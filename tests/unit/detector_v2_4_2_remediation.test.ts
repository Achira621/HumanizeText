/**
 * ============================================================================
 * HUMANIZETEXT DETECTOR V2.4.2: REMEDIATION & EMBARGO INTEGRITY TEST SUITE
 * Tests the historical holdout embargo, fail-closed embargo assertions,
 * duplicate lineage resolution, V2.2 archive crosswalk, and external acquisition
 * readiness gates.
 * ============================================================================
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  EMBARGO_MANIFEST,
  assertNoEmbargoedData,
  findEmbargoEntry,
} from '../../src/lib/detector/v2_4_2/embargoGuard';

describe('HUMANIZETEXT V2.4.2: Remediation & Embargo Integrity Gates', () => {
  const dataDir = resolve(process.cwd(), 'data/v2_4_2');
  const holdoutFixturePath = resolve(process.cwd(), 'tests/eval/fixtures/detector_v2_2_1_holdout.json');

  // --------------------------------------------------------------------------
  // 1. EMBARGO MANIFEST & COVERAGE
  // --------------------------------------------------------------------------
  describe('Historical Holdout Embargo Manifest', () => {
    it('verifies that the embargo manifest contains exactly 120 records', () => {
      expect(EMBARGO_MANIFEST.totalEmbargoedRecords).toBe(120);
      expect(EMBARGO_MANIFEST.embargoedRecords.length).toBe(120);
    });

    it('confirms every record in detector_v2_2_1_holdout.json is in the embargo manifest', () => {
      const rawHoldout: Array<{ id: string; sha256?: string; text: string }> = JSON.parse(
        readFileSync(holdoutFixturePath, 'utf8')
      );

      for (const item of rawHoldout) {
        const found = findEmbargoEntry(item.sha256 || '', undefined, item.id);
        expect(found).toBeDefined();
        expect(found?.reasonForExclusion).toContain('Permanent Embargo');
      }
    });

    it('fails closed when an embargoed sample is submitted to assertNoEmbargoedData', () => {
      const badBatch = [
        { sampleId: 'clean_001', sha256: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' },
        { sampleId: 'holdout_h_acad_01', sha256: 'f14d32b4e25e02f6ddb181ce2212ccdd718244b616566206ba0ffe105d2d7660' },
      ];

      expect(() => assertNoEmbargoedData(badBatch)).toThrow(/\[EMBARGO VIOLATION\]/);
    });
  });

  // --------------------------------------------------------------------------
  // 2. REMEDIATED DATASET REGISTRY
  // --------------------------------------------------------------------------
  describe('Remediated Dataset Registry Integrity', () => {
    const remediatedRegistryPath = resolve(dataDir, 'dataset_registry_remediated.jsonl');

    it('verifies remediated registry exists and contains 180 records (0 holdout records)', () => {
      expect(existsSync(remediatedRegistryPath)).toBe(true);
      const lines = readFileSync(remediatedRegistryPath, 'utf8')
        .split('\n')
        .filter((l) => l.trim().length > 0)
        .map((l) => JSON.parse(l));

      expect(lines.length).toBe(180);

      // Verify ZERO embargoed records in remediated registry
      expect(() => assertNoEmbargoedData(lines)).not.toThrow();

      const holdoutSources = lines.filter((l) => l.sourceDataset === 'detector_v2_2_1_holdout');
      expect(holdoutSources.length).toBe(0);
    });
  });

  // --------------------------------------------------------------------------
  // 3. DUPLICATE LINEAGE RESOLUTION
  // --------------------------------------------------------------------------
  describe('Duplicate Lineage Manifest', () => {
    const dupPath = resolve(dataDir, 'duplicate_lineage_manifest.json');

    it('reconciles exactly 18 verbatim duplicate synonym-swap records in seeds', () => {
      expect(existsSync(dupPath)).toBe(true);
      const dupManifest = JSON.parse(readFileSync(dupPath, 'utf8'));

      expect(dupManifest.totalSeedRecordsAnalyzed).toBe(80);
      expect(dupManifest.verbatimDuplicateCount).toBe(18);
      expect(dupManifest.uniqueEditedCount).toBe(2);
      expect(dupManifest.canonicalBaseCount).toBe(60);

      // Verify sample mapping for a known duplicate
      const remoteWorkEdit = dupManifest.lineageEntries.find((e: any) => e.sampleId === 'seeds_remote_work_a_edit');
      expect(remoteWorkEdit).toBeDefined();
      expect(remoteWorkEdit.isDuplicate).toBe(true);
      expect(remoteWorkEdit.canonicalSampleId).toBe('seeds_remote_work_a');
    });
  });

  // --------------------------------------------------------------------------
  // 4. V2.2 ARCHIVE CROSSWALK
  // --------------------------------------------------------------------------
  describe('V2.2 Archive Crosswalk', () => {
    const crosswalkPath = resolve(dataDir, 'v2_2_archive_crosswalk.json');

    it('resolves the 90-record archive vs 180 synthetic expansion discrepancy', () => {
      expect(existsSync(crosswalkPath)).toBe(true);
      const crosswalk = JSON.parse(readFileSync(crosswalkPath, 'utf8'));

      expect(crosswalk.totalArchiveRecords).toBe(90);
      expect(crosswalk.distinctTexts).toBe(90);

      const baseDev01 = crosswalk.records.find((r: any) => r.benchmarkArchiveSampleId === 'dev_h_acad_01');
      expect(baseDev01).toBeDefined();
      expect(baseDev01.v23ComparativeUsage).toContain('Used as base template');
    });
  });

  // --------------------------------------------------------------------------
  // 5. EXTERNAL DATASET ACQUISITION & LICENSING MATRIX
  // --------------------------------------------------------------------------
  describe('External Dataset Acquisition & Licensing Gate', () => {
    const acqPath = resolve(dataDir, 'external_dataset_acquisition_register.json');
    const licPath = resolve(dataDir, 'licensing_approval_matrix.json');

    it('approves RAID benchmark and Project Gutenberg; quarantines AITDNA', () => {
      expect(existsSync(acqPath)).toBe(true);
      expect(existsSync(licPath)).toBe(true);

      const acq = JSON.parse(readFileSync(acqPath, 'utf8'));
      const lic = JSON.parse(readFileSync(licPath, 'utf8'));

      const raid = acq.candidateCorpora.find((c: any) => c.candidateId === 'CORPUS_RAID_BENCHMARK');
      expect(raid.recommendationStatus).toBe('APPROVED_FOR_ACQUISITION');
      expect(raid.textLicense).toBe('CC-BY-4.0');

      const aitdna = acq.candidateCorpora.find((c: any) => c.candidateId === 'CORPUS_AITDNA_UKPLAB');
      expect(aitdna.recommendationStatus).toBe('REJECTED_AND_QUARANTINED');

      expect(lic.approvedSources.some((s: any) => s.candidateId === 'CORPUS_RAID_BENCHMARK')).toBe(true);
      expect(lic.quarantinedSources.some((s: any) => s.candidateId === 'CORPUS_AITDNA_UKPLAB')).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // 6. READINESS GATE AND DATA SUFFICIENCY
  // --------------------------------------------------------------------------
  describe('Rebuild Readiness Gate', () => {
    const inventoryPath = resolve(dataDir, 'source_dataset_inventory.json');

    it('confirms the 200-sample target is not yet met and blocks fresh training', () => {
      expect(existsSync(inventoryPath)).toBe(true);
      const inventory = JSON.parse(readFileSync(inventoryPath, 'utf8'));

      expect(inventory.preregistrationDeficit.status).toBe('INSUFFICIENT_DATA_FOR_FRESH_TRAINING');
      expect(inventory.preregistrationDeficit.humanAvailable).toBe(50);
      expect(inventory.preregistrationDeficit.humanDeficit).toBe(150);
      expect(inventory.preregistrationDeficit.aiAvailable).toBe(62);
      expect(inventory.preregistrationDeficit.aiDeficit).toBe(138);
    });
  });
});
