/**
 * ============================================================================
 * HUMANIZETEXT DETECTOR V2.4.3: EXTERNAL CORPUS ACQUISITION UNIT TESTS
 * Verifies:
 *   1. Schema validity for all acquired records via validateAcquiredRecord()
 *   2. Source-qualified authorship tiers and evidence retention
 *   3. Licensing compliance (RAID research quarantine, Gutenberg/EDGAR approvals)
 *   4. Fail-closed historical holdout embargo integrity (0 collisions)
 *   5. Numerical target satisfaction (>=200 human, >=200 AI, separate collaborative)
 *   6. Multi-genre and length distribution diversity
 *   7. Training readiness gate enforcement (zero model training in V2.4.3)
 * ============================================================================
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  validateAcquiredRecord,
  AcquiredRegistryRecord,
} from '../../src/lib/detector/v2_4_3/acquiredRegistrySchema';
import { assertNoEmbargoedData } from '../../src/lib/detector/v2_4_2/embargoGuard';

const ROOT_DIR = resolve(__dirname, '../..');
const DATA_DIR = resolve(ROOT_DIR, 'data/v2_4_3');

function loadJsonLines(path: string): AcquiredRegistryRecord[] {
  const content = readFileSync(path, 'utf8');
  return content
    .split('\n')
    .filter((l) => l.trim().length > 0)
    .map((l) => JSON.parse(l) as AcquiredRegistryRecord);
}

function loadJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

describe('Detector V2.4.3 External Corpus Acquisition Audit', () => {
  const registryPath = resolve(DATA_DIR, 'acquired_dataset_registry.jsonl');
  expect(existsSync(registryPath), 'Registry file must exist').toBe(true);

  const records = loadJsonLines(registryPath);

  it('1. should validate all acquired records against strict schema and SHA-256 integrity', () => {
    expect(records.length).toBeGreaterThanOrEqual(500);

    for (const rec of records) {
      const res = validateAcquiredRecord(rec);
      if (!res.isValid) {
        throw new Error(`Record ${rec.sampleId} failed schema validation: ${res.errors.join('; ')}`);
      }
      expect(res.isValid).toBe(true);
      expect(rec.wordCount).toBeGreaterThan(0);
      expect(rec.sha256).toMatch(/^[0-9a-f]{64}$/);
    }
  });

  it('2. should enforce source-qualified authorship tiers with documented provenance', () => {
    const validClasses = new Set([
      'verified_human',
      'historical_human_proxy',
      'verified_ai',
      'collaborative',
      'unknown',
      'excluded',
    ]);

    for (const rec of records) {
      expect(validClasses.has(rec.authorClass)).toBe(true);
      expect(rec.authorshipEvidence).toBeTruthy();
      expect(rec.authorshipEvidence.length).toBeGreaterThan(10);

      // Verify SEC EDGAR corporate separation
      if (rec.sourceDataset === 'sec_edgar_10k_item7_mda') {
        expect(rec.authorClass).toBe('historical_human_proxy');
        expect(rec.authorshipEvidence).toContain('SEC Form 10-K');
      }

      // Verify Project Gutenberg metadata
      if (rec.sourceDataset === 'project_gutenberg_us_public_domain') {
        expect(rec.authorClass).toBe('historical_human_proxy');
        expect(rec.authorshipEvidence).toContain('Project Gutenberg eBook');
      }

      // Verify AI generations contain model details
      if (rec.authorClass === 'verified_ai') {
        expect(rec.modelProvider).not.toBe('None');
        expect(rec.modelName).not.toBe('None');
      }
    }
  });

  it('3. should verify licensing approval matrix and RAID research quarantine', () => {
    const matrix = loadJson<{
      manifestVersion: string;
      reviewedSources: Array<{
        sourceName: string;
        intendedUseApproval: string;
        approvedForCommercialTraining: boolean;
        approvedForEvaluationBenchmarks: boolean;
      }>;
    }>(resolve(DATA_DIR, 'licensing_approval_matrix.json'));

    expect(matrix.manifestVersion).toBe('2.4.3');

    // Verify RAID is strictly research only pending review
    const raidSource = matrix.reviewedSources.find((s) => s.sourceName.includes('RAID'));
    expect(raidSource).toBeDefined();
    expect(raidSource?.intendedUseApproval).toBe('RESEARCH_ONLY_PENDING_REVIEW');
    expect(raidSource?.approvedForCommercialTraining).toBe(false);
    expect(raidSource?.approvedForEvaluationBenchmarks).toBe(true);

    // Verify RAID records in registry are flagged RESEARCH_ONLY_PENDING_REVIEW
    const raidRecords = records.filter((r) => r.sourceDataset === 'raid_benchmark_acl2024');
    expect(raidRecords.length).toBe(60);
    for (const r of raidRecords) {
      expect(r.intendedUseApproval).toBe('RESEARCH_ONLY_PENDING_REVIEW');
    }

    // Verify AITDNA is rejected and quarantined
    const aitdna = matrix.reviewedSources.find((s) => s.sourceName.includes('AITDNA'));
    expect(aitdna?.intendedUseApproval).toBe('REJECTED_QUARANTINED');
    expect(aitdna?.approvedForCommercialTraining).toBe(false);

    // Verify Project Gutenberg and SEC EDGAR approvals
    const gutenberg = matrix.reviewedSources.find((s) => s.sourceName.includes('Gutenberg'));
    expect(gutenberg?.approvedForCommercialTraining).toBe(true);
    const edgar = matrix.reviewedSources.find((s) => s.sourceName.includes('SEC EDGAR'));
    expect(edgar?.approvedForCommercialTraining).toBe(true);
  });

  it('4. should enforce fail-closed historical holdout embargo with zero collisions', () => {
    // Collect all candidate texts
    const candidateTexts = records.map((r) => r.text);
    const candidateShas = records.map((r) => r.sha256);

    // Run fail-closed assertion from embargoGuard
    expect(() => {
      assertNoEmbargoedData(candidateTexts, candidateShas);
    }).not.toThrow();

    const embargoReport = loadJson<{
      embargoStatus: string;
      exactSha256Matches: number;
      normalizedSha256Matches: number;
    }>(resolve(DATA_DIR, 'embargo_validation_report.json'));

    expect(embargoReport.embargoStatus).toBe('PASSED_STRICT_EMBARGO');
    expect(embargoReport.exactSha256Matches).toBe(0);
    expect(embargoReport.normalizedSha256Matches).toBe(0);
  });

  it('5. should satisfy minimum preregistration dataset targets (>=200 human, >=200 AI)', () => {
    // Approved for training
    const approvedHuman = records.filter(
      (r) =>
        r.intendedUseApproval === 'APPROVED_PRODUCT_TRAINING' &&
        (r.authorClass === 'verified_human' || r.authorClass === 'historical_human_proxy')
    );
    const approvedAi = records.filter(
      (r) =>
        r.intendedUseApproval === 'APPROVED_PRODUCT_TRAINING' &&
        r.authorClass === 'verified_ai'
    );
    const collaborative = records.filter((r) => r.authorClass === 'collaborative');

    expect(approvedHuman.length).toBeGreaterThanOrEqual(200);
    expect(approvedAi.length).toBeGreaterThanOrEqual(200);
    expect(collaborative.length).toBeGreaterThanOrEqual(50);

    expect(approvedHuman.length).toBe(210);
    expect(approvedAi.length).toBe(212);
    expect(collaborative.length).toBe(50);
  });

  it('6. should confirm balanced multi-genre and length distributions', () => {
    const genres = new Set(['academic', 'technical', 'professional', 'conversational', 'creative', 'explanatory']);
    const observedGenres = new Set(records.map((r) => r.genre));

    for (const g of genres) {
      expect(observedGenres.has(g as any)).toBe(true);
    }

    const diversityReport = loadJson<{
      crossTabulationSummary: {
        humanProxyAndVerified: Record<string, number>;
        verifiedAi: Record<string, number>;
      };
    }>(resolve(DATA_DIR, 'dataset_diversity_report.json'));

    // Verify all genres are represented in both classes
    for (const g of genres) {
      expect(diversityReport.crossTabulationSummary.humanProxyAndVerified[g]).toBeGreaterThan(0);
      expect(diversityReport.crossTabulationSummary.verifiedAi[g]).toBeGreaterThan(0);
    }

    // Verify word length categories
    const lengths = new Set(['short', 'medium', 'long']);
    const observedLengths = new Set(records.map((r) => r.lengthCategory));
    for (const l of lengths) {
      expect(observedLengths.has(l as any)).toBe(true);
    }
  });

  it('7. should enforce training readiness gate and prohibit premature model training', () => {
    const assessment = loadJson<{
      readinessStatus: string;
      trainingGateChecklist: {
        targetHumanPassagesMet: { status: string };
        targetAiPassagesMet: { status: string };
        newTrainingSplitDesignDocumented: { status: string };
      };
    }>(resolve(DATA_DIR, 'training_readiness_assessment.json'));

    expect(assessment.trainingGateChecklist.targetHumanPassagesMet.status).toBe('PASSED');
    expect(assessment.trainingGateChecklist.targetAiPassagesMet.status).toBe('PASSED');
    expect(assessment.trainingGateChecklist.newTrainingSplitDesignDocumented.status).toBe('PENDING_V2_5_PREREGISTRATION');

    // Classification must be COLLECTION_TARGET_REACHED_PROVENANCE_REVIEW_PENDING
    expect(assessment.readinessStatus).toBe('COLLECTION_TARGET_REACHED_PROVENANCE_REVIEW_PENDING');

    // Confirm that in V2.4.3 phase no premature unapproved model was created
    // Note: V2.5.0 legitimately trains the V2.5 candidate, whereas V2.4.3 prevented premature training
    const v2_5_premature_marker = resolve(ROOT_DIR, 'data/v2_4_3/premature_model_artifact.json');
    expect(existsSync(v2_5_premature_marker)).toBe(false);
  });
});

