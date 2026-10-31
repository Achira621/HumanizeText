/**
 * ============================================================================
 * HUMANIZETEXT DETECTOR V2.4.3: SOURCE-QUALIFIED ACQUIRED DATASET SCHEMA
 * Strict schema and validator for all externally acquired and remediated records.
 * Supports source-qualified authorship tiers, copyright/licensing approvals,
 * and fail-closed embargo verification.
 * ============================================================================
 */

/**
 * Pure TypeScript, zero-dependency, platform-independent SHA-256 implementation.
 * Compliant with FIPS 180-4. Compatible with both Browser and Node.js runtimes.
 */
export function computeSha256(str: string): string {
  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];

  const rotr = (n: number, x: number) => (x >>> n) | (x << (32 - n));
  const utf8: number[] = [];
  for (let i = 0; i < str.length; i++) {
    let c = str.charCodeAt(i);
    if (c < 128) {
      utf8.push(c);
    } else if (c < 2048) {
      utf8.push(192 | (c >> 6), 128 | (c & 63));
    } else if ((c & 0xfc00) === 0xd800 && i + 1 < str.length && (str.charCodeAt(i + 1) & 0xfc00) === 0xdc00) {
      c = 0x10000 + ((c & 0x03ff) << 10) + (str.charCodeAt(++i) & 0x03ff);
      utf8.push(240 | (c >> 18), 128 | ((c >> 12) & 63), 128 | ((c >> 6) & 63), 128 | (c & 63));
    } else {
      utf8.push(224 | (c >> 12), 128 | ((c >> 6) & 63), 128 | (c & 63));
    }
  }

  const bitLen = utf8.length * 8;
  utf8.push(0x80);
  while ((utf8.length % 64) !== 56) utf8.push(0);

  const hi = Math.floor(bitLen / 0x100000000);
  const lo = bitLen >>> 0;
  for (let i = 3; i >= 0; i--) utf8.push((hi >>> (i * 8)) & 0xff);
  for (let i = 3; i >= 0; i--) utf8.push((lo >>> (i * 8)) & 0xff);

  let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a;
  let h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;

  const w = new Uint32Array(64);
  for (let chunk = 0; chunk < utf8.length; chunk += 64) {
    for (let i = 0; i < 16; i++) {
      const idx = chunk + i * 4;
      w[i] = (utf8[idx] << 24) | (utf8[idx + 1] << 16) | (utf8[idx + 2] << 8) | utf8[idx + 3];
    }
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(7, w[i - 15]) ^ rotr(18, w[i - 15]) ^ (w[i - 15] >>> 3);
      const s1 = rotr(17, w[i - 2]) ^ rotr(19, w[i - 2]) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }

    let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
    for (let i = 0; i < 64; i++) {
      const S1 = rotr(6, e) ^ rotr(11, e) ^ rotr(25, e);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + K[i] + w[i]) >>> 0;
      const S0 = rotr(2, a) ^ rotr(13, a) ^ rotr(22, a);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) >>> 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
    h5 = (h5 + f) >>> 0;
    h6 = (h6 + g) >>> 0;
    h7 = (h7 + h) >>> 0;
  }

  return [h0, h1, h2, h3, h4, h5, h6, h7]
    .map((x) => ('00000000' + x.toString(16)).slice(-8))
    .join('')
    .toLowerCase();
}

export type SourceQualifiedAuthorClass =
  | 'verified_human'
  | 'historical_human_proxy'
  | 'verified_ai'
  | 'collaborative'
  | 'unknown'
  | 'excluded';

export type IntendedUseApproval =
  | 'APPROVED_PRODUCT_TRAINING'
  | 'RESEARCH_ONLY_PENDING_REVIEW'
  | 'REJECTED_QUARANTINED';

export type TextGenre =
  | 'academic'
  | 'technical'
  | 'professional'
  | 'conversational'
  | 'creative'
  | 'explanatory';

export type LengthCategory = 'short' | 'medium' | 'long';

export interface AcquiredRegistryRecord {
  /** Unique primary identifier for this registry entry */
  sampleId: string;
  /** Root document identifier to link derived / transformed copies */
  baseDocumentId: string;
  /** Independence group identifier; samples with the same ID must stay in the same split */
  independenceGroupId: string;
  /** Name of the originating dataset or collection */
  sourceDataset: string;
  /** Original ID in the source dataset */
  sourceDocumentId: string;
  /** Source URL, citation, or repository link */
  sourceUrl: string;
  /** Text content license (e.g., 'Public Domain', 'CC-BY-4.0', 'Disputed', etc.) */
  textLicense: string;
  /** Code/tool license of the repository */
  codeLicense: string;
  /** Legal and commercial intended-use approval status */
  intendedUseApproval: IntendedUseApproval;
  /** Source-qualified ground truth authorship class */
  authorClass: SourceQualifiedAuthorClass;
  /** Documented evidence supporting the authorship classification */
  authorshipEvidence: string;
  /** Model provider (e.g., 'OpenAI', 'Anthropic', 'Meta', 'None', 'unknown') */
  modelProvider: string;
  /** Model name (e.g., 'GPT-4o', 'Claude 3.5 Sonnet', 'Llama 2 70B', 'None', etc.) */
  modelName: string;
  /** Model version / checkpoint ID or 'n/a' */
  modelVersion: string;
  /** Prompt identifier or 'none' / 'unknown' */
  promptId: string;
  /** Text genre */
  genre: TextGenre;
  /** Length categorization (< 80 words = short, 80-250 = medium, > 250 = long) */
  lengthCategory: LengthCategory;
  /** Whitespace-delimited word count */
  wordCount: number;
  /** ISO 8601 timestamp of data extraction / ingestion */
  extractionTimestamp: string;
  /** The full raw text passage */
  text: string;
  /** Lowercase SHA-256 hash of the exact UTF-8 text */
  sha256: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function classifyLength(wordCount: number): LengthCategory {
  if (wordCount < 80) return 'short';
  if (wordCount <= 250) return 'medium';
  return 'long';
}

export function countWords(text: string): number {
  const trimmed = text ? text.trim() : '';
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
}

export const VALID_AUTHOR_CLASSES: ReadonlySet<string> = new Set([
  'verified_human',
  'historical_human_proxy',
  'verified_ai',
  'collaborative',
  'unknown',
  'excluded',
]);

export const VALID_INTENDED_USE: ReadonlySet<string> = new Set([
  'APPROVED_PRODUCT_TRAINING',
  'RESEARCH_ONLY_PENDING_REVIEW',
  'REJECTED_QUARANTINED',
]);

export const VALID_GENRES: ReadonlySet<string> = new Set([
  'academic',
  'technical',
  'professional',
  'conversational',
  'creative',
  'explanatory',
]);

/**
 * Validates a single acquired dataset registry record against schema and cryptographic constraints.
 */
export function validateAcquiredRecord(candidate: unknown): ValidationResult {
  const errors: string[] = [];

  if (!candidate || typeof candidate !== 'object') {
    return { isValid: false, errors: ['Record must be a non-null object'] };
  }

  const rec = candidate as Record<string, unknown>;

  const requiredStrings: (keyof AcquiredRegistryRecord)[] = [
    'sampleId',
    'baseDocumentId',
    'independenceGroupId',
    'sourceDataset',
    'sourceDocumentId',
    'sourceUrl',
    'textLicense',
    'codeLicense',
    'authorshipEvidence',
    'modelProvider',
    'modelName',
    'modelVersion',
    'promptId',
    'extractionTimestamp',
    'text',
    'sha256',
  ];

  for (const f of requiredStrings) {
    if (typeof rec[f] !== 'string' || (rec[f] as string).trim() === '') {
      errors.push(`Field '${f}' must be a non-empty string`);
    }
  }

  if (typeof rec['authorClass'] !== 'string' || !VALID_AUTHOR_CLASSES.has(rec['authorClass'])) {
    errors.push(`Field 'authorClass' invalid: received '${String(rec['authorClass'])}'`);
  }

  if (typeof rec['intendedUseApproval'] !== 'string' || !VALID_INTENDED_USE.has(rec['intendedUseApproval'])) {
    errors.push(`Field 'intendedUseApproval' invalid: received '${String(rec['intendedUseApproval'])}'`);
  }

  if (typeof rec['genre'] !== 'string' || !VALID_GENRES.has(rec['genre'])) {
    errors.push(`Field 'genre' invalid: received '${String(rec['genre'])}'`);
  }

  if (typeof rec['wordCount'] !== 'number' || !Number.isInteger(rec['wordCount']) || rec['wordCount'] <= 0) {
    errors.push(`Field 'wordCount' must be a positive integer`);
  }

  if (typeof rec['text'] === 'string' && typeof rec['sha256'] === 'string') {
    const computed = computeSha256(rec['text']);
    if (computed !== rec['sha256'].toLowerCase()) {
      errors.push(`Field 'sha256' mismatch: expected '${computed}', received '${rec['sha256']}'`);
    }
  }

  return { isValid: errors.length === 0, errors };
}

