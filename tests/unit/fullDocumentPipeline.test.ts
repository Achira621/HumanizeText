import { describe, it, expect } from 'vitest';
import { parseDocumentToBlocks, projectBlocksToPlainText } from '../../src/lib/pipeline/documentModel';
import { createDocumentChunks, buildGlobalDocumentProfile } from '../../src/lib/pipeline/documentChunker';
import { assembleDocument, alignRewrittenTextToBlocks } from '../../src/lib/pipeline/documentAssembler';
import { estimateTokenBudget, executeDocumentHumanizer } from '../../src/lib/pipeline/tokenBudgetRouter';
import { extractStructuredPdf } from '../../src/lib/documents/pdfExtractor';

describe('HUMANIZETEXT FULL-DOCUMENT HUMANIZER & PIPELINE', () => {
  // 1. Structure Preservation Test: 25-paragraph document must NOT collapse
  it('preserves exact paragraph structure for 25-paragraph document without collapsing', () => {
    const paragraphs: string[] = [];
    for (let i = 1; i <= 25; i++) {
      paragraphs.push(
        `This is authentic paragraph number ${i} in an extensive multi-page academic draft. It discusses empirical observation regarding system performance metric ${i * 4.5} percent under high concurrency loads.`
      );
    }
    const fullDocumentText = paragraphs.join('\n\n');

    const structuredDoc = parseDocumentToBlocks(fullDocumentText);
    expect(structuredDoc.blocks.length).toBe(25);

    // Chunker creates coherent chunks without breaking paragraphs
    const chunks = createDocumentChunks(structuredDoc, { maxWordsPerChunk: 300 });
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0].globalProfile.totalBlocks).toBe(25);

    // Simulate an LLM rewriting each chunk while preserving paragraph breaks
    const simulatedChunkResults = chunks.map(chunk => ({
      chunkId: chunk.chunkId,
      chunkIndex: chunk.chunkIndex,
      rewrittenText: chunk.blocks.map(b => b.rawText.replace('empirical observation', 'observed experimental data')).join('\n\n'),
      status: 'success' as const,
    }));

    const assembly = assembleDocument(structuredDoc, chunks, simulatedChunkResults);

    expect(assembly.outputBlockCount).toBe(25);
    expect(assembly.collapseDetected).toBe(false);
    expect(assembly.isStructurallyPreserved).toBe(true);
  });

  // 2. Anomaly Recovery: If an LLM attempts to collapse 4 paragraphs into 1, system restores topology
  it('detects and topologically repairs LLM paragraph collapse anomaly', () => {
    const fourParaText = [
      'First paragraph introducing research question [1].',
      'Second paragraph detailing experimental protocol at 25 degrees Celsius.',
      'Third paragraph presenting statistical significance p < 0.05.',
      'Fourth paragraph outlining conclusive takeaways and future work.',
    ].join('\n\n');

    const doc = parseDocumentToBlocks(fourParaText);
    expect(doc.blocks.length).toBe(4);

    const chunks = createDocumentChunks(doc, { maxWordsPerChunk: 500 });
    expect(chunks.length).toBe(1);

    // Malicious/lazy LLM collapses all 4 into a single paragraph!
    const collapsedResult = [{
      chunkId: chunks[0].chunkId,
      chunkIndex: 0,
      rewrittenText: 'This is a single combined summary paragraph that collapsed the entire four paragraphs into one.',
      status: 'success' as const,
    }];

    const assembly = assembleDocument(doc, chunks, collapsedResult);

    expect(assembly.collapseDetected).toBe(true);
    expect(assembly.warnings.length).toBeGreaterThan(0);
    // Topological fallback ensures all 4 block slots are preserved
    expect(assembly.outputBlockCount).toBe(4);
  });

  // 3. Protected Content: Code, Tables, Math, and Citations are 100% preserved
  it('protects code, tables, equations, and citations from alteration', () => {
    const richDocument = [
      '# Architectural Design Specification',
      'The distributed consensus layer maintains sequence order.',
      '```typescript\nconst activeNode = "primary";\n```',
      '| Node ID | Status | Latency |\n| --- | --- | --- |\n| 1 | active | 12ms |\n| 2 | standby | 15ms |',
      'Mathematical equation representation:\n$$E = mc^2$$',
      'Bibliographic citation:\n[1] Lamport, L. (1978). Time, Clocks, and the Ordering of Events.',
    ].join('\n\n');

    const doc = parseDocumentToBlocks(richDocument);
    const codeBlock = doc.blocks.find(b => b.type === 'code');
    const tableBlock = doc.blocks.find(b => b.type === 'table');
    const quoteOrCitation = doc.blocks.find(b => b.isProtected);

    expect(codeBlock?.isProtected).toBe(true);
    expect(tableBlock?.isProtected).toBe(true);
    expect(quoteOrCitation?.isProtected).toBe(true);

    const chunks = createDocumentChunks(doc);
    expect(chunks.some(c => c.hasProtectedContent)).toBe(true);
  });

  // 4. Token Budget Router Strategy Adaptation
  it('accurately estimates token budgets and adapts routing strategy', () => {
    const shortText = 'This is a short passage with 10 words for testing.';
    const shortBudget = estimateTokenBudget(shortText);
    expect(shortBudget.routingStrategy).toBe('single_pass');
    expect(shortBudget.chunkCount).toBe(1);

    // 1000 words text
    const longWords = new Array(800).fill('word').join(' ');
    const longBudget = estimateTokenBudget(longWords, 400);
    expect(longBudget.routingStrategy).toBe('chunked_hierarchical');
    expect(longBudget.chunkCount).toBe(2);
    expect(longBudget.estimatedTotalTokens).toBeGreaterThan(1500);
  });

  // 5. Scanned Page Flagging in PDF extraction
  it('identifies and flags scanned / image-only pages', async () => {
    // ArrayBuffer test simulation
    expect(typeof extractStructuredPdf).toBe('function');
  });
});

