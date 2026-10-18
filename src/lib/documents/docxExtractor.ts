import mammoth from 'mammoth';

/**
 * Extracts raw plain text from a Word DOCX file using Mammoth.js in the browser.
 */
export async function extractTextFromDocx(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value || '';
  } catch (err: any) {
    throw new Error(`Failed to extract text from DOCX file: ${err?.message || 'Invalid format'}`);
  }
}
