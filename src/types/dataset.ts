// ============================================================================
// PHASE 4: FINE-TUNING DATASET SCHEMA DEFINITIONS
// Specification for curated, privacy-compliant writing intelligence training data.
// Zero raw user text is collected or trained upon.
// ============================================================================

import type { WritingContext, WritingGenre } from './context';

export type DatasetSplit = 'train' | 'validation' | 'test';

export interface DataPermissions {
  consentedForResearch: boolean;
  license: 'CC-BY-4.0' | 'Apache-2.0' | 'MIT' | 'Public-Domain' | 'Proprietary-Synthetic';
  commercialUseAllowed: boolean;
  containsPii: boolean;
  anonymized: boolean;
}

export interface FineTuningSample {
  /** Unique sample identifier (e.g., "ft_academic_001") */
  sampleId: string;
  /** Schema specification version */
  schemaVersion: '1.0.0';
  /** Provenance and source corpus origin */
  provenance: string;
  /** Legal, license, and privacy permissions */
  permissions: DataPermissions;
  /** Associated WritingContext specifying genre, audience, stance, and protected tokens */
  context: WritingContext;
  /** Unedited source text exhibiting formulaic, mechanical, or awkward phrasing */
  sourceText: string;
  /** Professional human gold revision respecting author intent, voice, and invariants */
  preferredRevision: string;
  /** Key factual assertions that must be preserved without hallucination */
  protectedClaims: string[];
  /** Editorial rationale explaining why the preferred revision is superior */
  rationale: string;
  /** Dataset partition */
  split: DatasetSplit;
  /** Quality metadata */
  metadata: {
    wordCountSource: number;
    wordCountRevision: number;
    genre: WritingGenre;
    readingEaseSource: number;
    readingEaseRevision: number;
    dateCurated: string;
  };
}

export interface FineTuningDatasetManifest {
  datasetId: string;
  version: string;
  description: string;
  curator: string;
  totalSamples: number;
  splitCounts: {
    train: number;
    validation: number;
    test: number;
  };
  genresRepresented: WritingGenre[];
  privacyGuarantee: string;
}
