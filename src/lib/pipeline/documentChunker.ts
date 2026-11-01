/**
 * ============================================================================
 * HUMANIZETEXT DOCUMENT CHUNKER & CONTEXT PRESERVER
 * 
 * Splits long documents (articles, essays, technical reports, multi-page PDFs)
 * into coherent, self-contained chunks that preserve paragraph integrity,
 * heading hierarchy, and protected blocks (code, tables, math, citations).
 * 
 * Provides a shared global document profile injected into every chunk prompt.
 * ============================================================================
 */

import type { StructuredDocument, ContentBlock } from './documentModel';
import { detectGenre } from './contextEngine';
import { extractCitations, extractNumbers, extractDates } from './invariants';

export interface GlobalDocumentProfile {
  docId: string;
  totalWords: number;
  totalBlocks: number;
  genre: string;
  keyEntities: string[];
  numbersToPreserve: string[];
  datesToPreserve: string[];
  citationsToPreserve: string[];
  summaryContext: string;
}

export interface DocumentChunk {
  chunkId: string;
  chunkIndex: number;
  totalChunks: number;
  blockIds: string[];
  blocks: ContentBlock[];
  rawText: string;
  wordCount: number;
  hasProtectedContent: boolean;
  sectionHeading?: string;
  globalProfile: GlobalDocumentProfile;
}

export interface ChunkerOptions {
  maxWordsPerChunk?: number;
  preserveHeadings?: boolean;
}

/**
 * Creates a global profile from the entire document once.
 */
export function buildGlobalDocumentProfile(doc: StructuredDocument): GlobalDocumentProfile {
  const fullText = doc.blocks.map(b => b.rawText).join('\n\n');
  const words = fullText.split(/\s+/).filter(Boolean);
  const genre = detectGenre(fullText);

  // Extract key entities (Capitalized multi-word proper nouns)
  const entityMatches = fullText.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g) || [];
  const uniqueEntities = Array.from(new Set(entityMatches)).slice(0, 15);

  const numbers = extractNumbers(fullText);
  const dates = extractDates(fullText);
  const citations = extractCitations(fullText);

  // Generate a concise 1-2 sentence context summary from first and middle paragraphs
  const proseBlocks = doc.blocks.filter(b => b.type === 'paragraph' && !b.isProtected);
  const firstPara = proseBlocks[0]?.rawText.slice(0, 200) || '';
  const summaryContext = `Document genre: ${genre}. Core topic focus: "${firstPara.replace(/\s+/g, ' ').trim()}..."`;

  return {
    docId: doc.id,
    totalWords: words.length,
    totalBlocks: doc.blocks.length,
    genre,
    keyEntities: uniqueEntities,
    numbersToPreserve: numbers.slice(0, 30),
    datesToPreserve: dates.slice(0, 20),
    citationsToPreserve: citations.slice(0, 20),
    summaryContext,
  };
}

/**
 * Partitions a StructuredDocument into coherent DocumentChunks without breaking paragraphs.
 */
export function createDocumentChunks(
  doc: StructuredDocument,
  options: ChunkerOptions = {}
): DocumentChunk[] {
  const maxWords = options.maxWordsPerChunk ?? 500;
  const globalProfile = buildGlobalDocumentProfile(doc);

  if (doc.blocks.length === 0) {
    return [];
  }

  const chunks: DocumentChunk[] = [];
  let currentBlocks: ContentBlock[] = [];
  let currentWords = 0;
  let currentHeading: string | undefined = undefined;
  let hasProtected = false;

  const flushChunk = () => {
    if (currentBlocks.length === 0) return;

    const chunkIndex = chunks.length;
    const chunkText = currentBlocks.map(b => b.rawText).join('\n\n');

    chunks.push({
      chunkId: `chk_${doc.id}_${chunkIndex}`,
      chunkIndex,
      totalChunks: 0, // updated after all chunks created
      blockIds: currentBlocks.map(b => b.id),
      blocks: [...currentBlocks],
      rawText: chunkText,
      wordCount: currentWords,
      hasProtectedContent: hasProtected,
      sectionHeading: currentHeading,
      globalProfile,
    });

    currentBlocks = [];
    currentWords = 0;
    hasProtected = false;
  };

  for (let i = 0; i < doc.blocks.length; i++) {
    const block = doc.blocks[i];
    const blockWords = block.rawText.split(/\s+/).filter(Boolean).length;

    if (block.type === 'heading') {
      // If we already have accumulated significant content, start a new chunk at heading boundary
      if (currentWords >= 250) {
        flushChunk();
      }
      currentHeading = block.rawText;
      currentBlocks.push(block);
      currentWords += blockWords;
      continue;
    }

    if (block.isProtected) {
      hasProtected = true;
    }

    // Check if adding this block exceeds max chunk words
    if (currentWords > 0 && (currentWords + blockWords) > maxWords) {
      flushChunk();
    }

    currentBlocks.push(block);
    currentWords += blockWords;
  }

  flushChunk();

  // Populate totalChunks
  const total = chunks.length;
  for (const c of chunks) {
    c.totalChunks = total;
  }

  return chunks;
}
