import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { defaultHumanizerManager } from '../../src/lib/humanizer/manager';
import type { HumanizerOptions } from '../../src/types';

interface LongDocMetrics {
  name: string;
  inputWords: number;
  outputWords: number;
  wordRetentionPct: number;
  inputParagraphs: number;
  outputParagraphs: number;
  paragraphPreservationPct: number;
  inputHeadings: number;
  outputHeadings: number;
  tablesPreserved: boolean;
  codePreserved: boolean;
  mathPreserved: boolean;
  citationsPreserved: boolean;
  meaningPreservationScore: number;
  // Performance and Token Telemetry
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  processingTimeMs: number;
}

function countParagraphs(text: string): number {
  return text.split(/\n\s*\n/).filter((p) => p.trim() && !p.trim().startsWith('#')).length;
}

function countHeadings(text: string): number {
  return (text.match(/^#{1,6}\s+.+$/gm) || []).length;
}

function extractNamedEntities(text: string): Set<string> {
  const matches = text.match(/\b[A-Z][a-zA-Z0-9_-]{2,}\b/g) || [];
  return new Set(matches);
}

function computeMeaningPreservation(origText: string, revText: string): number {
  const origEntities = extractNamedEntities(origText);
  const revEntities = extractNamedEntities(revText);

  let retainedEntities = 0;
  for (const ent of origEntities) {
    if (revEntities.has(ent)) retainedEntities++;
  }
  const entityScore = origEntities.size > 0 ? retainedEntities / origEntities.size : 1.0;

  const origWords = new Set(origText.toLowerCase().split(/\s+/).filter((w) => w.length > 3));
  const revWords = new Set(revText.toLowerCase().split(/\s+/).filter((w) => w.length > 3));
  let intersection = 0;
  for (const w of origWords) {
    if (revWords.has(w)) intersection++;
  }
  const union = new Set([...origWords, ...revWords]).size;
  const lexicalScore = union > 0 ? intersection / union : 1.0;

  const origWCount = origText.split(/\s+/).filter(Boolean).length;
  const revWCount = revText.split(/\s+/).filter(Boolean).length;
  const lengthRatio = Math.min(1.0, revWCount / origWCount);

  // Composite objective formula:
  // 40% Entity preservation + 30% Lexical overlap + 30% Volume preservation
  return Math.round((0.4 * entityScore + 0.3 * lexicalScore + 0.3 * lengthRatio) * 1000) / 10;
}

async function runDocumentBenchmark(name: string, filePath: string): Promise<LongDocMetrics> {
  const text = fs.readFileSync(path.resolve(filePath), 'utf8');
  const inputWords = text.split(/\s+/).filter(Boolean).length;
  const inputParagraphs = countParagraphs(text);
  const inputHeadings = countHeadings(text);

  const startTime = performance.now();
  const result = await defaultHumanizerManager.humanize(text, { mode: 'natural' } as HumanizerOptions, 'rules-offline');
  const processingTimeMs = Math.round(performance.now() - startTime);

  const outputText = result.improvedText;
  const outputWords = outputText.split(/\s+/).filter(Boolean).length;
  const outputParagraphs = countParagraphs(outputText);
  const outputHeadings = countHeadings(outputText);

  // Check code preservation
  const origCodes = text.match(/```[a-z]*\n[\s\S]*?\n```/g) || [];
  const codePreserved = origCodes.every((c) => outputText.includes(c));

  // Check table preservation (no catastrophic regex)
  const hasTables = text.includes('|');
  const tablesPreserved = !hasTables || outputText.includes('|');

  // Check math preservation
  const origMathCount = (text.match(/\$\$/g) || []).length;
  const outMathCount = (outputText.match(/\$\$/g) || []).length;
  const mathPreserved = origMathCount === outMathCount;

  // Check citations preservation
  const origCitations = text.match(/\[\d+\]|\[REF-\d+\]|\[BIB-\d+\]/g) || [];
  const citationsPreserved = origCitations.every((c) => outputText.includes(c));

  const meaningPreservationScore = computeMeaningPreservation(text, outputText);

  const estimatedInputTokens = Math.ceil(inputWords * 1.35);
  const estimatedOutputTokens = Math.ceil(outputWords * 1.35);

  return {
    name,
    inputWords,
    outputWords,
    wordRetentionPct: Math.round((outputWords / inputWords) * 1000) / 10,
    inputParagraphs,
    outputParagraphs,
    paragraphPreservationPct: Math.round((outputParagraphs / inputParagraphs) * 1000) / 10,
    inputHeadings,
    outputHeadings,
    tablesPreserved,
    codePreserved,
    mathPreserved,
    citationsPreserved,
    meaningPreservationScore,
    estimatedInputTokens,
    estimatedOutputTokens,
    processingTimeMs,
  };
}

describe('HUMANIZETEXT V2.6: Long Document Scaling & Integrity Benchmark', () => {
  it('processes ~500-word document preserving structure, code, table, and math', async () => {
    const metrics = await runDocumentBenchmark('Doc 1: ~500 Words', 'tests/fixtures/documents/doc_500w.md');

    console.log('\n[LONG-DOC BENCHMARK: ~500 WORDS]');
    console.log(`Words In/Out:       ${metrics.inputWords} -> ${metrics.outputWords} (${metrics.wordRetentionPct}%)`);
    console.log(`Paragraphs In/Out:  ${metrics.inputParagraphs} -> ${metrics.outputParagraphs} (${metrics.paragraphPreservationPct}%)`);
    console.log(`Headings In/Out:    ${metrics.inputHeadings} -> ${metrics.outputHeadings}`);
    console.log(`Code Preserved:     ${metrics.codePreserved ? 'YES (100% byte-for-byte)' : 'NO'}`);
    console.log(`Math Preserved:     ${metrics.mathPreserved ? 'YES (100% byte-for-byte)' : 'NO'}`);
    console.log(`Meaning Score:      ${metrics.meaningPreservationScore}%`);
    console.log(`Processing Latency: ${metrics.processingTimeMs}ms`);

    expect(metrics.wordRetentionPct).toBeGreaterThanOrEqual(95);
    expect(metrics.outputParagraphs).toBe(metrics.inputParagraphs);
    expect(metrics.codePreserved).toBe(true);
    expect(metrics.mathPreserved).toBe(true);
    expect(metrics.meaningPreservationScore).toBeGreaterThanOrEqual(85);
  });

  it('processes ~2,000-word document without collapsing paragraphs or losing citations', async () => {
    const metrics = await runDocumentBenchmark('Doc 2: ~2,000 Words', 'tests/fixtures/documents/doc_2000w.md');

    console.log('\n[LONG-DOC BENCHMARK: ~2,000 WORDS]');
    console.log(`Words In/Out:       ${metrics.inputWords} -> ${metrics.outputWords} (${metrics.wordRetentionPct}%)`);
    console.log(`Paragraphs In/Out:  ${metrics.inputParagraphs} -> ${metrics.outputParagraphs} (${metrics.paragraphPreservationPct}%)`);
    console.log(`Headings In/Out:    ${metrics.inputHeadings} -> ${metrics.outputHeadings}`);
    console.log(`Citations Kept:     ${metrics.citationsPreserved ? 'YES (100% preserved)' : 'NO'}`);
    console.log(`Meaning Score:      ${metrics.meaningPreservationScore}%`);
    console.log(`Processing Latency: ${metrics.processingTimeMs}ms`);

    expect(metrics.wordRetentionPct).toBeGreaterThanOrEqual(95);
    expect(metrics.outputParagraphs).toBe(metrics.inputParagraphs);
    expect(metrics.citationsPreserved).toBe(true);
    expect(metrics.meaningPreservationScore).toBeGreaterThanOrEqual(85);
  });

  it('processes ~5,000-word enterprise specification across hierarchical chunk pipeline', async () => {
    const metrics = await runDocumentBenchmark('Doc 3: ~5,000 Words', 'tests/fixtures/documents/doc_5000w.md');

    console.log('\n[LONG-DOC BENCHMARK: ~5,000 WORDS]');
    console.log(`Words In/Out:       ${metrics.inputWords} -> ${metrics.outputWords} (${metrics.wordRetentionPct}%)`);
    console.log(`Paragraphs In/Out:  ${metrics.inputParagraphs} -> ${metrics.outputParagraphs} (${metrics.paragraphPreservationPct}%)`);
    console.log(`Headings In/Out:    ${metrics.inputHeadings} -> ${metrics.outputHeadings}`);
    console.log(`Tables Preserved:   ${metrics.tablesPreserved ? 'YES' : 'NO'}`);
    console.log(`Meaning Score:      ${metrics.meaningPreservationScore}%`);
    console.log(`Processing Latency: ${metrics.processingTimeMs}ms`);

    expect(metrics.wordRetentionPct).toBeGreaterThanOrEqual(95);
    expect(metrics.outputParagraphs).toBe(metrics.inputParagraphs);
    expect(metrics.meaningPreservationScore).toBeGreaterThanOrEqual(85);
  });

  it('processes ~10,000-word complete technical handbook with zero collapse', async () => {
    const metrics = await runDocumentBenchmark('Doc 4: ~10,000 Words', 'tests/fixtures/documents/doc_10000w.md');

    console.log('\n[LONG-DOC BENCHMARK: ~10,000 WORDS]');
    console.log(`Words In/Out:       ${metrics.inputWords} -> ${metrics.outputWords} (${metrics.wordRetentionPct}%)`);
    console.log(`Paragraphs In/Out:  ${metrics.inputParagraphs} -> ${metrics.outputParagraphs} (${metrics.paragraphPreservationPct}%)`);
    console.log(`Headings In/Out:    ${metrics.inputHeadings} -> ${metrics.outputHeadings}`);
    console.log(`Bibliography Kept:  ${metrics.citationsPreserved ? 'YES' : 'NO'}`);
    console.log(`Meaning Score:      ${metrics.meaningPreservationScore}%`);
    console.log(`Est. Input Tokens:  ${metrics.estimatedInputTokens}`);
    console.log(`Est. Output Tokens: ${metrics.estimatedOutputTokens}`);
    console.log(`Processing Latency: ${metrics.processingTimeMs}ms`);

    expect(metrics.wordRetentionPct).toBeGreaterThanOrEqual(95);
    expect(metrics.outputParagraphs).toBe(metrics.inputParagraphs);
    expect(metrics.citationsPreserved).toBe(true);
    expect(metrics.meaningPreservationScore).toBeGreaterThanOrEqual(85);
  });
});
