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

/**
 * Extracts plain text page-by-page from a PDF ArrayBuffer using PDF.js.
 */
export async function extractTextFromPdf(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useSystemFonts: true,
    });

    const pdfDoc = await loadingTask.promise;
    const pageTexts: string[] = [];

    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageString = textContent.items
        .map((item: any) => item.str || '')
        .join(' ');

      if (pageString.trim().length > 0) {
        pageTexts.push(pageString.trim());
      }
    }

    return pageTexts.join('\n\n');
  } catch (err: any) {
    throw new Error(`Failed to extract text from PDF document: ${err?.message || 'Invalid or encrypted PDF'}`);
  }
}
