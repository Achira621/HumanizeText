import { validateInvariants } from './invariants';

/**
 * Set of words starting with vowel letter but having a consonant /j/ or /w/ onset sound.
 */
export const VOWEL_LETTERS_WITH_CONSONANT_SOUND = new Set([
  'unique', 'uniquely', 'uniqueness',
  'universal', 'universally', 'universe',
  'university', 'universities',
  'uniform', 'uniformly',
  'user', 'users', 'useful', 'usefully', 'useless', 'usage', 'usages',
  'unit', 'units', 'united',
  'ubiquitous', 'ubiquity',
  'european', 'europeans',
  'eulogy', 'euphemism',
  'one', 'once', 'oneself', 'one-time', 'one-way'
]);

/**
 * Set of words starting with consonant letter 'h' with silent vowel onset.
 */
export const SILENT_H_VOWEL_SOUNDS = new Set([
  'hour', 'hours', 'hourly',
  'honest', 'honestly', 'honesty',
  'honor', 'honors', 'honorable', 'honorably',
  'heir', 'heirs', 'heiress'
]);

/**
 * Validates indefinite article agreement (a vs an) respecting phonological exceptions.
 */
export function validateArticleAgreement(text: string): { hasError: boolean; errors: string[] } {
  const errors: string[] = [];
  const articleRegex = /\b(a|an)\s+([a-zA-Z]+)\b/gi;
  let m: RegExpExecArray | null;

  while ((m = articleRegex.exec(text)) !== null) {
    const article = m[1].toLowerCase();
    const nextWord = m[2].toLowerCase();

    if (article === 'an') {
      const startsWithConsonantLetter = /^[bcdfghjklmnpqrstvwxyz]/.test(nextWord);
      const isSilentH = SILENT_H_VOWEL_SOUNDS.has(nextWord);
      const isConsonantSoundVowel = VOWEL_LETTERS_WITH_CONSONANT_SOUND.has(nextWord);

      if ((startsWithConsonantLetter && !isSilentH) || isConsonantSoundVowel) {
        errors.push(`Invalid article 'an' before consonant sound '${nextWord}' (expected 'a ${nextWord}')`);
      }
    } else if (article === 'a') {
      const startsWithVowelLetter = /^[aeiou]/.test(nextWord);
      const isSilentH = SILENT_H_VOWEL_SOUNDS.has(nextWord);
      const isConsonantSoundVowel = VOWEL_LETTERS_WITH_CONSONANT_SOUND.has(nextWord);

      if ((startsWithVowelLetter && !isConsonantSoundVowel) || isSilentH) {
        errors.push(`Invalid article 'a' before vowel sound '${nextWord}' (expected 'an ${nextWord}')`);
      }
    }
  }

  return { hasError: errors.length > 0, errors };
}

/**
 * Detects redundant consecutive transition adverbs (e.g. "However, nevertheless,").
 */
export function validateDuplicateTransitions(text: string): { hasDuplicates: boolean; duplicates: string[] } {
  const duplicates: string[] = [];
  const dupRegex = /\b(However|Moreover|Furthermore|Additionally|Consequently|Therefore|Still|Nevertheless|Nonetheless)\s*,\s*(however|moreover|furthermore|additionally|consequently|therefore|still|nevertheless|nonetheless|also)\b/gi;
  let m: RegExpExecArray | null;

  while ((m = dupRegex.exec(text)) !== null) {
    duplicates.push(m[0]);
  }

  return { hasDuplicates: duplicates.length > 0, duplicates };
}

/**
 * Detects accidental truncation and duplicated consecutive sentences.
 */
export function validateStructuralCompleteness(
  originalText: string,
  rewrittenText: string
): { isTruncated: boolean; hasDuplication: boolean; issues: string[] } {
  const issues: string[] = [];
  const trimmedOrig = originalText.trim();
  const trimmedRewr = rewrittenText.trim();

  // 1. Accidental truncation: original had terminal punctuation, rewrite ends mid-sentence or on comma/colon/hyphen
  const origEndsWithTerminator = /[.!?]["']?$/.test(trimmedOrig);
  const rewrEndsWithDangling = /[,:;\-—([]$/.test(trimmedRewr);
  const rewrEndsWithoutTerminator = !/[.!?]["']?$/.test(trimmedRewr);

  let isTruncated = false;
  if (origEndsWithTerminator && (rewrEndsWithDangling || rewrEndsWithoutTerminator)) {
    isTruncated = true;
    issues.push('Accidental truncation: Rewrite ends mid-clause or lacks terminal punctuation.');
  }

  // 2. Duplicated consecutive sentences
  const rewrSentences = trimmedRewr.match(/[^.!?]+[.!?]+/g) || [];
  let hasDuplication = false;
  if (rewrSentences.length >= 2) {
    for (let i = 0; i < rewrSentences.length - 1; i++) {
      const s1 = rewrSentences[i].trim().toLowerCase();
      const s2 = rewrSentences[i + 1].trim().toLowerCase();
      if (s1 === s2 && s1.length > 15) {
        hasDuplication = true;
        issues.push(`Duplicated consecutive sentence detected: "${rewrSentences[i].trim()}"`);
      }
    }
  }

  return { isTruncated, hasDuplication, issues };
}

/**
 * Filter and validate candidate alternatives against invariants and quality gates.
 * Rejects any alternative with dropped citations, numbers, quotes, or critical violations.
 */
export function filterValidAlternatives(
  sourceText: string,
  candidates: string[],
  options?: any
): string[] {
  const seen = new Set<string>();
  seen.add(sourceText.trim().toLowerCase());

  return candidates.filter((cand) => {
    const trimmed = cand.trim();
    if (!trimmed) return false;

    const norm = trimmed.toLowerCase();
    if (seen.has(norm)) return false;
    seen.add(norm);

    // Reject un-restored placeholder leaks
    if (/__HT_[A-Z0-9_]+__/.test(trimmed)) return false;

    const inv = validateQuality(sourceText, trimmed, options);
    if (
      inv.criticalViolation ||
      !inv.numbersPreserved ||
      !inv.citationsPreserved ||
      !inv.quotesPreserved ||
      !inv.unitsPreserved
    ) {
      return false;
    }
    const struct = validateStructuralCompleteness(sourceText, trimmed);
    if (struct.isTruncated || struct.hasDuplication) {
      return false;
    }
    return true;
  });
}

/**
 * Wraps baseline invariant validation with rhetorical idiom false-positive suppression
 * and quality validation (article agreement, duplicate transitions, structural completeness).
 */
export function validateQuality(
  originalText: string,
  rewrittenText: string,
  options?: any
): any {
  const isAffirmativeIdiom = /\b(?:goes\s+without\s+saying|without\s+a\s+doubt|without\s+question|not\s+to\s+mention)\b/i.test(originalText);

  const inv = validateInvariants(originalText, rewrittenText, options);
  const qualityWarnings: string[] = [];

  // Suppress false positive negation flip if caused strictly by rhetorical idiom "goes without saying"
  if (
    isAffirmativeIdiom &&
    inv.criticalViolation &&
    inv.violations.every((v: any) => v.type === 'negation_flip' && v.targetExcerpt?.includes('without saying'))
  ) {
    inv.criticalViolation = false;
    inv.negationsPreserved = true;
    inv.hasConfirmedFactualError = false;
    inv.isValid = inv.preservationWarnings.filter((w: string) => !w.includes('without saying')).length === 0;
  }

  const art = validateArticleAgreement(rewrittenText);
  if (art.hasError) {
    qualityWarnings.push(...art.errors);
  }

  const dup = validateDuplicateTransitions(rewrittenText);
  if (dup.hasDuplicates) {
    qualityWarnings.push(...dup.duplicates.map((d) => `Redundant duplicate transition: "${d}"`));
  }

  const struct = validateStructuralCompleteness(originalText, rewrittenText);
  if (struct.isTruncated || struct.hasDuplication) {
    qualityWarnings.push(...struct.issues);
  }

  return {
    ...inv,
    qualityWarnings,
  };
}

