import { describe, it, expect } from 'vitest';
import mammoth from 'mammoth';
import {
  parseDocumentBlocks,
  exportToTxt,
  exportToMarkdown,
  exportToDocx,
  exportToPdf,
} from '../../src/lib/documents/documentExporter';
import { extractStructuredPdf } from '../../src/lib/documents/pdfExtractor';

describe('Document Exporter (PDF, DOCX, Markdown, TXT)', () => {
  const sampleMarkdown = `# Neural Language Models and Synthesis

This document outlines architectural paradigms for transformer-based inference.

## Performance Benchmarks

Below is the comparative throughput across distinct hardware clusters:

| Cluster | Precision | Latency (ms) | Throughput (tok/s) |
| A100 | FP16 | 12.4 | 850 |
| H100 | FP8 | 4.1 | 2400 |

### Key Observations

- FP8 scaling provides over 2.8x acceleration without noticeable perplexity degradation.
- Memory bandwidth remains the primary bottleneck for autoregressive token decoding.

1. First optimization step: Kernel fusion
2. Second optimization step: KV cache quantization

\`\`\`typescript
interface GenerationConfig {
  temperature: number;
  maxTokens: number;
}
\`\`\`

> Architectural efficiency is prerequisite to democratization.
`;

  it('parses markdown into structured semantic blocks correctly', () => {
    const blocks = parseDocumentBlocks(sampleMarkdown);
    expect(blocks.some((b) => b.type === 'h1' && b.content === 'Neural Language Models and Synthesis')).toBe(true);
    expect(blocks.some((b) => b.type === 'h2' && b.content === 'Performance Benchmarks')).toBe(true);
    expect(blocks.some((b) => b.type === 'table' && b.tableRows?.length === 3)).toBe(true);
    expect(blocks.some((b) => b.type === 'bullet')).toBe(true);
    expect(blocks.some((b) => b.type === 'ordered')).toBe(true);
    expect(blocks.some((b) => b.type === 'code')).toBe(true);
    expect(blocks.some((b) => b.type === 'quote')).toBe(true);
  });

  it('exports plain text and markdown blobs correctly', async () => {
    const txtBlob = exportToTxt(sampleMarkdown);
    expect(txtBlob.type).toContain('text/plain');
    const txtContent = await txtBlob.text();
    expect(txtContent).toBe(sampleMarkdown);

    const mdBlob = exportToMarkdown(sampleMarkdown);
    expect(mdBlob.type).toContain('text/markdown');
    const mdContent = await mdBlob.text();
    expect(mdContent).toBe(sampleMarkdown);
  });

  it('exports and validates DOCX file formatting with Mammoth roundtrip', async () => {
    const docxBlob = await exportToDocx(sampleMarkdown, 'Test Benchmark Document');
    expect(docxBlob.size).toBeGreaterThan(1000);
    expect(docxBlob.type).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');

    // Roundtrip validation: read the generated DOCX buffer with mammoth
    const arrayBuffer = await docxBlob.arrayBuffer();
    const result = await mammoth.extractRawText({ buffer: Buffer.from(arrayBuffer) });
    const extractedText = result.value;

    expect(extractedText).toContain('Neural Language Models and Synthesis');
    expect(extractedText).toContain('Performance Benchmarks');
    expect(extractedText).toContain('A100');
    expect(extractedText).toContain('H100');
    expect(extractedText).toContain('FP8');
    expect(extractedText).toContain('Key Observations');
    expect(extractedText).toContain('Kernel fusion');
  });

  it('exports and validates PDF file formatting with PDF.js roundtrip', async () => {
    const pdfBlob = await exportToPdf(sampleMarkdown, 'Test Benchmark Document');
    expect(pdfBlob.size).toBeGreaterThan(1000);
    expect(pdfBlob.type).toBe('application/pdf');

    // Roundtrip validation: extract text and layout using our structured PDF extractor
    const arrayBuffer = await pdfBlob.arrayBuffer();
    const extraction = await extractStructuredPdf(arrayBuffer);

    expect(extraction.totalPages).toBeGreaterThanOrEqual(1);
    expect(extraction.scannedPageCount).toBe(0);
    expect(extraction.hasScannedPages).toBe(false);
    expect(extraction.fullText).toContain('Neural Language Models and Synthesis');
    expect(extraction.fullText).toContain('Performance Benchmarks');
    expect(extraction.fullText).toContain('A100');
    expect(extraction.fullText).toContain('H100');
    expect(extraction.fullText).toContain('Kernel fusion');
  });
});
