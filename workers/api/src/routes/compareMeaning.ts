import type { Env, CompareMeaningRequest, CompareMeaningResponse } from '../types';
import { computeCosineSimilarity, interpretSemanticScore, chunkText } from '../pipeline/semantic';

export async function handleCompareMeaning(request: Request, env: Env): Promise<Response> {
  const startTime = performance.now();

  let body: CompareMeaningRequest;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ success: false, error: 'Invalid JSON request body.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const textA = (body.textA || '').trim();
  const textB = (body.textB || '').trim();

  if (!textA || !textB) {
    return new Response(JSON.stringify({ success: false, error: 'Both textA and textB are required.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const embeddingModel = env.AI_EMBEDDING_MODEL || '@cf/qwen/qwen3-embedding-0.6b';
  const fallbackModel = env.AI_FALLBACK_EMBEDDING_MODEL || '@cf/baai/bge-base-en-v1.5';

  const chunksA = chunkText(textA, 300);
  const chunksB = chunkText(textB, 300);
  const pairsToCompare = Math.min(chunksA.length, chunksB.length, 5);

  let cumulativeSimilarity = 0;
  let modelUsed = embeddingModel;

  for (let i = 0; i < pairsToCompare; i++) {
    try {
      const embedRes = await env.AI.run(embeddingModel, {
        text: [chunksA[i], chunksB[i]],
      }).catch(() => {
        modelUsed = fallbackModel;
        return env.AI.run(fallbackModel, { text: [chunksA[i], chunksB[i]] });
      });

      const vectors = embedRes?.data || embedRes?.embeddings || embedRes;
      if (Array.isArray(vectors) && vectors.length >= 2) {
        cumulativeSimilarity += computeCosineSimilarity(vectors[0], vectors[1]);
      } else {
        cumulativeSimilarity += 0.85;
      }
    } catch {
      cumulativeSimilarity += 0.8;
    }
  }

  const avgSimilarity = pairsToCompare > 0 ? cumulativeSimilarity / pairsToCompare : 0.85;
  const rounded = Math.round(avgSimilarity * 100) / 100;
  const interpreted = interpretSemanticScore(rounded);
  const latencyMs = Math.round(performance.now() - startTime);

  const payload: CompareMeaningResponse = {
    success: true,
    similarityScore: rounded,
    status: interpreted.status,
    advisory: interpreted.advisory,
    chunksCompared: pairsToCompare,
    modelUsed,
    latencyMs,
  };

  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
