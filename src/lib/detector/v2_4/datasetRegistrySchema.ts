/**
 * ============================================================================
 * HUMANIZETEXT DETECTOR V2.4: UNIFIED DATASET REGISTRY SCHEMA
 * Strict schema and validator for all training, development, and evaluation records.
 * Enforces cryptographic integrity, provenance tracking, license metadata,
 * and independence group boundaries.
 * ============================================================================
 */

/**
 * Pure TypeScript, zero-dependency, platform-independent SHA-256 implementation.
 * Compliant with FIPS 180-4. Compatible with both Browser and Node.js runtimes.
 */
function sha256Pure(str: string): string {
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
  for (let i = 7; i >= 0; i--) utf8.push((bitLen >>> (i * 8)) & 0xff);

  let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a;
  let h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;

  const w = new Uint32Array(64);
  for (let i = 0; i < utf8.length; i += 64) {
    for (let j = 0; j < 16; j++) {
      w[j] = (utf8[i + j * 4] << 24) | (utf8[i + j * 4 + 1] << 16) | (utf8[i + j * 4 + 2] << 8) | (utf8[i + j * 4 + 3]);
    }
    for (let j = 16; j < 64; j++) {
      const s0 = rotr(7, w[j - 15]) ^ rotr(18, w[j - 15]) ^ (w[j - 15] >>> 3);
      const s1 = rotr(17, w[j - 2]) ^ rotr(19, w[j - 2]) ^ (w[j - 2] >>> 10);
      w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0;
    }

    let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
    for (let j = 0; j < 64; j++) {
      const S1 = rotr(6, e) ^ rotr(11, e) ^ rotr(25, e);
      const ch = (e & f) ^ ((~e) & g);
      const temp1 = (h + S1 + ch + K[j] + w[j]) | 0;
      const S0 = rotr(2, a) ^ rotr(13, a) ^ rotr(22, a);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) | 0;

      h = g; g = f; f = e; e = (d + temp1) | 0;
      d = c; c = b; b = a; a = (temp1 + temp2) | 0;
    }

    h0 = (h0 + a) | 0; h1 = (h1 + b) | 0; h2 = (h2 + c) | 0; h3 = (h3 + d) | 0;
    h4 = (h4 + e) | 0; h5 = (h5 + f) | 0; h6 = (h6 + g) | 0; h7 = (h7 + h) | 0;
  }

  const toHex = (n: number) => (n >>> 0).toString(16).padStart(8, '0');
  return (toHex(h0) + toHex(h1) + toHex(h2) + toHex(h3) + toHex(h4) + toHex(h5) + toHex(h6) + toHex(h7)).toLowerCase();
}

export function computeSha256(text: string): string {
  return sha256Pure(text);
}

export type AuthorClass = 'human' | 'ai' | 'collaborative';

export type TextGenre =
  | 'academic'
  | 'technical'
  | 'corporate'
  | 'conversational'
  | 'creative'
  | 'general';

export type TransformationType =
  | 'original'
  | 'verbatim'
  | 'synonym_swap'
  | 'mixed_edit'
  | 'expansion'
  | 'unknown';

export type QualityRatingStatus =
  | 'unassessed_by_human'
  | 'developer_assigned_proxy'
  | 'double_blind_verified';

export type ProvenanceStatus =
  | 'verified_archival'
  | 'prompted_generation'
  | 'synthetic_expansion'
  | 'workflow_validation_pilot'
  | 'quarantined'
  | 'unknown';

export interface DatasetRegistryRecord {
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
  /** Text content license (e.g., 'Public Domain', 'CC-BY-4.0', 'MIT', 'Disputed', 'unknown') */
  license: string;
  /** Authorship ground truth class */
  authorClass: AuthorClass;
  /** Model provider (e.g., 'OpenAI', 'Anthropic', 'Google', 'None', 'unknown') */
  modelProvider: string;
  /** Model name (e.g., 'gpt-4o', 'claude-3-5-sonnet', 'None', 'unknown') */
  modelName: string;
  /** Model version / checkpoint ID or 'unverified' / 'n/a' */
  modelVersion: string;
  /** Prompt identifier or 'none' / 'unknown' */
  promptId: string;
  /** Generation timestamp (ISO 8601) or 'historical' / 'unknown' */
  generationDate: string;
  /** Whitespace-delimited word count */
  wordCount: number;
  /** ISO 639-1 language code (e.g., 'en') */
  language: string;
  /** Text genre */
  genre: TextGenre;
  /** Transformation lineage */
  transformationType: TransformationType;
  /** Status of human quality evaluation */
  qualityRatingStatus: QualityRatingStatus;
  /** Verification status of provenance chain */
  provenanceStatus: ProvenanceStatus;
  /** The full raw text passage */
  text: string;
  /** Lowercase SHA-256 hash of the exact UTF-8 text */
  sha256: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export const VALID_AUTHOR_CLASSES: ReadonlySet<string> = new Set(['human', 'ai', 'collaborative']);

export const VALID_GENRES: ReadonlySet<string> = new Set([
  'academic',
  'technical',
  'corporate',
  'conversational',
  'creative',
  'general',
]);

export const VALID_TRANSFORMATION_TYPES: ReadonlySet<string> = new Set([
  'original',
  'verbatim',
  'synonym_swap',
  'mixed_edit',
  'expansion',
  'unknown',
]);

export const VALID_QUALITY_STATUSES: ReadonlySet<string> = new Set([
  'unassessed_by_human',
  'developer_assigned_proxy',
  'double_blind_verified',
]);

export const VALID_PROVENANCE_STATUSES: ReadonlySet<string> = new Set([
  'verified_archival',
  'prompted_generation',
  'synthetic_expansion',
  'workflow_validation_pilot',
  'quarantined',
  'unknown',
]);

/**
 * Validates a single dataset registry record against all schema and integrity constraints.
 */
export function validateDatasetRegistryRecord(candidate: unknown): ValidationResult {
  const errors: string[] = [];

  if (!candidate || typeof candidate !== 'object') {
    return { isValid: false, errors: ['Record must be a non-null object'] };
  }

  const rec = candidate as Record<string, unknown>;

  // Mandatory string fields
  const requiredStringFields: (keyof DatasetRegistryRecord)[] = [
    'sampleId',
    'baseDocumentId',
    'independenceGroupId',
    'sourceDataset',
    'sourceDocumentId',
    'sourceUrl',
    'license',
    'modelProvider',
    'modelName',
    'modelVersion',
    'promptId',
    'generationDate',
    'language',
    'text',
    'sha256',
  ];

  for (const field of requiredStringFields) {
    if (typeof rec[field] !== 'string' || (rec[field] as string).trim() === '') {
      errors.push(`Field '${field}' must be a non-empty string`);
    }
  }

  // Author class
  if (typeof rec['authorClass'] !== 'string' || !VALID_AUTHOR_CLASSES.has(rec['authorClass'])) {
    errors.push(`Field 'authorClass' must be one of: human, ai, collaborative. Received: '${String(rec['authorClass'])}'`);
  }

  // Genre
  if (typeof rec['genre'] !== 'string' || !VALID_GENRES.has(rec['genre'])) {
    errors.push(`Field 'genre' must be one of: ${Array.from(VALID_GENRES).join(', ')}. Received: '${String(rec['genre'])}'`);
  }

  // Transformation type
  if (typeof rec['transformationType'] !== 'string' || !VALID_TRANSFORMATION_TYPES.has(rec['transformationType'])) {
    errors.push(`Field 'transformationType' must be one of: ${Array.from(VALID_TRANSFORMATION_TYPES).join(', ')}. Received: '${String(rec['transformationType'])}'`);
  }

  // Quality rating status
  if (typeof rec['qualityRatingStatus'] !== 'string' || !VALID_QUALITY_STATUSES.has(rec['qualityRatingStatus'])) {
    errors.push(`Field 'qualityRatingStatus' must be one of: ${Array.from(VALID_QUALITY_STATUSES).join(', ')}. Received: '${String(rec['qualityRatingStatus'])}'`);
  }

  // Provenance status
  if (typeof rec['provenanceStatus'] !== 'string' || !VALID_PROVENANCE_STATUSES.has(rec['provenanceStatus'])) {
    errors.push(`Field 'provenanceStatus' must be one of: ${Array.from(VALID_PROVENANCE_STATUSES).join(', ')}. Received: '${String(rec['provenanceStatus'])}'`);
  }

  // Word count validation
  if (typeof rec['wordCount'] !== 'number' || !Number.isInteger(rec['wordCount']) || rec['wordCount'] <= 0) {
    errors.push(`Field 'wordCount' must be a positive integer. Received: ${String(rec['wordCount'])}`);
  }

  // Cryptographic hash validation
  if (typeof rec['text'] === 'string' && typeof rec['sha256'] === 'string') {
    const computed = computeSha256(rec['text']);
    if (computed !== rec['sha256'].toLowerCase()) {
      errors.push(`Field 'sha256' mismatch: expected '${computed}', received '${rec['sha256']}'`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
