/**
 * Source Retrieval Adapter Interface & Reference Corpus Adapter
 * 
 * Provides deterministic n-gram word shingle comparison against local reference documents,
 * with an extensible adapter interface prepared for future authorized search providers.
 */

export interface SourceDocument {
  id: string;
  name: string;
  text: string;
}

export interface MatchedPassage {
  matchedText: string;
  referenceName: string;
  wordCount: number;
}

export interface SourceRetrievalAdapter {
  readonly id: string;
  readonly name: string;
  readonly isAuthorized: boolean;
  retrieveSources(querySnippet: string): Promise<SourceDocument[]>;
}

/**
 * Built-in standard reference corpus adapter (local offline / free tier).
 */
export class ReferenceCorpusAdapter implements SourceRetrievalAdapter {
  public readonly id = 'reference-corpus-local';
  public readonly name = 'Standard Academic & Open Web Corpus';
  public readonly isAuthorized = true;

  private corpus: SourceDocument[];

  constructor(customCorpus?: SourceDocument[]) {
    this.corpus = customCorpus && customCorpus.length > 0 ? customCorpus : DEFAULT_WORKER_CORPUS;
  }

  public async retrieveSources(_querySnippet: string): Promise<SourceDocument[]> {
    // Returns the reference documents available in the corpus
    return this.corpus;
  }
}

/**
 * Stub adapter for future authorized external source retrieval.
 * Strict invariant: Never invokes unauthorized or paid endpoints without explicit credentials.
 */
export class FutureAuthorizedSearchAdapter implements SourceRetrievalAdapter {
  public readonly id = 'authorized-search-external';
  public readonly name = 'Authorized Web Index Adapter';
  public readonly isAuthorized = false; // Intentionally disabled until approved & configured

  public async retrieveSources(_querySnippet: string): Promise<SourceDocument[]> {
    // Explicit transparency: When not authorized, return empty list and disclose scope
    return [];
  }
}

/**
 * Fast deterministic n-gram shingle matching against supplied reference documents.
 */
export function matchShingles(
  submittedText: string,
  referenceDocs: SourceDocument[],
  shingleWordSize = 5
): {
  matchedPassages: MatchedPassage[];
  matchedWordsCount: number;
  totalWordsCount: number;
  overlapPercentage: number;
} {
  const normalize = (str: string) => str.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').trim();
  const subWords = normalize(submittedText).split(/\s+/).filter(Boolean);
  const totalWordsCount = subWords.length;

  if (totalWordsCount < shingleWordSize || referenceDocs.length === 0) {
    return {
      matchedPassages: [],
      matchedWordsCount: 0,
      totalWordsCount,
      overlapPercentage: 0,
    };
  }

  // Generate submitted n-grams
  const subShingles = new Set<string>();
  for (let i = 0; i <= totalWordsCount - shingleWordSize; i++) {
    subShingles.add(subWords.slice(i, i + shingleWordSize).join(' '));
  }

  const matchedPassages: MatchedPassage[] = [];
  const matchedWordIndices = new Set<number>();

  for (const ref of referenceDocs) {
    const refWords = normalize(ref.text).split(/\s+/).filter(Boolean);
    if (refWords.length < shingleWordSize) continue;

    for (let r = 0; r <= refWords.length - shingleWordSize; r++) {
      const shingle = refWords.slice(r, r + shingleWordSize).join(' ');
      if (subShingles.has(shingle)) {
        // Mark matched indices in submitted document
        for (let s = 0; s <= totalWordsCount - shingleWordSize; s++) {
          if (subWords.slice(s, s + shingleWordSize).join(' ') === shingle) {
            for (let k = 0; k < shingleWordSize; k++) {
              matchedWordIndices.add(s + k);
            }
            matchedPassages.push({
              matchedText: shingle,
              referenceName: ref.name,
              wordCount: shingleWordSize,
            });
          }
        }
      }
    }
  }

  // Deduplicate overlapping passages
  const uniquePassages: MatchedPassage[] = [];
  const seen = new Set<string>();
  for (const p of matchedPassages) {
    if (!seen.has(p.matchedText)) {
      seen.add(p.matchedText);
      uniquePassages.push(p);
    }
  }

  const matchedWordsCount = matchedWordIndices.size;
  const overlapPercentage =
    totalWordsCount > 0 ? Math.round((matchedWordsCount / totalWordsCount) * 1000) / 10 : 0;

  return {
    matchedPassages: uniquePassages.slice(0, 15),
    matchedWordsCount,
    totalWordsCount,
    overlapPercentage: Math.min(100, overlapPercentage),
  };
}

export const DEFAULT_WORKER_CORPUS: SourceDocument[] = [
  {
    id: 'ai-training-phrases',
    name: 'Standard AI Corpus Boilerplate Patterns',
    text: `In today's fast-paced digital world, it is crucial to delve into the multifaceted tapestry of modern technology. Furthermore, artificial intelligence plays a vital role in our daily lives. Needless to say, it is important to remember that these systems serve as a testament to human innovation. In conclusion, we must utilize these solutions to ensure optimal outcomes.`,
  },
  {
    id: 'academic-methodology-sample',
    name: 'Common Academic Methodology Repository',
    text: `In order to conduct an investigation into the aforementioned hypotheses, it should be noted that prior literature demonstrates a significant variance. Due to the fact that empirical observations were collected over a long duration of time, we have the ability to conclude that computational methodology serves as a beacon of modern inquiry.`,
  },
];
