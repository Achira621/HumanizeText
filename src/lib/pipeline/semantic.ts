/**
 * Semantic Embedding & Cosine Similarity Comparison
 * 
 * Computes vector cosine similarity and interprets semantic preservation scores
 * with coherent chunking for long texts.
 */

export interface SemanticComparisonResult {
  similarityScore: number; // 0.0 to 1.0
  status: 'high' | 'moderate' | 'low';
  advisory: string;
  chunksCompared?: number;
}

/**
 * Computes the cosine similarity between two numeric vectors.
 * Formula: (A · B) / (||A|| * ||B||)
 */
export function computeCosineSimilarity(vectorA: number[], vectorB: number[]): number {
  if (vectorA.length === 0 || vectorB.length === 0 || vectorA.length !== vectorB.length) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i];
    normA += vectorA[i] * vectorA[i];
    normB += vectorB[i] * vectorB[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  const raw = dotProduct / denominator;
  // Bounded between 0 and 1 for positive semantic models
  return Math.max(0, Math.min(1, raw));
}

/**
 * Splits text into coherent, bounded paragraph or sentence chunks (up to maxWords).
 */
export function chunkText(text: string, maxWords = 350): string[] {
  const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const chunks: string[] = [];
  let currentChunk: string[] = [];
  let currentCount = 0;

  for (const para of paragraphs) {
    const wordCount = para.split(/\s+/).filter(Boolean).length;
    if (currentCount + wordCount <= maxWords) {
      currentChunk.push(para);
      currentCount += wordCount;
    } else {
      if (currentChunk.length > 0) {
        chunks.push(currentChunk.join('\n\n'));
      }
      currentChunk = [para];
      currentCount = wordCount;
    }
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join('\n\n'));
  }

  return chunks.length > 0 ? chunks : [text];
}

/**
 * Interprets cosine similarity advisory score.
 * Distinguishes meaning similarity from factual verification.
 */
export function interpretSemanticScore(score: number): {
  status: 'high' | 'moderate' | 'low';
  advisory: string;
} {
  const rounded = Math.round(score * 100);
  if (score >= 0.88) {
    return {
      status: 'high',
      advisory: `High semantic alignment (${rounded}%). Core conceptual meaning, themes, and message are closely preserved.`,
    };
  }
  if (score >= 0.72) {
    return {
      status: 'moderate',
      advisory: `Moderate semantic alignment (${rounded}%). Phrasing or sentence ordering has shifted noticeably while main thoughts remain related.`,
    };
  }
  return {
    status: 'low',
    advisory: `Low semantic alignment (${rounded}%). The rewrite may have drifted into divergent phrasing or omitted key sub-arguments.`,
  };
}
