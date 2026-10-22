import { describe, it, expect } from 'vitest';
import {
  validateReviewEntry,
  aggregateReviews,
  parseReviewFormCsv,
  HumanReviewEntry,
  ComparisonMetadata,
} from '../../src/lib/evaluation/humanReviewAggregator';

/**
 * Unit tests for Human Quality Evaluation Review Aggregator
 * 
 * IMPORTANT: All test fixtures used in this file are strictly marked
 * [SYNTHETIC TEST DATA] to avoid any confusion with authentic human reviews.
 */

describe('Human Review Aggregator [SYNTHETIC TEST DATA]', () => {
  const validCompIds = new Set(['comp_synth_01', 'comp_synth_02', 'comp_synth_03']);

  const synthMetadata: ComparisonMetadata[] = [
    { comparisonId: 'comp_synth_01', passageId: 'p_01', genre: 'academic' },
    { comparisonId: 'comp_synth_02', passageId: 'p_02', genre: 'technical' },
    { comparisonId: 'comp_synth_03', passageId: 'p_03', genre: 'creative' },
  ];

  const validSynthEntry1: HumanReviewEntry = {
    comparisonId: 'comp_synth_01',
    reviewerId: 'reviewer_synth_alpha',
    meaningPreservationA: 5,
    meaningPreservationB: 4,
    factualAccuracyA: 5,
    factualAccuracyB: 5,
    clarityCoherenceA: 3,
    clarityCoherenceB: 4,
    genreToneFitA: 4,
    genreToneFitB: 5,
    unnecessaryEditingA: 4,
    unnecessaryEditingB: 3,
    overallPreference: 'B',
    materialChangeFlag: false,
    reviewerConfidence: 'High',
    notesRationale: '[SYNTHETIC TEST DATA] Output B is clearer while preserving claims.',
  };

  const validSynthEntry2: HumanReviewEntry = {
    comparisonId: 'comp_synth_02',
    reviewerId: 'reviewer_synth_alpha',
    meaningPreservationA: 5,
    meaningPreservationB: 2,
    factualAccuracyA: 5,
    factualAccuracyB: 2,
    clarityCoherenceA: 4,
    clarityCoherenceB: 4,
    genreToneFitA: 4,
    genreToneFitB: 4,
    unnecessaryEditingA: 5,
    unnecessaryEditingB: 2,
    overallPreference: 'A',
    materialChangeFlag: true,
    reviewerConfidence: 'High',
    notesRationale: '[SYNTHETIC TEST DATA] Output B hallucinated numerical metric.',
  };

  describe('validateReviewEntry', () => {
    it('accepts a fully compliant review entry', () => {
      const result = validateReviewEntry(validSynthEntry1, validCompIds);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects an unknown comparison ID', () => {
      const invalid = { ...validSynthEntry1, comparisonId: 'comp_unknown_999' };
      const result = validateReviewEntry(invalid, validCompIds);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === 'comparisonId')).toBe(true);
    });

    it('rejects missing or empty reviewerId', () => {
      const invalid = { ...validSynthEntry1, reviewerId: '   ' };
      const result = validateReviewEntry(invalid, validCompIds);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === 'reviewerId')).toBe(true);
    });

    it('rejects out-of-range integer scores (e.g. 0, 6, 2.5)', () => {
      const invalid0 = { ...validSynthEntry1, meaningPreservationA: 0 };
      expect(validateReviewEntry(invalid0, validCompIds).isValid).toBe(false);

      const invalid6 = { ...validSynthEntry1, meaningPreservationB: 6 };
      expect(validateReviewEntry(invalid6, validCompIds).isValid).toBe(false);

      const invalidFloat = { ...validSynthEntry1, factualAccuracyA: 3.5 };
      expect(validateReviewEntry(invalidFloat, validCompIds).isValid).toBe(false);
    });

    it('rejects invalid preference values', () => {
      const invalidPref = { ...validSynthEntry1, overallPreference: 'Maybe A' as any };
      const result = validateReviewEntry(invalidPref, validCompIds);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === 'overallPreference')).toBe(true);
    });

    it('rejects invalid confidence values', () => {
      const invalidConf = { ...validSynthEntry1, reviewerConfidence: 'Unsure' as any };
      const result = validateReviewEntry(invalidConf, validCompIds);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === 'reviewerConfidence')).toBe(true);
    });
  });

  describe('parseReviewFormCsv', () => {
    it('skips empty template rows where preference is unselected', () => {
      const blankCsv = `comparison_id,passage_id,genre,reviewer_id,meaning_preservation_a_1to5,meaning_preservation_b_1to5,factual_accuracy_a_1to5,factual_accuracy_b_1to5,clarity_coherence_a_1to5,clarity_coherence_b_1to5,genre_tone_fit_a_1to5,genre_tone_fit_b_1to5,unnecessary_editing_a_1to5,unnecessary_editing_b_1to5,overall_preference,material_change_flag,reviewer_confidence,reviewer_rationale_notes
comp_synth_01,p_01,academic,,,,,,,,,,,,,,`;

      const result = parseReviewFormCsv(blankCsv, validCompIds);
      expect(result.entries).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });

    it('parses valid filled rows accurately', () => {
      const filledCsv = `comparison_id,passage_id,genre,reviewer_id,meaning_preservation_a_1to5,meaning_preservation_b_1to5,factual_accuracy_a_1to5,factual_accuracy_b_1to5,clarity_coherence_a_1to5,clarity_coherence_b_1to5,genre_tone_fit_a_1to5,genre_tone_fit_b_1to5,unnecessary_editing_a_1to5,unnecessary_editing_b_1to5,overall_preference,material_change_flag,reviewer_confidence,reviewer_rationale_notes
comp_synth_01,p_01,academic,rev_01,5,4,5,5,3,4,4,5,4,3,B,no,High,"[SYNTHETIC TEST DATA] Output B is clearer."`;

      const result = parseReviewFormCsv(filledCsv, validCompIds);
      expect(result.errors).toHaveLength(0);
      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].comparisonId).toBe('comp_synth_01');
      expect(result.entries[0].overallPreference).toBe('B');
      expect(result.entries[0].materialChangeFlag).toBe(false);
    });

    it('captures parsing errors for invalid data in CSV', () => {
      const corruptCsv = `comparison_id,passage_id,genre,reviewer_id,meaning_preservation_a_1to5,meaning_preservation_b_1to5,factual_accuracy_a_1to5,factual_accuracy_b_1to5,clarity_coherence_a_1to5,clarity_coherence_b_1to5,genre_tone_fit_a_1to5,genre_tone_fit_b_1to5,unnecessary_editing_a_1to5,unnecessary_editing_b_1to5,overall_preference,material_change_flag,reviewer_confidence,reviewer_rationale_notes
comp_synth_01,p_01,academic,rev_01,99,4,5,5,3,4,4,5,4,3,INVALID_PREF,no,High,"error row"`;

      const result = parseReviewFormCsv(corruptCsv, validCompIds);
      expect(result.entries).toHaveLength(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('aggregateReviews', () => {
    it('aggregates dimension means and distributions correctly', () => {
      const report = aggregateReviews([validSynthEntry1, validSynthEntry2], synthMetadata);

      expect(report.metadata.totalTargetComparisons).toBe(3);
      expect(report.metadata.completedReviewsCount).toBe(2);
      expect(report.metadata.incompleteReviewsCount).toBe(1);
      expect(report.metadata.distinctReviewersCount).toBe(1);

      // Meaning preservation: Entry 1 (A:5, B:4), Entry 2 (A:5, B:2) -> meanA = 5.0, meanB = 3.0
      expect(report.overallDimensions.meaningPreservation.meanA).toBe(5);
      expect(report.overallDimensions.meaningPreservation.meanB).toBe(3);
      expect(report.overallDimensions.meaningPreservation.deltaBminusA).toBe(-2);

      // Preferences: 1 A, 1 B, 0 Tie, 0 Neither
      expect(report.preferences.preferenceA.count).toBe(1);
      expect(report.preferences.preferenceB.count).toBe(1);
      expect(report.preferences.tie.count).toBe(0);
      expect(report.preferences.neitherAcceptable.count).toBe(0);
      expect(report.preferences.materialChangeFlaggedCount).toBe(1);

      // Genre grouping
      expect(report.byGenre['academic'].count).toBe(1);
      expect(report.byGenre['technical'].count).toBe(1);
      expect(report.byGenre['creative'].count).toBe(0);
    });

    it('computes Cohen\'s Kappa and raw agreement between 2 independent reviewers', () => {
      const reviewerBetaEntry1: HumanReviewEntry = {
        ...validSynthEntry1,
        reviewerId: 'reviewer_synth_beta',
        overallPreference: 'B', // Agrees with alpha
      };
      const reviewerBetaEntry2: HumanReviewEntry = {
        ...validSynthEntry2,
        reviewerId: 'reviewer_synth_beta',
        overallPreference: 'Neither Is Acceptable', // Disagrees with alpha ('A')
      };

      const entries = [
        validSynthEntry1,
        validSynthEntry2,
        reviewerBetaEntry1,
        reviewerBetaEntry2,
      ];

      const report = aggregateReviews(entries, synthMetadata);
      expect(report.metadata.distinctReviewersCount).toBe(2);
      expect(report.interRaterAgreement).toBeDefined();
      expect(report.interRaterAgreement?.pairedComparisonsCount).toBe(2);
      expect(report.interRaterAgreement?.overallPreferenceRawAgreement).toBe(0.5); // 1 of 2 agree
      expect(typeof report.interRaterAgreement?.cohensKappa).toBe('number');
    });

    it('returns undefined for interRaterAgreement if reviewer count is not 2', () => {
      const reportSingle = aggregateReviews([validSynthEntry1], synthMetadata);
      expect(reportSingle.interRaterAgreement).toBeUndefined();
    });
  });
});
