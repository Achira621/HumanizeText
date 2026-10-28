/**
 * Phrase-level grammatical context validator and adapter.
 * Ensures that inline synonym and phrase substitutions preserve grammatical syntax,
 * correct article agreement ('a' vs 'an'), punctuation fidelity, quotation balance,
 * and logical polarity (negation).
 */

export interface ValidatePhraseContextParams {
  prefix: string;
  suffix: string;
  originalText: string;
  replacementText: string;
  frozenWords?: string[];
}

export interface ValidatePhraseContextResult {
  isValid: boolean;
  adaptedPrefix: string;
  adaptedReplacement: string;
  adaptedSuffix: string;
  warning?: string;
  error?: string;
}

/**
 * Determines whether a word begins with a vowel sound in English.
 * Handles common exceptions (e.g. 'hour', 'honest', 'user', 'unique', 'one', 'eu').
 */
export function startsWithVowelSound(word: string): boolean {
  const clean = word.trim().toLowerCase().replace(/^[^\w]+/, '');
  if (!clean) return false;

  // Silent 'h' words that take 'an'
  if (/^(hour|honest|honor|heir)/.test(clean)) {
    return true;
  }

  // Words beginning with 'u' or 'eu' that sound like /j/ (yoo) and take 'a'
  if (/^(user|unique|universal|university|uniform|union|usage|util|europ|eulog)/.test(clean)) {
    return false;
  }

  // 'one' or 'once' starts with /w/ and takes 'a'
  if (/^(one|once)/.test(clean)) {
    return false;
  }

  // Otherwise, standard vowel check
  return /^[aeiou]/i.test(clean);
}

/**
 * Validates and adapts an inline phrase replacement inside its immediate sentence context.
 */
export function validatePhraseContext(params: ValidatePhraseContextParams): ValidatePhraseContextResult {
  const { prefix, suffix, originalText, replacementText, frozenWords = [] } = params;

  let adaptedPrefix = prefix;
  let adaptedReplacement = replacementText.trim();
  let adaptedSuffix = suffix;

  // 1. Guard against empty replacement
  if (!adaptedReplacement) {
    return {
      isValid: false,
      adaptedPrefix,
      adaptedReplacement,
      adaptedSuffix,
      error: 'Replacement phrase cannot be empty.',
    };
  }

  // 2. Frozen words check
  const frozenSet = new Set(frozenWords.map((w) => w.trim().toLowerCase()).filter(Boolean));
  if (frozenSet.has(originalText.trim().toLowerCase())) {
    return {
      isValid: false,
      adaptedPrefix,
      adaptedReplacement,
      adaptedSuffix,
      error: `"${originalText.trim()}" is a protected frozen term and cannot be substituted.`,
    };
  }

  // 3. Casing adaptation
  // If original was capitalized at sentence start or heading, capitalize the replacement
  const isOriginalCapitalized = /^[A-Z]/.test(originalText);
  const isAtSentenceStart =
    /(?:^|[.!?]\s+|(?:^|\n)#+\s*)$/.test(prefix) || prefix.trim().length === 0;

  if (isOriginalCapitalized || isAtSentenceStart) {
    // Preserve acronyms (e.g. 'AI', 'API')
    if (adaptedReplacement.length > 0 && !/^[A-Z]{2,}/.test(adaptedReplacement)) {
      adaptedReplacement = adaptedReplacement.charAt(0).toUpperCase() + adaptedReplacement.slice(1);
    }
  } else if (/^[a-z]/.test(originalText) && !/^[A-Z]{2,}/.test(adaptedReplacement)) {
    // If original was lowercase, make replacement lowercase unless proper noun
    adaptedReplacement = adaptedReplacement.charAt(0).toLowerCase() + adaptedReplacement.slice(1);
  }

  // 4. Punctuation preservation
  // If original had trailing punctuation (e.g., "utilize,"), preserve it if replacement lacks it
  const trailingPunctMatch = originalText.match(/([,;:!?.…]+)$/);
  if (trailingPunctMatch && !/[,;:!?.…]$/.test(adaptedReplacement)) {
    adaptedReplacement += trailingPunctMatch[1];
  }

  // 5. Article agreement ('a' vs 'an')
  // Check if prefix ends with "a " or "an "
  const articleMatch = prefix.match(/\b(a|an)(\s+)$/i);
  if (articleMatch) {
    const article = articleMatch[1];
    const whitespace = articleMatch[2];
    const isUpper = article[0] === article[0].toUpperCase();
    const needsAn = startsWithVowelSound(adaptedReplacement);

    if (needsAn && article.toLowerCase() === 'a') {
      const newArticle = isUpper ? 'An' : 'an';
      adaptedPrefix = prefix.slice(0, articleMatch.index) + newArticle + whitespace;
    } else if (!needsAn && article.toLowerCase() === 'an') {
      const newArticle = isUpper ? 'A' : 'a';
      adaptedPrefix = prefix.slice(0, articleMatch.index) + newArticle + whitespace;
    }
  }

  // 6. Negation flipping check
  const isOrigNegation = /\b(not|never|no|neither|hardly|scarcely|barely)\b/i.test(originalText);
  const isRepNegation = /\b(not|never|no|neither|hardly|scarcely|barely)\b/i.test(adaptedReplacement);
  if (isOrigNegation !== isRepNegation) {
    return {
      isValid: false,
      adaptedPrefix,
      adaptedReplacement,
      adaptedSuffix,
      error: 'Replacement changes the logical polarity (negation) of the sentence.',
    };
  }

  // 7. Quotation and Bracket balance check
  const candidateFullText = adaptedPrefix + adaptedReplacement + adaptedSuffix;
  const quoteDoubleCount = (candidateFullText.match(/"/g) || []).length;
  const openParenCount = (candidateFullText.match(/\(/g) || []).length;
  const closeParenCount = (candidateFullText.match(/\)/g) || []).length;
  const openBracketCount = (candidateFullText.match(/\[/g) || []).length;
  const closeBracketCount = (candidateFullText.match(/\]/g) || []).length;

  if (openParenCount !== closeParenCount) {
    return {
      isValid: false,
      adaptedPrefix,
      adaptedReplacement,
      adaptedSuffix,
      error: 'Replacement introduces unbalanced parentheses.',
    };
  }
  if (openBracketCount !== closeBracketCount) {
    return {
      isValid: false,
      adaptedPrefix,
      adaptedReplacement,
      adaptedSuffix,
      error: 'Replacement introduces unbalanced brackets.',
    };
  }
  const origQuoteCount = ((prefix + originalText + suffix).match(/"/g) || []).length;
  if (quoteDoubleCount % 2 !== 0 && origQuoteCount % 2 === 0) {
    return {
      isValid: false,
      adaptedPrefix,
      adaptedReplacement,
      adaptedSuffix,
      error: 'Replacement introduces unbalanced quotation marks.',
    };
  }

  return {
    isValid: true,
    adaptedPrefix,
    adaptedReplacement,
    adaptedSuffix,
  };
}
