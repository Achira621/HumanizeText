/**
 * ============================================================================
 * HUMANIZETEXT DETECTOR V2.4.2: EMBARGO GUARD & INTEGRITY VALIDATOR
 * Fail-closed security guard enforcing permanent embargo against all 120
 * historical V2.2.1 research holdout records.
 * Ensures future ingestion, partitioning, training, and evaluation pipelines
 * fail immediately if an embargoed sample or derivative is detected.
 * ============================================================================
 */

import embargoManifestJson from '../../../../data/v2_4_2/historical_holdout_embargo_manifest.json';

export interface EmbargoEntry {
  originalSampleId: string;
  originalFixtureId: string;
  textSha256: string;
  normalizedTextSha256: string;
  baseDocumentId: string;
  independenceGroupId: string;
  genre: string;
  label: string;
  authorClass: string;
  reasonForExclusion: string;
}

export interface EmbargoManifest {
  manifestVersion: string;
  generatedDate: string;
  totalEmbargoedRecords: number;
  embargoPolicy: string;
  embargoedRecords: EmbargoEntry[];
}

export const EMBARGO_MANIFEST: EmbargoManifest = embargoManifestJson as unknown as EmbargoManifest;

// Pre-compiled fast lookup sets
const EMBARGOED_TEXT_HASHES: ReadonlySet<string> = new Set(
  EMBARGO_MANIFEST.embargoedRecords.map((r) => r.textSha256.toLowerCase())
);

const EMBARGOED_NORM_HASHES: ReadonlySet<string> = new Set(
  EMBARGO_MANIFEST.embargoedRecords.map((r) => r.normalizedTextSha256.toLowerCase())
);

const EMBARGOED_SAMPLE_IDS: ReadonlySet<string> = new Set(
  EMBARGO_MANIFEST.embargoedRecords.flatMap((r) => [r.originalSampleId, r.originalFixtureId])
);

/**
 * Normalizes text for canonical matching.
 */
export function normalizeTextCanonical(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Checks if a given text hash or sample ID is embargoed.
 */
export function isEmbargoed(textSha256: string, normSha256?: string, sampleId?: string): boolean {
  if (EMBARGOED_TEXT_HASHES.has(textSha256.toLowerCase())) return true;
  if (normSha256 && EMBARGOED_NORM_HASHES.has(normSha256.toLowerCase())) return true;
  if (sampleId && EMBARGOED_SAMPLE_IDS.has(sampleId)) return true;
  return false;
}

/**
 * Finds the specific embargo entry matching a hash or ID.
 */
export function findEmbargoEntry(
  textSha256: string,
  normSha256?: string,
  sampleId?: string
): EmbargoEntry | undefined {
  const tLower = textSha256.toLowerCase();
  const nLower = normSha256 ? normSha256.toLowerCase() : undefined;

  return EMBARGO_MANIFEST.embargoedRecords.find(
    (r) =>
      r.textSha256.toLowerCase() === tLower ||
      (nLower && r.normalizedTextSha256.toLowerCase() === nLower) ||
      (sampleId && (r.originalSampleId === sampleId || r.originalFixtureId === sampleId))
  );
}

/**
 * Enforces a fail-closed integrity assertion across an array of candidate records.
 * Throws a fatal Error if any embargoed passage is detected.
 */
export function assertNoEmbargoedData(
  records: Array<{ sampleId?: string; id?: string; textSha256?: string; sha256?: string }>
): void {
  const violations: string[] = [];

  for (const r of records) {
    const sId = r.sampleId || r.id;
    const sha = r.textSha256 || r.sha256;
    if (sha && isEmbargoed(sha, undefined, sId)) {
      violations.push(`Violation: Sample '${sId || 'unknown'}' matches embargoed holdout record (SHA: ${sha})`);
    }
  }

  if (violations.length > 0) {
    throw new Error(
      `[EMBARGO VIOLATION] Detected ${violations.length} prohibited historical holdout samples:\n` +
        violations.slice(0, 10).join('\n')
    );
  }
}

