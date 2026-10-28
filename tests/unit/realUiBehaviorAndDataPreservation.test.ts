import { describe, it, expect, vi } from 'vitest';
import {
  parseDocumentToBlocks,
} from '../../src/lib/pipeline/documentModel';
import { handleHumanize } from '../../workers/api/src/routes/humanize';
import { WorkerApiClient } from '../../src/lib/workerApi/client';
import { computeAiScore } from '../../src/lib/detector/detectorCore';
import type { Env } from '../../workers/api/src/types';

describe('Real UI Behavior and Data Preservation Verification (Phase 2 Task 5)', () => {
  // Required comprehensive fixture:
  // - 4 paragraphs
  // - 2 headings
  // - A numbered list
  // - An in-text citation: (Vaswani et al., 2017)
  // - Numerical data: 25,000, 14.8ms, 84.5%
  const comprehensiveFixture = [
    '# Large-Scale Systems Evaluation',
    'Modern distributed storage architectures must balance high read concurrency against replica synchronization latency across availability zones.',
    'Recent empirical investigations demonstrate that self-attention layers exhibit distinctive stylistic burstiness (Vaswani et al., 2017).',
    '## Latency and Throughput Benchmarks',
    'During maximum load stress testing, the server cluster successfully maintained 25,000 transactions per second with p99 latency remaining below 14.8ms.',
    'System initialization requires completing three deterministic preparation phases in sequence:',
    '1. Generate ephemeral cryptographic session keys using local entropy sources.',
    '2. Compute HMAC-SHA256 rolling window shingles across the draft document.',
    '3. Compare passage hashes against the encrypted local vault repository.',
    'Overall cluster memory utilization was capped at 84.5% under peak traffic conditions without inducing node failover or split-brain partitions.',
  ].join('\n\n');

  it('1. Correctly parses the comprehensive fixture into typed, ordered content blocks', () => {
    const doc = parseDocumentToBlocks(comprehensiveFixture);

    // Expect: 2 headings, 4 paragraphs, 3 numbered list items (or 1 list intro paragraph + 3 list items)
    expect(doc.blocks.length).toBeGreaterThanOrEqual(9);

    const headings = doc.blocks.filter((b) => b.type === 'heading');
    expect(headings).toHaveLength(2);
    expect(headings[0].rawText).toBe('# Large-Scale Systems Evaluation');
    expect(headings[0].level).toBe(1);
    expect(headings[1].rawText).toBe('## Latency and Throughput Benchmarks');
    expect(headings[1].level).toBe(2);

    const listItems = doc.blocks.filter((b) => b.type === 'list_item');
    expect(listItems).toHaveLength(3);
    expect(listItems[0].listMarker).toMatch(/1\.\s*/);
    expect(listItems[1].listMarker).toMatch(/2\.\s*/);
    expect(listItems[2].listMarker).toMatch(/3\.\s*/);

    const paragraphs = doc.blocks.filter((b) => b.type === 'paragraph');
    expect(paragraphs.length).toBeGreaterThanOrEqual(4);

    // Citations and numbers present in parsed blocks
    expect(doc.originalText).toContain('(Vaswani et al., 2017)');
    expect(doc.originalText).toContain('25,000');
    expect(doc.originalText).toContain('14.8ms');
    expect(doc.originalText).toContain('84.5%');
  });

  it('2. Remote model path executes block-aware rewrite preserving headings, lists, citations, and numbers', async () => {
    // Mock Workers AI environment
    const mockAiRun = vi.fn().mockImplementation(async (model: string, input: any) => {
      const promptText = input.messages?.[1]?.content || '';
      // Simulate neural rewrite with varied human cadence
      if (promptText.includes('Modern distributed storage')) {
        return { response: 'Distributed storage networks inevitably face tradeoffs between concurrent reads and replica latency across server zones.' };
      }
      if (promptText.includes('Vaswani et al., 2017')) {
        return { response: 'Empirical research highlights that self-attention structures generate distinctive authorial burstiness (Vaswani et al., 2017).' };
      }
      if (promptText.includes('25,000')) {
        return { response: 'Under heavy workloads, the system sustained 25,000 transactions every second, keeping p99 response times well under 14.8ms.' };
      }
      if (promptText.includes('84.5%')) {
        return { response: 'Total cluster memory consumption held steady at 84.5% during peak demand, avoiding cluster failovers.' };
      }
      return { response: 'Rewritten passage honoring authorial style.' };
    });

    const mockEnv: Env = {
      AI: { run: mockAiRun },
      AI_TEXT_MODEL: '@cf/qwen/qwen3-30b-a3b-fp8',
      MAX_INPUT_CHARS: '10000',
    };

    const req = new Request('http://localhost/api/humanize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: comprehensiveFixture,
        mode: 'natural',
      }),
    });

    const res = await handleHumanize(req, mockEnv);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);

    // Verify headings structure (# and ## levels) survived while content is rewritten
    expect(data.rewrittenText).toMatch(/^#\s+/m);
    expect(data.rewrittenText).toMatch(/^##\s+/m);

    // Verify list markers and numbering survived with formatting
    expect(data.rewrittenText).toMatch(/^1\.\s+/m);
    expect(data.rewrittenText).toMatch(/^2\.\s+/m);
    expect(data.rewrittenText).toMatch(/^3\.\s+/m);

    // Verify citation survived verbatim
    expect(data.rewrittenText).toContain('(Vaswani et al., 2017)');

    // Verify numerical data survived verbatim
    expect(data.rewrittenText).toContain('25,000');
    expect(data.rewrittenText).toContain('14.8ms');
    expect(data.rewrittenText).toContain('84.5%');

    // Verify paragraph breaks are preserved as blank lines
    const paragraphs = data.rewrittenText.split(/\n\s*\n/);
    expect(paragraphs.length).toBeGreaterThanOrEqual(6);
  });

  it('3. Paragraphs remain visually distinct in diff tokens and direct text view', async () => {
    const mockAiRun = vi.fn().mockResolvedValue({
      response: 'Rewritten paragraph with natural cadence and rhythm.',
    });
    const mockEnv: Env = {
      AI: { run: mockAiRun },
    };

    const req = new Request('http://localhost/api/humanize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: comprehensiveFixture, mode: 'natural' }),
    });

    const res = await handleHumanize(req, mockEnv);
    const data = await res.json();

    // Verify diff tokens contain whitespace tokens preserving blank lines (\n\n)
    const hasBlankLineTokens = data.diffTokens.some((t: any) => t.text.includes('\n\n'));
    expect(hasBlankLineTokens).toBe(true);

    // Direct text view has newlines
    expect(data.rewrittenText).toContain('\n\n');
  });

  it('4. Copying the result preserves paragraph breaks', async () => {
    const client = new WorkerApiClient({ baseUrl: '' });
    const result = await client.humanize(comprehensiveFixture, { mode: 'natural' });

    // Simulate handleCopy in FreeAiHumanizerPage.tsx:
    // navigator.clipboard.writeText(improvedText || currentText)
    const textToCopy = result.improvedText;
    expect(textToCopy).toBeDefined();

    // Invariant: textToCopy must contain \n\n blank lines
    const copiedParagraphs = textToCopy.split(/\n\s*\n/);
    expect(copiedParagraphs.length).toBeGreaterThanOrEqual(6);
    expect(textToCopy).toContain('(Vaswani et al., 2017)');
    expect(textToCopy).toContain('25,000');
  });

  it('5. Downloading the result preserves paragraphs and markdown formatting', async () => {
    const client = new WorkerApiClient({ baseUrl: '' });
    const result = await client.humanize(comprehensiveFixture, { mode: 'natural' });

    // Simulate handleDownload in FreeAiHumanizerPage.tsx:
    // new Blob([text], { type: 'text/plain;charset=utf-8' })
    const downloadedContent = result.improvedText;
    const blob = new Blob([downloadedContent], { type: 'text/plain;charset=utf-8' });

    expect(blob.size).toBeGreaterThan(100);
    expect(downloadedContent).toMatch(/^#\s+/m);
    expect(downloadedContent).toMatch(/^##\s+/m);
    expect(downloadedContent).toMatch(/1\.\s+/);
    expect(downloadedContent).toContain('\n\n');
  });

  it('6. The detector receives the clean intended text, not malformed tokens or concatenated output', async () => {
    const client = new WorkerApiClient({ baseUrl: '' });
    const result = await client.humanize(comprehensiveFixture, { mode: 'natural' });

    // In FreeAiHumanizerPage.tsx:
    // detector inspects `res.improvedText` directly
    const textSentToDetector = result.improvedText;

    // Must NOT be JSON stringified diff tokens or [object Object]
    expect(textSentToDetector).not.toContain('[object Object]');
    expect(textSentToDetector).not.toContain('"diffTokens"');
    expect(typeof textSentToDetector).toBe('string');

    // Run detector on the humanized output
    const aiAnalysis = computeAiScore(textSentToDetector);
    expect(aiAnalysis).toBeDefined();
    expect(aiAnalysis.aiProbability).toBeDefined();
    expect(aiAnalysis.aiProbability).toBeLessThan(0.40);
  });

  it('7. Network failure and malformed model responses preserve source content with graceful fallback', async () => {
    // A: Network failure to remote worker
    const brokenClient = new WorkerApiClient({ baseUrl: 'http://127.0.0.1:9999', timeoutMs: 100 });
    await expect(brokenClient.humanize(comprehensiveFixture, { mode: 'natural' })).rejects.toThrow();

    // B: Malformed model response (empty rewrite) in Worker returns 502 without modifying original data
    const emptyModelEnv: Env = {
      AI: { run: vi.fn().mockResolvedValue({ response: '' }) },
    };
    const badReq = new Request('http://localhost/api/humanize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'A short sentence for humanization.', mode: 'natural' }),
    });
    const errRes = await handleHumanize(badReq, emptyModelEnv);
    expect(errRes.status).toBe(502);

    // C: Local fallback preserves all 4 paragraphs, 2 headings, list, citations, and numbers
    const localClient = new WorkerApiClient({ baseUrl: '' });
    const fallbackResult = await localClient.humanize(comprehensiveFixture, { mode: 'natural' });

    expect(fallbackResult.improvedText).toContain('# Large-Scale Systems Evaluation');
    expect(fallbackResult.improvedText).toContain('(Vaswani et al., 2017)');
    expect(fallbackResult.improvedText).toContain('25,000');
    expect(fallbackResult.improvedText).toContain('14.8ms');
    expect(fallbackResult.fallbackTriggered).toBe(true);
  });
});
