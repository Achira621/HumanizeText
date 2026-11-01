/**
 * ============================================================================
 * HUMANIZETEXT PDF EXTRACTOR (ADVANCED STRUCTURED EXTRACTION)
 * 
 * Features:
 *   - Layout-aware line and paragraph grouping
 *   - Heading detection based on font size & styling
 *   - Table and tabular data preservation
 *   - Scanned / image-only page detection with explicit warnings
 *   - Metadata extraction (title, author, subject)
 *   - Full backward compatibility with existing extractTextFromPdf
 * ============================================================================
 */

// Polyfill Uint8Array.prototype.toHex for environments (Node / older browser engines)
// where PDF.js modern fingerprint calculation relies on the Stage 3/4 ArrayBuffer toHex proposal.
if (typeof Uint8Array !== 'undefined' && !(Uint8Array.prototype as any).toHex) {
  (Uint8Array.prototype as any).toHex = function (): string {
    return Array.from(this as Uint8Array)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  };
}

import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker in Vite client environment safely
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.mjs',
      import.meta.url
    ).toString();
  } catch {
    // Fallback if URL resolution fails
  }
}

export interface ExtractedPage {
  pageNumber: number;
  text: string;
  wordCount: number;
  isScannedOrImageOnly: boolean;
  headings: string[];
  tablesDetected: boolean;
}

export interface PdfExtractionResult {
  fullText: string;
  totalPages: number;
  scannedPageCount: number;
  hasScannedPages: boolean;
  scannedPages: number[];
  pages: ExtractedPage[];
  metadata?: {
    title?: string;
    author?: string;
    subject?: string;
    creator?: string;
  };
}

/**
 * Extracts structured text, layout, and detects scanned/image-only pages.
 */
export async function extractStructuredPdf(arrayBuffer: ArrayBuffer): Promise<PdfExtractionResult> {
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer.slice(0)),
      useSystemFonts: true,
    });

    const pdfDoc = await loadingTask.promise;
    const totalPages = pdfDoc.numPages;
    const pages: ExtractedPage[] = [];
    const scannedPages: number[] = [];
    const pageStrings: string[] = [];

    // Optional metadata
    let metadata: PdfExtractionResult['metadata'] = undefined;
    try {
      const meta = await pdfDoc.getMetadata();
      const info = (meta?.info as any) || {};
      metadata = {
        title: info.Title || undefined,
        author: info.Author || undefined,
        subject: info.Subject || undefined,
        creator: info.Creator || undefined,
      };
    } catch {
      // Non-fatal if metadata read fails
    }

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      const items = (textContent.items || []) as any[];

      // Check if page has no extractable text
      if (items.length === 0) {
        scannedPages.push(pageNum);
        pages.push({
          pageNumber: pageNum,
          text: '',
          wordCount: 0,
          isScannedOrImageOnly: true,
          headings: [],
          tablesDetected: false,
        });
        pageStrings.push(`[Page ${pageNum}: Scanned or image-only page (No selectable digital text detected - requires OCR)]`);
        continue;
      }

      // Group text items by vertical position (Y coordinate)
      // PDF coordinates have (0,0) at bottom-left, so higher Y is higher on page
      interface LineItem {
        str: string;
        x: number;
        y: number;
        height: number;
      }

      const lineMap = new Map<number, LineItem[]>();
      let maxFontHeight = 0;
      let totalFontHeight = 0;
      let itemCount = 0;

      for (const item of items) {
        const str = item.str || '';
        if (!str.trim()) continue;

        const transform = item.transform || [1, 0, 0, 1, 0, 0];
        const x = transform[4] || 0;
        const y = transform[5] || 0;
        const height = Math.abs(transform[0] || transform[3] || item.height || 12);

        if (height > maxFontHeight) maxFontHeight = height;
        totalFontHeight += height;
        itemCount++;

        // Group into lines with a 3pt tolerance
        let foundLineY: number | null = null;
        for (const existingY of lineMap.keys()) {
          if (Math.abs(existingY - y) <= 3) {
            foundLineY = existingY;
            break;
          }
        }

        const targetY = foundLineY ?? y;
        const currentList = lineMap.get(targetY) || [];
        currentList.push({ str, x, y, height });
        lineMap.set(targetY, currentList);
      }

      const avgFontHeight = itemCount > 0 ? totalFontHeight / itemCount : 12;

      // Sort lines top to bottom (descending Y)
      const sortedYs = Array.from(lineMap.keys()).sort((a, b) => b - a);
      const pageParagraphs: string[] = [];
      const pageHeadings: string[] = [];
      let currentParaLines: string[] = [];
      let lastY: number | null = null;
      let tablesDetected = false;

      for (const y of sortedYs) {
        const lineItems = lineMap.get(y) || [];
        // Sort items left to right (ascending X)
        lineItems.sort((a, b) => a.x - b.x);

        // Check for multiple distinct column alignments (table indicator)
        if (lineItems.length >= 3) {
          const colGaps = [];
          for (let c = 1; c < lineItems.length; c++) {
            colGaps.push(lineItems[c].x - lineItems[c - 1].x);
          }
          if (colGaps.some(g => g > 40)) {
            tablesDetected = true;
          }
        }

        const lineText = lineItems.map(it => it.str).join(' ').trim();
        if (!lineText) continue;

        const isHeading = lineItems.some(it => it.height > avgFontHeight * 1.25) && lineText.length < 120;
        const isBigVerticalGap = lastY !== null && Math.abs(lastY - y) > avgFontHeight * 2.0;

        if (isHeading) {
          if (currentParaLines.length > 0) {
            pageParagraphs.push(currentParaLines.join(' '));
            currentParaLines = [];
          }
          pageHeadings.push(lineText);
          pageParagraphs.push(`## ${lineText}`);
        } else if (isBigVerticalGap) {
          if (currentParaLines.length > 0) {
            pageParagraphs.push(currentParaLines.join(' '));
            currentParaLines = [];
          }
          currentParaLines.push(lineText);
        } else {
          currentParaLines.push(lineText);
        }

        lastY = y;
      }

      if (currentParaLines.length > 0) {
        pageParagraphs.push(currentParaLines.join(' '));
      }

      const pageText = pageParagraphs.join('\n\n');
      const pageWords = pageText.split(/\s+/).filter(Boolean).length;
      const isScanned = pageWords < 10;

      if (isScanned) {
        scannedPages.push(pageNum);
      }

      pages.push({
        pageNumber: pageNum,
        text: pageText,
        wordCount: pageWords,
        isScannedOrImageOnly: isScanned,
        headings: pageHeadings,
        tablesDetected,
      });

      if (pageText.trim()) {
        pageStrings.push(pageText.trim());
      } else if (isScanned) {
        pageStrings.push(`[Page ${pageNum}: Scanned or image-only page (No selectable digital text detected - requires OCR)]`);
      }
    }

    const fullText = pageStrings.join('\n\n');
    return {
      fullText,
      totalPages,
      scannedPageCount: scannedPages.length,
      hasScannedPages: scannedPages.length > 0,
      scannedPages,
      pages,
      metadata,
    };
  } catch (err: any) {
    throw new Error(`Failed to extract text from PDF document: ${err?.message || 'Invalid or encrypted PDF'}`);
  }
}

/**
 * Backward-compatible helper returning plain text.
 */
export async function extractTextFromPdf(arrayBuffer: ArrayBuffer): Promise<string> {
  const result = await extractStructuredPdf(arrayBuffer);
  return result.fullText;
}
