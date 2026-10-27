// ============================================================================
// DOCUMENT STRUCTURE MODEL & BLOCK-LEVEL REWRITE PIPELINE
// Preserves layout, headings, lists, code, and paragraph boundaries.
// ============================================================================

export type ContentBlockType =
  | 'paragraph'
  | 'heading'
  | 'list_item'
  | 'code'
  | 'quote'
  | 'table'
  | 'blank_line';

export interface ContentBlock {
  id: string;
  type: ContentBlockType;
  rawText: string;
  order: number;
  level?: number; // 1-6 for headings
  listType?: 'ordered' | 'unordered';
  listMarker?: string; // e.g. "- ", "* ", "1. ", "2) "
  isProtected: boolean;
  rewrittenText?: string;
  status: 'pending' | 'rewritten' | 'preserved' | 'fallback';
}

export interface StructuredDocument {
  id: string;
  blocks: ContentBlock[];
  originalText: string;
  format: 'plain' | 'markdown';
}

export interface StructuralValidationResult {
  isValid: boolean;
  hasCollapseAnomaly: boolean;
  hasOrderingAnomaly?: boolean;
  hasOmissionAnomaly?: boolean;
  hasFactualAnomaly?: boolean;
  hasDuplicateAnomaly?: boolean;
  inputBlockCount: number;
  outputBlockCount: number;
  warnings: string[];
  repairedText?: string;
  repairedBlocks?: ContentBlock[];
}

/**
 * Checks if a text segment contains code fences or formulas or URLs that must be protected.
 */
function isProtectedBlock(text: string, type: ContentBlockType): boolean {
  if (type === 'code' || type === 'table') return true;
  const trimmed = text.trim();
  // Standalone URLs or citation references lists
  if (/^https?:\/\/[^\s]+$/i.test(trimmed)) return true;
  // Mathematical equation blocks e.g. $$ ... $$
  if (/^\$\$.*\$\$$/s.test(trimmed)) return true;
  // Bibliographic entries e.g. [1] Author...
  if (/^\[\d+\]\s+/i.test(trimmed)) return true;
  return false;
}

/**
 * Parses raw input text or Markdown into a sequence of typed ContentBlocks.
 * Correctly distinguishes blank-line paragraph boundaries, headings, lists,
 * quotes, tables, and code blocks.
 */
export function parseDocumentToBlocks(text: string): StructuredDocument {
  const docId = `doc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  if (!text || !text.trim()) {
    return {
      id: docId,
      blocks: [],
      originalText: text || '',
      format: 'plain',
    };
  }

  const lines = text.split(/\r?\n/);
  const blocks: ContentBlock[] = [];
  let blockCounter = 0;
  let inCodeBlock = false;
  let codeBuffer: string[] = [];
  let isMarkdown = false;

  let currentParagraphLines: string[] = [];

  const flushParagraph = () => {
    if (currentParagraphLines.length > 0) {
      const rawText = currentParagraphLines.join('\n');
      blocks.push({
        id: `blk_${blockCounter++}_p`,
        type: 'paragraph',
        rawText,
        order: blocks.length,
        isProtected: false,
        status: 'pending',
      });
      currentParagraphLines = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // 1. Code blocks (``` or ~~~)
    if (trimmed.startsWith('```') || trimmed.startsWith('~~~')) {
      isMarkdown = true;
      if (!inCodeBlock) {
        flushParagraph();
        inCodeBlock = true;
        codeBuffer = [line];
      } else {
        codeBuffer.push(line);
        inCodeBlock = false;
        blocks.push({
          id: `blk_${blockCounter++}_code`,
          type: 'code',
          rawText: codeBuffer.join('\n'),
          order: blocks.length,
          isProtected: true,
          status: 'preserved',
        });
        codeBuffer = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    // 2. Blank line indicates paragraph boundary
    if (trimmed === '') {
      flushParagraph();
      continue;
    }

    // 3. Headings (# Heading, ## Subheading, etc.)
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      isMarkdown = true;
      flushParagraph();
      const level = headingMatch[1].length;
      blocks.push({
        id: `blk_${blockCounter++}_h${level}`,
        type: 'heading',
        rawText: line,
        level,
        order: blocks.length,
        isProtected: false,
        status: 'pending',
      });
      continue;
    }

    // 4. Blockquotes (> quote)
    const quoteMatch = line.match(/^>\s*(.*)$/);
    if (quoteMatch) {
      isMarkdown = true;
      flushParagraph();
      blocks.push({
        id: `blk_${blockCounter++}_quote`,
        type: 'quote',
        rawText: line,
        order: blocks.length,
        isProtected: false,
        status: 'pending',
      });
      continue;
    }

    // 5. Unordered list item (- item, * item, + item)
    const uListMatch = line.match(/^(\s*[-*+]\s+)(.*)$/);
    if (uListMatch) {
      isMarkdown = true;
      flushParagraph();
      blocks.push({
        id: `blk_${blockCounter++}_ul`,
        type: 'list_item',
        rawText: line,
        listType: 'unordered',
        listMarker: uListMatch[1],
        order: blocks.length,
        isProtected: false,
        status: 'pending',
      });
      continue;
    }

    // 6. Ordered list item (1. item, 2) item)
    const oListMatch = line.match(/^(\s*\d+[.)]\s+)(.*)$/);
    if (oListMatch) {
      isMarkdown = true;
      flushParagraph();
      blocks.push({
        id: `blk_${blockCounter++}_ol`,
        type: 'list_item',
        rawText: line,
        listType: 'ordered',
        listMarker: oListMatch[1],
        order: blocks.length,
        isProtected: false,
        status: 'pending',
      });
      continue;
    }

    // 7. Markdown Table row (| col1 | col2 |)
    if (/^\|.*\|$/.test(trimmed)) {
      isMarkdown = true;
      flushParagraph();
      // Group consecutive table lines into single table block
      const tableLines = [line];
      while (i + 1 < lines.length && /^\|.*\|$/.test(lines[i + 1].trim())) {
        i++;
        tableLines.push(lines[i]);
      }
      blocks.push({
        id: `blk_${blockCounter++}_table`,
        type: 'table',
        rawText: tableLines.join('\n'),
        order: blocks.length,
        isProtected: true,
        status: 'preserved',
      });
      continue;
    }

    // Normal prose line within a paragraph
    currentParagraphLines.push(line);
  }

  // Flush any remaining trailing lines
  if (inCodeBlock && codeBuffer.length > 0) {
    blocks.push({
      id: `blk_${blockCounter++}_code`,
      type: 'code',
      rawText: codeBuffer.join('\n'),
      order: blocks.length,
      isProtected: true,
      status: 'preserved',
    });
  } else {
    flushParagraph();
  }

  // Mark other protected blocks
  for (const blk of blocks) {
    if (!blk.isProtected && isProtectedBlock(blk.rawText, blk.type)) {
      blk.isProtected = true;
      blk.status = 'preserved';
    }
  }

  return {
    id: docId,
    blocks,
    originalText: text,
    format: isMarkdown ? 'markdown' : 'plain',
  };
}

/**
 * Projects ContentBlocks back into a plain-text/markdown document string.
 * Deterministically preserves blank lines between paragraphs and headings,
 * and maintains list formatting.
 */
export function projectBlocksToPlainText(
  docOrBlocks: StructuredDocument | ContentBlock[],
  useRewritten = true
): string {
  const blocks = Array.isArray(docOrBlocks) ? docOrBlocks : docOrBlocks.blocks;
  if (!blocks || blocks.length === 0) return '';

  const segments: string[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const prevBlock = i > 0 ? blocks[i - 1] : null;

    let content = (useRewritten && block.rewrittenText !== undefined)
      ? block.rewrittenText
      : block.rawText;

    // Clean any leading/trailing blank line noise from block content
    content = content.replace(/^\r?\n+/, '').replace(/\r?\n+$/, '');

    // If block was a heading, guarantee prefix `#... ` is preserved
    if (block.type === 'heading' && block.level) {
      const headingPrefix = '#'.repeat(block.level) + ' ';
      if (!content.trimStart().startsWith('#')) {
        content = headingPrefix + content.trim();
      }
    }

    // If block was a list item, guarantee list marker is preserved
    if (block.type === 'list_item' && block.listMarker) {
      if (!content.trimStart().match(/^(\d+[.)]|[-*+])\s+/)) {
        content = block.listMarker + content.trim();
      }
    }

    // If block was a quote, guarantee `> ` prefix
    if (block.type === 'quote') {
      if (!content.trimStart().startsWith('>')) {
        content = '> ' + content.trim();
      }
    }

    // Determine separator from previous block
    if (prevBlock) {
      // If two consecutive list items of same list type, use single newline
      if (prevBlock.type === 'list_item' && block.type === 'list_item') {
        segments.push('\n' + content);
      } else {
        // Otherwise, paragraph / heading separation requires blank line
        segments.push('\n\n' + content);
      }
    } else {
      segments.push(content);
    }
  }

  return segments.join('');
}

function extractAnchorTokens(text: string): Set<string> {
  const words = text.toLowerCase().match(/\b[a-z0-9'-]+\b/g) || [];
  const stopWords = new Set([
    'a', 'an', 'the', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
    'it', 'its', 'this', 'that', 'these', 'those', 'and', 'or', 'but', 'as'
  ]);
  return new Set(words.filter((w) => !stopWords.has(w) && w.length > 2));
}

function computeOverlapScore(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 || setB.size === 0) return 0;
  let matches = 0;
  for (const w of setA) {
    if (setB.has(w)) matches++;
  }
  return matches / Math.min(setA.size, setB.size);
}

export function extractNumbers(text: string): string[] {
  return (text.match(/\b\d+(?:[.,]\d+)?%?(?:ms|s|kg|g|ml|gb|mb|kb|usd|eur)?\b/gi) || []).map((n) => n.toLowerCase());
}

export function extractCitations(text: string): string[] {
  return text.match(/\[\d+\]|\([A-Z][a-zA-Z\s&.,]+,\s*\d{4}[a-z]?\)/g) || [];
}

function extractNegations(text: string): string[] {
  const matches = text.match(/\b(?:not|never|no|none|neither|nor|cannot|can't|won't|don't|doesn't|didn't|isn't|aren't|wasn't|weren't|must not|should not)\b/gi) || [];
  return Array.from(new Set(matches.map((m) => m.toLowerCase())));
}

/**
 * Validates that document structure was not damaged during rewriting.
 * Specifically checks for paragraph collapse anomalies, stripped headings/lists,
 * omitted blocks, duplicated content, scrambled order, and citation/data removal.
 */
export function validateDocumentStructure(
  input: StructuredDocument,
  outputText: string
): StructuralValidationResult {
  const outputDoc = parseDocumentToBlocks(outputText);
  const inputNonBlank = input.blocks.filter((b) => b.type !== 'blank_line');
  const outputNonBlank = outputDoc.blocks.filter((b) => b.type !== 'blank_line');

  const warnings: string[] = [];
  let hasCollapseAnomaly = false;
  let hasOrderingAnomaly = false;
  let hasOmissionAnomaly = false;
  let hasFactualAnomaly = false;
  let hasDuplicateAnomaly = false;

  // Anomaly 1: Multi-block input collapsed into single block
  if (inputNonBlank.length >= 2 && outputNonBlank.length === 1) {
    hasCollapseAnomaly = true;
    warnings.push(
      `Structural collapse anomaly: ${inputNonBlank.length} input blocks collapsed into 1 single output block.`
    );
  } else if (inputNonBlank.length > 2 && outputNonBlank.length < inputNonBlank.length) {
    hasOmissionAnomaly = true;
    warnings.push(
      `Structural block reduction: input had ${inputNonBlank.length} blocks, output has only ${outputNonBlank.length}.`
    );
  }

  // Anomaly 2: Headings stripped
  const inputHeadings = inputNonBlank.filter((b) => b.type === 'heading').length;
  const outputHeadings = outputNonBlank.filter((b) => b.type === 'heading').length;
  if (inputHeadings > 0 && outputHeadings === 0) {
    warnings.push(`Structural defect: ${inputHeadings} section headings were stripped.`);
  }

  // Anomaly 3: Lists stripped or flattened to prose
  const inputLists = inputNonBlank.filter((b) => b.type === 'list_item').length;
  const outputLists = outputNonBlank.filter((b) => b.type === 'list_item').length;
  if (inputLists >= 2 && outputLists === 0) {
    warnings.push(`Structural defect: List with ${inputLists} items was flattened into prose.`);
  }

  // Anomaly 4: Protected code or tables altered
  const inputProtected = inputNonBlank.filter((b) => b.isProtected);
  for (const prot of inputProtected) {
    if (!outputText.includes(prot.rawText.trim())) {
      warnings.push(`Protected content altered or removed: "${prot.rawText.slice(0, 40)}..."`);
    }
  }

  // Anomaly 5: Duplicate blocks in output
  for (let i = 0; i < outputNonBlank.length; i++) {
    for (let j = i + 1; j < outputNonBlank.length; j++) {
      const textA = outputNonBlank[i].rawText.trim();
      const textB = outputNonBlank[j].rawText.trim();
      if (textA.length > 25 && textB.length > 25) {
        const tokensA = extractAnchorTokens(textA);
        const tokensB = extractAnchorTokens(textB);
        const overlap = computeOverlapScore(tokensA, tokensB);
        if (overlap > 0.85) {
          hasDuplicateAnomaly = true;
          warnings.push(`Duplicate content detected in model output between blocks ${i + 1} and ${j + 1}.`);
        }
      }
    }
  }

  // Anomaly 6: Section reordering check across output blocks
  if (outputNonBlank.length >= 2 && inputNonBlank.length >= 2) {
    let lastMatchedInputIdx = -1;
    for (let oIdx = 0; oIdx < outputNonBlank.length; oIdx++) {
      const oTokens = extractAnchorTokens(outputNonBlank[oIdx].rawText);
      let bestInputIdx = -1;
      let highestOverlap = 0.20;

      for (let iIdx = 0; iIdx < inputNonBlank.length; iIdx++) {
        const iTokens = extractAnchorTokens(inputNonBlank[iIdx].rawText);
        const overlap = computeOverlapScore(oTokens, iTokens);
        if (overlap > highestOverlap) {
          highestOverlap = overlap;
          bestInputIdx = iIdx;
        }
      }

      if (bestInputIdx !== -1) {
        if (bestInputIdx < lastMatchedInputIdx) {
          hasOrderingAnomaly = true;
          warnings.push(
            `Section reordering anomaly detected: output block ${oIdx + 1} matches earlier input block ${bestInputIdx + 1}.`
          );
          break;
        }
        lastMatchedInputIdx = bestInputIdx;
      }
    }
  }

  // Anomaly 7: Citation, Numerical data, and Negation preservation across blocks
  for (let idx = 0; idx < inputNonBlank.length; idx++) {
    const origBlock = inputNonBlank[idx];
    const origNums = extractNumbers(origBlock.rawText);
    const origCits = extractCitations(origBlock.rawText);
    const origNegs = extractNegations(origBlock.rawText);

    const outBlock = outputNonBlank[idx] || outputNonBlank[0];
    if (outBlock) {
      const outText = outBlock.rawText;
      const missingNums = origNums.filter((num) => !outputText.toLowerCase().includes(num));
      const missingCits = origCits.filter((cit) => !outputText.includes(cit));

      if (missingNums.length > 0) {
        hasFactualAnomaly = true;
        warnings.push(`Numerical data omitted in block ${idx + 1}: ${missingNums.join(', ')}.`);
      }
      if (missingCits.length > 0) {
        hasFactualAnomaly = true;
        warnings.push(`Citations omitted in block ${idx + 1}: ${missingCits.join(', ')}.`);
      }

      if (origNegs.length > 0 && extractNegations(outText).length === 0) {
        const tokensOrig = extractAnchorTokens(origBlock.rawText);
        const tokensOut = extractAnchorTokens(outText);
        if (computeOverlapScore(tokensOrig, tokensOut) > 0.3) {
          warnings.push(
            `Semantic drift / polarity warning in block ${idx + 1}: negative qualification (${origNegs.join(', ')}) appears inverted.`
          );
        }
      }
    }
  }

  const isValid =
    !hasCollapseAnomaly &&
    !hasOrderingAnomaly &&
    !hasOmissionAnomaly &&
    !hasFactualAnomaly &&
    !hasDuplicateAnomaly &&
    warnings.length === 0;

  // Build repaired text if collapse happened, omission occurred, or factual data dropped
  let repairedText: string | undefined = undefined;
  let repairedBlocks: ContentBlock[] | undefined = undefined;
  if (hasCollapseAnomaly || hasOmissionAnomaly || hasFactualAnomaly) {
    const rep = repairCollapsedDocument(input, outputText);
    repairedText = rep.repairedText;
    repairedBlocks = rep.repairedBlocks;
  }

  return {
    isValid,
    hasCollapseAnomaly,
    hasOrderingAnomaly,
    hasOmissionAnomaly,
    hasFactualAnomaly,
    hasDuplicateAnomaly,
    inputBlockCount: inputNonBlank.length,
    outputBlockCount: outputNonBlank.length,
    warnings,
    repairedText,
    repairedBlocks,
  };
}

/**
 * Attempts deterministic repair when a model collapses multi-block input into a single block.
 * Maps output sentences back into the original block containers using content-anchor token
 * matching and monotonic sequence alignment.
 * If safe reconstruction is impossible, preserves affected original content with warnings.
 */
export function repairCollapsedDocument(
  input: StructuredDocument,
  collapsedOutputText: string
): { repairedText: string; repairedBlocks: ContentBlock[] } {
  const inputBlocks = input.blocks.filter((b) => b.type !== 'blank_line');
  if (inputBlocks.length <= 1) {
    return { repairedText: collapsedOutputText, repairedBlocks: input.blocks };
  }

  // Split collapsed output into sentences
  const sentenceRegex = /.*?(?:(?<!\b(?:et al|Dr|Mr|Mrs|Ms|Prof|vs|e\.g|i\.e))[.!?]+)(?=\s+[A-Z"'([0-9]|$)/gi;
  const sentences: string[] = [];
  let m: RegExpExecArray | null;
  let lastIdx = 0;
  while ((m = sentenceRegex.exec(collapsedOutputText)) !== null) {
    sentences.push(m[0].trim());
    lastIdx = m.index + m[0].length;
  }
  const rem = collapsedOutputText.slice(lastIdx).trim();
  if (rem) sentences.push(rem);

  if (sentences.length === 0) {
    return { repairedText: input.originalText, repairedBlocks: input.blocks };
  }

  // Extract anchor tokens for each input block
  const inputBlockAnchors = inputBlocks.map((b) => extractAnchorTokens(b.rawText));

  // For each sentence, compute best matching input block index
  const sentenceMatches: number[] = sentences.map((sentence) => {
    const sTokens = extractAnchorTokens(sentence);
    let bestIdx = -1;
    let highestScore = 0.12;
    for (let i = 0; i < inputBlockAnchors.length; i++) {
      const score = computeOverlapScore(sTokens, inputBlockAnchors[i]);
      if (score > highestScore) {
        highestScore = score;
        bestIdx = i;
      }
    }
    return bestIdx;
  });

  // Check if sentences exhibit severe order scramble
  const matchedIndices = sentenceMatches.filter((idx) => idx !== -1);
  let isSevereScramble = false;
  for (let i = 1; i < matchedIndices.length; i++) {
    if (matchedIndices[i] < matchedIndices[i - 1] - 1) {
      isSevereScramble = true;
      break;
    }
  }

  // If severe scramble: safe reconstruction is impossible -> preserve original text
  if (isSevereScramble) {
    return { repairedText: input.originalText, repairedBlocks: input.blocks };
  }

  // Assign sentences to input blocks respecting monotonic sequence
  const blockSentences: Map<number, string[]> = new Map();
  for (let i = 0; i < inputBlocks.length; i++) {
    blockSentences.set(i, []);
  }

  let currentBlockPointer = 0;
  for (let sIdx = 0; sIdx < sentences.length; sIdx++) {
    const sentence = sentences[sIdx];
    const matchedIdx = sentenceMatches[sIdx];

    if (matchedIdx >= currentBlockPointer) {
      currentBlockPointer = matchedIdx;
    }
    blockSentences.get(currentBlockPointer)?.push(sentence);
  }

  // Build repaired blocks
  const repairedBlocks: ContentBlock[] = [];
  for (let bIdx = 0; bIdx < inputBlocks.length; bIdx++) {
    const origBlock = inputBlocks[bIdx];

    // Protected blocks are always preserved verbatim
    if (origBlock.isProtected) {
      repairedBlocks.push({
        ...origBlock,
        rewrittenText: origBlock.rawText,
        status: 'preserved',
      });
      continue;
    }

    const assigned = blockSentences.get(bIdx) || [];

    // Check if paragraph was omitted
    if (assigned.length === 0) {
      // Safe reconstruction: preserve original affected block
      repairedBlocks.push({
        ...origBlock,
        rewrittenText: origBlock.rawText,
        status: 'fallback',
      });
      continue;
    }

    // Deduplicate any repeated sentences within the block
    const uniqueSentences: string[] = [];
    const seenSentences = new Set<string>();
    for (const s of assigned) {
      const norm = s.toLowerCase().trim();
      if (!seenSentences.has(norm)) {
        seenSentences.add(norm);
        uniqueSentences.push(s);
      }
    }

    let blockText = uniqueSentences.join(' ');

    // Check if critical numbers or citations in origBlock were stripped
    const origNums = extractNumbers(origBlock.rawText);
    const origCits = extractCitations(origBlock.rawText);
    const missingNums = origNums.filter((num) => !blockText.toLowerCase().includes(num));
    const missingCits = origCits.filter((cit) => !blockText.includes(cit));

    if (missingNums.length > 0 || missingCits.length > 0) {
      // Missing critical data: safe fallback to original block
      repairedBlocks.push({
        ...origBlock,
        rewrittenText: origBlock.rawText,
        status: 'fallback',
      });
      continue;
    }

    // Format heading
    if (origBlock.type === 'heading' && origBlock.level) {
      const cleanHeading = blockText.replace(/^#{1,6}\s+/, '').trim();
      blockText = '#'.repeat(origBlock.level) + ' ' + cleanHeading;
    }

    // Format list item
    if (origBlock.type === 'list_item' && origBlock.listMarker) {
      const cleanItem = blockText.replace(/^(\d+[.)]|[-*+])\s+/, '').trim();
      blockText = origBlock.listMarker + cleanItem;
    }

    // Format quote
    if (origBlock.type === 'quote') {
      const cleanQuote = blockText.replace(/^>\s*/, '').trim();
      blockText = '> ' + cleanQuote;
    }

    repairedBlocks.push({
      ...origBlock,
      rewrittenText: blockText,
      status: 'rewritten',
    });
  }

  const repairedText = projectBlocksToPlainText(repairedBlocks, true);
  return { repairedText, repairedBlocks };
}

export function repairCollapsedOutput(
  input: StructuredDocument,
  collapsedOutputText: string
): string {
  return repairCollapsedDocument(input, collapsedOutputText).repairedText;
}
