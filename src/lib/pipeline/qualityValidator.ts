import { validateInvariants, type InvariantValidationResult } from './invariants';

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
): InvariantValidationResult & { qualityWarnings: string[] } {
  const isAffirmativeIdiom = /\b(?:goes\s+without\s+saying|without\s+a\s+doubt|without\s+question|not\s+to\s+mention)\b/i.test(originalText);

  const inv = validateInvariants(originalText, rewrittenText, options);
  const qualityWarnings: string[] = [];

  // Suppress false positive negation flip if caused strictly by rhetorical idiom "goes without saying"
  if (
    isAffirmativeIdiom &&
    inv.criticalViolation &&
    inv.violations.every((v) => v.type === 'negation_flip' && v.targetExcerpt?.includes('without saying'))
  ) {
    inv.criticalViolation = false;
    inv.negationsPreserved = true;
    inv.hasConfirmedFactualError = false;
    inv.isValid = inv.preservationWarnings.filter((w) => !w.includes('without saying')).length === 0;
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

/**
 * Set of common English uncountable / mass nouns that cannot be quantified with 'numerous', 'many', etc.
 */
export const MASS_NOUN_SET = new Set([
  'water', 'equipment', 'information', 'evidence', 'research', 'software', 'hardware',
  'machinery', 'furniture', 'advice', 'baggage', 'luggage', 'traffic', 'weather',
  'knowledge', 'data', 'progress', 'debris', 'air', 'oil', 'fuel', 'waste', 'work'
]);

/**
 * Validates that mass nouns are not quantified with count determiners (e.g. "numerous water").
 */
export function validateMassNounQuantification(text: string): { hasError: boolean; errors: string[] } {
  const errors: string[] = [];
  const regex = /\b(numerous|many|several|few)\s+(?:(?:specialized|purified|experimental|excess|unnecessary|new|additional)\s+)?([a-zA-Z]+)\b/gi;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    const determiner = m[1].toLowerCase();
    const noun = m[2].toLowerCase();
    if (MASS_NOUN_SET.has(noun)) {
      errors.push(`Grammar error: count quantifier '${determiner}' cannot quantify mass noun '${noun}' (expected 'substantial ${noun}' or 'a great deal of ${noun}')`);
    }
  }
  return { hasError: errors.length > 0, errors };
}

/**
 * Validates that candidate sentences contain at least one verbal element (finite verb, auxiliary, or modal).
 */
export const COMMON_PLURAL_NOUNS = new Set([
  'nodes', 'servers', 'systems', 'users', 'files', 'records', 'clients', 'requests',
  'clusters', 'models', 'results', 'findings', 'documents', 'features', 'components',
  'items', 'hours', 'days', 'weeks', 'months', 'years', 'teams', 'members', 'workers',
  'tests', 'metrics', 'tools', 'logs', 'endpoints', 'credentials', 'chairs', 'croissants',
  'pines', 'ribbons', 'shallows', 'waves', 'shadows', 'avenues', 'legends', 'variables',
  'trials', 'participants', 'mechanisms', 'insights', 'plans', 'initiatives', 'units',
  'assets', 'stakeholders', 'outcomes', 'audits', 'partnerships'
]);

export function validateSentenceVerbs(_originalText: string, rewrittenText: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const sentences = rewrittenText
    .split(/(?<=(?<!\b(?:Dr|Mr|Mrs|Ms|Prof|vs|e\.g|i\.e|et al))[.!?])\s+/gi)
    .filter((s) => s.trim().length > 0);
  const verbPattern = /\b(?:is|are|was|were|be|been|being|have|has|had|do|does|did|will|would|shall|should|can|could|may|might|must|ought|indicate[s]?|reveal[s]?|suggest[s]?|establish(?:es)?|initialize[s]?|authenticate[s]?|commit[s]?|publish(?:es)?|complete[s]?|evaluate[s]?|express(?:es)?|review[s]?|conclude[s]?|agree[s]?|allow[s]?|lead[s]?|find[s]?|make[s]?|take[s]?|give[s]?|run[s]?|start[s]?|set[s]?|get[s]?|use[s]?|build[s]?|rel(?:y|ies)|depend[s]?|measure[s]?|compl(?:y|ies)|mandate[s]?|contract[s]?|fall[s]?|rise[s]?|grow[s]?|shrink[s]?|drop[s]?|see[s]?|know[s]?|think[s]?|feel[s]?|become[s]?|remain[s]?|stay[s]?|keep[s]?|hold[s]?|stand[s]?|turn[s]?|bring[s]?|send[s]?|receive[s]?|order[s]?|bear[s]?|break[s]?|speak[s]?|write[s]?|read[s]?|hear[s]?|watch(?:es)?|tell[s]?|ask[s]?|call[s]?|meet[s]?|pay[s]?|sit[s]?|lose[s]?|win[s]?|reach(?:es)?|learn[s]?|teach(?:es)?|spend[s]?|offer[s]?|expect[s]?|continue[s]?|require[s]?|contain[s]?|provide[s]?|show[s]?|observe[s]?|inspect[s]?|conduct[s]?|achieve[s]?|produce[s]?|generate[s]?|include[s]?|support[s]?|examine[s]?|demonstrate[s]?|improve[s]?|occur[s]?|result[s]?|cause[s]?|prevent[s]?|synthesize[s]?|develop[s]?|deploy[s]?|trigger[s]?|process(?:es)?|handle[s]?|manage[s]?|perform[s]?|submit[s]?|ensure[s]?|mitigate[s]?|safeguard[s]?|shed[s]?|clarif(?:y|ies)|illuminat(?:e|es)|explain[s]?|reflect[s]?|foster[s]?|reject[s]?|precede[s]?|realiz(?:e|es)|delve[s]?|embark[s]?|unlock[s]?|pack[s]?|lift[s]?|groan[s]?|filter[s]?|stabili(?:ze|zes)|malfunction[s]?|necessitat(?:e|es)|[a-z]{3,}ed)\b/i;

  for (const s of sentences) {
    const words = s.trim().split(/\s+/).filter(Boolean);
    // Exclude false positive short fragments or headings
    if (words.length >= 4) {
      let hasVerb = verbPattern.test(s);
      // Fallback check: look for 3rd person singular verb ending in 's' that is not a known plural noun
      if (!hasVerb) {
        for (const w of words) {
          const clean = w.toLowerCase().replace(/[^a-z]/g, '');
          if (clean.endsWith('s') && clean.length >= 4 && !COMMON_PLURAL_NOUNS.has(clean)) {
            hasVerb = true;
            break;
          }
        }
      }
      if (!hasVerb) {
        errors.push(`Sentence lacks a main verb or verbal predicate: "${s}"`);
      }
    }
  }
  return { isValid: errors.length === 0, errors };
}

/**
 * Validates conditionality and modality preservation (e.g. necessary vs. sufficient, obligation vs. permission).
 */
export function validateConditionalityAndModality(
  originalText: string,
  candidateText: string
): { isValid: boolean; error?: string } {
  const normOrig = originalText.toLowerCase();
  const normCand = candidateText.toLowerCase();

  // 1. Necessary condition inverted to sufficient or optional
  const necessaryPatterns = [
    /\b(?:is|are)\s+(?:required|mandatory|necessary|a\s+prerequisite)\s+for\b/,
    /\bprerequisite\s+for\b/,
    /\brequires?\s+that\b/,
    /\bmust\s+have\b/,
  ];
  const sufficientPatterns = [
    /\b(?:is|are)\s+(?:sufficient|optional|voluntary)\s+for\b/,
    /\bguarantees?\s+that\b/,
    /\bensures?\s+that\b/,
  ];

  const origHasNecessary = necessaryPatterns.some((p) => p.test(normOrig));
  const candHasSufficient = sufficientPatterns.some((p) => p.test(normCand));
  if (origHasNecessary && candHasSufficient) {
    return {
      isValid: false,
      error: 'Necessary condition inverted: Original required a prerequisite, but candidate claims it is sufficient or optional.',
    };
  }

  // 2. "only if" weakened to unconstrained "if"
  if (/\bonly\s+if\b/.test(normOrig) && !/\bonly\s+if\b/.test(normCand) && /\bif\b/.test(normCand)) {
    return {
      isValid: false,
      error: 'Conditionality weakened: Restrictive \'only if\' condition was weakened to unconditional \'if\'.',
    };
  }

  // 3. Obligation ("must", "shall", "is required to") weakened to permission/choice ("may", "can choose to", "optional")
  const obligationRegex = /\b(?:must|shall|is\s+required\s+to|are\s+required\s+to)\s+([a-z]+)\b/gi;
  let obMatch: RegExpExecArray | null;
  while ((obMatch = obligationRegex.exec(normOrig)) !== null) {
    const verb = obMatch[1];
    if (['be', 'have'].includes(verb)) continue;
    const permissionRegex = new RegExp(`\\b(?:may(?:\\s+choose\\s+to)?|can\\s+choose\\s+to|is\\s+optional\\s+to|are\\s+free\\s+to)\\s+${verb}\\b`, 'i');
    if (permissionRegex.test(normCand)) {
      return {
        isValid: false,
        error: `Obligation weakened: Mandatory '${obMatch[0]}' was weakened to optional permission in rewrite.`,
      };
    }
  }

  return { isValid: true };
}

/**
 * Validates alphanumeric identifiers (e.g., "CVE-2024-3094", "RFC-9110", "ISO-8601", "UUID-4A8B") are preserved.
 */
export function validateAlphanumericIdentifiers(
  originalText: string,
  candidateText: string
): { isValid: boolean; missingIdentifiers: string[] } {
  const missing: string[] = [];
  const idPattern = /\b[A-Z]{2,}(?:-[A-Za-z0-9]+)+\b/g;
  const origMatches = originalText.match(idPattern) || [];

  for (const id of origMatches) {
    const rx = new RegExp(`\\b${id.replace(/-/g, '[- ]?')}\\b`, 'i');
    if (!rx.test(candidateText)) {
      missing.push(id);
    }
  }

  return { isValid: missing.length === 0, missingIdentifiers: missing };
}

/**
 * Checks for lost restrictive qualifications (e.g., "under laboratory conditions", "primarily", "allegedly").
 */
export function checkLostQualifications(
  originalText: string,
  candidateText: string
): { hasLostQualifications: boolean; qualifications: string[] } {
  const qualifications: string[] = [];
  const qualPatterns = [
    /\bunder\s+(?:certain|specific|controlled|laboratory|standard|extreme)\s+conditions\b/i,
    /\bsubject\s+to\s+[a-z\s]+approval\b/i,
    /\bprovided\s+that\b/i,
    /\btentatively\b/i,
    /\bprimarily\b/i,
    /\ballegedly\b/i,
  ];

  for (const q of qualPatterns) {
    const m = q.exec(originalText);
    if (m && !q.test(candidateText)) {
      qualifications.push(m[0]);
    }
  }

  return { hasLostQualifications: qualifications.length > 0, qualifications };
}



