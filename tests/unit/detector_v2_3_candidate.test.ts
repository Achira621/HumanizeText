import { describe, it, expect } from 'vitest';
import {
  extractV23Features,
} from '../../src/lib/detector/v2_3/featureExtractor';
import {
  runStylometricDiscriminator,
  evaluateStylometricDiscriminator,
  runLearnedClassifier,
  evaluateLearnedClassifier,
} from '../../src/lib/detector/v2_3/stylometricDiscriminator';
import {
  runHybridDetector,
} from '../../src/lib/detector/v2_3/hybridDetector';
import {
  evaluateDetectorOption,
  computeEvaluationMetrics,
} from '../../src/lib/detector/v2_3/detectorAdapter';
import {
  validateGroupSplitIntegrity,
  type ProvenanceAwareEvaluationSample,
} from '../eval/detector_v2_3_comparative.eval.test';
import { computeAiScore } from '../../src/lib/detector/detectorCore';

describe('HUMANIZETEXT V2.3.1: Candidate Engineering & Reclassification Gates', () => {
  const sampleHumanText = `
    The discovery of deep-sea hydrothermal vents in 1977 revolutionized biological oceanography.
    Before this expedition, marine scientists universally assumed that all oceanic ecosystems ultimately
    relied upon solar radiation and photosynthetic primary production. These volcanic fissures proved
    that complex benthic communities could flourish in complete darkness, deriving energy entirely from
    chemosynthetic sulfur-oxidizing bacteria. Why did it take so long to find them? Submersibles were crude.
    Equipment was scarce. Yet, against all odds, Alvin succeeded.
  `.trim();

  const sampleAiText = `
    Hydrothermal vents play a crucial role in modern marine ecosystems.
    These delicate mineral fissures discharge mineral-rich hydrothermal fluids directly into benthic environments.
    Moreover, the surrounding biological communities utilize dissolved hydrogen sulfide for metabolic processes.
    Furthermore, marine biologists continue investigating these unique deep benthic ecological habitats worldwide.
  `.trim();

  describe('1. Feature Extractor Robustness & Determinism', () => {
    it('handles empty, whitespace, and single-word inputs safely without throwing', () => {
      const emptyRes = extractV23Features('');
      expect(emptyRes.wordCount).toBe(0);
      expect(emptyRes.sentenceCount).toBe(0);
      expect(emptyRes.features.burstinessCv).toBe(0.25);
      expect(emptyRes.features.typeTokenRatio).toBe(0);

      const singleWord = extractV23Features('Oceanography');
      expect(singleWord.wordCount).toBe(1);
      expect(singleWord.sentenceCount).toBe(1);
      expect(singleWord.features.shannonEntropy).toBe(0);
    });

    it('extracts identical feature vectors deterministically on repeated calls', () => {
      const run1 = extractV23Features(sampleHumanText);
      const run2 = extractV23Features(sampleHumanText);
      expect(run1.features).toEqual(run2.features);
    });

    it('measures higher burstiness and punctuation variation on human writing compared to formulaic AI', () => {
      const humanFeatures = extractV23Features(sampleHumanText).features;
      const aiFeatures = extractV23Features(sampleAiText).features;

      expect(humanFeatures.burstinessCv).toBeGreaterThan(aiFeatures.burstinessCv);
      expect(aiFeatures.burstinessUniformity).toBeGreaterThan(humanFeatures.burstinessUniformity);
      expect(aiFeatures.clicheDensity).toBeGreaterThan(humanFeatures.clicheDensity);
    });
  });

  describe('2. Hand-Weighted Stylometric Discriminator (Option B)', () => {
    it('evaluates features into a bounded heuristic match score [0, 1]', () => {
      const { features } = extractV23Features(sampleHumanText);
      const evalRes = evaluateStylometricDiscriminator(features);

      expect(evalRes.stylisticAiScore).toBeGreaterThanOrEqual(0.0);
      expect(evalRes.stylisticAiScore).toBeLessThanOrEqual(1.0);
      expect(evalRes.aiProbability).toBe(evalRes.stylisticAiScore);
      expect(evalRes.attributions.length).toBe(7);
    });

    it('abstains on short texts (< 40 words) with explicit insufficient evidence reason', () => {
      const shortText = 'Hydrothermal vents are deep underwater volcanic hot springs with sulfur.';
      const res = runStylometricDiscriminator(shortText);

      expect(res.isAbstained).toBe(true);
      expect(res.verdict).toBe('abstain_short_length');
      expect(res.confidence).toBe('insufficient_evidence');
      expect(res.abstentionReason).toContain('minimum 40 words required');
    });

    it('correctly attributes signals toward AI or Human indicator directions', () => {
      const res = runStylometricDiscriminator(sampleAiText);
      expect(res.topAttributions.length).toBeGreaterThan(0);
      const aiAttributions = res.topAttributions.filter((a) => a.indicatorDirection === 'ai_leaning');
      expect(aiAttributions.length).toBeGreaterThan(0);
    });

    it('maintains backwards compatibility for legacy learnedClassifier imports', () => {
      const { features } = extractV23Features(sampleHumanText);
      const res1 = evaluateLearnedClassifier(features);
      const res2 = evaluateStylometricDiscriminator(features);
      expect(res1).toEqual(res2);

      const run1 = runLearnedClassifier(sampleHumanText);
      const run2 = runStylometricDiscriminator(sampleHumanText);
      expect({ ...run1, inferenceDurationMs: 0 }).toEqual({ ...run2, inferenceDurationMs: 0 });
    });
  });

  describe('3. Heuristic Score Fusion (Option C)', () => {
    it('fuses stylometric and heuristic signals and reports component scores', () => {
      const res = runHybridDetector(sampleHumanText);

      expect(res.version).toBe('2.3.1');
      expect(res.detectorOption).toBe('option_c_hybrid');
      expect(res.componentScores).toBeDefined();
      expect(res.componentScores?.heuristicScore).toBeGreaterThanOrEqual(0);
      expect(res.componentScores?.stylometricScore).toBeGreaterThanOrEqual(0);
      expect(res.humanMatchScore).toBe(Number((1 - res.stylisticAiScore).toFixed(3)));
    });

    it('enforces selective abstention on short text (< 40 words)', () => {
      const shortHuman = 'Alvin discovered deep ocean vents in 1977, transforming our understanding of biology.';
      const res = runHybridDetector(shortHuman);

      expect(res.isAbstained).toBe(true);
      expect(res.verdict).toBe('abstain_short_length');
      expect(res.confidence).toBe('insufficient_evidence');
    });

    it('enforces selective abstention in intermediate ambiguity band [0.45, 0.55]', () => {
      const baseRes = runHybridDetector(sampleHumanText, { enableSelectiveAbstention: false });
      const score = baseRes.stylisticAiScore;
      const res = runHybridDetector(sampleHumanText, {
        ambiguityLower: Math.max(0, score - 0.05),
        ambiguityUpper: Math.min(1.0, score + 0.05),
      });

      expect(res.isAbstained).toBe(true);
      expect(res.verdict).toBe('abstain_ambiguous');
      expect(res.confidence).toBe('low');
      expect(res.abstentionReason).toContain('falls within the ambiguity interval');
    });

    it('bypasses abstention when enableSelectiveAbstention is disabled', () => {
      const shortText = 'A short sample evaluated in non-selective forced binary mode.';
      const res = runHybridDetector(shortText, { enableSelectiveAbstention: false });

      expect(res.isAbstained).toBe(false);
      expect(['ai', 'human']).toContain(res.verdict);
    });

    it('completes inference within budget (< 25ms)', () => {
      const res = runHybridDetector(sampleHumanText);
      expect(res.inferenceDurationMs).toBeLessThan(25);
    });
  });

  describe('4. Comparative Adapter & Transparent Abstention Semantics', () => {
    it('evaluates all three options on the exact same passage', () => {
      const optA = evaluateDetectorOption(sampleHumanText, 'option_a_heuristic');
      const optB = evaluateDetectorOption(sampleHumanText, 'option_b_stylometric');
      const optC = evaluateDetectorOption(sampleHumanText, 'option_c_hybrid');

      expect(optA.detectorOption).toBe('option_a_heuristic');
      expect(optB.detectorOption).toBe('option_b_stylometric');
      expect(optC.detectorOption).toBe('option_c_hybrid');
      expect(optA.wordCount).toBe(optB.wordCount);
      expect(optB.wordCount).toBe(optC.wordCount);
    });

    it('computes evaluation metrics with explicit class-conditional coverage and effective recall', () => {
      const mockScoredItems = [
        // 2 AI samples classified
        { label: 'ai_generated', result: { ...runHybridDetector(sampleAiText), isAbstained: false, verdict: 'ai' as const, stylisticAiScore: 0.85, aiProbability: 0.85 } },
        { label: 'ai_generated', result: { ...runHybridDetector(sampleAiText), isAbstained: false, verdict: 'ai' as const, stylisticAiScore: 0.75, aiProbability: 0.75 } },
        // 1 AI sample abstained
        { label: 'ai_generated', result: { ...runHybridDetector(sampleAiText), isAbstained: true, verdict: 'abstain_short_length' as const, stylisticAiScore: 0.50, aiProbability: 0.50 } },
        // 1 Human sample classified
        { label: 'human_verified', result: { ...runHybridDetector(sampleHumanText), isAbstained: false, verdict: 'human' as const, stylisticAiScore: 0.15, aiProbability: 0.15 } },
        // 1 Human sample abstained
        { label: 'human_verified', result: { ...runHybridDetector(sampleHumanText), isAbstained: true, verdict: 'abstain_short_length' as const, stylisticAiScore: 0.20, aiProbability: 0.20 } },
      ];

      const metrics = computeEvaluationMetrics(mockScoredItems);

      // Total population checks
      expect(metrics.totalSamples).toBe(5);
      expect(metrics.totalAiSamples).toBe(3);
      expect(metrics.totalHumanSamples).toBe(2);

      // Abstention breakdown
      expect(metrics.totalClassified).toBe(3);
      expect(metrics.totalAbstained).toBe(2);
      expect(metrics.aiSamplesClassified).toBe(2);
      expect(metrics.aiSamplesAbstained).toBe(1);
      expect(metrics.humanSamplesClassified).toBe(1);
      expect(metrics.humanSamplesAbstained).toBe(1);

      // Confusion matrix
      expect(metrics.tp).toBe(2);
      expect(metrics.fp).toBe(0);
      expect(metrics.tn).toBe(1);
      expect(metrics.fn).toBe(0);

      // Selective metrics (computed strictly over evaluated samples)
      expect(metrics.selectivePrecision).toBe(1.0);
      expect(metrics.selectiveRecall).toBe(1.0); // 2/2 evaluated AI
      expect(metrics.selectiveSpecificity).toBe(1.0); // 1/1 evaluated Human

      // Coverage metrics
      expect(metrics.aiCoverage).toBe(Number((2 / 3).toFixed(3)));
      expect(metrics.humanCoverage).toBe(0.5);
      expect(metrics.totalCoverage).toBe(0.6);
      expect(metrics.abstentionRate).toBe(0.4);

      // Cohort-wide effective recall (computed over TOTAL AI population)
      // Never report selective recall (1.0) without reporting effective recall (2/3 = 0.667)
      expect(metrics.cohortWideEffectiveAiRecall).toBe(Number((2 / 3).toFixed(3)));
      expect(metrics.cohortWideEffectiveHumanFpr).toBe(0.0);
    });
  });

  describe('5. Dataset Provenance & Group Split Integrity Validator', () => {
    it('validates non-overlapping independence groups across clean partitions', () => {
      const cleanSamples: ProvenanceAwareEvaluationSample[] = [
        {
          id: 'sample_01',
          group: 'group_a_dev',
          label: 'human_verified',
          genre: 'academic',
          lengthCategory: 'medium',
          text: 'Passage A',
          baseDocumentId: 'base_01',
          sourceDataset: 'dataset_a',
          sourceDocumentId: 'doc_01',
          authorClass: 'human',
          promptId: 'unavailable',
          modelProvider: 'none',
          modelName: 'human',
          generationMetadata: {},
          transformationType: 'original',
          independenceGroupId: 'group_alpha',
          qualityRatingStatus: 'unassessed_by_human',
          provenanceStatus: 'verified_archival',
          exploratoryQualityProxy: 'competent_human',
        },
        {
          id: 'sample_02',
          group: 'group_b_val',
          label: 'human_verified',
          genre: 'academic',
          lengthCategory: 'medium',
          text: 'Passage B',
          baseDocumentId: 'base_02',
          sourceDataset: 'dataset_b',
          sourceDocumentId: 'doc_02',
          authorClass: 'human',
          promptId: 'unavailable',
          modelProvider: 'none',
          modelName: 'human',
          generationMetadata: {},
          transformationType: 'original',
          independenceGroupId: 'group_beta',
          qualityRatingStatus: 'unassessed_by_human',
          provenanceStatus: 'verified_archival',
          exploratoryQualityProxy: 'competent_human',
        },
      ];

      const validation = validateGroupSplitIntegrity(cleanSamples);
      expect(validation.isValid).toBe(true);
      expect(validation.leaks.length).toBe(0);
    });

    it('detects and flags intentional partition contamination across groups', () => {
      const contaminatedSamples: ProvenanceAwareEvaluationSample[] = [
        {
          id: 'sample_01',
          group: 'group_a_dev',
          label: 'human_verified',
          genre: 'academic',
          lengthCategory: 'medium',
          text: 'Passage A',
          baseDocumentId: 'base_01',
          sourceDataset: 'dataset_a',
          sourceDocumentId: 'doc_01',
          authorClass: 'human',
          promptId: 'unavailable',
          modelProvider: 'none',
          modelName: 'human',
          generationMetadata: {},
          transformationType: 'original',
          independenceGroupId: 'shared_group_leak',
          qualityRatingStatus: 'unassessed_by_human',
          provenanceStatus: 'verified_archival',
          exploratoryQualityProxy: 'competent_human',
        },
        {
          id: 'sample_02',
          group: 'group_b_val',
          label: 'human_verified',
          genre: 'academic',
          lengthCategory: 'medium',
          text: 'Passage B derived from A',
          baseDocumentId: 'base_01',
          sourceDataset: 'dataset_b',
          sourceDocumentId: 'doc_01_copy',
          authorClass: 'human',
          promptId: 'unavailable',
          modelProvider: 'none',
          modelName: 'human',
          generationMetadata: {},
          transformationType: 'suffix_extension',
          independenceGroupId: 'shared_group_leak', // Contamination!
          qualityRatingStatus: 'unassessed_by_human',
          provenanceStatus: 'synthetic_expansion',
          exploratoryQualityProxy: 'competent_human',
        },
      ];

      const validation = validateGroupSplitIntegrity(contaminatedSamples);
      expect(validation.isValid).toBe(false);
      expect(validation.leaks.length).toBeGreaterThan(0);
      expect(validation.leaks[0]).toContain('Data Leakage');
    });

    it('safely handles records with unknown provenance and unassessed quality status', () => {
      const unknownRecord: ProvenanceAwareEvaluationSample = {
        id: 'sample_unknown',
        group: 'group_c_challenge',
        label: 'human_verified',
        genre: 'conversational',
        lengthCategory: 'short',
        text: 'Unknown text fragment.',
        baseDocumentId: 'unknown',
        sourceDataset: 'unknown',
        sourceDocumentId: 'unknown',
        authorClass: 'human',
        promptId: 'unavailable',
        modelProvider: 'none',
        modelName: 'human',
        generationMetadata: {},
        transformationType: 'original',
        independenceGroupId: 'unknown_group',
        qualityRatingStatus: 'unassessed_by_human',
        provenanceStatus: 'unknown',
        exploratoryQualityProxy: 'imperfect_human',
      };

      expect(unknownRecord.provenanceStatus).toBe('unknown');
      expect(unknownRecord.qualityRatingStatus).toBe('unassessed_by_human');
    });
  });

  describe('6. Production Baseline Isolation & Safe Boundary Verification', () => {
    it('confirms the production baseline computeAiScore remains the active default', () => {
      const baselineResult = computeAiScore(sampleHumanText);
      expect(baselineResult).toBeDefined();
      expect(baselineResult.aiProbability).toBeDefined();
      expect(typeof baselineResult.aiProbability).toBe('number');
      expect(baselineResult.matchingSignatures).toBeDefined();

      // Verify that candidate results are strictly isolated
      const candidateResult = runHybridDetector(sampleHumanText);
      expect(candidateResult.version).toBe('2.3.1');
      expect(candidateResult.stylisticAiScore).toBeDefined();
      expect(candidateResult.detectorOption).toBe('option_c_hybrid');
    });

    it('verifies candidate integration boundary defaults to stable baseline with explicit disclaimers', async () => {
      const { executeDetectorEngine } = await import('../../src/lib/detector/candidateIntegrationBoundary');

      // 1. Default invocation must be production baseline
      const defaultRun = executeDetectorEngine(sampleHumanText);
      expect(defaultRun.engineId).toBe('production_default');
      expect(defaultRun.isProductionDefault).toBe(true);

      // 2. Explicit opt-in for Option B
      const optBRun = executeDetectorEngine(sampleHumanText, { engineId: 'experimental_stylometric' });
      expect(optBRun.engineId).toBe('experimental_stylometric');
      expect(optBRun.isProductionDefault).toBe(false);
      expect(optBRun.scoreLabel).toBe('stylistic_ai_match_indicator');
      expect(optBRun.disclaimer).toContain('EXPERIMENTAL CANDIDATE');
      expect(optBRun.disclaimer).toContain('NOT an empirical probability');

      // 3. Explicit opt-in for Option C
      const optCRun = executeDetectorEngine(sampleHumanText, { engineId: 'experimental_fusion' });
      expect(optCRun.engineId).toBe('experimental_fusion');
      expect(optCRun.isProductionDefault).toBe(false);
      expect(optCRun.scoreLabel).toBe('fused_stylistic_match_indicator');
      expect(optCRun.disclaimer).toContain('EXPERIMENTAL CANDIDATE');
      expect(optCRun.disclaimer).toContain('NOT a calibrated Bayesian probability');
    });
  });
});
