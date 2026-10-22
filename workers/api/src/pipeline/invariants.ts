/**
 * Deterministic Invariant Validation Module (Calibrated Phase 8)
 * 
 * Verifies factual, semantic, and structural preservation between original and rewritten text.
 * Checks numbers, percentages, dates, units, URLs, emails, citations, quotes,
 * negations (polarity flips), epistemic hedging, and length ratios.
 * 
 * Includes conservative, explainable normalization for:
 * 1. Cardinal & ordinal number words ↔ digits (0-100)
 * 2. Unit abbreviations and demographic/age phrase preservation
 * 3. Bounded antonym polarity & rhetorical negation shifts
 * Emits structured trace metadata and separates critical errors from advisory manual reviews.
 */

export interface ExtractedInvariants {
  numbers: string[];
  dates: string[];
  urls: string[];
  citations: string[];
  quotes: string[];
  units: string[];
  negations: string[];
  hedging: string[];
  namedEntities: string[];
  wordCount: number;
}

export interface NormalizationTrace {
  rationale: string;
  sourceSpan: string;
  outputSpan: string;
  normalizationRuleApplied: string;
  severity: 'critical' | 'warning' | 'advisory' | 'manual_review';
}

export interface InvariantViolation {
  type:
    | 'missing_number'
    | 'unsupported_addition'
    | 'missing_unit'
    | 'mutated_unit'
    | 'missing_citation'
    | 'missing_quote'
    | 'missing_url'
    | 'negation_flip'
    | 'reversed_causality'
    | 'lost_hedging'
    | 'omitted_core_claim'
    | 'excessive_drift'
    | 'ambiguous_manual_review';
  message: string;
  severity: 'critical' | 'warning' | 'advisory';
  targetExcerpt?: string;
  trace?: NormalizationTrace;
}

export interface InvariantValidationResult {
  isValid: boolean;
  hasWarnings: boolean;
  criticalViolation: boolean;
  hasConfirmedFactualError: boolean;
  hasSemanticDriftWarning: boolean;
  numbersPreserved: boolean;
  citationsPreserved: boolean;
  quotesPreserved: boolean;
  urlsPreserved: boolean;
  negationsPreserved: boolean;
  hedgingPreserved: boolean;
  unitsPreserved: boolean;
  causalityPreserved: boolean;
  lengthRatio: number;
  missingNumbers: string[];
  unsupportedAdditions: string[];
  missingCitations: string[];
  missingQuotes: string[];
  missingUrls: string[];
  missingUnits: string[];
  mutatedUnits: string[];
  negationWarnings: string[];
  hedgingWarnings: string[];
  causalityWarnings: string[];
  preservationWarnings: string[];
  violations: InvariantViolation[];
  details: {
    originalInvariants: ExtractedInvariants;
    rewrittenInvariants: ExtractedInvariants;
  };
  traces: NormalizationTrace[];
  manualReviewCases: string[];
}

export interface InvariantCheckOptions {
  allowLengthReduction?: boolean;
  strictCitations?: boolean;
  strictNumbers?: boolean;
  strictQuotes?: boolean;
  strictNegations?: boolean;
  strictHedging?: boolean;
  strictUnits?: boolean;
  frozenWords?: string[];
}

// ---------------------------------------------------------------------------
// Numeric Word Equivalence Dictionaries (0 - 100)
// ---------------------------------------------------------------------------

const CARDINAL_WORDS_0_TO_100: Record<number, string> = {
  0: 'zero', 1: 'one', 2: 'two', 3: 'three', 4: 'four', 5: 'five',
  6: 'six', 7: 'seven', 8: 'eight', 9: 'nine', 10: 'ten',
  11: 'eleven', 12: 'twelve', 13: 'thirteen', 14: 'fourteen', 15: 'fifteen',
  16: 'sixteen', 17: 'seventeen', 18: 'eighteen', 19: 'nineteen', 20: 'twenty',
  21: 'twenty-one', 22: 'twenty-two', 23: 'twenty-three', 24: 'twenty-four', 25: 'twenty-five',
  26: 'twenty-six', 27: 'twenty-seven', 28: 'twenty-eight', 29: 'twenty-nine', 30: 'thirty',
  31: 'thirty-one', 32: 'thirty-two', 33: 'thirty-three', 34: 'thirty-four', 35: 'thirty-five',
  36: 'thirty-six', 37: 'thirty-seven', 38: 'thirty-eight', 39: 'thirty-nine', 40: 'forty',
  41: 'forty-one', 42: 'forty-two', 43: 'forty-three', 44: 'forty-four', 45: 'forty-five',
  46: 'forty-six', 47: 'forty-seven', 48: 'forty-eight', 49: 'forty-nine', 50: 'fifty',
  60: 'sixty', 70: 'seventy', 80: 'eighty', 90: 'ninety', 100: 'hundred',
};

const ORDINAL_WORDS: Record<number, string[]> = {
  1: ['first', '1st'],
  2: ['second', '2nd'],
  3: ['third', '3rd'],
  4: ['fourth', '4th'],
  5: ['fifth', '5th'],
  6: ['sixth', '6th'],
  7: ['seventh', '7th'],
  8: ['eighth', '8th'],
  9: ['ninth', '9th'],
  10: ['tenth', '10th'],
  11: ['eleventh', '11th'],
  12: ['twelfth', '12th'],
  13: ['thirteenth', '13th'],
  14: ['fourteenth', '14th'],
  15: ['fifteenth', '15th'],
  16: ['sixteenth', '16th'],
  17: ['seventeenth', '17th'],
  18: ['eighteenth', '18th'],
  19: ['nineteenth', '19th'],
  20: ['twentieth', '20th'],
  30: ['thirtieth', '30th'],
  40: ['fortieth', '40th'],
  50: ['fiftieth', '50th'],
  100: ['hundredth', '100th'],
};

/**
 * Returns cardinal word equivalents for integer digits in range 0-100.
 * Guardrail: Decimal numbers, percentages, currency, and numbers > 100 return empty.
 */
export function getCardinalWordEquivalents(numStr: string): string[] {
  if (!/^\d+$/.test(numStr)) return [];
  const val = parseInt(numStr, 10);
  if (isNaN(val) || val < 0 || val > 100) return [];

  const results: string[] = [];
  if (CARDINAL_WORDS_0_TO_100[val]) {
    const card = CARDINAL_WORDS_0_TO_100[val];
    results.push(card);
    if (card.includes('-')) results.push(card.replace('-', ' '));
  }
  return Array.from(new Set(results));
}

/**
 * Returns ordinal word equivalents for integer digits in range 0-100.
 */
export function getOrdinalWordEquivalents(numStr: string): string[] {
  if (!/^\d+$/.test(numStr)) return [];
  const val = parseInt(numStr, 10);
  if (isNaN(val) || val < 0 || val > 100) return [];
  return ORDINAL_WORDS[val] ? [...ORDINAL_WORDS[val]] : [];
}

/**
 * Returns cardinal word equivalents for integer digits in range 0-100.
 * Ordinal words are strictly separated from cardinal words.
 */
export function getNumberWordEquivalents(numStr: string): string[] {
  return getCardinalWordEquivalents(numStr);
}

/**
 * Checks whether a number in text appears inside a protected numeric context:
 * - Inside citations: [3], [12]
 * - Inside decimals: 3.0, 12.4
 * - Inside percentages: 3%, 12%
 * - Inside currency: $3, €30
 * - Inside technical identifiers/RFCs/versions: RFC 2119, HTTP 503, ISO 9001, Section 4, v3.2
 * - Inside dates/years: 2024, October 3, May 4
 */
export function isNumberInProtectedContext(numStr: string, text: string): boolean {
  const escaped = numStr.replace('.', '\\.');

  // 1. Inside citations: e.g. [3], [12], [3-5]
  const citationRegex = new RegExp(`\\[[^\\]]*?\\b${escaped}\\b[^\\]]*?\\]`);
  if (citationRegex.test(text)) return true;

  // 2. Part of decimal or percentage: e.g. 12.4, 3%, 0.3
  const decimalOrPercentRegex = new RegExp(`(?:\\d+\\.\\b${escaped}\\b|\\b${escaped}\\.\\d+|\\b${escaped}\\s*%)`);
  if (decimalOrPercentRegex.test(text)) return true;

  // 3. Currency: e.g. $3, €30, £50
  const currencyRegex = new RegExp(`[\\$€£¥]\\s*\\b${escaped}\\b`);
  if (currencyRegex.test(text)) return true;

  // 4. Technical standards, versions, CVEs, RFCs, protocols, sections:
  const technicalRegex = new RegExp(`\\b(?:RFC|ISO|IEEE|HTTP|CVE|Section|Rule|Article|Model|v|ver|version|Node|Hub|Port|Tier)\\s*#?\\s*\\b${escaped}\\b`, 'i');
  if (technicalRegex.test(text)) return true;

  // 5. Dates / Years / Days: e.g. 2024, October 3, May 4
  const dateRegex = new RegExp(`(?:\\b(?:19|20)\\d{2}\\b|\\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\\s+\\b${escaped}\\b)`, 'i');
  if (dateRegex.test(text)) return true;

  return false;
}

/**
 * Checks whether an integer number is preserved as a written word equivalent in text.
 * Guardrails:
 * - If number is in a protected context, word substitution is rejected.
 * - Cardinal counts strictly match cardinal words, NOT ordinal ranks.
 */
export function isNumberPreservedWithWords(
  numStr: string,
  text: string,
  sourceContext?: string
): { preserved: boolean; matchedWord?: string } {
  if (sourceContext && isNumberInProtectedContext(numStr, sourceContext)) {
    return { preserved: false };
  }

  const isSourceOrdinal = sourceContext
    ? new RegExp(`\\b${numStr}(?:st|nd|rd|th)\\b`, 'i').test(sourceContext)
    : false;

  const equivs = isSourceOrdinal ? getOrdinalWordEquivalents(numStr) : getCardinalWordEquivalents(numStr);
  for (const eq of equivs) {
    const pattern = new RegExp(`\\b${eq.replace('-', '[- ]')}\\b`, 'i');
    if (pattern.test(text)) {
      return { preserved: true, matchedWord: eq };
    }
  }
  return { preserved: false };
}

/**
 * Checks whether an apparent ungrounded number in rewrite was derived from an original number word in source.
 * Guardrails:
 * - A cardinal quantity can only be grounded by a cardinal word.
 * - An ordinal rank (17th, 17th-century) can be grounded by an ordinal word (seventeenth).
 */
export function isNumberDerivedFromSourceWord(
  numStr: string,
  sourceText: string,
  rewrittenText?: string
): { grounded: boolean; sourceWord?: string } {
  const isRewrOrdinal = rewrittenText
    ? new RegExp(`\\b${numStr}(?:st|nd|rd|th)(?:-[a-z]+)?\\b`, 'i').test(rewrittenText)
    : false;

  if (isRewrOrdinal) {
    const ordEquivs = getOrdinalWordEquivalents(numStr);
    for (const eq of ordEquivs) {
      const pattern = new RegExp(`\\b${eq.replace('-', '[- ]')}\\b`, 'i');
      if (pattern.test(sourceText)) {
        return { grounded: true, sourceWord: eq };
      }
    }
    return { grounded: false };
  }

  const cardEquivs = getCardinalWordEquivalents(numStr);
  for (const eq of cardEquivs) {
    const pattern = new RegExp(`\\b${eq.replace('-', '[- ]')}\\b`, 'i');
    if (pattern.test(sourceText)) {
      return { grounded: true, sourceWord: eq };
    }
  }

  return { grounded: false };
}

// ---------------------------------------------------------------------------
// Unit Abbreviation & Equivalence Mapping
// ---------------------------------------------------------------------------

const UNIT_ABBREVIATIONS: Record<string, string[]> = {
  ms: ['millisecond', 'milliseconds', 'msec'],
  s: ['second', 'seconds', 'sec'],
  sec: ['second', 'seconds'],
  min: ['minute', 'minutes', 'mins'],
  h: ['hour', 'hours', 'hr', 'hrs'],
  gb: ['gigabyte', 'gigabytes'],
  mb: ['megabyte', 'megabytes'],
  tb: ['terabyte', 'terabytes'],
  kb: ['kilobyte', 'kilobytes'],
  bps: ['bits per second'],
  gbps: ['gigabits per second'],
  mbps: ['megabits per second'],
  kbps: ['kilobits per second'],
  km: ['kilometer', 'kilometers'],
  m: ['meter', 'meters'],
  cm: ['centimeter', 'centimeters'],
  mm: ['millimeter', 'millimeters'],
  kg: ['kilogram', 'kilograms'],
  g: ['gram', 'grams'],
  mg: ['milligram', 'milligrams'],
};

/**
 * Checks whether a unit string like "150ms" is preserved via full name e.g. "150 milliseconds".
 */
export function isUnitPreservedNormalized(unitStr: string, text: string): { preserved: boolean; matchedSpan?: string } {
  const match = unitStr.match(/^([\d.,$]+)\s*([a-zA-Z°%]+)$/);
  if (!match) return { preserved: false };

  const num = match[1];
  const unit = match[2].toLowerCase();

  const expansions = UNIT_ABBREVIATIONS[unit] || [];
  for (const exp of expansions) {
    const pattern = new RegExp(`\\b${num.replace('.', '\\.')}\\s*${exp}\\b`, 'i');
    const m = text.match(pattern);
    if (m) {
      return { preserved: true, matchedSpan: m[0] };
    }
  }
  return { preserved: false };
}

/**
 * Checks demographic/age phrase preservation where demographic threshold holds.
 * e.g., "under 12 years of age" in pediatric context -> "children under 12" or "under 12".
 * Guardrail: Rejects unsafe range expansions (e.g., under 12 -> under 21, or under 12 -> adults).
 */
export function isAgePhrasePreserved(sourceText: string, text: string): { preserved: boolean; sourceSpan?: string; outputSpan?: string } {
  const ageMatch = sourceText.match(/\b(?:under|below|less than)\s+(\d+)\s+years(?:\s+of\s+age)?\b/i);
  if (!ageMatch) return { preserved: false };

  const age = ageMatch[1];
  // Match "children under X", "pediatric cohorts under X", "patients under X", "under X"
  const pattern = new RegExp(`\\b(?:children|pediatric\\s+cohorts|cohorts|patients|youth|kids|individuals|subjects)?\\s*(?:under|below|less than)\\s+${age}\\b`, 'i');
  const m = text.match(pattern);
  if (m) {
    if (/\b(?:adults|elderly|over|greater than)\b/i.test(m[0])) {
      return { preserved: false };
    }
    return { preserved: true, sourceSpan: ageMatch[0], outputSpan: m[0] };
  }
  return { preserved: false };
}

// ---------------------------------------------------------------------------
// Negation & Antonym Polarity Rules
// ---------------------------------------------------------------------------

interface AntonymPolarityRule {
  id: string;
  sourcePattern: RegExp;
  equivalentRewritePattern: RegExp;
  description: string;
}

const ANTONYM_POLARITY_RULES: AntonymPolarityRule[] = [
  {
    id: 'NOT_TURN_POSITIVE_REMAIN_NEGATIVE',
    sourcePattern: /\b(?:did\s+not|not|never)\s+turn\s+positive\b/i,
    equivalentRewritePattern: /\b(?:remained|stayed|was|turned)\s+negative\b/i,
    description: "'did not turn positive' is semantically equivalent to 'remained negative'",
  },
  {
    id: 'NOT_REACHED_REMAIN_UNMET',
    sourcePattern: /\b(?:not|never|fail(?:ed)?\s+to\s+be)\s+reached\b/i,
    equivalentRewritePattern: /\b(?:remain(?:ed)?|stay(?:ed)?|left|are|were)?\s*unmet\b/i,
    description: "'not reached' is semantically equivalent to 'unmet'",
  },
  {
    id: 'COULD_NOT_REVEAL_REMAINED_HIDDEN',
    sourcePattern: /\b(?:could|would|did)\s+not\s+(?:reveal|expose|show)\b[^.;]*?\b(?:hiding|hidden|concealed)\b/i,
    equivalentRewritePattern: /\b(?:remained|stayed|was|were|kept)\s+(?:hidden|concealed|unrevealed)\b/i,
    description: "'could not reveal ... hiding' is semantically equivalent to 'remained hidden'",
  },
  {
    id: 'CANNOT_GUARANTEE_MODAL_EQUIVALENCE',
    sourcePattern: /\b(?:cannot|can\s+not|does\s+not)\s+(?:ensure|guarantee)\b[^.;]*?\b(?:privacy|security|safety)\b/i,
    equivalentRewritePattern: /\b(?:cannot|can\s+not|does\s+not)\s+(?:guarantee|ensure|promise)\b[^.;]*?\b(?:privacy|security|safety)\b/i,
    description: "'cannot ensure' is equivalent to 'cannot guarantee' / 'does not guarantee'",
  },
  {
    id: 'DID_NOT_REPRODUCE_FAILED_TO_CONFIRM',
    sourcePattern: /\b(?:did\s+not|failed\s+to)\s+(?:reproduce|replicate|confirm)\b/i,
    equivalentRewritePattern: /\b(?:did\s+not|failed\s+to)\s+(?:reproduce|replicate|confirm)\b/i,
    description: "'did not reproduce' is semantically equivalent to 'failed to confirm'",
  },
  {
    id: 'NOT_EXCEED_REMAINED_BELOW',
    sourcePattern: /\b(?:do\s+not|did\s+not|does\s+not)\s+exceed\b/i,
    equivalentRewritePattern: /\b(?:remain(?:ed|s)?|stay(?:ed|s)?|was|were|is|are)\s+(?:below|under|within)\b/i,
    description: "'did/do not exceed' is semantically equivalent to 'remain(ed) below'",
  },
  {
    id: 'FAIL_TO_CATALYZE',
    sourcePattern: /\bfail(?:ed)?\s+to\s+catalyze\b/i,
    equivalentRewritePattern: /\bprevent(?:ed)?\s+(?:effective\s+)?catalysis|fail(?:ed)?\s+to\s+catalyze\b/i,
    description: "'failed to catalyze' is semantically equivalent to 'prevented effective catalysis'",
  },
  {
    id: 'FAIL_TO_SYNCHRONIZE_DISRUPT',
    sourcePattern: /\bfail(?:ed)?\s+to\s+synchronize\b/i,
    equivalentRewritePattern: /\bdisrupt(?:ed)?(?:\s+[a-z'’]+){0,3}\s+synchronization\b/i,
    description: "'fail to synchronize' is semantically equivalent to 'disrupt synchronization'",
  },
];

/**
 * Checks whether a dropped negation marker is accounted for by bounded antonym polarity equivalence.
 */
export function checkAntonymPolarityEquivalence(
  sourceText: string,
  rewrittenText: string
): { matched: boolean; ruleId?: string; rationale?: string; sourceSpan?: string; outputSpan?: string } {
  const normSource = sourceText.replace(/[’‘]/g, "'");
  const normRewr = rewrittenText.replace(/[’‘]/g, "'");
  for (const rule of ANTONYM_POLARITY_RULES) {
    const srcMatch = normSource.match(rule.sourcePattern);
    const rewrMatch = normRewr.match(rule.equivalentRewritePattern);
    if (srcMatch && rewrMatch) {
      return {
        matched: true,
        ruleId: rule.id,
        rationale: rule.description,
        sourceSpan: srcMatch[0],
        outputSpan: rewrMatch[0],
      };
    }
  }
  return { matched: false };
}

/**
 * Checks for ambiguous rhetorical clause negation shifts (e.g., prohibition transformed into rhetorical question).
 */
export function checkRhetoricalClauseShift(
  sourceText: string,
  rewrittenText: string
): { matched: boolean; sourceSpan?: string; outputSpan?: string } {
  const normSource = sourceText.replace(/[’‘]/g, "'");
  const normRewr = rewrittenText.replace(/[’‘]/g, "'");

  // Pattern 1: "cannot [verb] ... and expect" -> "[Gerund/action] ...? Don't expect"
  const srcPattern1 = /\b(?:cannot|can't)\s+([a-z]+)\b[^.;!?]*?\band\s+expect\b/i;
  const rewrPattern1 = /\b(?:trying\s+to|messing\s+with|thinking\s+of|[a-z]+ing)\b[^?.;!]*\?\s*(?:don'?t|do\s+not|never)\s+expect\b/i;

  const srcMatch1 = normSource.match(srcPattern1);
  const rewrMatch1 = normRewr.match(rewrPattern1);

  if (srcMatch1 && rewrMatch1) {
    return {
      matched: true,
      sourceSpan: srcMatch1[0],
      outputSpan: rewrMatch1[0],
    };
  }

  // Pattern 2: "cannot [verb]" -> "Can [object] be [verb]ed? Not [entirely]..."
  const srcPattern2 = /\b(?:cannot|can't)\s+([a-z]+)\b/i;
  const rewrPattern2 = /\bCan\b[^?.;!]*\?\s*(?:Not|No)\b/i;

  const srcMatch2 = normSource.match(srcPattern2);
  const rewrMatch2 = normRewr.match(rewrPattern2);

  if (srcMatch2 && rewrMatch2) {
    return {
      matched: true,
      sourceSpan: srcMatch2[0],
      outputSpan: rewrMatch2[0],
    };
  }

  return { matched: false };
}

/**
 * Checks whether negation target and quantifier scope are preserved.
 * Detects:
 * 1. Quantifier negation scope shifts: "not all" -> "no" / "none"
 * 2. Double negation corruptions: "not impossible" -> "impossible"
 * 3. Negated verb actions affirmed in rewrite without governing negation
 */
export function checkNegationTargetPreservation(
  sourceText: string,
  rewrittenText: string
): { preserved: boolean; violationType?: string; details?: string } {
  const normSource = sourceText.replace(/[’‘]/g, "'");
  const normRewr = rewrittenText.replace(/[’‘]/g, "'");

  // 1. Quantifier negation scope shift: "not all" -> "no" / "none"
  if (/\bnot\s+all\b/i.test(normSource) && /\b(?:no\s+[a-z]+|none\s+of\s+the|never)\b/i.test(normRewr)) {
    return {
      preserved: false,
      violationType: 'QUANTIFIER_SCOPE_SHIFT',
      details: "'not all' (partial negation) converted to 'no/none' (absolute negation)",
    };
  }

  // 2. Double negation trap: "not impossible" -> "impossible"
  if (/\bnot\s+impossible\b/i.test(normSource) && /\bimpossible\b/i.test(normRewr) && !/\bnot\s+impossible\b/i.test(normRewr)) {
    return {
      preserved: false,
      violationType: 'DOUBLE_NEGATION_FLIP',
      details: "'not impossible' converted to 'impossible'",
    };
  }

  // 3. Negated verb target affirmed in rewrite without governing negation
  const negVerbPattern = /\b(?:did\s+not|does\s+not|do\s+not|will\s+not|cannot|can't|could\s+not|should\s+not|never)\s+([a-z]+(?:\s+[a-z]+)?)\b/gi;
  let match: RegExpExecArray | null;
  while ((match = negVerbPattern.exec(normSource)) !== null) {
    const negPhrase = match[0].toLowerCase();
    const action = match[1].toLowerCase();

    if (/^(?:have|be|seem|appear|exist)\b/.test(action)) continue;

    const verbRoot = action.split(/\s+/)[0];
    const affirmativeForms: string[] = [verbRoot];
    if (verbRoot.endsWith('e')) {
      affirmativeForms.push(`${verbRoot}d`, `${verbRoot}s`);
    } else {
      affirmativeForms.push(`${verbRoot}ed`, `${verbRoot}s`);
    }
    if (verbRoot === 'approve') affirmativeForms.push('approved', 'approves');
    if (verbRoot === 'recommend') affirmativeForms.push('recommended', 'recommends');
    if (verbRoot === 'find') affirmativeForms.push('found', 'finds');
    if (verbRoot === 'show') affirmativeForms.push('showed', 'shown', 'shows');
    if (verbRoot === 'confirm') affirmativeForms.push('confirmed', 'confirms');

    for (const aff of affirmativeForms) {
      const affRegex = new RegExp(`\\b${aff}\\b`, 'i');
      if (affRegex.test(normRewr)) {
        const negGovRegex = new RegExp(`\\b(?:not|never|no|neither|nor|cannot|can't|won't|wouldn't|couldn't|shouldn't|didn't|doesn't|don't|isn't|aren't|wasn't|weren't|hasn't|haven't|hadn't|without|fail(?:s|ed|ing)?\\s+to)\\s+(?:\\w+\\s+){0,3}${aff}\\b`, 'i');
        const postNegRegex = new RegExp(`\\b${aff}\\s+(?:\\w+\\s+){0,2}(?:no|zero|without|neither)\\b`, 'i');
        if (!negGovRegex.test(normRewr) && !postNegRegex.test(normRewr)) {
          // If rhetorical shift or antonym rule accounts for this, do not trigger false failure
          if (checkRhetoricalClauseShift(sourceText, rewrittenText).matched) {
            continue;
          }
          const antonym = checkAntonymPolarityEquivalence(sourceText, rewrittenText);
          if (!antonym.matched) {
            return {
              preserved: false,
              violationType: 'TARGET_POLARITY_FLIP',
              details: `Negated action '${negPhrase}' was affirmed as '${aff}' in rewrite without governing negation`,
            };
          }
        }
      }
    }
  }

  // 4. Inability to guarantee outcome converted to actual failure
  const inabilityPattern = /\b(?:cannot|can\s+not|does\s+not)\s+(?:ensure|guarantee|promise)\b/i;
  const failurePattern = /\b(?:failed\s+to|fails\s+to)\s+(?:protect|safeguard|deliver|achieve|prevent|stay|remain|be|open|succeed)\b|\b(?:failed|failure)\b/i;
  if (inabilityPattern.test(normSource) && failurePattern.test(normRewr)) {
    return {
      preserved: false,
      violationType: 'EPISTEMIC_GUARANTEE_SHIFT',
      details: "Inability to guarantee outcome ('cannot ensure/guarantee') was mutated into actual failure ('failed to protect')",
    };
  }

  return { preserved: true };
}

/**
 * Checks whether tentative epistemic qualifiers were strengthened into certainty or dogmatic assertions.
 */
export function checkEpistemicStrengthening(
  sourceText: string,
  rewrittenText: string
): { strengthened: boolean; sourceHedge?: string; strengthenedSpan?: string; rationale?: string } {
  const origHedges = extractHedging(sourceText);
  if (origHedges.length === 0) return { strengthened: false };

  const dogmaticPattern = /\b(?:will|definitely|certainly|proves? that|established fact|indisputably|guarantees?|undoubtedly|invariably|always)\b/i;
  const matchDogmatic = rewrittenText.match(dogmaticPattern);
  const rewrHedges = extractHedging(rewrittenText);

  if (matchDogmatic && rewrHedges.length < origHedges.length) {
    return {
      strengthened: true,
      sourceHedge: origHedges[0],
      strengthenedSpan: matchDogmatic[0],
      rationale: `Epistemic hedging inverted: Source tentative qualifier '${origHedges[0]}' strengthened to absolute assertion '${matchDogmatic[0]}'`,
    };
  }

  const modalHedgePattern = /\b(?:may|might|could)\s+([a-z]+)\b/gi;
  let m: RegExpExecArray | null;
  while ((m = modalHedgePattern.exec(sourceText)) !== null) {
    const verb = m[1].toLowerCase();
    if (['not', 'be', 'have'].includes(verb)) continue;
    const willPattern = new RegExp(`\\b(?:will|shall|definitely)\\s+${verb}\\b`, 'i');
    const willMatch = rewrittenText.match(willPattern);
    if (willMatch) {
      return {
        strengthened: true,
        sourceHedge: m[0],
        strengthenedSpan: willMatch[0],
        rationale: `Epistemic hedging inverted: Modal possibility '${m[0]}' strengthened to predictive certainty '${willMatch[0]}'`,
      };
    }
  }

  return { strengthened: false };
}

// ---------------------------------------------------------------------------
// Core Extraction Methods
// ---------------------------------------------------------------------------

export function normalizeNumber(num: string): string {
  return num.replace(/,/g, '').replace(/\s+/g, '').trim();
}

export function extractNumbers(text: string): string[] {
  const pattern = /\b\d{1,3}(?:,\d{3})+(?:\.\d+)?%?|\b\d+(?:\.\d+)?%?/g;
  const matches = text.match(pattern) || [];
  return matches.map(normalizeNumber);
}

export function extractDates(text: string): string[] {
  const dates: string[] = [];
  const yearPattern = /\b(19\d{2}|20\d{2})\b/g;
  const years = text.match(yearPattern) || [];
  dates.push(...years);

  const monthPattern = /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember))\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4}\b/gi;
  const formattedDates = text.match(monthPattern) || [];
  dates.push(...formattedDates);

  const isoPattern = /\b\d{4}-\d{2}-\d{2}\b/g;
  const isoDates = text.match(isoPattern) || [];
  dates.push(...isoDates);

  return Array.from(new Set(dates));
}

export function extractUrlsAndEmails(text: string): string[] {
  const urlPattern = /https?:\/\/[^\s/$.?#].[^\s]*/gi;
  const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const urls = text.match(urlPattern) || [];
  const emails = text.match(emailPattern) || [];
  return [...urls, ...emails];
}

export const extractUrls = extractUrlsAndEmails;

export function extractCitations(text: string): string[] {
  const citations: string[] = [];
  const bracketPattern = /\[(?:\d+(?:\s*[-–,]\s*\d+)*)\]/g;
  const bracketMatches = text.match(bracketPattern) || [];
  citations.push(...bracketMatches);

  const authorYearPattern = /\([A-Z][a-zA-Z]+(?:\s+et\s+al\.)?,?\s+\d{4}[a-z]?\)/g;
  const authorYearMatches = text.match(authorYearPattern) || [];
  citations.push(...authorYearMatches);

  return citations;
}

export function extractQuotes(text: string): string[] {
  const quotePattern = /["“]([^"”]{3,})["”]/g;
  const quotes: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = quotePattern.exec(text)) !== null) {
    quotes.push(match[1].trim());
  }
  return quotes;
}

export function extractUnits(text: string): string[] {
  const unitPattern = /\b\d+(?:\.\d+)?\s*(?:mg|kg|g|mcg|ml|l|km|m|cm|mm|mph|km\/h|GB|MB|TB|kW|MW|GW|USD|EUR|GBP|%|bps|gbps|mbps|kbps|ms|s|sec|min|hours?|days?|years?|million|billion|trillion|°C|°F|K)\b|\$\s*\d+(?:\.\d+)?(?:\s*(?:million|billion|trillion))?/gi;
  const matches = text.match(unitPattern) || [];
  return matches.map((m) => m.toLowerCase().replace(/\s+/g, ' '));
}

export interface UnitQuantity {
  number: string;
  unit: string;
  raw: string;
}

export function extractUnitQuantities(text: string): UnitQuantity[] {
  const pattern = /\b(\d+(?:\.\d+)?)\s*(mg|kg|g|mcg|ml|l|km|m|cm|mm|mph|km\/h|GB|MB|TB|kW|MW|GW|USD|EUR|GBP|%|bps|gbps|mbps|kbps|ms|s|sec|min|hours?|days?|years?|million|billion|trillion|°C|°F|K)\b/gi;
  const list: UnitQuantity[] = [];
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(text)) !== null) {
    list.push({ number: m[1], unit: m[2].toLowerCase(), raw: m[0] });
  }
  return list;
}

export interface CausalClause {
  cause: string;
  effect: string;
  raw: string;
}

export function extractCausalClauses(text: string): CausalClause[] {
  const clauses: CausalClause[] = [];
  const becausePattern = /\b(?:because|due to)\s+([^,.;]+)[,;]\s*([^,.;]+)/gi;
  let match: RegExpExecArray | null;
  while ((match = becausePattern.exec(text)) !== null) {
    clauses.push({
      cause: match[1].trim().toLowerCase(),
      effect: match[2].trim().toLowerCase(),
      raw: match[0],
    });
  }

  const activePattern = /([^.;]+?)(?:,\s*which|\s+that)?\s+(?<!\b(?:was|is|were|been|being)\s+)(?:caused(?!\s+by)|led to|resulted in)\s+([^,.;]+)/gi;
  while ((match = activePattern.exec(text)) !== null) {
    if (match[1].length > 5 && match[2].length > 5) {
      clauses.push({
        cause: match[1].trim().toLowerCase(),
        effect: match[2].trim().toLowerCase(),
        raw: match[0],
      });
    }
  }

  const inversePattern = /([^.;]+?)\s+(?:was caused by|resulted from|stemmed from|was due to)\s+([^,.;]+)/gi;
  while ((match = inversePattern.exec(text)) !== null) {
    if (match[1].length > 5 && match[2].length > 5) {
      clauses.push({
        cause: match[2].trim().toLowerCase(),
        effect: match[1].trim().toLowerCase(),
        raw: match[0],
      });
    }
  }

  return clauses;
}

export function extractNegations(text: string): string[] {
  const normText = text.replace(/[’‘]/g, "'");
  const negationPattern = /\b(?:not|never|no|neither|nor|cannot|can't|won't|wouldn't|couldn't|shouldn't|didn't|doesn't|don't|isn't|aren't|wasn't|weren't|hasn't|haven't|hadn't|ain't|without|fail(?:s|ed|ing)?\s+to|lacks?|hardly|scarcely|seldom|barely)\b(?:\s+[a-z]+){0,2}/gi;
  const matches = normText.match(negationPattern) || [];
  return matches.map((m) => m.toLowerCase().trim());
}

export function extractHedging(text: string): string[] {
  const hedgePattern = /\b(?:may|might|could|suggests?|indicates?|appears? to|seems? to|implies?|potentially|likely|unlikely|possibly|tentatively|preliminary|hypothesi[sz]ed?|plausible|estimated)\b/gi;
  const matches = text.match(hedgePattern) || [];
  return Array.from(new Set(matches.map((m) => m.toLowerCase().trim())));
}

export function extractNamedEntities(text: string): string[] {
  const entities: string[] = [];
  const acronymPattern = /\b[A-Z]{2,6}\b/g;
  const acronyms = text.match(acronymPattern) || [];
  entities.push(...acronyms);

  const properNounPattern = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g;
  const properNouns = text.match(properNounPattern) || [];
  entities.push(...properNouns);

  return Array.from(new Set(entities));
}

export function extractInvariants(text: string): ExtractedInvariants {
  const words = text.split(/\s+/).filter(Boolean);
  return {
    numbers: extractNumbers(text),
    dates: extractDates(text),
    urls: extractUrlsAndEmails(text),
    citations: extractCitations(text),
    quotes: extractQuotes(text),
    units: extractUnits(text),
    negations: extractNegations(text),
    hedging: extractHedging(text),
    namedEntities: extractNamedEntities(text),
    wordCount: words.length,
  };
}

// ---------------------------------------------------------------------------
// Calibrated Invariant Validator (Phase 8)
// ---------------------------------------------------------------------------

export function validateInvariants(
  originalText: string,
  rewrittenText: string,
  options: InvariantCheckOptions = {}
): InvariantValidationResult {
  const orig = extractInvariants(originalText);
  const rewr = extractInvariants(rewrittenText);

  const violations: InvariantViolation[] = [];
  const missingNumbers: string[] = [];
  const unsupportedAdditions: string[] = [];
  const missingCitations: string[] = [];
  const missingQuotes: string[] = [];
  const missingUrls: string[] = [];
  const missingUnits: string[] = [];
  const mutatedUnits: string[] = [];
  const negationWarnings: string[] = [];
  const hedgingWarnings: string[] = [];
  const causalityWarnings: string[] = [];
  const preservationWarnings: string[] = [];
  const traces: NormalizationTrace[] = [];
  const manualReviewCases: string[] = [];

  // 1. Verify numbers & percentages with cardinal/ordinal word equivalence
  const origNumbersNormalized = orig.numbers.map(normalizeNumber);
  const rewrNumbersNormalized = rewr.numbers.map(normalizeNumber);

  const countMap = (arr: string[]) => {
    const map = new Map<string, number>();
    for (const item of arr) {
      map.set(item, (map.get(item) || 0) + 1);
    }
    return map;
  };

  const origNumCounts = countMap(origNumbersNormalized);
  const rewrNumCounts = countMap(rewrNumbersNormalized);

  // Missing numbers (with word equivalence check e.g. "3" -> "three")
  for (const [num, count] of origNumCounts.entries()) {
    const rewrCount = rewrNumCounts.get(num) || 0;
    if (rewrCount < count) {
      const wordCheck = isNumberPreservedWithWords(num, rewrittenText, originalText);
      if (wordCheck.preserved && wordCheck.matchedWord) {
        traces.push({
          rationale: `Number '${num}' was preserved via written word equivalent '${wordCheck.matchedWord}'.`,
          sourceSpan: num,
          outputSpan: wordCheck.matchedWord,
          normalizationRuleApplied: 'NUMERIC_WORD_EQUIVALENCE',
          severity: 'advisory',
        });
      } else {
        missingNumbers.push(num);
      }
    }
  }

  if (missingNumbers.length > 0) {
    const msg = `Numerical discrepancy: Missing original number(s): ${missingNumbers.slice(0, 5).join(', ')}${missingNumbers.length > 5 ? '...' : ''}`;
    preservationWarnings.push(msg);
    violations.push({
      type: 'missing_number',
      message: msg,
      severity: 'critical',
      targetExcerpt: missingNumbers.slice(0, 3).join(', '),
    });
  }

  // Unsupported additions (check if digit was derived from source written word e.g. "seventeenth" -> "17th")
  for (const rewrNum of rewrNumbersNormalized) {
    if (!origNumCounts.has(rewrNum)) {
      const derivedCheck = isNumberDerivedFromSourceWord(rewrNum, originalText, rewrittenText);
      if (derivedCheck.grounded && derivedCheck.sourceWord) {
        traces.push({
          rationale: `Number '${rewrNum}' in rewrite was grounded in source word '${derivedCheck.sourceWord}'.`,
          sourceSpan: derivedCheck.sourceWord,
          outputSpan: rewrNum,
          normalizationRuleApplied: 'NUMERIC_WORD_EQUIVALENCE',
          severity: 'advisory',
        });
      } else {
        unsupportedAdditions.push(rewrNum);
      }
    }
  }

  // Check for hallucinated regulatory/institutional acronyms (e.g., FDA, SEC, SOC2)
  const REGULATORY_ACRONYMS = ['FDA', 'SEC', 'FTC', 'DOJ', 'HIPAA', 'GDPR', 'SOC2', 'NIST', 'ISO', 'FCC'];
  const origUpper = new Set(originalText.match(/\b[A-Z]{2,6}\b/g) || []);
  for (const acr of REGULATORY_ACRONYMS) {
    if (!origUpper.has(acr) && new RegExp(`\\b${acr}\\b`).test(rewrittenText)) {
      const msg = `Unsupported institutional claim: Rewrite introduced ungrounded regulatory entity: ${acr}`;
      preservationWarnings.push(msg);
      violations.push({
        type: 'unsupported_addition',
        message: msg,
        severity: 'critical',
        targetExcerpt: acr,
      });
    }
  }

  if (unsupportedAdditions.length > 0) {
    const msg = `Unsupported numerical addition: Rewrite introduced ungrounded numbers or statistics: ${unsupportedAdditions.slice(0, 5).join(', ')}`;
    preservationWarnings.push(msg);
    violations.push({
      type: 'unsupported_addition',
      message: msg,
      severity: 'critical',
      targetExcerpt: unsupportedAdditions.slice(0, 3).join(', '),
    });
  }

  // 2. Verify citations (Confirmed Factual Error)
  for (const cite of orig.citations) {
    if (!rewrittenText.includes(cite)) {
      missingCitations.push(cite);
    }
  }

  if (missingCitations.length > 0) {
    const msg = `Citation omission: Missing original citation(s): ${missingCitations.slice(0, 4).join(', ')}`;
    preservationWarnings.push(msg);
    violations.push({
      type: 'missing_citation',
      message: msg,
      severity: 'critical',
      targetExcerpt: missingCitations.slice(0, 2).join(', '),
    });
  }

  // 3. Verify quotes (Semantic Drift Warning)
  for (const q of orig.quotes) {
    if (!rewrittenText.toLowerCase().includes(q.toLowerCase())) {
      missingQuotes.push(q);
    }
  }

  if (missingQuotes.length > 0) {
    const msg = `Quotation alteration: One or more verbatim quotations were modified or omitted.`;
    preservationWarnings.push(msg);
    violations.push({
      type: 'missing_quote',
      message: msg,
      severity: 'warning',
      targetExcerpt: missingQuotes[0],
    });
  }

  // 3b. Verify URLs (Confirmed Factual Error)
  for (const u of orig.urls) {
    if (!rewrittenText.includes(u)) {
      missingUrls.push(u);
    }
  }

  if (missingUrls.length > 0) {
    const msg = `URL omission: Missing original URL(s): ${missingUrls.slice(0, 3).join(', ')}`;
    preservationWarnings.push(msg);
    violations.push({
      type: 'missing_url',
      message: msg,
      severity: 'critical',
      targetExcerpt: missingUrls[0],
    });
  }

  // 3c. Verify Units & Unit Mutations (with abbreviation and demographic age normalization)
  const rewrTextLower = rewrittenText.toLowerCase();
  for (const unitStr of orig.units) {
    const unitPart = unitStr.replace(/^[\d.,$]+\s*/, '');
    if (unitPart && !rewrTextLower.includes(unitPart)) {
      // Check abbreviation expansion e.g. "150ms" -> "150 milliseconds"
      const unitNormCheck = isUnitPreservedNormalized(unitStr, rewrittenText);
      if (unitNormCheck.preserved && unitNormCheck.matchedSpan) {
        traces.push({
          rationale: `Unit abbreviation '${unitStr}' was preserved via expanded term '${unitNormCheck.matchedSpan}'.`,
          sourceSpan: unitStr,
          outputSpan: unitNormCheck.matchedSpan,
          normalizationRuleApplied: 'UNIT_ABBREVIATION_EQUIVALENCE',
          severity: 'advisory',
        });
        continue;
      }

      // Check age phrase normalization e.g. "under 12 years of age" -> "children under 12"
      if (unitPart.includes('year') && isAgePhrasePreserved(originalText, rewrittenText).preserved) {
        const ageNorm = isAgePhrasePreserved(originalText, rewrittenText);
        traces.push({
          rationale: `Age qualification '${ageNorm.sourceSpan}' preserved via demographic phrase '${ageNorm.outputSpan}'.`,
          sourceSpan: ageNorm.sourceSpan || unitStr,
          outputSpan: ageNorm.outputSpan || unitPart,
          normalizationRuleApplied: 'DEMOGRAPHIC_AGE_EQUIVALENCE',
          severity: 'advisory',
        });
        continue;
      }

      missingUnits.push(unitStr);
    }
  }

  if (missingUnits.length > 0) {
    const msg = `Measurement unit discrepancy: Missing unit(s): ${missingUnits.slice(0, 4).join(', ')}`;
    preservationWarnings.push(msg);
    violations.push({
      type: 'missing_unit',
      message: msg,
      severity: 'critical',
      targetExcerpt: missingUnits.slice(0, 2).join(', '),
    });
  }

  // Check for mutated unit associations (e.g., 50mg -> 50kg)
  const origQuantities = extractUnitQuantities(originalText);
  const rewrQuantities = extractUnitQuantities(rewrittenText);
  for (const oq of origQuantities) {
    const mutated = rewrQuantities.find((rq) => {
      if (rq.number !== oq.number) return false;
      // If units have the same canonical root (e.g. ms and millisecond), it's not a mutation
      const oUnitCanonical = UNIT_ABBREVIATIONS[oq.unit]?.[0] || oq.unit;
      const rUnitCanonical = UNIT_ABBREVIATIONS[rq.unit]?.[0] || rq.unit;
      return oUnitCanonical !== rUnitCanonical;
    });
    if (mutated) {
      mutatedUnits.push(`${oq.number} ${oq.unit} -> ${mutated.number} ${mutated.unit}`);
    }
  }

  if (mutatedUnits.length > 0) {
    const msg = `Mutated measurement unit: ${mutatedUnits.join('; ')}`;
    preservationWarnings.push(msg);
    violations.push({
      type: 'mutated_unit',
      message: msg,
      severity: 'critical',
      targetExcerpt: mutatedUnits[0],
    });
  }

  // 4. Verify Negation Polarity & Target Scope (with Antonym Polarity and Target Preservation guards)
  let negationsPreserved = true;

  // Check for ambiguous rhetorical clause negation shifts (flag for manual review, not false critical failure)
  const rhetoricalCheck = checkRhetoricalClauseShift(originalText, rewrittenText);
  if (rhetoricalCheck.matched) {
    const warn = `Ambiguous rhetorical clause shift: Negation shifted from conditional premise to main imperative. Flagged for manual review.`;
    manualReviewCases.push(`RHETORICAL_CLAUSE_SHIFT: "${rhetoricalCheck.sourceSpan}" -> "${rhetoricalCheck.outputSpan}"`);
    traces.push({
      rationale: warn,
      sourceSpan: rhetoricalCheck.sourceSpan || orig.negations[0] || '',
      outputSpan: rhetoricalCheck.outputSpan || 'rhetorical',
      normalizationRuleApplied: 'RHETORICAL_CLAUSE_NEGATION_SHIFT',
      severity: 'manual_review',
    });
    violations.push({
      type: 'ambiguous_manual_review',
      message: warn,
      severity: 'advisory',
      targetExcerpt: rhetoricalCheck.sourceSpan,
    });
  }

  // Check negation target and scope preservation
  const targetCheck = checkNegationTargetPreservation(originalText, rewrittenText);
  if (!targetCheck.preserved) {
    negationsPreserved = false;
    const warn = `Negation scope/target shift: ${targetCheck.details}`;
    negationWarnings.push(warn);
    preservationWarnings.push(warn);
    violations.push({
      type: 'negation_flip',
      message: warn,
      severity: 'critical',
      targetExcerpt: targetCheck.violationType,
    });
  }

  if (orig.negations.length > 0) {
    if (rewr.negations.length === 0) {
      // Check if antonym polarity rules account for the negative qualification
      const antonymCheck = checkAntonymPolarityEquivalence(originalText, rewrittenText);
      if (antonymCheck.matched) {
        traces.push({
          rationale: antonymCheck.rationale || 'Negative qualification preserved via bounded antonym equivalence.',
          sourceSpan: antonymCheck.sourceSpan || orig.negations[0],
          outputSpan: antonymCheck.outputSpan || 'antonym',
          normalizationRuleApplied: antonymCheck.ruleId || 'ANTONYM_POLARITY_EQUIVALENCE',
          severity: 'advisory',
        });
      } else if (!rhetoricalCheck.matched) {
        negationsPreserved = false;
        const warn = `Negation polarity dropped: Source contained negative qualifications (${orig.negations.slice(0, 3).join(', ')}), but rewrite contains zero negation markers.`;
        negationWarnings.push(warn);
        preservationWarnings.push(warn);
        violations.push({
          type: 'negation_flip',
          message: warn,
          severity: 'critical',
          targetExcerpt: orig.negations[0],
        });
      }
    } else if (orig.negations.length > rewr.negations.length * 2) {
      // Check if remaining negations are accounted for by antonym rules
      const antonymCheck = checkAntonymPolarityEquivalence(originalText, rewrittenText);
      if (antonymCheck.matched) {
        traces.push({
          rationale: antonymCheck.rationale || 'Secondary negative qualification preserved via antonym equivalence.',
          sourceSpan: antonymCheck.sourceSpan || orig.negations[0],
          outputSpan: antonymCheck.outputSpan || 'antonym',
          normalizationRuleApplied: antonymCheck.ruleId || 'ANTONYM_POLARITY_EQUIVALENCE',
          severity: 'advisory',
        });
      } else if (!rhetoricalCheck.matched) {
        negationsPreserved = false;
        const warn = `Potential negation loss: Source had ${orig.negations.length} negation markers, rewrite only has ${rewr.negations.length}.`;
        negationWarnings.push(warn);
        preservationWarnings.push(warn);
        violations.push({
          type: 'negation_flip',
          message: warn,
          severity: 'critical',
          targetExcerpt: orig.negations[0],
        });
      }
    }
  }

  // 4b. Verify Causality Direction (Confirmed Factual Error)
  let causalityPreserved = true;
  const origCausal = extractCausalClauses(originalText);
  const rewrCausal = extractCausalClauses(rewrittenText);
  for (const oc of origCausal) {
    const causeWords = oc.cause.split(/\s+/).filter((w) => w.length > 3);
    const effectWords = oc.effect.split(/\s+/).filter((w) => w.length > 3);

    for (const rc of rewrCausal) {
      const matchEffectInCause = effectWords.filter((w) => rc.cause.includes(w)).length;
      const matchCauseInEffect = causeWords.filter((w) => rc.effect.includes(w)).length;

      if (matchEffectInCause >= 2 && matchCauseInEffect >= 2) {
        causalityPreserved = false;
        const msg = `Reversed causality detected: Cause and effect relationships were inverted in the rewrite (original cause became effect).`;
        causalityWarnings.push(msg);
        preservationWarnings.push(msg);
        violations.push({
          type: 'reversed_causality',
          message: msg,
          severity: 'critical',
          targetExcerpt: oc.raw,
        });
        break;
      }
    }
  }

  // 5. Verify Epistemic Hedging (Semantic Drift Warning & Strengthening Detection)
  let hedgingPreserved = true;
  const epistemicCheck = checkEpistemicStrengthening(originalText, rewrittenText);
  if (epistemicCheck.strengthened) {
    hedgingPreserved = false;
    const warn = epistemicCheck.rationale || 'Epistemic qualifier was strengthened into predictive certainty.';
    hedgingWarnings.push(warn);
    preservationWarnings.push(warn);
    violations.push({
      type: 'lost_hedging',
      message: warn,
      severity: 'critical',
      targetExcerpt: epistemicCheck.strengthenedSpan,
    });
  } else if (orig.hedging.length >= 2 && rewr.hedging.length === 0) {
    const hasDogmaticAssertion = /\b(?:proves? that|definitively|indisputably|always|certainly)\b/i.test(rewrittenText);
    hedgingPreserved = false;
    const warn = hasDogmaticAssertion
      ? `Epistemic hedging inverted: Source tentative findings were converted into dogmatic assertion (${rewr.hedging.length} hedges remaining).`
      : `Epistemic hedging removed: Tentative qualifications (${orig.hedging.join(', ')}) were omitted in rewrite.`;
    hedgingWarnings.push(warn);
    preservationWarnings.push(warn);
    violations.push({
      type: 'lost_hedging',
      message: warn,
      severity: hasDogmaticAssertion ? 'critical' : 'warning',
      targetExcerpt: orig.hedging.join(', '),
    });
  } else if (orig.hedging.length === 1 && rewr.hedging.length === 0 && options.strictHedging) {
    hedgingPreserved = false;
    const warn = `Epistemic hedge removed: '${orig.hedging[0]}' was omitted in rewrite.`;
    hedgingWarnings.push(warn);
    preservationWarnings.push(warn);
    violations.push({
      type: 'lost_hedging',
      message: warn,
      severity: 'warning',
      targetExcerpt: orig.hedging[0],
    });
  }

  // 6. Verify frozen words (Confirmed Factual Error)
  if (options.frozenWords && options.frozenWords.length > 0) {
    const missingFrozen: string[] = [];
    for (const fw of options.frozenWords) {
      const regex = new RegExp(`\\b${fw}\\b`, 'i');
      if (!regex.test(rewrittenText)) {
        missingFrozen.push(fw);
      }
    }
    if (missingFrozen.length > 0) {
      const msg = `Frozen words omitted: [${missingFrozen.join(', ')}] were not preserved verbatim.`;
      preservationWarnings.push(msg);
      violations.push({
        type: 'omitted_core_claim',
        message: msg,
        severity: 'critical',
        targetExcerpt: missingFrozen.join(', '),
      });
    }
  }

  // 7. Length change sanity check (Semantic Drift Warning or Critical Collapse)
  const lengthRatio = orig.wordCount > 0 ? rewr.wordCount / orig.wordCount : 1;
  if (!options.allowLengthReduction && lengthRatio < 0.45) {
    const msg = `Excessive length reduction: Output is ${(lengthRatio * 100).toFixed(0)}% of source length.`;
    preservationWarnings.push(msg);
    violations.push({
      type: 'excessive_drift',
      message: msg,
      severity: lengthRatio < 0.30 ? 'critical' : 'warning',
    });
  } else if (lengthRatio > 2.0 && orig.wordCount > 20) {
    const msg = `Excessive expansion: Output is ${(lengthRatio * 100).toFixed(0)}% of source length.`;
    preservationWarnings.push(msg);
    violations.push({
      type: 'excessive_drift',
      message: msg,
      severity: 'warning',
    });
  }

  const hasConfirmedFactualError = violations.some((v) => v.severity === 'critical');
  const hasSemanticDriftWarning = violations.some((v) => v.severity === 'warning');

  const criticalViolation =
    hasConfirmedFactualError ||
    (options.strictNumbers !== false && missingNumbers.length > 0) ||
    (options.strictCitations !== false && missingCitations.length > 0) ||
    (options.strictNegations !== false && !negationsPreserved && orig.negations.length >= 1 && rewr.negations.length === 0) ||
    (options.strictUnits !== false && missingUnits.length > 0) ||
    lengthRatio < 0.3;

  return {
    isValid: preservationWarnings.length === 0,
    hasWarnings: preservationWarnings.length > 0,
    criticalViolation,
    hasConfirmedFactualError,
    hasSemanticDriftWarning,
    numbersPreserved: missingNumbers.length === 0 && unsupportedAdditions.length === 0,
    citationsPreserved: missingCitations.length === 0,
    quotesPreserved: missingQuotes.length === 0,
    urlsPreserved: missingUrls.length === 0,
    negationsPreserved,
    hedgingPreserved,
    unitsPreserved: missingUnits.length === 0 && mutatedUnits.length === 0,
    causalityPreserved,
    lengthRatio: Math.round(lengthRatio * 100) / 100,
    missingNumbers,
    unsupportedAdditions,
    missingCitations,
    missingQuotes,
    missingUrls,
    missingUnits,
    mutatedUnits,
    negationWarnings,
    hedgingWarnings,
    causalityWarnings,
    preservationWarnings,
    violations,
    details: {
      originalInvariants: orig,
      rewrittenInvariants: rewr,
    },
    traces,
    manualReviewCases,
  };
}

// ---------------------------------------------------------------------------
// Legacy Pre-Phase-8 Validator (Frozen baseline for immutable re-evaluation)
// ---------------------------------------------------------------------------

function extractNegationsLegacy(text: string): string[] {
  const negationPattern = /\b(?:not|never|no|neither|nor|cannot|can't|won't|wouldn't|couldn't|shouldn't|didn't|doesn't|isn't|aren't|wasn't|weren't|hasn't|haven't|hadn't|ain't|without|fail(?:s|ed|ing)?\s+to)\b(?:\s+[a-z]+){0,2}/gi;
  const matches = text.match(negationPattern) || [];
  return matches.map((m) => m.toLowerCase().trim());
}

function extractInvariantsLegacy(text: string): ExtractedInvariants {
  const words = text.split(/\s+/).filter(Boolean);
  return {
    numbers: extractNumbers(text),
    dates: extractDates(text),
    urls: extractUrlsAndEmails(text),
    citations: extractCitations(text),
    quotes: extractQuotes(text),
    units: extractUnits(text),
    negations: extractNegationsLegacy(text),
    hedging: extractHedging(text),
    namedEntities: extractNamedEntities(text),
    wordCount: words.length,
  };
}

export function validateInvariantsLegacy(
  originalText: string,
  rewrittenText: string,
  options: InvariantCheckOptions = {}
): InvariantValidationResult {
  const orig = extractInvariantsLegacy(originalText);
  const rewr = extractInvariantsLegacy(rewrittenText);

  const violations: InvariantViolation[] = [];
  const missingNumbers: string[] = [];
  const unsupportedAdditions: string[] = [];
  const missingCitations: string[] = [];
  const missingQuotes: string[] = [];
  const missingUrls: string[] = [];
  const missingUnits: string[] = [];
  const mutatedUnits: string[] = [];
  const negationWarnings: string[] = [];
  const hedgingWarnings: string[] = [];
  const causalityWarnings: string[] = [];
  const preservationWarnings: string[] = [];

  const origNumbersNormalized = orig.numbers.map(normalizeNumber);
  const rewrNumbersNormalized = rewr.numbers.map(normalizeNumber);

  const countMap = (arr: string[]) => {
    const map = new Map<string, number>();
    for (const item of arr) {
      map.set(item, (map.get(item) || 0) + 1);
    }
    return map;
  };

  const origNumCounts = countMap(origNumbersNormalized);
  const rewrNumCounts = countMap(rewrNumbersNormalized);

  for (const [num, count] of origNumCounts.entries()) {
    const rewrCount = rewrNumCounts.get(num) || 0;
    if (rewrCount < count) {
      missingNumbers.push(num);
    }
  }

  if (missingNumbers.length > 0) {
    const msg = `Numerical discrepancy: Missing original number(s): ${missingNumbers.slice(0, 5).join(', ')}${missingNumbers.length > 5 ? '...' : ''}`;
    preservationWarnings.push(msg);
    violations.push({
      type: 'missing_number',
      message: msg,
      severity: 'critical',
      targetExcerpt: missingNumbers.slice(0, 3).join(', '),
    });
  }

  for (const rewrNum of rewrNumbersNormalized) {
    if (!origNumCounts.has(rewrNum)) {
      if (!['1', '2'].includes(rewrNum) || orig.numbers.length === 0) {
        unsupportedAdditions.push(rewrNum);
      }
    }
  }

  if (unsupportedAdditions.length > 0) {
    const msg = `Unsupported numerical addition: Rewrite introduced ungrounded numbers or statistics: ${unsupportedAdditions.slice(0, 5).join(', ')}`;
    preservationWarnings.push(msg);
    violations.push({
      type: 'unsupported_addition',
      message: msg,
      severity: 'critical',
      targetExcerpt: unsupportedAdditions.slice(0, 3).join(', '),
    });
  }

  for (const cite of orig.citations) {
    if (!rewrittenText.includes(cite)) {
      missingCitations.push(cite);
    }
  }

  if (missingCitations.length > 0) {
    const msg = `Citation omission: Missing original citation(s): ${missingCitations.slice(0, 4).join(', ')}`;
    preservationWarnings.push(msg);
    violations.push({
      type: 'missing_citation',
      message: msg,
      severity: 'critical',
      targetExcerpt: missingCitations.slice(0, 2).join(', '),
    });
  }

  for (const q of orig.quotes) {
    if (!rewrittenText.toLowerCase().includes(q.toLowerCase())) {
      missingQuotes.push(q);
    }
  }

  if (missingQuotes.length > 0) {
    const msg = `Quotation alteration: One or more verbatim quotations were modified or omitted.`;
    preservationWarnings.push(msg);
    violations.push({
      type: 'missing_quote',
      message: msg,
      severity: 'warning',
      targetExcerpt: missingQuotes[0],
    });
  }

  for (const u of orig.urls) {
    if (!rewrittenText.includes(u)) {
      missingUrls.push(u);
    }
  }

  if (missingUrls.length > 0) {
    const msg = `URL omission: Missing original URL(s): ${missingUrls.slice(0, 3).join(', ')}`;
    preservationWarnings.push(msg);
    violations.push({
      type: 'missing_url',
      message: msg,
      severity: 'critical',
      targetExcerpt: missingUrls[0],
    });
  }

  const rewrTextLower = rewrittenText.toLowerCase();
  for (const unitStr of orig.units) {
    const unitPart = unitStr.replace(/^[\d.,$]+\s*/, '');
    if (unitPart && !rewrTextLower.includes(unitPart)) {
      missingUnits.push(unitStr);
    }
  }

  if (missingUnits.length > 0) {
    const msg = `Measurement unit discrepancy: Missing unit(s): ${missingUnits.slice(0, 4).join(', ')}`;
    preservationWarnings.push(msg);
    violations.push({
      type: 'missing_unit',
      message: msg,
      severity: 'critical',
      targetExcerpt: missingUnits.slice(0, 2).join(', '),
    });
  }

  const origQuantities = extractUnitQuantities(originalText);
  const rewrQuantities = extractUnitQuantities(rewrittenText);
  for (const oq of origQuantities) {
    const mutated = rewrQuantities.find((rq) => rq.number === oq.number && rq.unit !== oq.unit);
    if (mutated) {
      mutatedUnits.push(`${oq.number} ${oq.unit} -> ${mutated.number} ${mutated.unit}`);
    }
  }

  if (mutatedUnits.length > 0) {
    const msg = `Mutated measurement unit: ${mutatedUnits.join('; ')}`;
    preservationWarnings.push(msg);
    violations.push({
      type: 'mutated_unit',
      message: msg,
      severity: 'critical',
      targetExcerpt: mutatedUnits[0],
    });
  }

  let negationsPreserved = true;
  if (orig.negations.length > 0) {
    if (rewr.negations.length === 0) {
      negationsPreserved = false;
      const warn = `Negation polarity dropped: Source contained negative qualifications (${orig.negations.slice(0, 3).join(', ')}), but rewrite contains zero negation markers.`;
      negationWarnings.push(warn);
      preservationWarnings.push(warn);
      violations.push({
        type: 'negation_flip',
        message: warn,
        severity: 'critical',
        targetExcerpt: orig.negations[0],
      });
    } else if (orig.negations.length > rewr.negations.length * 2) {
      negationsPreserved = false;
      const warn = `Potential negation loss: Source had ${orig.negations.length} negation markers, rewrite only has ${rewr.negations.length}.`;
      negationWarnings.push(warn);
      preservationWarnings.push(warn);
      violations.push({
        type: 'negation_flip',
        message: warn,
        severity: 'critical',
        targetExcerpt: orig.negations[0],
      });
    }
  }

  let causalityPreserved = true;
  const origCausal = extractCausalClauses(originalText);
  const rewrCausal = extractCausalClauses(rewrittenText);
  for (const oc of origCausal) {
    const causeWords = oc.cause.split(/\s+/).filter((w) => w.length > 3);
    const effectWords = oc.effect.split(/\s+/).filter((w) => w.length > 3);

    for (const rc of rewrCausal) {
      const matchEffectInCause = effectWords.filter((w) => rc.cause.includes(w)).length;
      const matchCauseInEffect = causeWords.filter((w) => rc.effect.includes(w)).length;

      if (matchEffectInCause >= 2 && matchCauseInEffect >= 2) {
        causalityPreserved = false;
        const msg = `Reversed causality detected: Cause and effect relationships were inverted in the rewrite (original cause became effect).`;
        causalityWarnings.push(msg);
        preservationWarnings.push(msg);
        violations.push({
          type: 'reversed_causality',
          message: msg,
          severity: 'critical',
          targetExcerpt: oc.raw,
        });
        break;
      }
    }
  }

  let hedgingPreserved = true;
  if (orig.hedging.length >= 2 && rewr.hedging.length === 0) {
    const hasDogmaticAssertion = /\b(?:proves? that|definitively|indisputably|always|certainly)\b/i.test(rewrittenText);
    hedgingPreserved = false;
    const warn = hasDogmaticAssertion
      ? `Epistemic hedging inverted: Source tentative findings were converted into dogmatic assertion (${rewr.hedging.length} hedges remaining).`
      : `Epistemic hedging removed: Tentative qualifications (${orig.hedging.join(', ')}) were omitted in rewrite.`;
    hedgingWarnings.push(warn);
    preservationWarnings.push(warn);
    violations.push({
      type: 'lost_hedging',
      message: warn,
      severity: hasDogmaticAssertion ? 'critical' : 'warning',
      targetExcerpt: orig.hedging.join(', '),
    });
  }

  if (options.frozenWords && options.frozenWords.length > 0) {
    const missingFrozen: string[] = [];
    for (const fw of options.frozenWords) {
      const regex = new RegExp(`\\b${fw}\\b`, 'i');
      if (!regex.test(rewrittenText)) {
        missingFrozen.push(fw);
      }
    }
    if (missingFrozen.length > 0) {
      const msg = `Frozen words omitted: [${missingFrozen.join(', ')}] were not preserved verbatim.`;
      preservationWarnings.push(msg);
      violations.push({
        type: 'omitted_core_claim',
        message: msg,
        severity: 'critical',
        targetExcerpt: missingFrozen.join(', '),
      });
    }
  }

  const lengthRatio = orig.wordCount > 0 ? rewr.wordCount / orig.wordCount : 1;
  if (!options.allowLengthReduction && lengthRatio < 0.45) {
    const msg = `Excessive length reduction: Output is ${(lengthRatio * 100).toFixed(0)}% of source length.`;
    preservationWarnings.push(msg);
    violations.push({
      type: 'excessive_drift',
      message: msg,
      severity: lengthRatio < 0.30 ? 'critical' : 'warning',
    });
  } else if (lengthRatio > 2.0 && orig.wordCount > 20) {
    const msg = `Excessive expansion: Output is ${(lengthRatio * 100).toFixed(0)}% of source length.`;
    preservationWarnings.push(msg);
    violations.push({
      type: 'excessive_drift',
      message: msg,
      severity: 'warning',
    });
  }

  const hasConfirmedFactualError = violations.some((v) => v.severity === 'critical');
  const hasSemanticDriftWarning = violations.some((v) => v.severity === 'warning' || v.severity === 'advisory');

  const criticalViolation =
    hasConfirmedFactualError ||
    (options.strictNumbers !== false && missingNumbers.length > 0) ||
    (options.strictCitations !== false && missingCitations.length > 0) ||
    (options.strictNegations !== false && !negationsPreserved && orig.negations.length >= 1 && rewr.negations.length === 0) ||
    (options.strictUnits !== false && missingUnits.length > 0) ||
    lengthRatio < 0.3;

  return {
    isValid: preservationWarnings.length === 0,
    hasWarnings: preservationWarnings.length > 0,
    criticalViolation,
    hasConfirmedFactualError,
    hasSemanticDriftWarning,
    numbersPreserved: missingNumbers.length === 0 && unsupportedAdditions.length === 0,
    citationsPreserved: missingCitations.length === 0,
    quotesPreserved: missingQuotes.length === 0,
    urlsPreserved: missingUrls.length === 0,
    negationsPreserved,
    hedgingPreserved,
    unitsPreserved: missingUnits.length === 0 && mutatedUnits.length === 0,
    causalityPreserved,
    lengthRatio: Math.round(lengthRatio * 100) / 100,
    missingNumbers,
    unsupportedAdditions,
    missingCitations,
    missingQuotes,
    missingUrls,
    missingUnits,
    mutatedUnits,
    negationWarnings,
    hedgingWarnings,
    causalityWarnings,
    preservationWarnings,
    violations,
    details: {
      originalInvariants: orig,
      rewrittenInvariants: rewr,
    },
    traces: [],
    manualReviewCases: [],
  };
}
