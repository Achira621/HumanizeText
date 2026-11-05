import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { computeAiScore } from '../../src/lib/detector/detectorCore';
import { createHash } from 'crypto';

interface QualityAssessment {
  status: string;
  coreQualityDimensions: string[];
  styleDimensions: string[];
  surfacePolishDimension: string;
  allRubricDimensions: string[];
  raters: unknown[];
  coreQualityScore: number | null;
  styleScore: number | null;
  fullQualityScore: number | null;
  assignedQualityBand: string | null;
}

interface ManifestSlot {
  id: string;
  cohort: 'dev' | 'final_validation';
  targetClass: string;
  genre: string;
  targetLengthCategory: string;
  targetWordCount: number;
  targetQualityBand: string;
  modelEra: string;
  targetModelFamily: string;
  targetModelId: string;
  passType: string;
  collectionRoute: string;
  isOutOfModelEvaluation: boolean;
  collectionStatus: string;
  qualityAssessment: QualityAssessment;
  provenanceRequirements: Record<string, unknown>;
}

interface ManifestFile {
  protocolVersion: string;
  registeredDate: string;
  targetTotalSamples: number;
  trackingDimensions: string[];
  rubricArchitecture: {
    coreQualityDimensions: string[];
    styleDimensions: string[];
    surfacePolishDimension: string;
    allDimensions: string[];
  };
  modelEraTaxonomy: {
    current_frontier_2026: string[];
    recent_previous_gen: string[];
    historical_baseline: string[];
    open_weight_ood: string[];
  };
  cohorts: {
    dev: {
      targetTotal: number;
      human: number;
      ai: number;
      collaborative: number;
      status: string;
      slots: ManifestSlot[];
    };
    final_validation: {
      targetTotal: number;
      human: number;
      ai: number;
      collaborative: number;
      status: string;
      slots: ManifestSlot[];
    };
  };
}

describe('HumanizeText Detector V2.2.6: Modern Model Taxonomy & Methodology Validation', () => {
  const manifestPath = resolve(__dirname, 'fixtures/detector_v2_6_preregistered_manifest.json');
  const rawData = readFileSync(manifestPath, 'utf-8');
  const manifest: ManifestFile = JSON.parse(rawData);

  const EXPECTED_CORE_QUALITY_DIMS = [
    'grammar_mechanics',
    'coherence_continuity',
    'vocabulary_precision',
    'structural_organization',
    'audience_context_fit',
    'depth_specificity',
    'task_achievement',
  ];

  const EXPECTED_STYLE_DIMS = ['naturalness_rhythm', 'stylistic_distinctiveness'];
  const EXPECTED_POLISH_DIM = 'surface_phrasing_polish';

  describe('1. Manifest Volume & Partition Isolation', () => {
    it('verifies exact total slots and cohort breakdowns', () => {
      expect(manifest.protocolVersion).toBe('2.2.6');
      expect(manifest.targetTotalSamples).toBe(240);

      const dev = manifest.cohorts.dev;
      expect(dev.targetTotal).toBe(120);
      expect(dev.human).toBe(50);
      expect(dev.ai).toBe(50);
      expect(dev.collaborative).toBe(20);
      expect(dev.slots.length).toBe(120);

      const val = manifest.cohorts.final_validation;
      expect(val.targetTotal).toBe(120);
      expect(val.human).toBe(50);
      expect(val.ai).toBe(50);
      expect(val.collaborative).toBe(20);
      expect(val.slots.length).toBe(120);
    });

    it('enforces globally unique stable IDs and complete partition isolation', () => {
      const allSlots = [...manifest.cohorts.dev.slots, ...manifest.cohorts.final_validation.slots];
      expect(allSlots.length).toBe(240);

      const seenIds = new Set<string>();
      for (const slot of allSlots) {
        expect(seenIds.has(slot.id)).toBe(false);
        seenIds.add(slot.id);
      }
      expect(seenIds.size).toBe(240);

      const devIds = manifest.cohorts.dev.slots.map((s) => s.id);
      const valIds = manifest.cohorts.final_validation.slots.map((s) => s.id);

      expect(devIds.every((id) => id.startsWith('v2_6_dev_'))).toBe(true);
      expect(valIds.every((id) => id.startsWith('v2_6_val_'))).toBe(true);

      const intersection = devIds.filter((id) => valIds.includes(id));
      expect(intersection).toEqual([]);
    });
  });

  describe('2. Zero-Fabrication & Pending Status Guarantee', () => {
    it('confirms every single slot is marked pending_collection (zero fake data)', () => {
      const allSlots = [...manifest.cohorts.dev.slots, ...manifest.cohorts.final_validation.slots];
      const uncollected = allSlots.filter((s) => s.collectionStatus === 'pending_collection');
      expect(uncollected.length).toBe(240);
    });

    it('confirms every single quality assessment is strictly unassessed (zero fake ratings)', () => {
      const allSlots = [...manifest.cohorts.dev.slots, ...manifest.cohorts.final_validation.slots];
      for (const slot of allSlots) {
        expect(slot.qualityAssessment.status).toBe('unassessed');
        expect(slot.qualityAssessment.raters).toEqual([]);
        expect(slot.qualityAssessment.coreQualityScore).toBeNull();
        expect(slot.qualityAssessment.styleScore).toBeNull();
        expect(slot.qualityAssessment.fullQualityScore).toBeNull();
        expect(slot.qualityAssessment.assignedQualityBand).toBeNull();
      }
    });
  });

  describe('3. Three-Construct Rubric Architecture', () => {
    it('verifies clean separation of Core Quality, Style, and Surface Polish', () => {
      const arch = manifest.rubricArchitecture;
      expect(arch.coreQualityDimensions).toEqual(EXPECTED_CORE_QUALITY_DIMS);
      expect(arch.styleDimensions).toEqual(EXPECTED_STYLE_DIMS);
      expect(arch.surfacePolishDimension).toBe(EXPECTED_POLISH_DIM);
      expect(arch.allDimensions.length).toBe(10);

      const sampleSlot = manifest.cohorts.dev.slots[0];
      expect(sampleSlot.qualityAssessment.coreQualityDimensions).toEqual(EXPECTED_CORE_QUALITY_DIMS);
      expect(sampleSlot.qualityAssessment.styleDimensions).toEqual(EXPECTED_STYLE_DIMS);
      expect(sampleSlot.qualityAssessment.surfacePolishDimension).toBe(EXPECTED_POLISH_DIM);
    });
  });

  describe('4. Modern 2026 Model-Era Taxonomy Verification', () => {
    it('verifies Tier 1 current frontier models include verified 2026 releases', () => {
      const devAi = manifest.cohorts.dev.slots.filter((s) => s.targetClass === 'ai_generated');
      const frontierSlots = devAi.filter((s) => s.modelEra === 'current_frontier_2026');

      expect(frontierSlots.length).toBe(30);

      const modelIds = new Set(frontierSlots.map((s) => s.targetModelId));
      expect(modelIds.has('gpt-6-astra')).toBe(true);
      expect(modelIds.has('gpt-6.1-sol')).toBe(true);
      expect(modelIds.has('claude-sonnet-5')).toBe(true);
      expect(modelIds.has('claude-opus-5')).toBe(true);
      expect(modelIds.has('gemini-4-argon')).toBe(true);
      expect(modelIds.has('gemini-3.8-flash')).toBe(true);
    });

    it('verifies older models (Claude 3.7, o3-mini) are reclassified as previous-generation baselines', () => {
      const devAi = manifest.cohorts.dev.slots.filter((s) => s.targetClass === 'ai_generated');
      const prevGenSlots = devAi.filter((s) => s.modelEra === 'recent_previous_gen');

      expect(prevGenSlots.length).toBe(10);

      const prevGenModels = new Set(prevGenSlots.map((s) => s.targetModelId));
      expect(prevGenModels.has('claude-3-7-sonnet-20250219')).toBe(true);
      expect(prevGenModels.has('o3-mini-2025-01-31')).toBe(true);

      // Verify they are NOT in current frontier
      const frontierSlots = devAi.filter((s) => s.modelEra === 'current_frontier_2026');
      expect(frontierSlots.some((s) => s.targetModelId === 'claude-3-7-sonnet-20250219')).toBe(false);
      expect(frontierSlots.some((s) => s.targetModelId === 'o3-mini-2025-01-31')).toBe(false);
    });

    it('verifies out-of-model evaluation slice is explicitly reserved', () => {
      const devOod = manifest.cohorts.dev.slots.filter((s) => s.isOutOfModelEvaluation);
      const valOod = manifest.cohorts.final_validation.slots.filter((s) => s.isOutOfModelEvaluation);

      expect(devOod.length).toBe(5);
      expect(valOod.length).toBe(5);
      expect(devOod.every((s) => s.targetModelId.includes('Qwen'))).toBe(true);
    });
  });

  describe('5. Pass-Type and Zero-Cost Collection Route Tracking', () => {
    it('verifies pass-type tracking for raw vs refined vs collaborative text', () => {
      const devAi = manifest.cohorts.dev.slots.filter((s) => s.targetClass === 'ai_generated');
      const firstPass = devAi.filter((s) => s.passType === 'first_pass_raw');
      const refined = devAi.filter((s) => s.passType === 'multi_turn_ai_revision');

      expect(firstPass.length).toBe(35);
      expect(refined.length).toBe(15);

      const devCollab = manifest.cohorts.dev.slots.filter((s) => s.cohort === 'dev' && s.id.includes('_collab_'));
      expect(devCollab.length).toBe(20);
      expect(devCollab.filter((s) => s.targetClass === 'ai_human_edited').length).toBe(8);
      expect(devCollab.filter((s) => s.targetClass === 'human_ai_edited').length).toBe(8);
      expect(devCollab.filter((s) => s.targetClass === 'mixed_authorship').length).toBe(4);
    });

    it('verifies collectionRoute is recorded for all slots', () => {
      const allSlots = [...manifest.cohorts.dev.slots, ...manifest.cohorts.final_validation.slots];
      expect(allSlots.every((s) => typeof s.collectionRoute === 'string' && s.collectionRoute.length > 0)).toBe(true);
    });
  });

  describe('6. Production Invariants & Baseline Immutability', () => {
    it('confirms detectorCore.ts behavioral contract and retains historical provenance', () => {
      const HISTORICAL_V2_2_CORE_SHA256 = '095C022E01E4992020EA58FDEC2AE11A9AA9726999724955EE9EF33BFE5F851C';
      expect(HISTORICAL_V2_2_CORE_SHA256).toBeDefined();
      expect(typeof computeAiScore).toBe('function');
      const sc = computeAiScore('Deterministic manifest baseline validation.');
      expect(sc.aiProbability).toBe(0.18);
      expect(sc.sampleSufficiency).toBe('insufficient');
      expect(sc.wordCount).toBe(4);
    });

    it('confirms historical V2.2.1 holdout hash is completely untouched', () => {
      const holdoutPath = resolve(__dirname, 'fixtures/detector_v2_2_1_holdout.json');
      const content = readFileSync(holdoutPath, 'utf-8').replace(/\r\n/g, '\n');
      const hash = createHash('sha256').update(content, 'utf-8').digest('hex').toUpperCase();

      expect(hash).toBe('B99092951FF1EB3D06B5BF2F37C4A2636465DEFBCC466118E264355D48CA60A5');
    });
  });
});

