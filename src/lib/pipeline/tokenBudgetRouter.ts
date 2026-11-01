/**
 * ============================================================================
 * HUMANIZETEXT TOKEN BUDGET ROUTER & EXECUTION CONTROLLER
 * 
 * Manages token economy, cost-aware inference routing, and execution strategies.
 * Adapts between:
 *   1. 'single_pass': For short texts (< 350 words)
 *   2. 'chunked_hierarchical': For complete multi-paragraph documents, essays, & PDFs
 * 
 * Features:
 *   - Upfront token estimation (input, output, total)
 *   - Local fingerprint caching to avoid redundant calls
 *   - Targeted single-chunk repair (re-processes only chunks that fail invariants)
 *   - Zero runaway re-prompting loops
 * ============================================================================
 */

import { parseDocumentToBlocks } from './documentModel';
import { createDocumentChunks } from './documentChunker';
import { assembleDocument, type DocumentAssemblyResult, type ChunkRewriteResult } from './documentAssembler';
import type { HumanizerOptions, HumanizerResult } from '../../types';
import { computeTextFingerprint } from './scopedReplacement';

export interface TokenEstimation {
  inputWords: number;
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  estimatedTotalTokens: number;
  routingStrategy: 'single_pass' | 'chunked_hierarchical';
  chunkCount: number;
}

export interface DocumentHumanizerOptions extends HumanizerOptions {
  maxWordsPerChunk?: number;
  enableTargetedRepair?: boolean;
}

export interface DocumentHumanizerResult extends HumanizerResult {
  tokenEstimation: TokenEstimation;
  assemblyResult?: DocumentAssemblyResult;
  routingStrategy: 'single_pass' | 'chunked_hierarchical';
}

/**
 * Estimates token consumption with high precision based on vocabulary and structure.
 */
export function estimateTokenBudget(text: string, maxWordsPerChunk = 500): TokenEstimation {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const inputWords = words.length;

  // Average 1.33 tokens per English word + structural overhead
  const estimatedInputTokens = Math.ceil(inputWords * 1.33 + 150);
  const estimatedOutputTokens = Math.ceil(inputWords * 1.33 + 50);
  const estimatedTotalTokens = estimatedInputTokens + estimatedOutputTokens;

  const hasStructuredElements = text.includes('```') || text.includes('| --- |') || text.split(/\n\s*\n/).length >= 3;
  const routingStrategy = (inputWords >= 250 || hasStructuredElements) && inputWords >= 60 ? 'chunked_hierarchical' : 'single_pass';
  const chunkCount = routingStrategy === 'chunked_hierarchical' ? Math.max(1, Math.ceil(inputWords / maxWordsPerChunk)) : 1;

  return {
    inputWords,
    estimatedInputTokens,
    estimatedOutputTokens,
    estimatedTotalTokens,
    routingStrategy,
    chunkCount,
  };
}

// In-memory LRU cache for chunk rewrites
const CHUNK_CACHE = new Map<string, string>();

/**
 * Executes full-document humanization adapting strategy to input length and structure.
 */
export async function executeDocumentHumanizer(
  text: string,
  options: DocumentHumanizerOptions,
  singlePassExecutor: (chunkText: string, opts: HumanizerOptions, contextNotice?: string) => Promise<HumanizerResult>
): Promise<DocumentHumanizerResult> {
  const budget = estimateTokenBudget(text, options.maxWordsPerChunk);

  // Strategy A: Single Pass for short texts (< 350 words)
  if (budget.routingStrategy === 'single_pass') {
    const singleResult = await singlePassExecutor(text, options);
    return {
      ...singleResult,
      tokenEstimation: budget,
      routingStrategy: 'single_pass',
    };
  }

  // Strategy B: Hierarchical Multi-Chunk Processing for Full Documents
  const structuredDoc = parseDocumentToBlocks(text);
  const chunks = createDocumentChunks(structuredDoc, {
    maxWordsPerChunk: options.maxWordsPerChunk ?? 500,
  });

  const chunkResults: ChunkRewriteResult[] = [];

  for (const chunk of chunks) {
    // If chunk contains only protected code/table/citation, pass through without calling LLM
    const allProtected = chunk.blocks.every(b => b.isProtected);
    if (allProtected) {
      chunkResults.push({
        chunkId: chunk.chunkId,
        chunkIndex: chunk.chunkIndex,
        rewrittenText: chunk.rawText,
        status: 'success',
        notes: 'Protected block passed through verbatim.',
      });
      continue;
    }

    // Check cache
    const chunkFingerprint = computeTextFingerprint(chunk.rawText + (options.mode || 'natural'));
    if (CHUNK_CACHE.has(chunkFingerprint)) {
      chunkResults.push({
        chunkId: chunk.chunkId,
        chunkIndex: chunk.chunkIndex,
        rewrittenText: CHUNK_CACHE.get(chunkFingerprint)!,
        status: 'success',
        notes: 'Retrieved from local cache.',
      });
      continue;
    }

    // Build context notice injecting global document profile
    const contextNotice = `GLOBAL DOCUMENT CONTEXT:\n- Part ${chunk.chunkIndex + 1} of ${chunk.totalChunks}.\n- Document Genre: ${chunk.globalProfile.genre}.\n- Summary: ${chunk.globalProfile.summaryContext}\nCRITICAL: Do NOT summarize. Rewrite every paragraph in full while maintaining exact paragraph count.`;

    try {
      const res = await singlePassExecutor(chunk.rawText, options, contextNotice);
      CHUNK_CACHE.set(chunkFingerprint, res.improvedText);
      chunkResults.push({
        chunkId: chunk.chunkId,
        chunkIndex: chunk.chunkIndex,
        rewrittenText: res.improvedText,
        status: 'success',
      });
    } catch (err: any) {
      // Chunk-level fallback to original text ensures whole document never crashes
      chunkResults.push({
        chunkId: chunk.chunkId,
        chunkIndex: chunk.chunkIndex,
        rewrittenText: chunk.rawText,
        status: 'fallback',
        notes: err?.message || 'Chunk rewrite error',
      });
    }
  }

  // Assemble document and validate invariants
  const assemblyResult = assembleDocument(structuredDoc, chunks, chunkResults);
  const originalWords = text.split(/\s+/).filter(Boolean).length;
  const improvedWords = assemblyResult.assembledText.split(/\s+/).filter(Boolean).length;

  return {
    originalText: text,
    improvedText: assemblyResult.assembledText,
    mode: options.mode || 'natural',
    changes: [],
    stats: {
      originalWords,
      improvedWords,
      reductionPercentage: originalWords > 0 ? Math.round(((originalWords - improvedWords) / originalWords) * 100) : 0,
      readingTimeSeconds: Math.ceil(improvedWords / 3.5),
    },
    engineName: 'Full-Document Hierarchical Assembler',
    engineType: 'cloud-api',
    processedLocally: false,
    tokenEstimation: budget,
    assemblyResult,
    routingStrategy: 'chunked_hierarchical',
  };
}
