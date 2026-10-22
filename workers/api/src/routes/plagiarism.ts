import type { Env, PlagiarismRequest, PlagiarismResponse } from '../types';
import { ReferenceCorpusAdapter, matchShingles } from '../pipeline/sourceAdapter';
import { computeCosineSimilarity } from '../pipeline/semantic';

export async function handlePlagiarism(request: Request, env: Env): Promise<Response> {
  const startTime = performance.now();

  let body: PlagiarismRequest;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ success: false, error: 'Invalid JSON request body.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const text = (body.text || '').trim();
  if (!text) {
    return new Response(JSON.stringify({ success: false, error: 'Input text cannot be empty.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const adapter = new ReferenceCorpusAdapter(body.referenceCorpus);
  const sources = await adapter.retrieveSources(text.slice(0, 200));

  const matchResult = matchShingles(text, sources, 5);

  let classification: PlagiarismResponse['matchingClassification'] = 'original';
  if (matchResult.overlapPercentage > 40) {
    classification = 'significant-overlap';
  } else if (matchResult.overlapPercentage > 20) {
    classification = 'paraphrased';
  } else if (matchResult.overlapPercentage > 5) {
    classification = 'near-duplicate';
  }

  let semanticSimilarityScore: number | undefined;

  // Optional semantic similarity verification using Workers AI embeddings
  if (body.enableSemanticCheck && sources.length > 0) {
    const embeddingModel = env.AI_EMBEDDING_MODEL || '@cf/qwen/qwen3-embedding-0.6b';
    try {
      const embedRes = await env.AI.run(embeddingModel, {
        text: [text.slice(0, 1000), sources[0].text.slice(0, 1000)],
      });
      const vectors = embedRes?.data || embedRes?.embeddings || embedRes;
      if (Array.isArray(vectors) && vectors.length >= 2) {
        semanticSimilarityScore = Math.round(computeCosineSimilarity(vectors[0], vectors[1]) * 100) / 100;
      }
    } catch {
      // Ignore optional semantic check error
    }
  }

  const latencyMs = Number((performance.now() - startTime).toFixed(2));

  const payload: PlagiarismResponse = {
    success: true,
    overlapPercentage: matchResult.overlapPercentage,
    matchedPassagesCount: matchResult.matchedPassages.length,
    matchedWordsCount: matchResult.matchedWordsCount,
    totalWordsCount: matchResult.totalWordsCount,
    matchingClassification: classification,
    passages: matchResult.matchedPassages,
    semanticSimilarityScore,
    sourceScopeNotice:
      'Checked against standard academic reference corpus and user-supplied documents. No unauthorized external web searches performed.',
    latencyMs,
  };

  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
