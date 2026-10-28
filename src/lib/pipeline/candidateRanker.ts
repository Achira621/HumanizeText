// ============================================================================
// CANDIDATE VALIDATION AND RANKING ENGINE
// Hard invariant rejection + multi-dimensional soft scoring for candidate selection
// ============================================================================

import type {
  AlternativeCandidate,
  AlternativeScope,
  CandidateScoreBreakdown,
  HumanizerMode,
  RewriteStrength,
} from '../../types';
import type { WritingGenre, ToneRegister } from '../../types/context';
import { validateInvariants, checkNegationTargetPreservation } from './invariants';
import {
  validateArticleAgreement,
  validateDuplicateTransitions,
  validateMassNounQuantification,
  validateSentenceVerbs,
  validateStructuralCompleteness,
  validateConditionalityAndModality,
  validateAlphanumericIdentifiers,
  checkLostQualifications,
} from './qualityValidator';

export interface CandidateRankingOptions {
  genre?: WritingGenre;
  tone?: ToneRegister;
  rewriteStrength?: RewriteStrength;
  targetReadingLevel?: 'general' | 'academic' | 'casual';
  mode?: HumanizerMode;
  scope?: AlternativeScope;
  frozenWords?: string[];
  freezeQuotes?: boolean;
}

export interface CandidateRankingResult {
  rankedCandidates: AlternativeCandidate[];
  rejectedCandidates: AlternativeCandidate[];
  bestCandidate?: AlternativeCandidate;
}

/**
 * Computes Flesch-Kincaid Grade Level proxy.
 */
function computeReadingGrade(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 0;
  const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
  const sentenceCount = Math.max(1, sentences.length);
  const wordCount = words.length;
  const syllables = words.reduce((acc, w) => acc + Math.max(1, Math.round(w.length / 3)), 0);
  return 0.39 * (wordCount / sentenceCount) + 11.8 * (syllables / wordCount) - 15.59;
}

/**
 * Evaluates candidate rewrite against hard gates and multi-dimensional soft criteria.
 */
export function evaluateCandidate(
  sourceText: string,
  candidateText: string,
  options: CandidateRankingOptions = {}
): {
  isValid: boolean;
  rejectionReason?: string;
  scoreBreakdown: CandidateScoreBreakdown;
  warnings: string[];
} {
  const warnings: string[] = [];
  const trimmedCand = candidateText.trim();
  const trimmedSource = sourceText.trim();

  // ── HARD REJECTION CHECKS ──────────────────────────────────────────────────

  // 1. Empty or placeholder leak
  if (!trimmedCand) {
    return {
      isValid: false,
      rejectionReason: 'Candidate output is empty',
      warnings: ['Empty candidate text'],
      scoreBreakdown: createZeroScore(),
    };
  }

  if (/__HT_[A-Z0-9_]+__/.test(trimmedCand)) {
    return {
      isValid: false,
      rejectionReason: 'Unrestored protected placeholder detected in candidate',
      warnings: ['Placeholder leak detected'],
      scoreBreakdown: createZeroScore(),
    };
  }

  // 2. Invariant validation (numbers, citations, quotes, units)
  const inv = validateInvariants(trimmedSource, trimmedCand, {
    frozenWords: options.frozenWords,
    allowLengthReduction: options.mode === 'concise',
  });

  if (inv.criticalViolation) {
    return {
      isValid: false,
      rejectionReason: `Critical invariant failure: ${inv.violations[0]?.message || 'Constraint violation'}`,
      warnings: inv.preservationWarnings,
      scoreBreakdown: createZeroScore(),
    };
  }

  if (!inv.numbersPreserved) {
    return {
      isValid: false,
      rejectionReason: 'Numbers or statistics were dropped or altered',
      warnings: inv.preservationWarnings,
      scoreBreakdown: createZeroScore(),
    };
  }

  if (!inv.citationsPreserved) {
    return {
      isValid: false,
      rejectionReason: 'Academic citations or reference markers were dropped or altered',
      warnings: inv.preservationWarnings,
      scoreBreakdown: createZeroScore(),
    };
  }

  if (options.freezeQuotes !== false && !inv.quotesPreserved) {
    return {
      isValid: false,
      rejectionReason: 'Direct quotations were modified or dropped',
      warnings: inv.preservationWarnings,
      scoreBreakdown: createZeroScore(),
    };
  }

  if (!inv.unitsPreserved) {
    return {
      isValid: false,
      rejectionReason: 'Physical measurement units or currencies were modified',
      warnings: inv.preservationWarnings,
      scoreBreakdown: createZeroScore(),
    };
  }

  // 3. Causality & Epistemic Hedging Verification
  if (!inv.causalityPreserved) {
    return {
      isValid: false,
      rejectionReason: 'Critical invariant failure: Reversed causality detected in candidate',
      warnings: inv.causalityWarnings,
      scoreBreakdown: createZeroScore(),
    };
  }

  if (!inv.hedgingPreserved) {
    return {
      isValid: false,
      rejectionReason: 'Critical invariant failure: Epistemic hedging was inverted or lost',
      warnings: inv.hedgingWarnings,
      scoreBreakdown: createZeroScore(),
    };
  }

  // 3b. Conditionality & Modality Verification
  const condCheck = validateConditionalityAndModality(trimmedSource, trimmedCand);
  if (!condCheck.isValid) {
    return {
      isValid: false,
      rejectionReason: condCheck.error || 'Conditionality or modality reversal',
      warnings: [condCheck.error || 'Modality shift'],
      scoreBreakdown: createZeroScore(),
    };
  }

  // 3c. Alphanumeric Identifier Verification
  const idCheck = validateAlphanumericIdentifiers(trimmedSource, trimmedCand);
  if (!idCheck.isValid) {
    return {
      isValid: false,
      rejectionReason: `Alphanumeric identifier omitted or corrupted: ${idCheck.missingIdentifiers.join(', ')}`,
      warnings: idCheck.missingIdentifiers.map((id) => `Missing identifier: ${id}`),
      scoreBreakdown: createZeroScore(),
    };
  }

  // 4. Structural completeness & truncation
  const struct = validateStructuralCompleteness(trimmedSource, trimmedCand);
  if (struct.isTruncated) {
    return {
      isValid: false,
      rejectionReason: 'Candidate suffers from dangling clause or missing terminal punctuation',
      warnings: struct.issues,
      scoreBreakdown: createZeroScore(),
    };
  }

  if (struct.hasDuplication) {
    return {
      isValid: false,
      rejectionReason: 'Candidate contains duplicated consecutive sentences',
      warnings: struct.issues,
      scoreBreakdown: createZeroScore(),
    };
  }

  // 5. Negation target preservation
  const negCheck = checkNegationTargetPreservation(trimmedSource, trimmedCand);
  if (!negCheck.preserved) {
    return {
      isValid: false,
      rejectionReason: `Negation violation: ${negCheck.details || 'Polarity reversed'}`,
      warnings: [`Negation failure: ${negCheck.violationType}`],
      scoreBreakdown: createZeroScore(),
    };
  }

  // 6. Mass noun quantification check
  const massNoun = validateMassNounQuantification(trimmedCand);
  if (massNoun.hasError) {
    return {
      isValid: false,
      rejectionReason: `Grammar failure: ${massNoun.errors[0]}`,
      warnings: massNoun.errors,
      scoreBreakdown: createZeroScore(),
    };
  }

  // 7. Syntactic verb completeness check
  const verbCheck = validateSentenceVerbs(trimmedSource, trimmedCand);
  if (!verbCheck.isValid) {
    return {
      isValid: false,
      rejectionReason: `Grammar failure: ${verbCheck.errors[0]}`,
      warnings: verbCheck.errors,
      scoreBreakdown: createZeroScore(),
    };
  }

  // ── SOFT RANKING SIGNALS (Heuristic ranking proxies, uncalibrated) ───────────

  // A. Grammar Fluency (0.0 to 1.0 heuristic proxy)
  let grammarFluency = 1.0;
  const art = validateArticleAgreement(trimmedCand);
  if (art.hasError) {
    grammarFluency -= Math.min(0.4, art.errors.length * 0.2);
    warnings.push(...art.errors);
  }

  const dupTrans = validateDuplicateTransitions(trimmedCand);
  if (dupTrans.hasDuplicates) {
    grammarFluency -= Math.min(0.3, dupTrans.duplicates.length * 0.15);
    warnings.push(...dupTrans.duplicates.map((d) => `Redundant transition: ${d}`));
  }

  if (/\s{2,}/.test(trimmedCand)) grammarFluency -= 0.1;
  if (/\s+[,.:;!?]/.test(trimmedCand)) grammarFluency -= 0.15;
  if (/[.!?]\s+[a-z]/.test(trimmedCand)) grammarFluency -= 0.2;
  grammarFluency = Math.max(0.1, Math.min(1.0, grammarFluency));

  // B. Semantic Preservation (Heuristic proxy: 60% unigram token overlap + 40% bigram order overlap)
  const origWords = trimmedSource.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
  const candWords = trimmedCand.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
  const candTokenSet = new Set(candWords);
  let retainedWords = 0;
  for (const t of origWords) {
    if (candTokenSet.has(t)) retainedWords++;
  }
  const unigramRatio = origWords.length > 0 ? retainedWords / origWords.length : 1.0;

  const origBigrams = new Set<string>();
  for (let i = 0; i < origWords.length - 1; i++) {
    origBigrams.add(`${origWords[i]} ${origWords[i + 1]}`);
  }
  let retainedBigrams = 0;
  for (let i = 0; i < candWords.length - 1; i++) {
    if (origBigrams.has(`${candWords[i]} ${candWords[i + 1]}`)) retainedBigrams++;
  }
  const bigramRatio = origBigrams.size > 0 ? retainedBigrams / origBigrams.size : unigramRatio;

  const retentionRatio = 0.60 * unigramRatio + 0.40 * bigramRatio;
  let semanticPreservation = 0.5;
  if (retentionRatio >= 0.70) semanticPreservation = 1.0;
  else if (retentionRatio >= 0.55) semanticPreservation = 0.85;
  else if (retentionRatio >= 0.40) semanticPreservation = 0.70;
  else if (retentionRatio >= 0.25) semanticPreservation = 0.50;
  else semanticPreservation = 0.30;

  // Soft signal: check lost qualifications
  const qualCheck = checkLostQualifications(trimmedSource, trimmedCand);
  if (qualCheck.hasLostQualifications) {
    warnings.push(...qualCheck.qualifications.map((q) => `Lost qualification: "${q}"`));
    semanticPreservation = Math.max(0.2, semanticPreservation - 0.2);
  }

  // C. Contextual Fit (0.0 to 1.0 heuristic proxy)
  let contextualFit = 0.85;
  const genre = options.genre || 'general';
  if (genre === 'academic' || options.mode === 'formal') {
    if (/\b(?:delve|tapestry|beacon|testament|multifaceted)\b/i.test(trimmedCand)) {
      contextualFit -= 0.3;
    }
    if (/\b(?:don't|can't|won't|it's|they're)\b/i.test(trimmedCand)) {
      contextualFit -= 0.15; // penalize informal contractions in formal register
    }
  } else if (genre === 'conversational' || options.mode === 'conversational') {
    if (/\b(?:don't|can't|it's|they're|I'm|you're)\b/i.test(trimmedCand)) {
      contextualFit += 0.15; // reward natural contractions
    }
    if (/\b(?:furthermore|moreover|consequently|aforementioned)\b/i.test(trimmedCand)) {
      contextualFit -= 0.3; // penalize stiff academic transitions
    }
  }
  contextualFit = Math.max(0.2, Math.min(1.0, contextualFit));

  // D. Readability Appropriateness (0.0 to 1.0)
  const grade = computeReadingGrade(trimmedCand);
  let readabilityScore = 0.9;
  if (options.targetReadingLevel === 'casual') {
    if (grade > 11) readabilityScore = 0.5;
    else if (grade > 9) readabilityScore = 0.75;
  } else if (options.targetReadingLevel === 'academic') {
    if (grade < 7) readabilityScore = 0.5;
    else if (grade < 9) readabilityScore = 0.75;
  }
  readabilityScore = Math.max(0.2, Math.min(1.0, readabilityScore));

  // E. Conciseness / Length Ratio (0.0 to 1.0)
  const lenRatio = trimmedSource.length > 0 ? trimmedCand.length / trimmedSource.length : 1.0;
  let conciseness = 0.9;
  if (options.mode === 'concise') {
    if (lenRatio <= 0.85) conciseness = 1.0;
    else if (lenRatio > 1.05) conciseness = 0.5;
  } else {
    if (lenRatio < 0.55 || lenRatio > 1.45) conciseness = 0.5;
    else if (lenRatio < 0.70 || lenRatio > 1.30) conciseness = 0.75;
    else conciseness = 1.0;
  }

  // F. Strength Alignment (0.0 to 1.0)
  const strength = options.rewriteStrength || 'balanced';
  let strengthAlignment = 0.85;
  if (strength === 'minimal') {
    strengthAlignment = retentionRatio >= 0.80 ? 1.0 : 0.6;
  } else if (strength === 'light') {
    strengthAlignment = retentionRatio >= 0.65 && retentionRatio <= 0.90 ? 1.0 : 0.75;
  } else if (strength === 'balanced') {
    strengthAlignment = retentionRatio >= 0.50 && retentionRatio <= 0.80 ? 1.0 : 0.80;
  } else if (strength === 'strong' || strength === 'extensive') {
    strengthAlignment = retentionRatio <= 0.70 ? 1.0 : 0.80;
  }

  // G. Weighted Overall Score
  const overallScore = Number(
    (
      0.30 * grammarFluency +
      0.25 * semanticPreservation +
      0.15 * contextualFit +
      0.10 * readabilityScore +
      0.10 * conciseness +
      0.10 * strengthAlignment
    ).toFixed(3)
  );

  return {
    isValid: true,
    warnings,
    scoreBreakdown: {
      grammarFluency: Number(grammarFluency.toFixed(2)),
      semanticPreservation: Number(semanticPreservation.toFixed(2)),
      contextualFit: Number(contextualFit.toFixed(2)),
      readabilityScore: Number(readabilityScore.toFixed(2)),
      conciseness: Number(conciseness.toFixed(2)),
      strengthAlignment: Number(strengthAlignment.toFixed(2)),
      overallScore,
    },
  };
}

function createZeroScore(): CandidateScoreBreakdown {
  return {
    grammarFluency: 0,
    semanticPreservation: 0,
    contextualFit: 0,
    readabilityScore: 0,
    conciseness: 0,
    strengthAlignment: 0,
    overallScore: 0,
  };
}

/**
 * Validates, scores, and ranks a list of candidate rewrites in descending order of quality.
 */
export function rankCandidates(
  sourceText: string,
  candidates: string[],
  options: CandidateRankingOptions = {}
): CandidateRankingResult {
  const seen = new Set<string>();
  const evaluatedList: AlternativeCandidate[] = [];
  const rejectedList: AlternativeCandidate[] = [];
  const scope = options.scope || 'passage';

  let candidateIndex = 0;
  for (const cand of candidates) {
    const trimmed = cand.trim();
    if (!trimmed) continue;
    const norm = trimmed.toLowerCase();
    if (seen.has(norm)) continue;
    seen.add(norm);

    candidateIndex++;
    const id = `cand_${candidateIndex}_${Math.random().toString(36).slice(2, 6)}`;
    const evalResult = evaluateCandidate(sourceText, trimmed, options);

    if (evalResult.isValid) {
      evaluatedList.push({
        id,
        text: trimmed,
        scope,
        isValid: true,
        scoreBreakdown: evalResult.scoreBreakdown,
        validationWarnings: evalResult.warnings,
      });
    } else {
      rejectedList.push({
        id,
        text: trimmed,
        scope,
        isValid: false,
        rejectionReason: evalResult.rejectionReason,
        validationWarnings: evalResult.warnings,
        scoreBreakdown: evalResult.scoreBreakdown,
      });
    }
  }

  // Sort valid candidates descending by overallScore
  evaluatedList.sort((a, b) => (b.scoreBreakdown?.overallScore || 0) - (a.scoreBreakdown?.overallScore || 0));

  // Assign ranks and descriptive human-readable labels
  evaluatedList.forEach((c, idx) => {
    c.rank = idx + 1;
    const pct = Math.round((c.scoreBreakdown?.overallScore || 0) * 100);
    c.label = idx === 0 ? `Primary Selection (${pct}%)` : `Option ${idx + 1} (${pct}%)`;
  });

  return {
    rankedCandidates: evaluatedList,
    rejectedCandidates: rejectedList,
    bestCandidate: evaluatedList[0],
  };
}
