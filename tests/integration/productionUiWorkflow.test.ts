import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import mammoth from 'mammoth';
import { extractStructuredPdf } from '../../src/lib/documents/pdfExtractor';
import { parseDocumentToBlocks, projectBlocksToPlainText } from '../../src/lib/pipeline/documentModel';
import { defaultHumanizerManager } from '../../src/lib/humanizer/manager';
import { computeDiffTokens } from '../../src/lib/humanizer/ruleEngine';
import { exportToDocx, exportToPdf, exportToMarkdown, exportToTxt } from '../../src/lib/documents/documentExporter';
import type { HumanizerOptions } from '../../src/types';

describe('HUMANIZETEXT V2.6: Production UI Workflow Integration Suite', () => {
  const multiSectionText = [
    '# Enterprise Cryptographic Verification Architecture',
    '',
    'Modern data platforms require end-to-end auditability without sacrificing query execution speed.',
    '',
    '## 1. Key Derivation and Salt Management',
    '',
    'Session keys are derived using PBKDF2 with a minimum of 100,000 iterations and 256-bit entropy salts.',
    '',
    '## 2. Cluster Throughput Metrics',
    '',
    '| Region | Active Nodes | Query Latency (ms) | Peak Throughput (qps) |',
    '| US-East | 32 | 4.2 | 120,000 |',
    '| EU-West | 24 | 5.1 | 95,000 |',
    '',
    '```typescript',
    'interface VaultKeyRecord {',
    '  keyId: string;',
    '  salt: Uint8Array;',
    '}',
    '```',
    '',
    '## 3. References and Statutory Governance',
    '',
    '[1] Barker, E. (2020). Recommendation for Key Management. NIST SP 800-57 Part 1 Rev. 5.'
  ].join('\n');

  it('1. Verifies direct Text Input and structural parsing', () => {
    const doc = parseDocumentToBlocks(multiSectionText);
    expect(doc.blocks.length).toBeGreaterThanOrEqual(7);
    expect(doc.blocks.some((b) => b.type === 'heading' && b.level === 1)).toBe(true);
    expect(doc.blocks.some((b) => b.type === 'table')).toBe(true);
    expect(doc.blocks.some((b) => b.type === 'code')).toBe(true);
  });

  it('2. Verifies real PDF upload extraction and section detection', async () => {
    const pdfPath = path.resolve('tests/fixtures/pdf/academic_sections_references.pdf');
    const buffer = fs.readFileSync(pdfPath);
    const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

    const extraction = await extractStructuredPdf(arrayBuffer);
    expect(extraction.totalPages).toBe(1);
    expect(extraction.hasScannedPages).toBe(false);
    expect(extraction.fullText).toContain('Deep Learning Architectures');
    expect(extraction.fullText).toContain('Vaswani, A., et al.');
  });

  it('3. Verifies processing progress, section status, and reassembly', async () => {
    const result = await defaultHumanizerManager.humanize(
      multiSectionText,
      { mode: 'academic' } as HumanizerOptions,
      'rules-offline'
    );

    expect(result.improvedText).toBeDefined();
    expect(result.improvedText).toContain('interface VaultKeyRecord');
    expect(result.improvedText).toContain('PBKDF2');
    expect(result.improvedText).toContain('NIST SP 800-57');
  });

  it('4. Verifies transparent error handling for scanned-only documents', async () => {
    const scannedPath = path.resolve('tests/fixtures/pdf/scanned_image.pdf');
    const buffer = fs.readFileSync(scannedPath);
    const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

    const extraction = await extractStructuredPdf(arrayBuffer);
    expect(extraction.hasScannedPages).toBe(true);
    expect(extraction.scannedPageCount).toBe(1);
    expect(extraction.fullText).toContain('Scanned or image-only page (No selectable digital text detected - requires OCR)');
  });

  it('5. Verifies original vs humanized diff comparison tokens', async () => {
    const orig = 'In today fast-paced world, it is important to remember that AI plays a vital role.';
    const res = await defaultHumanizerManager.humanize(orig, { mode: 'natural' } as HumanizerOptions, 'rules-offline');
    const diffTokens = computeDiffTokens(orig, res.improvedText, res.changes, []);

    expect(diffTokens.length).toBeGreaterThan(0);
    expect(diffTokens.some((t) => t.type === 'unchanged' || t.type === 'changed' || t.type === 'structural')).toBe(true);
  });

  it('6. Verifies complete document preview rendering', () => {
    const doc = parseDocumentToBlocks(multiSectionText);
    const rendered = projectBlocksToPlainText(doc.blocks, true);
    expect(rendered).toContain('# Enterprise Cryptographic Verification Architecture');
    expect(rendered).toContain('| Region | Active Nodes |');
    expect(rendered).toContain('```typescript');
  });

  it('7. Verifies PDF and DOCX export generation and roundtrip binary validation', async () => {
    // DOCX Export
    const docxBlob = await exportToDocx(multiSectionText, 'Cryptographic Verification Architecture');
    expect(docxBlob.size).toBeGreaterThan(1000);
    const docxBuffer = Buffer.from(await docxBlob.arrayBuffer());
    const docxParsed = await mammoth.extractRawText({ buffer: docxBuffer });
    expect(docxParsed.value).toContain('Enterprise Cryptographic Verification Architecture');
    expect(docxParsed.value).toContain('US-East');

    // PDF Export
    const pdfBlob = await exportToPdf(multiSectionText, 'Cryptographic Verification Architecture');
    expect(pdfBlob.size).toBeGreaterThan(1000);
    const pdfBuffer = await pdfBlob.arrayBuffer();
    const pdfExtraction = await extractStructuredPdf(pdfBuffer);
    expect(pdfExtraction.fullText).toContain('Enterprise Cryptographic Verification Architecture');
    expect(pdfExtraction.fullText).toContain('US-East');

    // Markdown & TXT Export
    const mdBlob = exportToMarkdown(multiSectionText);
    expect(await mdBlob.text()).toBe(multiSectionText);

    const txtBlob = exportToTxt(multiSectionText);
    expect(await txtBlob.text()).toBe(multiSectionText);
  });
});
