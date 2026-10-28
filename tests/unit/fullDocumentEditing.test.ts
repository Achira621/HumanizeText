import { describe, it, expect, vi } from 'vitest';
import { handleHumanize, isStructuralHeading, parseListItem, parseQuote } from '../../workers/api/src/routes/humanize';
import type { Env } from '../../workers/api/src/types';

describe('Objective A: Full-Document Editing & Structural Fidelity', () => {
  it('1. Correctly identifies structural headings that must be preserved verbatim', () => {
    expect(isStructuralHeading('# References')).toBe(true);
    expect(isStructuralHeading('## References')).toBe(true);
    expect(isStructuralHeading('## Bibliography')).toBe(true);
    expect(isStructuralHeading('## Table of Contents')).toBe(true);
    expect(isStructuralHeading('### Abstract')).toBe(true);
    expect(isStructuralHeading('# Works Cited')).toBe(true);

    // Regular content headings are not structural and are eligible for rewriting
    expect(isStructuralHeading('# Architectural Foundations of Distributed Systems')).toBe(false);
    expect(isStructuralHeading('## Latency Profiling in Edge Networks')).toBe(false);
  });

  it('2. Correctly parses list item indentation, markers, and content', () => {
    const unordered = parseListItem('  - High throughput queuing mechanism');
    expect(unordered).toEqual({
      indent: '  ',
      marker: '-',
      content: 'High throughput queuing mechanism',
    });

    const ordered = parseListItem('1. Execute ephemeral cryptographic handshake');
    expect(ordered).toEqual({
      indent: '',
      marker: '1.',
      content: 'Execute ephemeral cryptographic handshake',
    });

    const asterisk = parseListItem('    * Sub-item with deep indentation');
    expect(asterisk).toEqual({
      indent: '    ',
      marker: '*',
      content: 'Sub-item with deep indentation',
    });
  });

  it('3. Correctly parses blockquote prefix and content', () => {
    const quote = parseQuote('> Authentic writing prioritizes cadence over mechanical repetition.');
    expect(quote).toEqual({
      prefix: '> ',
      content: 'Authentic writing prioritizes cadence over mechanical repetition.',
    });
  });

  it('4. Rewrites heading text while strictly preserving markdown level and hashes', async () => {
    const mockAiRun = vi.fn().mockImplementation((model, params) => {
      const userPrompt = params.messages[1].content;
      if (userPrompt.includes('Deep Neural Architectures')) {
        return Promise.resolve({ response: 'Modern Neural Network Design' });
      }
      return Promise.resolve({ response: 'Rewritten natural content.' });
    });

    const mockEnv: Env = { AI: { run: mockAiRun } };
    const doc = `# Deep Neural Architectures\n\nDeep networks process hierarchical feature representations efficiently.`;

    const req = new Request('http://localhost/api/humanize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: doc, mode: 'natural' }),
    });

    const res = await handleHumanize(req, mockEnv);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    // Heading level preserved as # with rewritten title
    expect(data.rewrittenText).toContain('# Modern Neural Network Design');
    expect(data.rewrittenText).not.toContain('# Deep Neural Architectures');
  });

  it('5. Rewrites list items while strictly preserving bullet markers, numbering, and order', async () => {
    const mockAiRun = vi.fn().mockImplementation((model, params) => {
      const userPrompt = params.messages[1].content;
      if (userPrompt.includes('First procedural step')) {
        return Promise.resolve({ response: 'Initiate the system validation' });
      }
      if (userPrompt.includes('Second procedural step')) {
        return Promise.resolve({ response: 'Verify all downstream replica nodes' });
      }
      if (userPrompt.includes('Third procedural step')) {
        return Promise.resolve({ response: 'Confirm consensus state across clusters' });
      }
      return Promise.resolve({ response: 'Rewritten body' });
    });

    const mockEnv: Env = { AI: { run: mockAiRun } };
    const doc = `Here is the operational runbook:\n\n1. First procedural step\n2. Second procedural step\n3. Third procedural step`;

    const req = new Request('http://localhost/api/humanize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: doc, mode: 'natural' }),
    });

    const res = await handleHumanize(req, mockEnv);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.rewrittenText).toContain('1. Initiate the system validation');
    expect(data.rewrittenText).toContain('2. Verify all downstream replica nodes');
    expect(data.rewrittenText).toContain('3. Confirm consensus state across clusters');
    // Ensure ordering is strictly preserved
    const idx1 = data.rewrittenText.indexOf('1.');
    const idx2 = data.rewrittenText.indexOf('2.');
    const idx3 = data.rewrittenText.indexOf('3.');
    expect(idx1).toBeLessThan(idx2);
    expect(idx2).toBeLessThan(idx3);
  });

  it('6. Rewrites blockquotes while preserving blockquote syntax (>)', async () => {
    const mockAiRun = vi.fn().mockImplementation((model, params) => {
      const userPrompt = params.messages[1].content;
      if (userPrompt.includes('The true metric of elegance')) {
        return Promise.resolve({ response: 'Real system elegance lies in simplicity rather than complexity.' });
      }
      return Promise.resolve({ response: 'Introductory context.' });
    });

    const mockEnv: Env = { AI: { run: mockAiRun } };
    const doc = `Opening argument:\n\n> The true metric of elegance is brevity and unyielding clarity.\n\nConcluding remark.`;

    const req = new Request('http://localhost/api/humanize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: doc, mode: 'natural' }),
    });

    const res = await handleHumanize(req, mockEnv);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.rewrittenText).toContain('> Real system elegance lies in simplicity rather than complexity.');
  });

  it('7. Preserves code fences, formulas, URLs, and structural headings verbatim', async () => {
    const mockAiRun = vi.fn().mockResolvedValue({
      response: 'Modernized technical prose with natural cadence.',
    });

    const mockEnv: Env = { AI: { run: mockAiRun } };
    const doc = [
      '# Architectural Design',
      '',
      'The following snippet implements zero-copy packet buffers:',
      '',
      '```rust',
      'fn process_packet(buf: &[u8]) -> Result<(), Error> {',
      '    Ok(())',
      '}',
      '```',
      '',
      'Mathematical latency bound satisfies:',
      '',
      '$$E[T] = \\frac{\\lambda}{\\mu - \\lambda}$$',
      '',
      'For official specs, visit:',
      '',
      'https://tools.ietf.org/rfc/rfc2616.txt',
      '',
      '## References',
      '',
      '[1] Shannon, C. E. (1948). A Mathematical Theory of Communication.',
    ].join('\n');

    const req = new Request('http://localhost/api/humanize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: doc, mode: 'natural' }),
    });

    const res = await handleHumanize(req, mockEnv);
    const data = await res.json();

    expect(res.status).toBe(200);
    // Code block preserved verbatim
    expect(data.rewrittenText).toContain('```rust\nfn process_packet(buf: &[u8]) -> Result<(), Error> {\n    Ok(())\n}\n```');
    // Formula preserved verbatim
    expect(data.rewrittenText).toContain('$$E[T] = \\frac{\\lambda}{\\mu - \\lambda}$$');
    // Standalone URL preserved verbatim
    expect(data.rewrittenText).toContain('https://tools.ietf.org/rfc/rfc2616.txt');
    // Structural section heading preserved verbatim
    expect(data.rewrittenText).toContain('## References');
    // Bibliography preserved verbatim
    expect(data.rewrittenText).toContain('[1] Shannon, C. E. (1948). A Mathematical Theory of Communication.');
  });

  it('8. Safe fallback when validation fails on a block (missing numbers or citations)', async () => {
    const mockAiRun = vi.fn().mockImplementation((model, params) => {
      const userPrompt = params.messages[1].content;
      // Inadvertently drop the number 42.5% and citation [4]
      if (userPrompt.includes('42.5%')) {
        return Promise.resolve({ response: 'Throughput increased dramatically without measuring metrics.' });
      }
      return Promise.resolve({ response: 'General paragraph with good human flow.' });
    });

    const mockEnv: Env = { AI: { run: mockAiRun } };
    const doc = [
      'Preliminary context paragraph.',
      '',
      'The benchmark revealed a 42.5% reduction in latency as documented by [4].',
      '',
      'Concluding summary paragraph.',
    ].join('\n');

    const req = new Request('http://localhost/api/humanize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: doc, mode: 'natural' }),
    });

    const res = await handleHumanize(req, mockEnv);
    const data = await res.json();

    expect(res.status).toBe(200);
    // Block 2 failed factual validation (dropped 42.5% and [4]), so it safely fell back to original text!
    expect(data.rewrittenText).toContain('The benchmark revealed a 42.5% reduction in latency as documented by [4].');
  });
});
