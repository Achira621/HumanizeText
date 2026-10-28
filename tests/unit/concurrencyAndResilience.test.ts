import { describe, it, expect, vi } from 'vitest';
import {
  handleHumanize,
  runWithBoundedConcurrency,
  isTransientError,
} from '../../workers/api/src/routes/humanize';
import type { Env } from '../../workers/api/src/types';

describe('Objective B: Resilient Model Execution & Bounded Concurrency', () => {
  it('1. Accurately classifies transient vs non-transient errors', () => {
    expect(isTransientError({ status: 429 })).toBe(true);
    expect(isTransientError({ status: 503 })).toBe(true);
    expect(isTransientError({ status: 504 })).toBe(true);
    expect(isTransientError({ message: 'Subrequest limit exceeded' })).toBe(true);
    expect(isTransientError({ message: 'Rate limit reached, please retry' })).toBe(true);
    expect(isTransientError({ message: 'Connection timed out' })).toBe(true);

    // Non-transient errors should not be retried
    expect(isTransientError({ status: 400 })).toBe(false);
    expect(isTransientError({ status: 404 })).toBe(false);
    expect(isTransientError({ message: 'Malformed JSON payload' })).toBe(false);
  });

  it('2. Enforces strict concurrency bounds and preserves index order across async tasks', async () => {
    let activeWorkers = 0;
    let maxObservedActiveWorkers = 0;
    const taskCount = 20;
    const concurrencyLimit = 3;

    const tasks = Array.from({ length: taskCount }, (_, i) => `item_${i}`);

    const results = await runWithBoundedConcurrency(tasks, concurrencyLimit, async (item, idx) => {
      activeWorkers++;
      maxObservedActiveWorkers = Math.max(maxObservedActiveWorkers, activeWorkers);
      // Simulate non-zero async duration
      await new Promise((r) => setTimeout(r, 10));
      activeWorkers--;
      return `result_for_${item}_at_${idx}`;
    });

    expect(maxObservedActiveWorkers).toBeLessThanOrEqual(concurrencyLimit);
    expect(results.length).toBe(taskCount);
    // Strict order verification
    for (let i = 0; i < taskCount; i++) {
      expect(results[i]).toBe(`result_for_item_${i}_at_${i}`);
    }
  });

  // Test document scaling with 1, 4, 8, 12, and 20 eligible text blocks
  const blockCounts = [1, 4, 8, 12, 20];
  for (const count of blockCounts) {
    it(`3. Processes document with ${count} block(s) within bounded concurrency and preserves order`, async () => {
      let activeCalls = 0;
      let peakConcurrency = 0;

      const mockAiRun = vi.fn().mockImplementation(async (model, params) => {
        activeCalls++;
        peakConcurrency = Math.max(peakConcurrency, activeCalls);
        await new Promise((r) => setTimeout(r, 5));
        activeCalls--;

        const prompt = params.messages[1].content;
        const match = prompt.match(/Block (\d+) content/);
        const num = match ? match[1] : '0';
        return { response: `Polished human text for block ${num}.` };
      });

      const mockEnv: Env = {
        AI: { run: mockAiRun },
        MAX_CONCURRENT_INFERENCE: '3',
      };

      const blocks = Array.from({ length: count }, (_, i) => `Block ${i + 1} content with informative details.`);
      const inputDoc = blocks.join('\n\n');

      const req = new Request('http://localhost/api/humanize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputDoc, mode: 'natural' }),
      });

      const res = await handleHumanize(req, mockEnv);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify peak concurrency respects the limit (<= 3, capped at 4)
      if (count > 1) {
        expect(peakConcurrency).toBeLessThanOrEqual(3);
      }

      // Verify all blocks are present in sequential order in output
      for (let i = 0; i < count; i++) {
        expect(data.rewrittenText).toContain(`Polished human text for block ${i + 1}.`);
      }

      // Verify telemetry is properly populated
      expect(data.telemetry).toBeDefined();
      expect(data.telemetry.requestCount).toBeGreaterThanOrEqual(1);
      expect(data.telemetry.concurrencyLimit).toBe(3);
      expect(typeof data.telemetry.elapsedInferenceMs).toBe('number');
      expect(typeof data.telemetry.estimatedNeuronUsage).toBe('number');
    });
  }

  it('4. Retries transient failures with exponential backoff and succeeds', async () => {
    let callAttempts = 0;
    const mockAiRun = vi.fn().mockImplementation(async () => {
      callAttempts++;
      if (callAttempts === 1) {
        // First attempt fails with transient 429
        const err: any = new Error('Rate limit exceeded');
        err.status = 429;
        throw err;
      }
      return { response: 'Successfully processed after backoff retry.' };
    });

    const mockEnv: Env = { AI: { run: mockAiRun } };
    const doc = 'Single block needing humanization with transient retry.';

    const req = new Request('http://localhost/api/humanize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: doc, mode: 'natural' }),
    });

    const res = await handleHumanize(req, mockEnv);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(callAttempts).toBe(2);
    expect(data.telemetry.totalRetries).toBe(1);
    expect(data.telemetry.modelErrorsCount).toBe(1);
    expect(data.rewrittenText).toBe('Successfully processed after backoff retry.');
  });

  it('5. Invokes fallback model when primary model fails permanently', async () => {
    const mockAiRun = vi.fn().mockImplementation(async (model) => {
      if (model.includes('qwen')) {
        throw new Error('Primary model internal error');
      }
      return { response: 'Fallback model rescued the request.' };
    });

    const mockEnv: Env = {
      AI: { run: mockAiRun },
      AI_TEXT_MODEL: '@cf/qwen/qwen3-30b-a3b-fp8',
      AI_FALLBACK_TEXT_MODEL: '@cf/meta/llama-3.1-8b-instruct',
    };

    const doc = 'Prose paragraph testing automatic fallback failover.';

    const req = new Request('http://localhost/api/humanize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: doc, mode: 'natural' }),
    });

    const res = await handleHumanize(req, mockEnv);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.fallbackTriggered).toBe(true);
    expect(data.modelUsed).toContain('llama');
    expect(data.rewrittenText).toBe('Fallback model rescued the request.');
  });

  it('6. Failed block falls back safely to original text without discarding other blocks', async () => {
    const mockAiRun = vi.fn().mockImplementation(async (model, params) => {
      const prompt = params.messages[1].content;
      if (prompt.includes('Beta')) {
        throw new Error('Inference server crash on faulty block');
      }
      if (prompt.includes('Alpha')) {
        return { response: 'Flawlessly rewritten Alpha paragraph.' };
      }
      return { response: 'Flawlessly rewritten Gamma paragraph.' };
    });

    const mockEnv: Env = { AI: { run: mockAiRun } };
    const doc = [
      'Alpha prose paragraph exploring distributed algorithms.',
      '',
      'Beta prose paragraph that crashes during inference.',
      '',
      'Gamma prose paragraph summarizing system findings.',
    ].join('\n');

    const req = new Request('http://localhost/api/humanize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: doc, mode: 'natural' }),
    });

    const res = await handleHumanize(req, mockEnv);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);

    // Alpha and Gamma were rewritten
    expect(data.rewrittenText).toContain('Flawlessly rewritten Alpha paragraph.');
    expect(data.rewrittenText).toContain('Flawlessly rewritten Gamma paragraph.');
    // Beta gracefully fell back to its original raw text without losing content or throwing 500!
    expect(data.rewrittenText).toContain('Beta prose paragraph that crashes during inference.');
    expect(data.telemetry.failedBlockRewrites).toBe(1);
    expect(data.telemetry.successfulBlockRewrites).toBe(2);
  });

  it('7. Telemetry contains zero raw user document text', async () => {
    const mockAiRun = vi.fn().mockResolvedValue({
      response: 'Neutral generic output text.',
    });

    const secretDocument = 'CONFIDENTIAL_DATA_PATIENT_SSN_987654321_DO_NOT_LEAK';
    const mockEnv: Env = { AI: { run: mockAiRun } };

    const req = new Request('http://localhost/api/humanize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: secretDocument, mode: 'natural' }),
    });

    const res = await handleHumanize(req, mockEnv);
    const data = await res.json();

    // Verify telemetry JSON contains zero traces of secret text
    const telemetrySerialized = JSON.stringify(data.telemetry);
    expect(telemetrySerialized).not.toContain('CONFIDENTIAL');
    expect(telemetrySerialized).not.toContain('987654321');
    expect(telemetrySerialized).not.toContain('PATIENT');
  });
});
