export interface Token {
  raw: string;
  normalized: string;
  startChar: number;
  endChar: number;
  wordIndex: number;
  sentenceIndex: number;
}

export interface TokenizedDocument {
  tokens: Token[];
  sentences: string[];
  totalWords: number;
  totalChars: number;
  rawText: string;
}

/**
 * Normalizes an individual word token using Unicode NFC, lowercasing,
 * and stripping edge punctuation while preserving inner hyphens and international glyphs.
 */
export function normalizeToken(word: string): string {
  return word
    .normalize('NFC')
    .toLowerCase()
    .replace(/^[ldjcmnst]['’]/u, '') // Strip leading single-letter elisions (e.g. l'élève -> élève)
    .replace(/^qu['’]/u, '')
    .replace(/^[\p{P}\p{S}]+/u, '')
    .replace(/[\p{P}\p{S}]+$/u, '')
    .trim();
}

/**
 * Tokenizes arbitrary Unicode text into word tokens and sentences,
 * recording precise character start/end coordinates for exact passage highlighting.
 */
export function tokenizeText(text: string): TokenizedDocument {
  const normalizedText = text.normalize('NFC');
  const tokens: Token[] = [];
  const sentences: string[] = [];

  // Match sentences roughly using common sentence boundaries without destroying abbreviations
  const sentenceRegex = /[^.!?\n]+(?:[.!?\n]+|$)/gu;
  let sentenceMatch: RegExpExecArray | null;
  let sIndex = 0;

  while ((sentenceMatch = sentenceRegex.exec(normalizedText)) !== null) {
    const rawSentence = sentenceMatch[0].trim();
    if (rawSentence.length > 0) {
      sentences.push(rawSentence);
      sIndex++;
    }
  }

  // Tokenize words using Unicode character classes (\p{L}\p{N})
  const wordRegex = /[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu;
  let wordMatch: RegExpExecArray | null;
  let wordIdx = 0;

  while ((wordMatch = wordRegex.exec(normalizedText)) !== null) {
    const rawWord = wordMatch[0];
    const startChar = wordMatch.index;
    const endChar = startChar + rawWord.length;
    const normalized = normalizeToken(rawWord);

    if (normalized.length > 0) {
      // Find sentence index for this token
      let tokenSentenceIdx = 0;
      let charAccum = 0;
      for (let i = 0; i < sentences.length; i++) {
        charAccum += sentences[i].length + 1;
        if (startChar < charAccum) {
          tokenSentenceIdx = i;
          break;
        }
      }

      tokens.push({
        raw: rawWord,
        normalized,
        startChar,
        endChar,
        wordIndex: wordIdx,
        sentenceIndex: tokenSentenceIdx,
      });

      wordIdx++;
    }
  }

  return {
    tokens,
    sentences,
    totalWords: tokens.length,
    totalChars: normalizedText.length,
    rawText: normalizedText,
  };
}
