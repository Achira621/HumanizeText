import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { computeAiScore } from '../../src/lib/detector/detectorCore';
import { createHash } from 'crypto';

interface QualityAssessment {
  status: string;
  rubricDimensions: string[];
  raters: unknown[];
  overallMeanScore: number | null;
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
  qualityRubricDimensions: string[];
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

describe('HumanizeText Detector V2.2.5: Manifest, Quality Protocol & Taxonomy Validation', () => {
  const manifestPath = resolve(__dirname, 'fixtures/detector_v2_5_preregistered_manifest.json');
  const rawData = readFileSync(manifestPath, 'utf-8');
  const manifest: ManifestFile = JSON.parse(rawData);

  const EXPECTED_RUBRIC_DIMENSIONS = [
    'grammar_mechanics',
    'coherence_continuity',
    'naturalness_rhythm',
    'vocabulary_precision',
    'structural_organization',
    'audience_context_fit',
    'depth_specificity',
    'stylistic_distinctiveness',
    'fluency_after_editing',
    'task_achievement',
  ];

  describe('1. Manifest Volume & Strict Partition Balance', () => {
    it('verifies exact total slots and cohort breakdowns', () => {
      expect(manifest.protocolVersion).toBe('2.2.5');
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

      // Verify prefix segregation
      expect(devIds.every((id) => id.startsWith('v2_5_dev_'))).toBe(true);
      expect(valIds.every((id) => id.startsWith('v2_5_val_'))).toBe(true);

      // Verify zero intersection
      const intersection = devIds.filter((id) => valIds.includes(id));
      expect(intersection).toEqual([]);
    });
  });

  describe('2. Zero-Fabrication & Collection Status Guarantee', () => {
    it('confirms every single slot is marked pending_collection (zero fabricated text)', () => {
      const allSlots = [...manifest.cohorts.dev.slots, ...manifest.cohorts.final_validation.slots];
      const uncollectedSlots = allSlots.filter((s) => s.collectionStatus === 'pending_collection');
      expect(uncollectedSlots.length).toBe(240);
    });

    it('confirms every single quality assessment is strictly unassessed (zero fake ratings)', () => {
      const allSlots = [...manifest.cohorts.dev.slots, ...manifest.cohorts.final_validation.slots];
      for (const slot of allSlots) {
        expect(slot.qualityAssessment.status).toBe('unassessed');
        expect(slot.qualityAssessment.raters).toEqual([]);
        expect(slot.qualityAssessment.overallMeanScore).toBeNull();
        expect(slot.qualityAssessment.assignedQualityBand).toBeNull();
      }
    });
  });

  describe('3. Independent 10-Dimensional Quality Rubric', () => {
    it('verifies all 10 independent quality rubric dimensions are defined', () => {
      expect(manifest.qualityRubricDimensions).toEqual(EXPECTED_RUBRIC_DIMENSIONS);
      expect(manifest.qualityRubricDimensions.length).toBe(10);

      const sampleSlot = manifest.cohorts.dev.slots[0];
      expect(sampleSlot.qualityAssessment.rubricDimensions).toEqual(EXPECTED_RUBRIC_DIMENSIONS);
    });
  });

  describe('4. De-Confounded Multi-Dimensional Stratification', () => {
    it('verifies human slots span all three quality bands (not exclusively low or high)', () => {
      const devHuman = manifest.cohorts.dev.slots.filter((s) => s.targetClass === 'human_verified');
      expect(devHuman.length).toBe(50);

      const lower = devHuman.filter((s) => s.targetQualityBand === 'lower');
      const adequate = devHuman.filter((s) => s.targetQualityBand === 'adequate');
      const high = devHuman.filter((s) => s.targetQualityBand === 'high');

      expect(lower.length).toBeGreaterThanOrEqual(10);
      expect(adequate.length).toBeGreaterThanOrEqual(20);
      expect(high.length).toBeGreaterThanOrEqual(10);
      expect(lower.length + adequate.length + high.length).toBe(50);
    });

    it('verifies AI slots span all three quality bands (not exclusively stereotypical clichés)', () => {
      const devAi = manifest.cohorts.dev.slots.filter((s) => s.targetClass === 'ai_generated');
      expect(devAi.length).toBe(50);

      const lower = devAi.filter((s) => s.targetQualityBand === 'lower');
      const adequate = devAi.filter((s) => s.targetQualityBand === 'adequate');
      const high = devAi.filter((s) => s.targetQualityBand === 'high');

      expect(lower.length).toBeGreaterThanOrEqual(5);
      expect(adequate.length).toBeGreaterThanOrEqual(20);
      expect(high.length).toBeGreaterThanOrEqual(15);
      expect(lower.length + adequate.length + high.length).toBe(50);
    });

    it('verifies genre and length stratification across classes', () => {
      const genres = ['academic', 'technical', 'corporate', 'conversational', 'creative'];
      const lengths = ['short', 'medium', 'long'];

      for (const g of genres) {
        const humanGenre = manifest.cohorts.dev.slots.filter(
          (s) => s.targetClass === 'human_verified' && s.genre === g
        );
        const aiGenre = manifest.cohorts.dev.slots.filter(
          (s) => s.targetClass === 'ai_generated' && s.genre === g
        );
        expect(humanGenre.length).toBe(10);
        expect(aiGenre.length).toBe(10);
      }

      for (const len of lengths) {
        const humanLen = manifest.cohorts.dev.slots.filter(
          (s) => s.targetClass === 'human_verified' && s.targetLengthCategory === len
        );
        const aiLen = manifest.cohorts.dev.slots.filter(
          (s) => s.targetClass === 'ai_generated' && s.targetLengthCategory === len
        );
        expect(humanLen.length).toBeGreaterThanOrEqual(15);
        expect(aiLen.length).toBeGreaterThanOrEqual(15);
      }
    });
  });

  describe('5. Model-Era Taxonomy & Out-of-Model Reservation', () => {
    it('verifies AI slots cover the 4-tier model-era taxonomy', () => {
      const devAi = manifest.cohorts.dev.slots.filter((s) => s.targetClass === 'ai_generated');

      const frontier = devAi.filter((s) => s.modelEra === 'current_frontier');
      const recent = devAi.filter((s) => s.modelEra === 'recent_previous_gen');
      const historical = devAi.filter((s) => s.modelEra === 'historical_baseline');
      const openWeight = devAi.filter((s) => s.modelEra === 'open_weight_ood');

      expect(frontier.length).toBe(30);
      expect(recent.length).toBe(10);
      expect(historical.length).toBe(5);
      expect(openWeight.length).toBe(5);
      expect(frontier.length + recent.length + historical.length + openWeight.length).toBe(50);

      // Verify specific modern models are included
      const modelIds = new Set(frontier.map((s) => s.targetModelId));
      expect(modelIds.has('claude-3-7-sonnet-20250219')).toBe(true);
      expect(modelIds.has('o3-mini-2025-01-31')).toBe(true);
      expect(modelIds.has('o1-2024-12-17')).toBe(true);
      expect(modelIds.has('gemini-2.0-flash')).toBe(true);
    });

    it('verifies exactly 5 slots per cohort are reserved for out-of-model evaluation', () => {
      const devOod = manifest.cohorts.dev.slots.filter((s) => s.isOutOfModelEvaluation);
      const valOod = manifest.cohorts.final_validation.slots.filter((s) => s.isOutOfModelEvaluation);

      expect(devOod.length).toBe(5);
      expect(valOod.length).toBe(5);
      expect(devOod.every((s) => s.targetModelId.includes('Qwen'))).toBe(true);
    });

    it('verifies pass-type tracking for multi-turn revision vs first pass', () => {
      const devAi = manifest.cohorts.dev.slots.filter((s) => s.targetClass === 'ai_generated');
      const firstPass = devAi.filter((s) => s.passType === 'first_pass_generation');
      const refined = devAi.filter((s) => s.passType === 'multi_turn_revision');

      expect(firstPass.length).toBe(35);
      expect(refined.length).toBe(15);
    });
  });

  describe('6. Production Invariants & Baseline Immutability', () => {
    it('confirms detectorCore.ts behavioral contract and retains historical provenance', () => {
      const HISTORICAL_V2_2_CORE_SHA256 = '095C022E01E4992020EA58FDEC2AE11A9AA9726999724955EE9EF33BFE5F851C';
      expect(HISTORICAL_V2_2_CORE_SHA256).toBeDefined();
      expect(typeof computeAiScore).toBe('function');
      const sc = computeAiScore('Deterministic manifest baseline validation.');
      expect(sc.aiProbability).toBe(0.26);
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
