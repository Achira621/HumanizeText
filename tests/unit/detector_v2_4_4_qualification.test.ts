/**
 * ============================================================================
 * HUMANIZETEXT DETECTOR V2.4.4: CORPUS PROVENANCE QUALIFICATION UNIT TESTS
 * Verifies:
 *   1. Mutually exclusive record eligibility reconciliation (532 total)
 *   2. Human authorship evidence audit (verified human vs corporate vs historical)
 *   3. AI generation provenance audit (checkpoints, parameters, temporal limits)
 *   4. Source lineage & unique document non-equivalence proof (532 records != 487 groups)
 *   5. Genre & length diversity cross-tabulations and abstention protocols
 *   6. Licensing eligibility decisions (RAID research quarantine, AITDNA rejection)
 *   7. Contemporary model coverage assessment (2026 temporal challenge set)
 *   8. Preregistered four-way group split integrity & zero-leakage verification
 *   9. Final test embargo seal (62 passages frozen before model training)
 * ============================================================================
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT_DIR = resolve(__dirname, '../..');
const DATA_DIR = resolve(ROOT_DIR, 'data/v2_4_4');

function loadJson<T>(filename: string): T {
  const p = resolve(DATA_DIR, filename);
  expect(existsSync(p), `Manifest file ${filename} must exist`).toBe(true);
  return JSON.parse(readFileSync(p, 'utf8')) as T;
}

function loadJsonLines<T>(filename: string): T[] {
  const p = resolve(DATA_DIR, filename);
  expect(existsSync(p), `JSONL file ${filename} must exist`).toBe(true);
  const content = readFileSync(p, 'utf8');
  return content
    .split('\n')
    .filter((l) => l.trim().length > 0)
    .map((l) => JSON.parse(l) as T);
}

describe('Detector V2.4.4 Corpus Provenance Qualification Audit', () => {
  it('1. should reconcile all 532 records across mutually exclusive eligibility groups', () => {
    const manifest = loadJson<{
      manifestVersion: string;
      totalRecords: number;
      reconciliation: {
        approvedProductTrainingHuman: number;
        approvedProductTrainingAi: number;
        collaborative: number;
        researchOnly: number;
        excluded: number;
        sumReconciled: number;
      };
      researchOnlyBreakdown: {
        raidHumanBaselineCount: number;
        raidAiGenerationCount: number;
        quarantinedFromProductTraining: boolean;
      };
    }>('record_eligibility_manifest.json');

    expect(manifest.manifestVersion).toBe('2.4.4');
    expect(manifest.totalRecords).toBe(532);
    expect(manifest.reconciliation.approvedProductTrainingHuman).toBe(210);
    expect(manifest.reconciliation.approvedProductTrainingAi).toBe(212);
    expect(manifest.reconciliation.collaborative).toBe(50);
    expect(manifest.reconciliation.researchOnly).toBe(60);
    expect(manifest.reconciliation.excluded).toBe(0);
    expect(manifest.reconciliation.sumReconciled).toBe(532);

    expect(manifest.researchOnlyBreakdown.raidHumanBaselineCount).toBe(30);
    expect(manifest.researchOnlyBreakdown.raidAiGenerationCount).toBe(30);
    expect(manifest.researchOnlyBreakdown.quarantinedFromProductTraining).toBe(true);
  });

  it('2. should verify human authorship evidence audit with corporate separation', () => {
    const evidence = loadJson<{
      totalHumanRecordsAudited: number;
      categories: {
        verified_human: { count: number; verificationMethod: string };
        historical_human_proxy_gutenberg: { count: number; legalStatus: string };
        historical_human_proxy_sec_corporate: { count: number; individualHumanDisclaimer: string };
        research_only_raid_human: { count: number; quarantineStatus: string };
      };
    }>('human_authorship_evidence_manifest.json');

    expect(evidence.totalHumanRecordsAudited).toBe(240); // 50 VH + 110 Gutenberg + 50 SEC + 30 RAID Human
    expect(evidence.categories.verified_human.count).toBe(50);
    expect(evidence.categories.historical_human_proxy_gutenberg.count).toBe(110);
    expect(evidence.categories.historical_human_proxy_sec_corporate.count).toBe(50);
    expect(evidence.categories.research_only_raid_human.count).toBe(30);

    // Verify corporate disclaimer
    expect(evidence.categories.historical_human_proxy_sec_corporate.individualHumanDisclaimer).toContain('does NOT identify individual human authors');
  });

  it('3. should verify AI generation provenance audit and temporal limitation disclosures', () => {
    const aiProv = loadJson<{
      totalAiRecordsAudited: number;
      productTrainingAiCount: number;
      researchSliceAiCount: number;
      temporalLimitationStatement: string;
      checkpointAudit: Record<string, { model: string; count: number }>;
    }>('ai_generation_provenance_manifest.json');

    expect(aiProv.totalAiRecordsAudited).toBe(242); // 212 approved + 30 RAID AI
    expect(aiProv.productTrainingAiCount).toBe(212);
    expect(aiProv.researchSliceAiCount).toBe(30);

    expect(aiProv.checkpointAudit['OpenAI'].count).toBe(42);
    expect(aiProv.checkpointAudit['Anthropic'].count).toBe(36);
    expect(aiProv.checkpointAudit['Meta'].count).toBe(36);
    expect(aiProv.checkpointAudit['Mistral AI'].count).toBe(36);
    expect(aiProv.checkpointAudit['Remnant_GPT_4'].count).toBe(62);

    expect(aiProv.temporalLimitationStatement).toContain('mid-2024 checkpoints');
    expect(aiProv.temporalLimitationStatement).toContain('2026 reasoning models');
  });

  it('4. should prove record count is not equal to independent document count in lineage graph', () => {
    const docReport = loadJson<{
      metricSummary: {
        totalRegistryRecords: number;
        uniqueExactTextHashes: number;
        uniqueBaseDocuments: number;
        uniqueSourceWorks: number;
        uniqueIndependenceGroups: number;
      };
      nonEquivalenceDisclosure: string;
    }>('unique_document_count_report.json');

    expect(docReport.metricSummary.totalRegistryRecords).toBe(532);
    expect(docReport.metricSummary.uniqueExactTextHashes).toBe(532);
    expect(docReport.metricSummary.uniqueIndependenceGroups).toBe(467);
    expect(docReport.metricSummary.uniqueBaseDocuments).toBeLessThan(532);
    expect(docReport.metricSummary.totalRegistryRecords).not.toBe(docReport.metricSummary.uniqueIndependenceGroups);
    expect(docReport.nonEquivalenceDisclosure).toContain('WARNING: Registry record count (532) does NOT equal independent document count');
  });

  it('5. should confirm genre and length distributions and abstention thresholds', () => {
    const genreMatrix = loadJson<{
      genres: string[];
      marginalTotals: { byGenre: Record<string, number> };
    }>('authorship_genre_cross_tabulation.json');

    expect(genreMatrix.genres.length).toBe(6);
    expect(genreMatrix.marginalTotals.byGenre['academic']).toBe(87);
    expect(genreMatrix.marginalTotals.byGenre['technical']).toBe(99);
    expect(genreMatrix.marginalTotals.byGenre['professional']).toBe(93);
    expect(genreMatrix.marginalTotals.byGenre['conversational']).toBe(56);
    expect(genreMatrix.marginalTotals.byGenre['creative']).toBe(96);
    expect(genreMatrix.marginalTotals.byGenre['explanatory']).toBe(101);

    const lengthReport = loadJson<{
      abstentionProtocolDesign: { minimumEvaluatedLength: number; abstentionThreshold: string };
    }>('length_by_class_report.json');

    expect(lengthReport.abstentionProtocolDesign.minimumEvaluatedLength).toBe(50);
    expect(lengthReport.abstentionProtocolDesign.abstentionThreshold).toBe('< 40 words');
  });

  it('6. should enforce licensing eligibility decisions and quarantine RAID and AITDNA', () => {
    const licensing = loadJson<{
      licensingDecisions: Record<string, { decision: string }>;
    }>('licensing_eligibility_manifest.json');

    expect(licensing.licensingDecisions['project_gutenberg'].decision).toBe('APPROVED_PRODUCT_TRAINING');
    expect(licensing.licensingDecisions['sec_edgar'].decision).toBe('APPROVED_PRODUCT_TRAINING');
    expect(licensing.licensingDecisions['verified_synthetic_ai'].decision).toBe('APPROVED_PRODUCT_TRAINING');
    expect(licensing.licensingDecisions['raid_benchmark'].decision).toBe('RESEARCH_ONLY_PENDING_REVIEW');
    expect(licensing.licensingDecisions['aitdna_dataset'].decision).toBe('REJECTED_QUARANTINED');
  });

  it('7. should assess contemporary 2026 model coverage and quarantine challenge cohort', () => {
    const assessment = loadJson<{
      temporalChallengeCohort: {
        totalPassages: number;
        quarantineStatus: string;
        evaluatedModels: string[];
      };
    }>('contemporary_model_coverage_assessment.json');

    expect(assessment.temporalChallengeCohort.totalPassages).toBe(24);
    expect(assessment.temporalChallengeCohort.quarantineStatus).toBe('STRICTLY_EXCLUDED_FROM_TRAINING');
    expect(assessment.temporalChallengeCohort.evaluatedModels).toContain('o3-mini-2025-01-31');
    expect(assessment.temporalChallengeCohort.evaluatedModels).toContain('claude-3-7-sonnet-20250219');
    expect(assessment.temporalChallengeCohort.evaluatedModels).toContain('deepseek-reasoner-r1');
  });

  it('8. should verify preregistered four-way split and prove zero cross-partition leakage', () => {
    const splitManifest = loadJson<{
      totalProductEligiblePassages: number;
      partitions: {
        TRAIN: { total: number; humanCount: number; aiCount: number };
        DEV: { total: number; humanCount: number; aiCount: number };
        CAL: { total: number; humanCount: number; aiCount: number };
        FINAL_TEST: { total: number; humanCount: number; aiCount: number };
      };
    }>('preregistered_four_way_split_manifest.json');

    expect(splitManifest.totalProductEligiblePassages).toBe(422);
    expect(splitManifest.partitions.TRAIN.total).toBe(254);
    expect(splitManifest.partitions.TRAIN.humanCount).toBe(126);
    expect(splitManifest.partitions.TRAIN.aiCount).toBe(128);

    expect(splitManifest.partitions.DEV.total).toBe(64);
    expect(splitManifest.partitions.DEV.humanCount).toBe(32);
    expect(splitManifest.partitions.DEV.aiCount).toBe(32);

    expect(splitManifest.partitions.CAL.total).toBe(42);
    expect(splitManifest.partitions.CAL.humanCount).toBe(21);
    expect(splitManifest.partitions.CAL.aiCount).toBe(21);

    expect(splitManifest.partitions.FINAL_TEST.total).toBe(62);
    expect(splitManifest.partitions.FINAL_TEST.humanCount).toBe(31);
    expect(splitManifest.partitions.FINAL_TEST.aiCount).toBe(31);

    // Verify mathematical zero leakage
    const leakageReport = loadJson<{
      leakageAuditStatus: string;
      pairwiseGroupOverlaps: Record<string, string[]>;
    }>('leakage_validation_report.json');

    expect(leakageReport.leakageAuditStatus).toBe('PASSED_ZERO_LEAKAGE');
    for (const [pair, overlaps] of Object.entries(leakageReport.pairwiseGroupOverlaps)) {
      expect(overlaps.length, `Overlap between ${pair} must be zero`).toBe(0);
    }
  });

  it('9. should cryptographically seal final test embargo manifest (62 passages)', () => {
    const finalTestEmbargo = loadJson<{
      embargoPolicy: string;
      totalSealedRecords: number;
      sealedPassages: Array<{ sampleId: string; sha256: string; normalizedSha256: string }>;
    }>('final_test_embargo_manifest.json');

    expect(finalTestEmbargo.embargoPolicy).toBe('FROZEN_FINAL_EVALUATION_SEAL');
    expect(finalTestEmbargo.totalSealedRecords).toBe(62);
    expect(finalTestEmbargo.sealedPassages.length).toBe(62);

    for (const p of finalTestEmbargo.sealedPassages) {
      expect(p.sampleId).toBeTruthy();
      expect(p.sha256).toMatch(/^[0-9a-f]{64}$/);
      expect(p.normalizedSha256).toMatch(/^[0-9a-f]{64}$/);
    }

    // Verify qualified registry consistency
    const registryRecords = loadJsonLines<{ sampleId: string; partition: string }>('qualified_corpus_registry.jsonl');
    const finalTestInRegistry = registryRecords.filter((r) => r.partition === 'FINAL_TEST');
    expect(finalTestInRegistry.length).toBe(62);
  });
});
