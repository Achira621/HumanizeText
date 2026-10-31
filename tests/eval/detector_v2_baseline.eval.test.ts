import { describe, it, expect } from 'vitest';
import { loadDetectorV2Benchmark, loadComparatorBenchmark } from './fixtures';
import { computeAiScore } from '../../src/lib/detector/detectorCore';
import type { DetectorV2BenchmarkRow } from './types';

interface BinaryMetrics {
  total: number;
  tp: number;
  fp: number;
  tn: number;
  fn: number;
  precision: number | null;
  recall: number;
  specificity: number;
  falsePositiveRate: number;
  falseNegativeRate: number;
  balancedAccuracy: number;
  /** Empirical Mean Squared Distance to binary labels {0, 1}. Diagnostic heuristic metric, NOT a probabilistic Brier score. */
  meanSquaredDistanceDiagnostic: number;
}

function calculateBinaryMetrics(
  scoredSamples: Array<{ row: DetectorV2BenchmarkRow; score: number }>,
  threshold = 0.5
): BinaryMetrics {
  const binaryOnly = scoredSamples.filter(
    (s) => s.row.label === 'human_verified' || s.row.label === 'ai_generated'
  );

  let tp = 0;
  let fp = 0;
  let tn = 0;
  let fn = 0;
  let brierSum = 0;

  for (const s of binaryOnly) {
    const isPredictedAi = s.score >= threshold;
    const isGroundTruthAi = s.row.label === 'ai_generated';
    const trueProb = isGroundTruthAi ? 1.0 : 0.0;

    brierSum += Math.pow(s.score - trueProb, 2);

    if (isGroundTruthAi) {
      if (isPredictedAi) tp++;
      else fn++;
    } else {
      if (isPredictedAi) fp++;
      else tn++;
    }
  }

  const precision = tp + fp > 0 ? tp / (tp + fp) : null;
  const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
  const specificity = tn + fp > 0 ? tn / (tn + fp) : 0;
  const falsePositiveRate = tn + fp > 0 ? fp / (tn + fp) : 0;
  const falseNegativeRate = tp + fn > 0 ? fn / (tp + fn) : 0;
  const balancedAccuracy = (recall + specificity) / 2;
  const brierScore = binaryOnly.length > 0 ? brierSum / binaryOnly.length : 0;

  return {
    total: binaryOnly.length,
    tp,
    fp,
    tn,
    fn,
    precision: precision !== null ? Math.round(precision * 1000) / 1000 : null,
    recall: Math.round(recall * 1000) / 1000,
    specificity: Math.round(specificity * 1000) / 1000,
    falsePositiveRate: Math.round(falsePositiveRate * 1000) / 1000,
    falseNegativeRate: Math.round(falseNegativeRate * 1000) / 1000,
    balancedAccuracy: Math.round(balancedAccuracy * 1000) / 1000,
    meanSquaredDistanceDiagnostic: Math.round(brierScore * 1000) / 1000,
  };
}

describe('HumanizeText Detector Intelligence V2 Baseline Evaluation', () => {
  const dataset = loadDetectorV2Benchmark();
  const comparators = loadComparatorBenchmark();

  it('verifies dataset integrity and provenance splits', () => {
    expect(dataset.length).toBe(45);
    const devSet = dataset.filter((d) => d.split === 'dev');
    const calibSet = dataset.filter((d) => d.split === 'calibration');
    const heldOutSet = dataset.filter((d) => d.split === 'held_out');

    expect(devSet.length).toBe(15);
    expect(calibSet.length).toBe(15);
    expect(heldOutSet.length).toBe(15);

    // Verify all 5 categories are present in each split
    for (const splitSet of [devSet, calibSet, heldOutSet]) {
      const counts: Record<string, number> = {};
      for (const row of splitSet) {
        counts[row.label] = (counts[row.label] || 0) + 1;
      }
      expect(counts['human_verified']).toBe(5);
      expect(counts['ai_generated']).toBe(5);
      expect(counts['ai_human_edited']).toBe(2);
      expect(counts['human_ai_edited']).toBe(2);
      expect(counts['mixed_authorship']).toBe(1);
    }
  });

  it('measures baseline detector performance on dev and calibration sets', () => {
    const scoredDev = dataset
      .filter((d) => d.split === 'dev')
      .map((row) => ({
        row,
        res: computeAiScore(row.text),
        score: computeAiScore(row.text).aiProbability,
      }));

    const scoredCalib = dataset
      .filter((d) => d.split === 'calibration')
      .map((row) => ({
        row,
        res: computeAiScore(row.text),
        score: computeAiScore(row.text).aiProbability,
      }));

    const devMetrics = calculateBinaryMetrics(scoredDev, 0.5);
    const calibMetrics = calculateBinaryMetrics(scoredCalib, 0.5);

    console.log('[BASELINE DEV METRICS]', devMetrics);
    console.log('[BASELINE CALIBRATION METRICS]', calibMetrics);

    // Score distribution by category on combined dev + calib
    const combined = [...scoredDev, ...scoredCalib];
    const categoryScores: Record<string, number[]> = {};
    for (const s of combined) {
      if (!categoryScores[s.row.label]) categoryScores[s.row.label] = [];
      categoryScores[s.row.label].push(s.score);
    }

    const mean = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
    const distributionSummary = Object.fromEntries(
      Object.entries(categoryScores).map(([cat, scores]) => [
        cat,
        {
          count: scores.length,
          mean: Math.round(mean(scores) * 100) / 100,
          min: Math.min(...scores),
          max: Math.max(...scores),
        },
      ])
    );

    console.log('[BASELINE SCORE DISTRIBUTION BY PROVENANCE]', distributionSummary);

    console.log('[ALL DEV & CALIB SCORES]');
    for (const s of combined) {
      console.log(`  ${s.row.id} [${s.row.split}|${s.row.label}|${s.row.genre}] score=${s.score} hits=${s.res.keywordHits} text="${s.row.text.slice(0, 50)}..."`);
    }

    // Verify cell sums equal total counts
    expect(devMetrics.total).toBe(devMetrics.tp + devMetrics.fp + devMetrics.tn + devMetrics.fn);
    expect(calibMetrics.total).toBe(calibMetrics.tp + calibMetrics.fp + calibMetrics.tn + calibMetrics.fn);
  });

  it('evaluates comparator benchmarks and analyzes agreement vs correctness', () => {
    expect(comparators.length).toBeGreaterThanOrEqual(5);

    const comparatorResults = comparators.map((sample) => {
      const localResult = computeAiScore(sample.text);
      const observations = sample.observations.map((obs) => ({
        comparator: obs.comparator,
        reportedScore: obs.reportedScore,
        reportedLabel: obs.reportedLabel,
        agreesWithTrueLabel:
          sample.trueLabel === 'human_verified' || sample.trueLabel === 'ai_human_edited'
            ? obs.reportedScore < 0.4
            : obs.reportedScore >= 0.6,
      }));

      const localAgreesWithTrueLabel =
        sample.trueLabel === 'human_verified' || sample.trueLabel === 'ai_human_edited'
          ? localResult.aiProbability < 0.4
          : localResult.aiProbability >= 0.6;

      return {
        sampleId: sample.sampleId,
        trueLabel: sample.trueLabel,
        localScore: localResult.aiProbability,
        localAgreesWithTrueLabel,
        observations,
      };
    });

    console.log('[COMPARATOR BENCHMARK AUDIT RESULTS]', JSON.stringify(comparatorResults, null, 2));

    expect(comparatorResults.length).toBe(5);
  });
});
