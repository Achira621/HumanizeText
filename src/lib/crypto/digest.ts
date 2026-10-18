import type { DocumentDigest } from '../../types';

/**
 * Normalizes Unicode text for consistent hashing and comparisons.
 * Uses Unicode Normalization Form C (NFC), folds case, and collapses whitespace.
 */
export function normalizeTextForDigest(text: string): string {
  return text
    .normalize('NFC')
    .toLowerCase()
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Encodes an ArrayBuffer or Uint8Array into a lowercase hexadecimal string.
 */
export function bufferToHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

/**
 * Computes both the Raw SHA-256 and Normalized SHA-256 digests of text.
 * Uses the browser's native Web Crypto API.
 */
export async function computeDocumentDigests(text: string): Promise<DocumentDigest> {
  const encoder = new TextEncoder();
  
  // 1. Raw digest
  const rawData = encoder.encode(text);
  const rawHashBuffer = await crypto.subtle.digest('SHA-256', rawData);
  const rawSha256 = bufferToHex(rawHashBuffer);

  // 2. Normalized digest
  const normalizedText = normalizeTextForDigest(text);
  const normalizedData = encoder.encode(normalizedText);
  const normHashBuffer = await crypto.subtle.digest('SHA-256', normalizedData);
  const normalizedSha256 = bufferToHex(normHashBuffer);

  return {
    rawSha256,
    normalizedSha256,
    rawByteLength: rawData.byteLength,
    normalizedByteLength: normalizedData.byteLength,
    computedAt: Date.now(),
  };
}

/**
 * Computes a standard SHA-256 digest of an arbitrary string or Uint8Array.
 */
export async function sha256Hex(data: string | Uint8Array): Promise<string> {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  const hashBuffer = await crypto.subtle.digest('SHA-256', bytes as unknown as BufferSource);
  return bufferToHex(hashBuffer);
}
