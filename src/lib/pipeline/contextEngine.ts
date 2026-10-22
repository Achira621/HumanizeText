// ============================================================================
// CONTEXT ENGINE — CONTEXT EXTRACTION & REWRITE PLANNING
// Deterministic analysis to extract passage meaning, intent, genre, tone,
// epistemic uncertainty, and construct a targeted RewritePlan before generation.
// ============================================================================

import type {
  WritingContext,
  RewritePlan,
  WritingGenre,
  WritingAudience,
  ToneRegister,
  EpistemicStance,
  WritingIssue,
  ProtectedTokens,
  EditingIntensity,
} from '../../types/context';
import {
  extractNumbers,
  extractDates,
  extractCitations,
  extractQuotes,
  extractUrlsAndEmails,
  extractUnits,
  extractNegations,
  extractHedging,
} from './invariants';

export interface ContextAnalysisOptions {
  genre?: WritingGenre;
  audience?: WritingAudience;
  tone?: ToneRegister;
  intensity?: EditingIntensity;
  frozenWords?: string[];
  explicitInstructions?: string;
}

const AI_CLICHE_PATTERNS: Array<{ pattern: RegExp; description: string }> = [
  { pattern: /\bdelve(?:\s+into)?\b/i, description: 'Overused synthetic verb "delve"' },
  { pattern: /\btapestry\b/i, description: 'Overused AI metaphor "tapestry"' },
  { pattern: /\btestament to\b/i, description: 'Formulaic praise "testament to"' },
  { pattern: /\bmultifaceted\b/i, description: 'Vague academic filler "multifaceted"' },
  { pattern: /\bseamlessly?\b/i, description: 'Generic buzzword "seamlessly"' },
  { pattern: /\bharness(?:ing)?\b/i, description: 'Mechanical action verb "harnessing"' },
  { pattern: /\bever-evolving\b/i, description: 'Clichéd temporality "ever-evolving"' },
  { pattern: /\bplays? a (?:vital|pivotal|crucial|key) role\b/i, description: 'Mechanical importance trope' },
  { pattern: /\bin today's (?:fast-paced )?(?:world|landscape|era|digital age)\b/i, description: 'Formulaic opener trope' },
  { pattern: /\bit is important to note that\b/i, description: 'Unnecessary throat-clearing' },
];

const WORDINESS_PATTERNS: Array<{ pattern: RegExp; description: string }> = [
  { pattern: /\bin order to\b/i, description: 'Wordy preposition "in order to" -> "to"' },
  { pattern: /\bdue to the fact that\b/i, description: 'Wordy causal phrase "due to the fact that" -> "because"' },
  { pattern: /\bat this point in time\b/i, description: 'Wordy temporal phrase "at this point in time" -> "now"' },
  { pattern: /\bfor the purpose of\b/i, description: 'Wordy phrasing "for the purpose of" -> "to / for"' },
  { pattern: /\ba large number of\b/i, description: 'Vague quantifier "a large number of" -> "many"' },
];

const STIFF_TRANSITIONS: Array<{ pattern: RegExp; description: string }> = [
  { pattern: /\bmoreover,?\b/i, description: 'Stiff robotic transition "moreover"' },
  { pattern: /\bfurthermore,?\b/i, description: 'Mechanical transition "furthermore"' },
  { pattern: /\bconsequently,?\b/i, description: 'Formal academic connective "consequently"' },
  { pattern: /\bin conclusion,?\b/i, description: 'School essay signpost "in conclusion"' },
];

/**
 * Detects the writing genre from vocabulary, citations, and structural signals.
 */
export function detectGenre(text: string): WritingGenre {
  const citations = extractCitations(text);
  if (citations.length > 0 || /\b(?:et al\.|methodology|empirical|statistically|hypothesi[sz]|longitudinal|systematic review)\b/i.test(text)) {
    return 'academic';
  }

  if (/\b(?:API|endpoints?|SDK|database|compiler|latency|microservices?|boolean|JSON|HTTPS?|SQL|Python|TypeScript|algorithm)\b/i.test(text)) {
    return 'technical';
  }

  if (/\b(?:ARR|EBITDA|revenue|quarterly|stakeholders?|Series [A-Z]|procurement|ROI|deliverables?|synergy)\b/i.test(text)) {
    return 'professional';
  }

  if (/\b(?:I|we|my|our|you|honestly|dad|mom|kids|coffee|walk|lunch|weekend|cool|grew up|felt)\b/i.test(text) && !/\b(?:whereas|pursuant|inasmuch)\b/i.test(text)) {
    return 'conversational';
  }

  if (/\b(?:whisper|shadows|twilight|echoed|canvas|silence|wander|melody)\b/i.test(text) && text.split(/[.!?]+/).length > 2) {
    return 'creative';
  }

  return 'general';
}

/**
 * Detects target audience based on genre and phrasing complexity.
 */
export function detectAudience(genre: WritingGenre, text: string): WritingAudience {
  if (genre === 'academic') return 'domain-experts';
  if (genre === 'technical') return 'domain-experts';
  if (genre === 'professional') return 'business-executives';
  if (/\b(?:students?|curriculum|lecture|textbook)\b/i.test(text)) return 'students';
  if (/\b(?:team|sprint|standup|our meeting|sync)\b/i.test(text)) return 'colleagues';
  return 'general-public';
}

/**
 * Detects tone and register.
 */
export function detectTone(genre: WritingGenre, text: string): ToneRegister {
  if (genre === 'academic') return 'objective';
  if (genre === 'technical') return 'authoritative';
  if (genre === 'conversational') return 'casual';
  if (/\b(?:crucial|urgent|vital|must|imperative|essential)\b/i.test(text)) return 'persuasive';
  if (/\b(?:exciting|delighted|enjoy|fascinating)\b/i.test(text)) return 'engaging';
  return 'formal';
}

/**
 * Detects epistemic stance and certainty level.
 */
export function detectEpistemicStance(hedges: string[], negations: string[]): EpistemicStance {
  if (hedges.length >= 2) return 'hedged';
  if (negations.length >= 2 && hedges.length >= 1) return 'skeptical';
  if (/\b(?:possibly|perhaps|might|could|unexplored|future studies)\b/i.test(hedges.join(' '))) return 'exploratory';
  return 'certain';
}

/**
 * Extracts candidate core thesis and claims from key sentences.
 */
export function extractClaims(text: string): { thesis: string; claims: string[] } {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 15);

  if (sentences.length === 0) {
    return { thesis: text.slice(0, 100), claims: [] };
  }

  const thesis = sentences[0]; // Primary topic sentence
  const claims: string[] = [];

  for (let i = 1; i < sentences.length; i++) {
    const s = sentences[i];
    if (
      extractNumbers(s).length > 0 ||
      extractCitations(s).length > 0 ||
      extractUnits(s).length > 0 ||
      /\b(?:demonstrated|reported|observed|found|revealed|announced|decreased|increased)\b/i.test(s)
    ) {
      claims.push(s);
    }
  }

  if (claims.length === 0 && sentences.length > 1) {
    claims.push(sentences[sentences.length - 1]);
  }

  return { thesis, claims: claims.slice(0, 4) };
}

/**
 * Identifies writing issues to address in the rewrite plan.
 */
export function identifyWritingIssues(text: string): WritingIssue[] {
  const issues: WritingIssue[] = [];

  for (const { pattern, description } of AI_CLICHE_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      issues.push({
        type: 'ai_cliche',
        description,
        targetExcerpt: match[0],
      });
    }
  }

  for (const { pattern, description } of WORDINESS_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      issues.push({
        type: 'wordiness',
        description,
        targetExcerpt: match[0],
      });
    }
  }

  for (const { pattern, description } of STIFF_TRANSITIONS) {
    const match = text.match(pattern);
    if (match) {
      issues.push({
        type: 'stiff_transition',
        description,
        targetExcerpt: match[0],
      });
    }
  }

  // Check for monotonous sentence lengths
  const sentences = text.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 5);
  if (sentences.length >= 3) {
    const lengths = sentences.map((s) => s.split(/\s+/).length);
    const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance = lengths.reduce((acc, l) => acc + Math.pow(l - avg, 2), 0) / lengths.length;
    if (variance < 4 && lengths.length >= 3) {
      issues.push({
        type: 'monotonous_cadence',
        description: 'Uniform sentence lengths create a robotic rhythm; introduce human burstiness.',
      });
    }
  }

  return issues;
}

/**
 * Analyzes source text to extract complete WritingContext.
 */
export function analyzeWritingContext(
  text: string,
  options: ContextAnalysisOptions = {}
): WritingContext {
  const trimmed = text.trim();
  const words = trimmed.split(/\s+/).filter(Boolean);
  const genre = options.genre || detectGenre(trimmed);
  const audience = options.audience || detectAudience(genre, trimmed);
  const tone = options.tone || detectTone(genre, trimmed);

  const hedging = extractHedging(trimmed);
  const negations = extractNegations(trimmed);
  const epistemicStance = detectEpistemicStance(hedging, negations);

  const numbers = extractNumbers(trimmed);
  const dates = extractDates(trimmed);
  const citations = extractCitations(trimmed);
  const quotes = extractQuotes(trimmed);
  const units = extractUnits(trimmed);
  const urls = extractUrlsAndEmails(trimmed);

  const { thesis, claims } = extractClaims(trimmed);

  const missingContext: string[] = [];
  if (words.length < 25) {
    missingContext.push('short_passage_limited_discourse');
  }
  if (!options.explicitInstructions && !options.genre) {
    missingContext.push('genre_inferred_from_linguistics');
  }

  const protectedTokens: ProtectedTokens = {
    numbers,
    dates,
    citations,
    quotes,
    units,
    urls,
    frozenWords: options.frozenWords || [],
  };

  return {
    objective: `Humanize text for ${genre} writing with natural cadence while strictly preserving factual claims and epistemic hedges.`,
    genre,
    audience,
    tone,
    epistemicStance,
    coreThesis: thesis,
    supportingClaims: claims,
    protectedTokens,
    hedgingMarkers: hedging,
    negationMarkers: negations,
    editingIntensity: options.intensity || 'balanced',
    explicitInstructions: options.explicitInstructions,
    missingContext,
  };
}

/**
 * Builds a targeted RewritePlan based on extracted WritingContext.
 */
export function buildRewritePlan(
  context: WritingContext,
  text: string
): RewritePlan {
  const issues = identifyWritingIssues(text);
  const isShort = text.split(/\s+/).filter(Boolean).length < 20;

  // Sections that must not be rewritten
  const sectionsToKeepUnchanged: string[] = [
    ...context.protectedTokens.quotes,
    ...context.protectedTokens.citations,
    ...context.protectedTokens.urls,
  ];

  // Specific adjustments matching genre
  let rhythmAdjustment = 'Vary sentence lengths: mix short punchy statements with rich compound thoughts.';
  let dictionAdjustment = 'Replace formulaic AI clichés with natural human phrasing.';
  let formalityAdjustment = 'Maintain standard professional register.';

  switch (context.genre) {
    case 'academic':
      formalityAdjustment = 'Maintain scholarly register, precise scientific terminology, and formal citation formatting.';
      rhythmAdjustment = 'Retain syntactically sophisticated subordinate clauses while eliminating robotic transition bloat.';
      break;
    case 'technical':
      formalityAdjustment = 'Keep precise technical parameters, code tokens, and architectural specifications exact.';
      rhythmAdjustment = 'Favor concise active explanations over passive abstractions.';
      break;
    case 'conversational':
      formalityAdjustment = 'Incorporate natural contractions, direct address, and authentic idiomatic rhythm.';
      rhythmAdjustment = 'Keep sentences dynamic and conversational.';
      break;
    case 'professional':
      formalityAdjustment = 'Ensure crisp executive framing; cut bureaucratic jargon and nominalizations.';
      break;
  }

  const invariantRequirements: string[] = [
    'Preserve all numbers, percentages, and measurement units verbatim.',
    'Preserve all academic citation markers and references.',
    'Preserve all verbatim quotations intact.',
    'CRITICAL: Do NOT flip negations or alter negative claim polarity.',
    'CRITICAL: Preserve all epistemic hedges (e.g. "suggests", "may") without converting them into absolute proof.',
  ];

  if (context.protectedTokens.frozenWords.length > 0) {
    invariantRequirements.push(`Preserve frozen words verbatim: [${context.protectedTokens.frozenWords.join(', ')}].`);
  }

  return {
    planId: `plan_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    genre: context.genre,
    coreMessage: context.coreThesis || 'Preserve author core message without distortion',
    claimsToPreserve: context.supportingClaims,
    qualificationsToMaintain: context.hedgingMarkers,
    issuesToFix: issues,
    sectionsToKeepUnchanged,
    targetedAdjustments: {
      rhythm: rhythmAdjustment,
      diction: dictionAdjustment,
      formality: formalityAdjustment,
    },
    invariantRequirements,
    isFallback: isShort || context.missingContext.includes('short_passage_limited_discourse'),
  };
}
