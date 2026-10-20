import { describe, it, expect, vi } from 'vitest';
import worker from '../../workers/api/src/index';
import { checkRateLimit } from '../../workers/api/src/pipeline/rateLimiter';
import type { Env } from '../../workers/api/src/types';

describe('Cloudflare Worker Pipeline & Routes', () => {
  const createMockEnv = (overrides = {}): Env => ({
    AI: {
      run: vi.fn(async (model: string, _input: any) => {
        if (model.includes('embedding')) {
          return { data: [[0.5, 0.5, 0.5], [0.5, 0.5, 0.5]] };
        }
        return { response: 'During clinical trials in 2024, the outcome [1] showed a 95% success rate.' };
      }),
    },
    AI_TEXT_MODEL: '@cf/qwen/qwen3-30b-a3b-fp8',
    AI_EMBEDDING_MODEL: '@cf/qwen/qwen3-embedding-0.6b',
    ALLOWED_ORIGINS: 'https://humanizetext-nine.vercel.app,http://localhost:5173',
    MAX_INPUT_CHARS: '5000',
    MAX_OUTPUT_TOKENS: '1536',
    RATE_LIMIT_PER_MINUTE: '15',
    ...overrides,
  });

  it('GET /api/health returns service status and model catalog', async () => {
    const env = createMockEnv();
    const req = new Request('http://localhost/api/health', { method: 'GET' });
    const res = await worker.fetch(req, env, {} as any);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe('healthy');
    expect(data.platform).toContain('Cloudflare Workers AI');
    expect(data.availableModels).toContain('@cf/qwen/qwen3-30b-a3b-fp8');
  });

  it('OPTIONS preflight returns 204 with CORS headers', async () => {
    const env = createMockEnv();
    const req = new Request('http://localhost/api/humanize', {
      method: 'OPTIONS',
      headers: { Origin: 'https://humanizetext-nine.vercel.app' },
    });
    const res = await worker.fetch(req, env, {} as any);

    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://humanizetext-nine.vercel.app');
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');
  });

  it('POST /api/humanize executes pipeline with deterministic checks and semantic similarity', async () => {
    const env = createMockEnv();
    const origText = 'During clinical trials in 2024, the outcome [1] showed a 95% success rate in 40 patients.';
    const req = new Request('http://localhost/api/humanize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:5173',
      },
      body: JSON.stringify({
        text: origText,
        mode: 'natural',
        vocabularyIntensity: 'balanced',
        enableSemanticComparison: true,
      }),
    });

    const res = await worker.fetch(req, env, {} as any);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.rewrittenText).toBeTruthy();
    expect(data.invariants).toBeDefined();
    expect(data.invariants.citationsPreserved).toBe(true);
    expect(data.semanticSimilarity).toBeDefined();
    expect(data.semanticSimilarity.score).toBeGreaterThan(0.7);
    expect(data.modelUsed).toBe('@cf/qwen/qwen3-30b-a3b-fp8');
  });

  it('POST /api/humanize uses single generation call without embedding when enableSemanticComparison is omitted', async () => {
    const env = createMockEnv();
    const origText = 'The team published the initial report in 2024 with positive results.';
    const req = new Request('http://localhost/api/humanize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: origText, mode: 'natural' }),
    });

    const res = await worker.fetch(req, env, {} as any);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    // Embedding model was NOT called, saving daily Neurons
    expect(data.semanticSimilarity).toBeUndefined();
    expect(env.AI.run).toHaveBeenCalledTimes(1);
  });

  it('POST /api/humanize rejects oversized input gracefully with HTTP 413', async () => {
    const env = createMockEnv({ MAX_INPUT_CHARS: '100' });
    const hugeText = 'A'.repeat(150);
    const req = new Request('http://localhost/api/humanize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: hugeText }),
    });

    const res = await worker.fetch(req, env, {} as any);
    expect(res.status).toBe(413);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain('maximum free-tier limit');
  });

  it('POST /api/humanize rejects empty or tiny input with HTTP 400', async () => {
    const env = createMockEnv();
    const req = new Request('http://localhost/api/humanize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'too short' }),
    });

    const res = await worker.fetch(req, env, {} as any);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.success).toBe(false);
  });

  it('POST /api/compare-meaning computes cosine similarity across chunks', async () => {
    const env = createMockEnv();
    const req = new Request('http://localhost/api/compare-meaning', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        textA: 'Artificial intelligence is changing the nature of education.',
        textB: 'Machine learning technologies are reshaping educational environments.',
      }),
    });

    const res = await worker.fetch(req, env, {} as any);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.similarityScore).toBeGreaterThanOrEqual(0.7);
    expect(data.status).toBeDefined();
  });

  it('POST /api/detect executes calibrated multi-signal analysis without LLM hallucination', async () => {
    const env = createMockEnv();
    const req = new Request('http://localhost/api/detect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: "In today's fast-paced digital world, it is crucial to delve into the multifaceted tapestry of modern technology. Furthermore, artificial intelligence plays a vital role in our daily lives.",
      }),
    });

    const res = await worker.fetch(req, env, {} as any);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.score.aiProbability).toBeGreaterThan(0.5);
    expect(data.signalsDetected.length).toBeGreaterThan(0);
    expect(data.modelUsed).toBe('calibrated-multi-signal-v1');
  });

  it('POST /api/plagiarism/check detects verbatim n-gram shingles against reference corpus', async () => {
    const env = createMockEnv();
    const samplePlagiarized =
      "In today's fast-paced digital world, it is crucial to delve into the multifaceted tapestry of modern technology.";
    const req = new Request('http://localhost/api/plagiarism/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: samplePlagiarized,
      }),
    });

    const res = await worker.fetch(req, env, {} as any);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.matchedPassagesCount).toBeGreaterThan(0);
    expect(data.sourceScopeNotice).toContain('No unauthorized external web searches');
  });

  it('enforces sliding-window rate limit per client IP', () => {
    const ip = 'test-client-ip-123';
    // Consume 3 allowed
    expect(checkRateLimit(ip, 3).allowed).toBe(true);
    expect(checkRateLimit(ip, 3).allowed).toBe(true);
    expect(checkRateLimit(ip, 3).allowed).toBe(true);
    // 4th request must be rejected
    const blocked = checkRateLimit(ip, 3);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });
});
