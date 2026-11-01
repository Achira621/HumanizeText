import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { extractStructuredPdf, extractTextFromPdf } from '../../src/lib/documents/pdfExtractor';

describe('PDF Extractor (Structured Extraction & Scanned Page Detection)', () => {
  it('extracts native digital text and detects non-scanned layout', async () => {
    const fixturePath = path.resolve(__dirname, '../fixtures/pdf/native_text.pdf');
    const buffer = fs.readFileSync(fixturePath);
    const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

    const result = await extractStructuredPdf(arrayBuffer);
    expect(result.totalPages).toBe(1);
    expect(result.scannedPageCount).toBe(0);
    expect(result.hasScannedPages).toBe(false);
    expect(result.fullText).toContain('Introduction to Natural Language Processing');
    expect(result.fullText).toContain('authentic native digital text');

    const plainText = await extractTextFromPdf(arrayBuffer);
    expect(plainText).toEqual(result.fullText);
  });

  it('extracts multi-page documents and preserves tables', async () => {
    const fixturePath = path.resolve(__dirname, '../fixtures/pdf/multipage_table.pdf');
    const buffer = fs.readFileSync(fixturePath);
    const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

    const result = await extractStructuredPdf(arrayBuffer);
    expect(result.totalPages).toBe(2);
    expect(result.pages[0].tablesDetected).toBe(false);
    expect(result.pages[1].tablesDetected).toBe(true);
    expect(result.fullText).toContain('Research Methodology and Protocol');
  });

  it('detects scanned / image-only PDFs with zero extractable text', async () => {
    const fixturePath = path.resolve(__dirname, '../fixtures/pdf/scanned_image.pdf');
    const buffer = fs.readFileSync(fixturePath);
    const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

    const result = await extractStructuredPdf(arrayBuffer);
    expect(result.totalPages).toBe(1);
    expect(result.scannedPageCount).toBe(1);
    expect(result.hasScannedPages).toBe(true);
    expect(result.pages[0].isScannedOrImageOnly).toBe(true);
    expect(result.fullText.trim()).toContain('[Page 1: Scanned or image-only page (No selectable digital text detected - requires OCR)]');
  });

  it('extracts multi-section academic PDF with tables, headings and citations', async () => {
    const fixturePath = path.resolve(__dirname, '../fixtures/pdf/academic_sections_references.pdf');
    const buffer = fs.readFileSync(fixturePath);
    const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

    const result = await extractStructuredPdf(arrayBuffer);
    expect(result.totalPages).toBe(1);
    expect(result.scannedPageCount).toBe(0);
    expect(result.hasScannedPages).toBe(false);
    expect(result.fullText).toContain('Deep Learning Architectures in Natural Language Understanding');
    expect(result.fullText).toContain('Vaswani, A., et al.');
    expect(result.fullText).toContain('Llama-3-8B');
    expect(result.fullText).toContain('Claude-3-Sonnet');
  });

  it('correctly accounts for mixed PDFs with both selectable text and scanned pages', async () => {
    const fixturePath = path.resolve(__dirname, '../fixtures/pdf/mixed_text_scanned.pdf');
    const buffer = fs.readFileSync(fixturePath);
    const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

    const result = await extractStructuredPdf(arrayBuffer);
    expect(result.totalPages).toBe(2);
    expect(result.scannedPageCount).toBe(1);
    expect(result.hasScannedPages).toBe(true);
    expect(result.scannedPages).toEqual([2]);

    // Page 1 is selectable text
    expect(result.pages[0].isScannedOrImageOnly).toBe(false);
    expect(result.pages[0].text).toContain('Executive Summary: Quarterly Financial Review');
    expect(result.pages[0].wordCount).toBeGreaterThan(15);

    // Page 2 is scanned image page
    expect(result.pages[1].isScannedOrImageOnly).toBe(true);
    expect(result.pages[1].wordCount).toBe(0);

    // Ensure full text accounts for every page and does not silently omit page 2
    expect(result.fullText).toContain('Operating revenue grew 14.2%');
    expect(result.fullText).toContain('[Page 2: Scanned or image-only page (No selectable digital text detected - requires OCR)]');
  });
});
