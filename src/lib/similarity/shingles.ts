import type { Token, TokenizedDocument } from './tokenizer';

export interface ShingleItem {
  shingleIndex: number;
  normalizedText: string;
  rawText: string;
  startWord: number;
  endWord: number;
  startChar: number;
  endChar: number;
  tokens: Token[];
}

/**
 * Creates overlapping n-gram word shingles from a tokenized document.
 * By default, uses 5-grams (5 consecutive words), which balances detection of non-trivial
 * verbatim copying while avoiding false positives on ubiquitous short phrases.
 */
export function createWordShingles(
  doc: TokenizedDocument,
  shingleSize: number = 5
): ShingleItem[] {
  const { tokens, rawText } = doc;
  if (tokens.length < shingleSize) {
    if (tokens.length === 0) return [];
    // If the document has fewer tokens than the shingle size, create a single shingle covering all tokens
    const firstToken = tokens[0];
    const lastToken = tokens[tokens.length - 1];
    return [
      {
        shingleIndex: 0,
        normalizedText: tokens.map((t) => t.normalized).join(' '),
        rawText: rawText.substring(firstToken.startChar, lastToken.endChar),
        startWord: 0,
        endWord: tokens.length - 1,
        startChar: firstToken.startChar,
        endChar: lastToken.endChar,
        tokens,
      },
    ];
  }

  const shingles: ShingleItem[] = [];

  for (let i = 0; i <= tokens.length - shingleSize; i++) {
    const windowTokens = tokens.slice(i, i + shingleSize);
    const firstToken = windowTokens[0];
    const lastToken = windowTokens[windowTokens.length - 1];

    shingles.push({
      shingleIndex: i,
      normalizedText: windowTokens.map((t) => t.normalized).join(' '),
      rawText: rawText.substring(firstToken.startChar, lastToken.endChar),
      startWord: i,
      endWord: i + shingleSize - 1,
      startChar: firstToken.startChar,
      endChar: lastToken.endChar,
      tokens: windowTokens,
    });
  }

  return shingles;
}
