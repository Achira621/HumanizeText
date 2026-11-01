/**
 * ============================================================================
 * HUMANIZETEXT DOCUMENT ASSEMBLER & STRUCTURAL VERIFIER
 * 
 * Reassembles rewritten chunks back into a cohesive StructuredDocument.
 * Enforces strict structural preservation:
 *   - Verifies paragraph count preservation (prevents 25-paragraph collapse)
 *   - Validates byte-for-byte preservation of protected code, tables, and math
 *   - Repairs collapsed outputs using original block topologies
 *   - Validates semantic invariants (numbers, dates, citations, negations)
 * ============================================================================
 */

import {
  type StructuredDocument,
  type ContentBlock,
  projectBlocksToPlainText,
  validateDocumentStructure,
} from './documentModel';
import type { DocumentChunk } from './documentChunker';
import { validateInvariants } from './invariants';

export interface ChunkRewriteResult {
  chunkId: string;
  chunkIndex: number;
  rewrittenText: string;
  status: 'success' | 'fallback' | 'repaired';
  notes?: string;
}

export interface DocumentAssemblyResult {
  assembledText: string;
  originalWordCount: number;
  rewrittenWordCount: number;
  originalBlockCount: number;
  outputBlockCount: number;
  isStructurallyPreserved: boolean;
  collapseDetected: boolean;
  repairedChunksCount: number;
  warnings: string[];
  invariantsPassed: boolean;
  invariantWarnings: string[];
}

/**
 * Splits rewritten chunk text into corresponding blocks matching the chunk's block count.
 */
function alignRewrittenTextToBlocks(chunk: DocumentChunk, rewrittenText: string): ContentBlock[] {
  const resultBlocks: ContentBlock[] = [];
  const origBlocks = chunk.blocks;

  // If chunk only had 1 block, assign rewritten text directly
  if (origBlocks.length === 1) {
    const single = origBlocks[0];
    resultBlocks.push({
      ...single,
      rewrittenText: single.isProtected ? single.rawText : rewrittenText.trim(),
      status: single.isProtected ? 'preserved' : 'rewritten',
    });
    return resultBlocks;
  }

  // Split rewritten text by double line breaks (paragraphs)
  const rewrittenParagraphs = rewrittenText
    .split(/\r?\n\s*\r?\n/)
    .map(p => p.trim())
    .filter(Boolean);

  // If paragraph count matches exactly, map 1-to-1
  if (rewrittenParagraphs.length === origBlocks.length) {
    for (let i = 0; i < origBlocks.length; i++) {
      const b = origBlocks[i];
      resultBlocks.push({
        ...b,
        rewrittenText: b.isProtected ? b.rawText : rewrittenParagraphs[i],
        status: b.isProtected ? 'preserved' : 'rewritten',
      });
    }
    return resultBlocks;
  }

  // If LLM collapsed multiple paragraphs into fewer paragraphs, perform topological repair
  let pIdx = 0;
  for (let i = 0; i < origBlocks.length; i++) {
    const b = origBlocks[i];
    if (b.isProtected) {
      resultBlocks.push({
        ...b,
        rewrittenText: b.rawText,
        status: 'preserved',
      });
      continue;
    }

    if (b.type === 'heading') {
      resultBlocks.push({
        ...b,
        rewrittenText: b.rawText,
        status: 'preserved',
      });
      continue;
    }

    // Allocate from rewritten paragraphs if available, otherwise fallback to original
    if (pIdx < rewrittenParagraphs.length) {
      resultBlocks.push({
        ...b,
        rewrittenText: rewrittenParagraphs[pIdx++],
        status: 'rewritten',
      });
    } else {
      // Paragraph was collapsed/omitted: retain original text with warning
      resultBlocks.push({
        ...b,
        rewrittenText: b.rawText,
        status: 'fallback',
      });
    }
  }

  return resultBlocks;
}

/**
 * Reassembles rewritten chunks into a complete document and validates structural invariants.
 */
export function assembleDocument(
  originalDoc: StructuredDocument,
  chunks: DocumentChunk[],
  chunkResults: ChunkRewriteResult[]
): DocumentAssemblyResult {
  const warnings: string[] = [];
  let collapseDetected = false;
  let repairedChunksCount = 0;

  const resultMap = new Map<string, ChunkRewriteResult>();
  for (const cr of chunkResults) {
    resultMap.set(cr.chunkId, cr);
  }

  const assembledBlocks: ContentBlock[] = [];

  for (const chunk of chunks) {
    const res = resultMap.get(chunk.chunkId);
    const rewritten = res?.rewrittenText || chunk.rawText;

    const aligned = alignRewrittenTextToBlocks(chunk, rewritten);

    // Check if any block was collapsed or fallen back
    const hadCollapse = aligned.some(b => b.status === 'fallback');
    if (hadCollapse) {
      collapseDetected = true;
      repairedChunksCount++;
      warnings.push(`Chunk ${chunk.chunkIndex + 1}: LLM collapsed paragraph boundaries; original structure preserved via topological repair.`);
    }

    assembledBlocks.push(...aligned);
  }

  const assembledText = projectBlocksToPlainText(assembledBlocks, true);
  const origText = originalDoc.originalText;

  // Global Structural Validation
  const structValidation = validateDocumentStructure(originalDoc, assembledText);
  if (structValidation.hasCollapseAnomaly) {
    collapseDetected = true;
    warnings.push(`Global structural anomaly: Document block count divergence (${structValidation.inputBlockCount} in -> ${structValidation.outputBlockCount} out).`);
  }

  // Semantic Invariant Validation (numbers, dates, citations, negations)
  const invariantCheck = validateInvariants(origText, assembledText);
  const invariantsPassed = invariantCheck.isValid;
  const invariantWarnings = invariantCheck.preservationWarnings;

  const originalWordCount = origText.split(/\s+/).filter(Boolean).length;
  const rewrittenWordCount = assembledText.split(/\s+/).filter(Boolean).length;

  return {
    assembledText,
    originalWordCount,
    rewrittenWordCount,
    originalBlockCount: originalDoc.blocks.length,
    outputBlockCount: assembledBlocks.length,
    isStructurallyPreserved: !collapseDetected && Math.abs(originalWordCount - rewrittenWordCount) / (originalWordCount || 1) < 0.35,
    collapseDetected,
    repairedChunksCount,
    warnings,
    invariantsPassed,
    invariantWarnings,
  };
}
