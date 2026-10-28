import type {
  AlternativeCandidate,
  AlternativesMetadata,
  DiffToken,
  HumanizerChange,
  TargetSpan,
} from '../../types';
import { computeDiffTokens } from '../humanizer/ruleEngine';
import { validatePhraseContext } from './phraseGrammarValidator';

/**
 * Computes a fast, deterministic content fingerprint combining string length
 * and a 32-bit FNV/DJB2 hash.
 */
export function computeTextFingerprint(text: string): string {
  if (!text) return 'empty_0';
  let hash = 5381;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) + hash) + text.charCodeAt(i);
    hash |= 0;
  }
  return `len_${text.length}_h_${(hash >>> 0).toString(16)}`;
}

export type RefusalReason =
  | 'stale_document'
  | 'missing_target'
  | 'ambiguous_target'
  | 'scope_mismatch'
  | 'invalid_candidate';

export interface ApplyAlternativeParams {
  currentText: string;
  originalDraftText?: string;
  candidate: AlternativeCandidate;
  candidateIndex: number;
  metadata: AlternativesMetadata;
  frozenWords?: string[];
  changes?: HumanizerChange[];
}

export interface ApplyAlternativeResult {
  success: boolean;
  newText?: string;
  updatedMetadata?: AlternativesMetadata;
  error?: string;
  refusalReason?: RefusalReason;
  diffTokens?: DiffToken[];
  stats?: {
    originalWords: number;
    improvedWords: number;
    reductionPercentage: number;
    readingTimeSeconds: number;
  };
}

/**
 * Safely applies an alternative candidate to editor text using strict target contracts.
 * 
 * Rules:
 * 1. Never silently fall back from scoped replacement to replacing the whole document.
 * 2. If target coordinates or target text cannot be uniquely verified, refuse with explicit error.
 * 3. Scope contracts: 'phrase' cannot replace sentences/passages/docs; 'sentence' cannot replace docs.
 * 4. Byte-for-byte preservation: all text outside the verified target span remains untouched.
 * 5. On failure, return success=false without modifying any state.
 */
export function applyScopedAlternative(params: ApplyAlternativeParams): ApplyAlternativeResult {
  const {
    currentText,
    originalDraftText = '',
    candidate,
    candidateIndex,
    metadata,
    frozenWords = [],
    changes = [],
  } = params;

  if (!candidate || !candidate.text) {
    return {
      success: false,
      refusalReason: 'invalid_candidate',
      error: 'Candidate text is missing or empty.',
    };
  }

  if (candidate.isValid === false) {
    return {
      success: false,
      refusalReason: 'invalid_candidate',
      error: candidate.validationWarnings?.join('; ') || 'Candidate failed safety/invariant validation.',
    };
  }

  if (metadata.scope === 'none' || metadata.candidates.length === 0) {
    return {
      success: false,
      refusalReason: 'scope_mismatch',
      error: 'No valid alternative rewrites available.',
    };
  }

  // Phrase-level candidates must NEVER replace a sentence, passage, or complete document
  if (metadata.scope === 'phrase' || candidate.scope === 'phrase') {
    return {
      success: false,
      refusalReason: 'scope_mismatch',
      error: 'Phrase-level suggestions cannot replace document or passage scope. Apply via inline editor.',
    };
  }

  const prevCandidate = metadata.candidates[metadata.selectedIndex];
  const prevCandidateText = prevCandidate?.text ?? '';

  let newText: string;
  let newTargetSpan: TargetSpan | undefined = undefined;

  // ── 1. Document Scope ──────────────────────────────────────────────────────────
  if (metadata.scope === 'document') {
    // Check if user edited the document since alternatives were generated
    if (metadata.sourceFingerprint) {
      const currentFingerprint = computeTextFingerprint(currentText);
      if (currentFingerprint !== metadata.sourceFingerprint) {
        return {
          success: false,
          refusalReason: 'stale_document',
          error:
            'The document was edited since alternatives were generated. Replacing the document would overwrite your manual changes. Please rephrase to generate fresh alternatives.',
        };
      }
    }

    newText = candidate.text;
    newTargetSpan = {
      startIndex: 0,
      endIndex: candidate.text.length,
      text: candidate.text,
    };
  } else {
    // ── 2. Scoped Sentence or Passage Replacement ──────────────────────────────
    let targetStart = -1;
    let targetEnd = -1;

    // Check if an explicit targetSpan was provided and is still valid
    if (metadata.targetSpan) {
      const span = metadata.targetSpan;
      if (
        span.startIndex >= 0 &&
        span.endIndex <= currentText.length &&
        span.startIndex <= span.endIndex
      ) {
        const textAtSpan = currentText.slice(span.startIndex, span.endIndex);
        // Verify that text at the recorded span matches either the recorded span text
        // or the active candidate text
        if (textAtSpan === span.text || (prevCandidateText && textAtSpan === prevCandidateText)) {
          targetStart = span.startIndex;
          targetEnd = span.endIndex;
        }
      }
    }

    // If targetSpan did not verify, attempt exact unique resolution of prevCandidateText
    if (targetStart === -1) {
      if (!prevCandidateText || !prevCandidateText.trim()) {
        return {
          success: false,
          refusalReason: 'missing_target',
          error: 'Original target text is missing. Cannot safely resolve replacement boundaries.',
        };
      }

      // Count all occurrences in current text
      const matches: number[] = [];
      let searchPos = 0;
      while ((searchPos = currentText.indexOf(prevCandidateText, searchPos)) !== -1) {
        matches.push(searchPos);
        searchPos += prevCandidateText.length;
      }

      if (matches.length === 0) {
        // Target text not found anywhere in document!
        return {
          success: false,
          refusalReason: 'missing_target',
          error:
            'Target text was not found in the current document (it may have been modified or deleted). Scoped alternative cannot be applied.',
        };
      }

      if (matches.length > 1) {
        // Target is ambiguous! Multiple identical sentences exist and target coordinates were lost/invalidated
        return {
          success: false,
          refusalReason: 'ambiguous_target',
          error: `Found ${matches.length} identical instances of the target text. Replacement cannot be safely targeted without disambiguation. Please rephrase this section directly.`,
        };
      }

      // Exactly 1 unique match
      targetStart = matches[0];
      targetEnd = targetStart + prevCandidateText.length;
    }

    // Double check bounds
    if (targetStart < 0 || targetEnd < targetStart || targetEnd > currentText.length) {
      return {
        success: false,
        refusalReason: 'missing_target',
        error: 'Target boundaries are out of bounds or corrupted. Replacement aborted.',
      };
    }

    // Execute byte-for-byte scoped slice
    const prefix = currentText.slice(0, targetStart);
    const suffix = currentText.slice(targetEnd);
    newText = prefix + candidate.text + suffix;

    newTargetSpan = {
      startIndex: targetStart,
      endIndex: targetStart + candidate.text.length,
      text: candidate.text,
      sentenceIndex: metadata.targetSpan?.sentenceIndex,
      blockId: metadata.targetSpan?.blockId,
    };
  }

  // ── 3. Recalculate Statistics and Diff Tokens ────────────────────────────────
  const origWords = originalDraftText.trim().split(/\s+/).filter(Boolean).length;
  const impWords = newText.trim().split(/\s+/).filter(Boolean).length;
  const wordDiff = origWords - impWords;
  const reductionPercentage = origWords > 0 ? Math.round((wordDiff / origWords) * 100) : 0;
  const readingTimeSeconds = Math.round((impWords / 200) * 60);

  const diffTokens = computeDiffTokens(originalDraftText, newText, changes, frozenWords);

  const updatedMetadata: AlternativesMetadata = {
    ...metadata,
    selectedIndex: candidateIndex,
    sourceFingerprint: computeTextFingerprint(newText),
    targetSpan: newTargetSpan,
  };

  return {
    success: true,
    newText,
    updatedMetadata,
    diffTokens,
    stats: {
      originalWords: origWords,
      improvedWords: impWords,
      reductionPercentage,
      readingTimeSeconds,
    },
  };
}

export interface ApplyPhraseReplacementParams {
  currentText: string;
  originalDraftText?: string;
  token: DiffToken;
  replacementText: string;
  sourceFingerprint?: string;
  frozenWords?: string[];
  changes?: HumanizerChange[];
}

export interface ApplyPhraseReplacementResult {
  success: boolean;
  newText?: string;
  error?: string;
  refusalReason?: RefusalReason;
  newDiffTokens?: DiffToken[];
  stats?: {
    originalWords: number;
    improvedWords: number;
    reductionPercentage: number;
    readingTimeSeconds: number;
  };
  newFingerprint?: string;
}

/**
 * Safely applies an inline phrase or synonym substitution to editor text.
 * 
 * Rules:
 * 1. Coordinates: uses token.startIndex and token.endIndex. Verifies currentText at coordinates matches token.text.
 * 2. Grammatical Context: runs validatePhraseContext to adjust article ('a'/'an'), casing, and ensure brackets/quotes/negation invariants.
 * 3. Byte-for-Byte: replaces only [token.startIndex, token.endIndex], preserving prefix and suffix completely.
 * 4. Recalculation: recomputes DiffTokens (refreshing all token offsets) and text statistics.
 * 5. Rejection: rejects stale, ambiguous, or invalid substitutions without altering document.
 */
export function applyInlinePhraseReplacement(
  params: ApplyPhraseReplacementParams
): ApplyPhraseReplacementResult {
  const {
    currentText,
    originalDraftText = '',
    token,
    replacementText,
    sourceFingerprint,
    frozenWords = [],
    changes = [],
  } = params;

  if (!replacementText || !replacementText.trim()) {
    return {
      success: false,
      refusalReason: 'invalid_candidate',
      error: 'Replacement phrase cannot be empty.',
    };
  }

  // 1. Resolve and verify target span coordinates
  let targetStart = token.startIndex;
  let targetEnd = token.endIndex;

  if (
    targetStart !== undefined &&
    targetEnd !== undefined &&
    targetStart >= 0 &&
    targetEnd <= currentText.length &&
    targetStart <= targetEnd
  ) {
    const textAtSpan = currentText.slice(targetStart, targetEnd);
    if (textAtSpan !== token.text) {
      return {
        success: false,
        refusalReason: 'stale_document',
        error:
          'The document was edited since this suggestion was generated. Target boundaries no longer match.',
      };
    }
  } else {
    // Missing coordinates fallback: search for unique occurrence of token.text
    if (!token.text || !token.text.trim()) {
      return {
        success: false,
        refusalReason: 'missing_target',
        error: 'Target token text is empty.',
      };
    }

    const matches: number[] = [];
    let searchPos = 0;
    while ((searchPos = currentText.indexOf(token.text, searchPos)) !== -1) {
      matches.push(searchPos);
      searchPos += token.text.length;
    }

    if (matches.length === 0) {
      return {
        success: false,
        refusalReason: 'missing_target',
        error: 'Target phrase was not found in the current text (it may have been modified or deleted).',
      };
    }

    if (matches.length > 1) {
      return {
        success: false,
        refusalReason: 'ambiguous_target',
        error: `Found ${matches.length} identical instances of this phrase. Coordinates are required to prevent ambiguous replacement.`,
      };
    }

    targetStart = matches[0];
    targetEnd = targetStart + token.text.length;
  }

  // Check fingerprint if provided
  if (sourceFingerprint && computeTextFingerprint(currentText) !== sourceFingerprint) {
    const textAtSpan = currentText.slice(targetStart, targetEnd);
    if (textAtSpan !== token.text) {
      return {
        success: false,
        refusalReason: 'stale_document',
        error:
          'The document was modified after suggestions were generated. Phrase target is no longer valid.',
      };
    }
  }

  // 2. Validate grammatical context (article agreement, casing, bracket/quote balance, polarity)
  const rawPrefix = currentText.slice(0, targetStart);
  const rawSuffix = currentText.slice(targetEnd);

  const contextValidation = validatePhraseContext({
    prefix: rawPrefix,
    suffix: rawSuffix,
    originalText: token.text,
    replacementText,
    frozenWords,
  });

  if (!contextValidation.isValid) {
    return {
      success: false,
      refusalReason: 'invalid_candidate',
      error: contextValidation.error || 'Phrase replacement violates grammatical invariants.',
    };
  }

  // 3. Byte-for-byte replacement using adapted prefix, replacement, and suffix
  const newText =
    contextValidation.adaptedPrefix +
    contextValidation.adaptedReplacement +
    contextValidation.adaptedSuffix;

  // 4. Update changes record so newDiffTokens accurately reflects the applied change
  const updatedChanges: HumanizerChange[] = [
    ...changes.filter((c) => c.replacement.toLowerCase() !== token.text.toLowerCase()),
    {
      original: token.original || token.text,
      replacement: contextValidation.adaptedReplacement.trim(),
      reason: token.reason || 'Inline synonym replacement',
      category: token.category || 'phrasing',
      index: 0,
      alternatives: (token.alternatives || []).filter(
        (a) => a.toLowerCase() !== contextValidation.adaptedReplacement.trim().toLowerCase()
      ),
    },
  ];

  // 5. Recalculate stats & diff tokens (refreshing all character offsets)
  const origWords = originalDraftText.trim().split(/\s+/).filter(Boolean).length;
  const impWords = newText.trim().split(/\s+/).filter(Boolean).length;
  const wordDiff = origWords - impWords;
  const reductionPercentage = origWords > 0 ? Math.round((wordDiff / origWords) * 100) : 0;
  const readingTimeSeconds = Math.round((impWords / 200) * 60);

  const newDiffTokens = computeDiffTokens(originalDraftText, newText, updatedChanges, frozenWords);
  const newFingerprint = computeTextFingerprint(newText);

  return {
    success: true,
    newText,
    newDiffTokens,
    newFingerprint,
    stats: {
      originalWords: origWords,
      improvedWords: impWords,
      reductionPercentage,
      readingTimeSeconds,
    },
  };
}
