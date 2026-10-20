import type { Env } from '../types';

export async function handleHealth(_request: Request, env: Env): Promise<Response> {
  const models = [
    env.AI_TEXT_MODEL || '@cf/qwen/qwen3-30b-a3b-fp8',
    env.AI_FALLBACK_TEXT_MODEL || '@cf/meta/llama-3.1-8b-instruct',
    env.AI_EMBEDDING_MODEL || '@cf/qwen/qwen3-embedding-0.6b',
  ];

  const payload = {
    status: 'healthy',
    service: 'humanizetext-worker-api',
    version: '2.0.0',
    platform: 'Cloudflare Workers AI (Free Tier)',
    availableModels: models,
    endpoints: [
      'POST /api/humanize',
      'POST /api/compare-meaning',
      'POST /api/detect',
      'POST /api/plagiarism/check',
      'GET /api/health',
    ],
    timestamp: Date.now(),
  };

  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
