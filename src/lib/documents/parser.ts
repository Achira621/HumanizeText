import type { DocumentFile, DocumentFormat } from '../../types';
import { computeDocumentDigests } from '../crypto/digest';
import { extractTextFromDocx } from './docxExtractor';
import { extractTextFromPdf } from './pdfExtractor';

export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB safety limit

export class DocumentParseError extends Error {
  public code: 'FILE_TOO_LARGE' | 'UNSUPPORTED_TYPE' | 'CORRUPTED_FILE';

  constructor(message: string, code: 'FILE_TOO_LARGE' | 'UNSUPPORTED_TYPE' | 'CORRUPTED_FILE') {
    super(message);
    this.name = 'DocumentParseError';
    this.code = code;
  }
}

export function detectDocumentFormat(fileName: string): DocumentFormat {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'txt':
      return 'txt';
    case 'md':
    case 'markdown':
      return 'md';
    case 'pdf':
      return 'pdf';
    case 'docx':
      return 'docx';
    default:
      return 'raw';
  }
}

/**
 * Parses an uploaded document file locally in the browser.
 * No data is uploaded to any server.
 */
export async function parseUploadedDocument(file: File): Promise<DocumentFile> {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new DocumentParseError(
      `File "${file.name}" exceeds the maximum 25 MB safety limit.`,
      'FILE_TOO_LARGE'
    );
  }

  const format = detectDocumentFormat(file.name);
  let text = '';

  try {
    if (format === 'txt' || format === 'md' || format === 'raw') {
      text = await file.text();
    } else if (format === 'docx') {
      const arrayBuffer = await file.arrayBuffer();
      text = await extractTextFromDocx(arrayBuffer);
    } else if (format === 'pdf') {
      const arrayBuffer = await file.arrayBuffer();
      text = await extractTextFromPdf(arrayBuffer);
    }
  } catch (err: any) {
    throw new DocumentParseError(
      `Failed to parse ${file.name}: ${err?.message || 'Unsupported or damaged file structure'}`,
      'CORRUPTED_FILE'
    );
  }

  // Count words and characters cleanly
  const words = text.trim().split(/\s+/).filter(Boolean);
  const wordCount = text.trim().length === 0 ? 0 : words.length;
  const characterCount = text.length;

  // Compute integrity digests
  const digests = await computeDocumentDigests(text);

  return {
    id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    name: file.name,
    format,
    size: file.size,
    text,
    wordCount,
    characterCount,
    createdAt: Date.now(),
    sha256Digest: digests.rawSha256,
    normalizedDigest: digests.normalizedSha256,
  };
}
