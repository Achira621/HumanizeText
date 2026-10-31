import { describe, it, expect } from 'vitest';
import {
  evaluateSelectiveCorpus,
  evaluateSamplePolicy,
  validateCorpusIntegrity,
  formatSelectiveReportMarkdown,
  CANDIDATE_POLICIES,
  CorpusIntegrityError,
  type SelectiveCorpusRow,
  type CandidatePolicy,
} from './selectiveEvaluator';
import { computeAiScore } from '../../src/lib/detector/detectorCore';

describe('HumanizeText Detector V2.2.4: Selective Classification Infrastructure', () => {
  // Mock helper to generate synthetic samples for controlled test scenarios
  function makeSample(overrides: Partial<SelectiveCorpusRow>): SelectiveCorpusRow {
    return {
      id: `test_sample_${Math.random().toString(36).substring(2, 8)}`,
      cohort: 'dev',
      genre: 'academic',
      lengthCategory: 'medium',
      wordCount: 60,
      label: 'human_verified',
      sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      provenance: {
        authorOrSource: 'Verified Author / Test Archive',
        method: 'historical_document',
        date: '2026-01-01',
        verificationStatus: 'verified',
      },
      text: 'This is a test passage that contains enough words to satisfy word count minimums for evaluation testing.',
      ...overrides,
    };
  }

  describe('1. Data Integrity & Provenance Validation', () => {
    it('detects duplicate sample IDs and fails validation', () => {
      const s1 = makeSample({ id: 'dup_id_01' });
      const s2 = makeSample({ id: 'dup_id_01' });

      const res = validateCorpusIntegrity([s1, s2]);
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.includes("Duplicate sample ID detected: 'dup_id_01'"))).toBe(true);

      expect(() => {
        evaluateSelectiveCorpus([s1, s2], CANDIDATE_POLICIES.POLICY_A_BASELINE, { strictValidation: true });
      }).toThrowError(CorpusIntegrityError);
    });

    it('detects missing provenance authorOrSource and reports validation error', () => {
      const badSample = makeSample({
        id: 'bad_prov_01',
        provenance: {
          authorOrSource: '',
          method: 'unknown',
        },
      });

      const res = validateCorpusIntegrity([badSample]);
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.includes("Provenance missing 'authorOrSource'"))).toBe(true);
    });

    it('detects empty or whitespace-only text passages', () => {
      const badSample = makeSample({ id: 'empty_text_01', text: '    ' });
      const res = validateCorpusIntegrity([badSample]);
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.includes('Text passage is empty'))).toBe(true);
    });
  });

  describe('2. Boundary & Decision Logic Checks', () => {
    it('verifies exact length boundaries (theta = 50 words)', () => {
      const policy: CandidatePolicy = {
        id: 'test_len_50',
        type: 'policy_b_min_length',
        name: 'Test 50 Words',
        description: 'Test policy',
        minWordCount: 50,
        tauHuman: 0.50,
        tauAi: 0.50,
      };

      // 49 words
      const text49 = new Array(49).fill('word').join(' ');
      expect(evaluateSamplePolicy(text49, 0.20, policy)).toBe('abstain_length');
      expect(evaluateSamplePolicy(text49, 0.80, policy)).toBe('abstain_length');

      // Exactly 50 words
      const text50 = new Array(50).fill('word').join(' ');
      expect(evaluateSamplePolicy(text50, 0.20, policy)).toBe('human');
      expect(evaluateSamplePolicy(text50, 0.80, policy)).toBe('ai');
    });

    it('verifies exact score boundaries in intermediate region [0.35, 0.65]', () => {
      const policy: CandidatePolicy = {
        id: 'test_score_band',
        type: 'policy_c_selective_region',
        name: 'Test Score Band',
        description: 'Test policy',
        minWordCount: 10,
        tauHuman: 0.35,
        tauAi: 0.65,
      };

      const validText = new Array(20).fill('word').join(' ');

      // Exactly at lower boundary (0.35) -> Abstain
      expect(evaluateSamplePolicy(validText, 0.35, policy)).toBe('abstain_score');

      // Exactly at upper boundary (0.65) -> Abstain
      expect(evaluateSamplePolicy(validText, 0.65, policy)).toBe('abstain_score');

      // Inside intermediate band (0.50) -> Abstain
      expect(evaluateSamplePolicy(validText, 0.50, policy)).toBe('abstain_score');

      // Strictly below lower boundary (0.349) -> Human
      expect(evaluateSamplePolicy(validText, 0.349, policy)).toBe('human');

      // Strictly above upper boundary (0.651) -> AI
      expect(evaluateSamplePolicy(validText, 0.651, policy)).toBe('ai');
    });
  });

  describe('3. Selective Metrics Edge Cases & Denominator Safety', () => {
    it('handles zero decided samples (all samples abstained) without NaN or crash', () => {
      // Policy requires 1000 words; all samples have 50 words
      const policy: CandidatePolicy = {
        id: 'impossible_length',
        type: 'policy_b_min_length',
        name: 'Impossible Length',
        description: 'Abstains on everything under 1000w',
        minWordCount: 1000,
        tauHuman: 0.50,
        tauAi: 0.50,
      };

      const samples: SelectiveCorpusRow[] = [
        makeSample({ id: 'h1', label: 'human_verified', text: new Array(50).fill('word').join(' ') }),
        makeSample({ id: 'a1', label: 'ai_generated', text: new Array(50).fill('word').join(' ') }),
      ];

      const { report } = evaluateSelectiveCorpus(samples, policy);

      expect(report.coverage.totalEligible).toBe(2);
      expect(report.coverage.decidedCount).toBe(0);
      expect(report.coverage.abstainedCount).toBe(2);
      expect(report.coverage.coverageProportion).toBe(0);
      expect(report.coverage.abstentionRate).toBe(1);

      // Decided rates must be null, not NaN
      expect(report.selectivePerformanceRates.precision).toBeNull();
      expect(report.selectivePerformanceRates.recall).toBeNull();
      expect(report.selectivePerformanceRates.specificity).toBeNull();
      expect(report.selectivePerformanceRates.falsePositiveRate).toBeNull();
      expect(report.selectivePerformanceRates.falseNegativeRate).toBeNull();
      expect(report.selectivePerformanceRates.balancedAccuracy).toBeNull();

      expect(report.overallCohortOutcomes.proportionCorrect).toBe(0);
      expect(report.overallCohortOutcomes.proportionIncorrect).toBe(0);
    });

    it('handles zero predicted positives (all decided samples classified as human)', () => {
      // All samples score 0.10, so classified as human
      const samples: SelectiveCorpusRow[] = [
        makeSample({ id: 'h1', label: 'human_verified', text: new Array(50).fill('sample').join(' ') }),
        makeSample({ id: 'a1', label: 'ai_generated', text: new Array(50).fill('sample').join(' ') }),
      ];

      const { report } = evaluateSelectiveCorpus(samples, CANDIDATE_POLICIES.POLICY_A_BASELINE, {
        customScoreEvaluator: () => 0.10,
      });

      expect(report.selectiveConfusionMatrix.sTP).toBe(0);
      expect(report.selectiveConfusionMatrix.sFP).toBe(0);
      expect(report.selectiveConfusionMatrix.sTN).toBe(1);
      expect(report.selectiveConfusionMatrix.sFN).toBe(1);

      // sTP + sFP = 0 -> Precision must be null, recall must be 0
      expect(report.selectivePerformanceRates.precision).toBeNull();
      expect(report.selectivePerformanceRates.recall).toBe(0);
      expect(report.selectivePerformanceRates.specificity).toBe(1);
      expect(report.selectivePerformanceRates.falsePositiveRate).toBe(0);
    });

    it('handles zero decided human samples (all human samples abstained)', () => {
      // Human samples have 20 words (<50w, abstains), AI samples have 60 words (>=50w, decided)
      const samples: SelectiveCorpusRow[] = [
        makeSample({ id: 'h1', label: 'human_verified', text: new Array(20).fill('human').join(' ') }),
        makeSample({ id: 'a1', label: 'ai_generated', text: new Array(60).fill('ai').join(' ') }),
      ];

      const { report } = evaluateSelectiveCorpus(samples, CANDIDATE_POLICIES.POLICY_B_MIN_LENGTH_50, {
        customScoreEvaluator: () => 0.90,
      });

      expect(report.classConditionalCoverage.human.total).toBe(1);
      expect(report.classConditionalCoverage.human.decided).toBe(0);
      expect(report.classConditionalCoverage.human.abstained).toBe(1);
      expect(report.classConditionalCoverage.human.coverage).toBe(0);

      expect(report.classConditionalCoverage.ai.total).toBe(1);
      expect(report.classConditionalCoverage.ai.decided).toBe(1);
      expect(report.classConditionalCoverage.ai.coverage).toBe(1);

      // Zero decided human -> Specificity and FPR must be null (no human denominator)
      expect(report.selectivePerformanceRates.specificity).toBeNull();
      expect(report.selectivePerformanceRates.falsePositiveRate).toBeNull();
      // AI was decided and classified correctly
      expect(report.selectivePerformanceRates.recall).toBe(1);
      expect(report.selectivePerformanceRates.precision).toBe(1);
    });

    it('handles zero decided AI samples (all AI samples abstained)', () => {
      // AI samples have 20 words (<50w, abstains), Human samples have 60 words (>=50w, decided)
      const samples: SelectiveCorpusRow[] = [
        makeSample({ id: 'h1', label: 'human_verified', text: new Array(60).fill('human').join(' ') }),
        makeSample({ id: 'a1', label: 'ai_generated', text: new Array(20).fill('ai').join(' ') }),
      ];

      const { report } = evaluateSelectiveCorpus(samples, CANDIDATE_POLICIES.POLICY_B_MIN_LENGTH_50, {
        customScoreEvaluator: () => 0.10,
      });

      expect(report.classConditionalCoverage.ai.decided).toBe(0);
      expect(report.classConditionalCoverage.ai.coverage).toBe(0);

      // Zero decided AI -> Recall and FNR must be null
      expect(report.selectivePerformanceRates.recall).toBeNull();
      expect(report.selectivePerformanceRates.falseNegativeRate).toBeNull();
      expect(report.selectivePerformanceRates.specificity).toBe(1);
      expect(report.selectivePerformanceRates.falsePositiveRate).toBe(0);
    });

    it('handles no samples abstained (100% coverage baseline)', () => {
      const samples: SelectiveCorpusRow[] = [
        makeSample({ id: 'h1', label: 'human_verified', text: new Array(60).fill('human').join(' ') }),
        makeSample({ id: 'a1', label: 'ai_generated', text: new Array(60).fill('ai').join(' ') }),
      ];

      const { report } = evaluateSelectiveCorpus(samples, CANDIDATE_POLICIES.POLICY_A_BASELINE, {
        customScoreEvaluator: (text) => (text.includes('ai') ? 0.85 : 0.15),
      });

      expect(report.coverage.coverageProportion).toBe(1);
      expect(report.coverage.abstentionRate).toBe(0);
      expect(report.selectiveConfusionMatrix.sTP).toBe(1);
      expect(report.selectiveConfusionMatrix.sTN).toBe(1);
      expect(report.selectivePerformanceRates.precision).toBe(1);
      expect(report.selectivePerformanceRates.recall).toBe(1);
      expect(report.selectivePerformanceRates.specificity).toBe(1);
      expect(report.selectivePerformanceRates.balancedAccuracy).toBe(1);
    });
  });

  describe('4. Strict Collaborative Cohort Separation', () => {
    it('completely excludes collaborative samples from pure-binary denominators', () => {
      const samples: SelectiveCorpusRow[] = [
        makeSample({ id: 'h1', label: 'human_verified', text: new Array(60).fill('text').join(' ') }),
        makeSample({ id: 'a1', label: 'ai_generated', text: new Array(60).fill('text').join(' ') }),
        makeSample({ id: 'c1', label: 'collaborative', text: new Array(60).fill('text').join(' ') }),
        makeSample({ id: 'c2', label: 'mixed_authorship', text: new Array(60).fill('text').join(' ') }),
        makeSample({ id: 'c3', label: 'human_ai_edited', text: new Array(60).fill('text').join(' ') }),
      ];

      const { report } = evaluateSelectiveCorpus(samples, CANDIDATE_POLICIES.POLICY_A_BASELINE, {
        customScoreEvaluator: () => 0.80,
      });

      // Total samples is 5, but eligible pure-binary MUST be exactly 2
      expect(report.totalSamplesEvaluated).toBe(5);
      expect(report.pureBinaryEligibleCount).toBe(2);
      expect(report.coverage.totalEligible).toBe(2);
      expect(report.selectiveConfusionMatrix.totalDecided).toBe(2);

      // Collaborative report exists and has 3 samples
      expect(report.collaborativeReport).toBeDefined();
      expect(report.collaborativeReport?.totalCount).toBe(3);
    });
  });

  describe('5. Immutability Verification', () => {
    it('guarantees candidate policy evaluation does not mutate input samples or detectorCore', () => {
      const originalText = 'The system architecture handles high throughput gracefully without memory leaks.';
      const sample = makeSample({
        id: 'immut_01',
        text: originalText,
        wordCount: 10,
      });

      const sampleCopy = JSON.parse(JSON.stringify(sample));

      const { evaluatedSamples } = evaluateSelectiveCorpus([sample], CANDIDATE_POLICIES.POLICY_C_SELECTIVE_35_65);

      // Verify input sample was not altered
      expect(sample.text).toBe(originalText);
      expect(sample).toEqual(sampleCopy);

      // Verify evaluated output is frozen
      expect(Object.isFrozen(evaluatedSamples[0])).toBe(true);

      // Verify computeAiScore produces identical deterministic output
      const run1 = computeAiScore(originalText);
      const run2 = computeAiScore(originalText);
      expect(run1.aiProbability).toBe(run2.aiProbability);
      expect(run1.signalBreakdown).toEqual(run2.signalBreakdown);
    });
  });

  describe('6. Report Markdown Formatting', () => {
    it('generates compliant, structured Markdown report with all required sections', () => {
      const samples: SelectiveCorpusRow[] = [
        makeSample({ id: 'h1', label: 'human_verified', text: new Array(60).fill('human').join(' ') }),
        makeSample({ id: 'a1', label: 'ai_generated', text: new Array(60).fill('ai').join(' ') }),
        makeSample({ id: 'c1', label: 'collaborative', text: new Array(60).fill('collab').join(' ') }),
      ];

      const { report } = evaluateSelectiveCorpus(samples, CANDIDATE_POLICIES.POLICY_C_SELECTIVE_35_65, {
        cohortName: 'Unit Test Dev Cohort',
        customScoreEvaluator: (text) => (text.includes('ai') ? 0.90 : text.includes('collab') ? 0.50 : 0.15),
      });

      const md = formatSelectiveReportMarkdown(report);

      expect(md).toContain('# Selective Evaluation Report: Unit Test Dev Cohort');
      expect(md).toContain('## 1. Coverage & Decision Volume');
      expect(md).toContain('## 2. Class-Conditional Coverage');
      expect(md).toContain('## 3. Selective Classification Performance');
      expect(md).toContain('## 4. Overall Cohort Outcomes');
      expect(md).toContain('## 5. Collaborative / Mixed Cohort Analysis');
    });
  });
});

