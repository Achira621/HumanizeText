import { describe, it, expect, vi } from 'vitest';
import { handleHumanize } from '../../workers/api/src/routes/humanize';
import { WorkerApiClient } from '../../src/lib/workerApi/client';
import { computeAiScore } from '../../src/lib/detector/detectorCore';
import type { Env } from '../../workers/api/src/types';

describe('Objective D: Real User Journey End-to-End Verification', () => {
  // Complex representative document with paragraphs, headings, nested lists, citations, technical metrics, and conclusion
  const representativeDocument = [
    '# High-Throughput Edge Architectures for Modern Data Pipelines',
    '',
    'Traditional centralized processing architectures experience significant transmission bottlenecks when dealing with high-frequency telemetry streams. By offloading initial ingestion and token filtering to autonomous edge workers, organizations achieve lower latency and enhanced network reliability under sudden load surges.',
    '',
    '## Quantitative Benchmarks and Cluster Metrics',
    '',
    'Our empirical evaluation across 4 geographic regions demonstrated that distributed buffer queues sustained 48,500 operations per second, reducing tail p99 latency to 12.4ms without dropping packets (Smith & Taylor, 2023).',
    '',
    'The runbook mandates strict operational discipline:',
    '',
    '1. Initialize TLS 1.3 cryptographic session tokens',
    '2. Stream rolling window shingles to worker memory',
    '3. Verify HMAC-SHA256 signatures before forwarding payload',
    '',
    'Mathematical throughput bound obeys:',
    '',
    '$$T(n) = O(n \\log n)$$',
    '',
    '> Latency is not merely a technical performance parameter; it is the fundamental currency of user trust.',
    '',
    '## References',
    '',
    '[1] Smith, J., & Taylor, R. (2023). Scalable Ingestion at the Network Edge.',
    '',
    '## Conclusion',
    '',
    'In summary, decentralized edge topologies provide an indispensable architectural paradigm for resilient, real-time distributed computation.'
  ].join('\n');

  it('1. Executes through the actual Worker route and returns structured payload', async () => {
    const mockAiRun = vi.fn().mockImplementation(async (model, params) => {
      const userContent = params.messages[1].content;
      if (userContent.includes('High-Throughput Edge Architectures')) {
        return { response: 'Scaling Edge Architectures for Distributed Data Systems' };
      }
      if (userContent.includes('Quantitative Benchmarks')) {
        return { response: 'Empirical Performance Metrics and Latency Bounds' };
      }
      if (userContent.includes('Traditional centralized processing')) {
        return { response: 'Centralized server architectures inevitably struggle when handling bursty sensor telemetry. Moving ingestion logic directly to edge nodes prevents core network congestion.' };
      }
      if (userContent.includes('4 geographic regions')) {
        return { response: 'Testing across 4 geographic regions showed queues handling 48,500 operations per second, keeping p99 latency down to 12.4ms (Smith & Taylor, 2023).' };
      }
      if (userContent.includes('Initialize TLS 1.3')) {
        return { response: 'Generate ephemeral TLS 1.3 handshake keys' };
      }
      if (userContent.includes('Stream rolling window')) {
        return { response: 'Buffer rolling window segments directly in local memory' };
      }
      if (userContent.includes('Verify HMAC-SHA256')) {
        return { response: 'Validate HMAC-SHA256 checksums prior to message dispatch' };
      }
      if (userContent.includes('fundamental currency')) {
        return { response: 'System latency represents the direct foundation of human confidence.' };
      }
      if (userContent.includes('decentralized edge topologies')) {
        return { response: 'Edge computing creates a practical, durable foundation for responsive distributed applications.' };
      }
      return { response: 'Natural rewritten passage.' };
    });

    const mockEnv: Env = {
      AI: { run: mockAiRun },
      MAX_CONCURRENT_INFERENCE: '3',
    };

    const req = new Request('http://localhost/api/humanize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: representativeDocument,
        mode: 'natural',
      }),
    });

    // 1. Verify route execution
    const res = await handleHumanize(req, mockEnv);
    expect(res.status).toBe(200);

    const payload = await res.json();
    expect(payload.success).toBe(true);
    expect(payload.rewrittenText).toBeTruthy();

    // 2. Paragraphs and section boundaries remain intact
    const originalSections = representativeDocument.split(/\n\s*\n/);
    const rewrittenSections = payload.rewrittenText.split(/\n\s*\n/);
    expect(rewrittenSections.length).toBe(originalSections.length);

    // 3. Eligible headings and list content improved where safe
    expect(payload.rewrittenText).toContain('# Scaling Edge Architectures for Distributed Data Systems');
    expect(payload.rewrittenText).toContain('## Empirical Performance Metrics and Latency Bounds');
    expect(payload.rewrittenText).toContain('1. Generate ephemeral TLS 1.3 handshake keys');
    expect(payload.rewrittenText).toContain('2. Buffer rolling window segments directly in local memory');
    expect(payload.rewrittenText).toContain('3. Validate HMAC-SHA256 checksums prior to message dispatch');
    expect(payload.rewrittenText).toContain('> System latency represents the direct foundation of human confidence.');

    // 4. Protected content preserved verbatim
    // Math formula preserved verbatim
    expect(payload.rewrittenText).toContain('$$T(n) = O(n \\log n)$$');
    // Citation reference section preserved verbatim
    expect(payload.rewrittenText).toContain('## References');
    expect(payload.rewrittenText).toContain('[1] Smith, J., & Taylor, R. (2023). Scalable Ingestion at the Network Edge.');
    // Citation in prose preserved verbatim
    expect(payload.rewrittenText).toContain('(Smith & Taylor, 2023)');
    // Numerical figures preserved verbatim
    expect(payload.rewrittenText).toContain('4');
    expect(payload.rewrittenText).toContain('48,500');
    expect(payload.rewrittenText).toContain('12.4ms');

    // 5. Direct-output formatting verification (plain-text projection)
    expect(payload.rewrittenText).toMatch(/^#\s+/m);
    expect(payload.rewrittenText).toMatch(/^##\s+/m);
    expect(payload.rewrittenText).toMatch(/^1\.\s+/m);
    expect(payload.rewrittenText).toMatch(/^>\s+/m);

    // 6. Detector input is the plain-text projection, NOT serialized objects or diff tokens
    expect(typeof payload.rewrittenText).toBe('string');
    expect(payload.rewrittenText).not.toContain('"id":');
    expect(payload.rewrittenText).not.toContain('"type":');
    expect(payload.rewrittenText).not.toContain('[object Object]');

    const detectorScore = computeAiScore(payload.rewrittenText);
    expect(typeof detectorScore.aiProbability).toBe('number');
    expect(detectorScore.aiProbability).toBeLessThan(0.40); // Successfully scores low on detector

    // 7. Telemetry & concurrency bounds
    expect(payload.telemetry).toBeDefined();
    expect(payload.telemetry.concurrencyLimit).toBe(3);
    expect(payload.telemetry.requestCount).toBeGreaterThanOrEqual(5);
    expect(payload.telemetry.failedBlockRewrites).toBe(0);
    expect(payload.telemetry.modelErrorsCount).toBe(0);
  });

  it('2. Client correctly translates Worker API response to UI-facing HumanizerResult', async () => {
    const mockWorkerResponse = {
      success: true,
      rewrittenText: '# New Title\n\nNatural human paragraph.\n\n- Improved list item',
      mode: 'natural',
      changesMade: true,
      preservationWarnings: [],
      diffTokens: [
        { id: '1', text: '# New Title\n\n', type: 'changed' },
        { id: '2', text: 'Natural human paragraph.\n\n', type: 'changed' },
        { id: '3', text: '- Improved list item', type: 'changed' },
      ],
      stats: {
        originalWords: 15,
        improvedWords: 12,
        reductionPercentage: 20,
        readingTimeSeconds: 4,
      },
      modelUsed: '@cf/qwen/qwen3-30b-a3b-fp8',
      version: '2.1.0-context-engine',
      latencyMs: 145.2,
      invariants: {
        numbersPreserved: true,
        citationsPreserved: true,
        unitsPreserved: true,
        negationsPreserved: true,
        quotesPreserved: true,
        urlsPreserved: true,
      },
      telemetry: {
        requestCount: 3,
        successfulBlockRewrites: 3,
        failedBlockRewrites: 0,
        totalRetries: 0,
        modelErrorsCount: 0,
        concurrencyLimit: 3,
        elapsedInferenceMs: 120.4,
        modelUsed: '@cf/qwen/qwen3-30b-a3b-fp8',
        fallbackTriggered: false,
        estimatedNeuronUsage: 0.25,
      },
    };

    const client = new WorkerApiClient('https://api.humanizetext.dev');
    const adaptSpy = vi.spyOn(client as any, 'adaptWorkerResponse');

    // Simulate client handling
    const result = (client as any).adaptWorkerResponse(
      mockWorkerResponse,
      '# Original Title\n\nOriginal text paragraph.\n\n- Original list item',
      'natural',
      150
    );

    expect(result.improvedText).toBe(mockWorkerResponse.rewrittenText);
    expect(result.document).toBeDefined();
    expect(result.document.blocks.length).toBeGreaterThanOrEqual(3);
    expect(result.telemetry).toBeDefined();
    expect(result.telemetry.concurrencyLimit).toBe(3);
    expect(result.telemetry.successfulBlockRewrites).toBe(3);
    expect(adaptSpy).toHaveBeenCalled();
  });
});
