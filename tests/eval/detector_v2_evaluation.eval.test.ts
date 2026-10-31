import { describe, it, expect } from 'vitest';
import { loadDetectorV2Benchmark } from './fixtures';
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

describe('HumanizeText Detector Intelligence V2 Post-Intervention Evaluation', () => {
  const dataset = loadDetectorV2Benchmark();

  it('runs holdout set evaluation (untouched during tuning, N=15)', () => {
    const heldOutRows = dataset.filter((d) => d.split === 'held_out');
    expect(heldOutRows.length).toBe(15);

    const scoredHoldout = heldOutRows.map((row) => {
      const res = computeAiScore(row.text);
      return {
        row,
        res,
        score: res.aiProbability,
      };
    });

    const holdoutBinaryMetrics = calculateBinaryMetrics(scoredHoldout, 0.5);
    console.log('[HOLDOUT BINARY METRICS]', JSON.stringify(holdoutBinaryMetrics, null, 2));

    // Print all individual holdout evaluations
    console.log('[HOLDOUT INDIVIDUAL SCORES]');
    for (const s of scoredHoldout) {
      console.log(
        `  ${s.row.id} [${s.row.genre}|${s.row.label}] score=${s.score} hits=${s.res.keywordHits} text="${s.row.text.slice(0, 50)}..."`
      );
    }

    // Check false positive rate on verified human text
    expect(holdoutBinaryMetrics.fp).toBe(0); // 0 / 5 false positives on human text
    expect(holdoutBinaryMetrics.falsePositiveRate).toBe(0.0);
    // Recall on AI generated text
    expect(holdoutBinaryMetrics.tp).toBeGreaterThanOrEqual(4); // at least 4 / 5 detected
  });

  it('computes comprehensive benchmark metrics across all splits and subgroups', () => {
    const allScored = dataset.map((row) => {
      const res = computeAiScore(row.text);
      return {
        row,
        res,
        score: res.aiProbability,
      };
    });

    const devMetrics = calculateBinaryMetrics(allScored.filter((s) => s.row.split === 'dev'), 0.5);
    const calibMetrics = calculateBinaryMetrics(allScored.filter((s) => s.row.split === 'calibration'), 0.5);
    const holdoutMetrics = calculateBinaryMetrics(allScored.filter((s) => s.row.split === 'held_out'), 0.5);
    const overallBinaryMetrics = calculateBinaryMetrics(allScored, 0.5);

    console.log('[OVERALL METRICS ACROSS SPLITS]', {
      dev: devMetrics,
      calibration: calibMetrics,
      held_out: holdoutMetrics,
      overall: overallBinaryMetrics,
    });

    // Score distribution by category across all 45 samples
    const categoryScores: Record<string, number[]> = {};
    for (const s of allScored) {
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
    console.log('[OVERALL SCORE DISTRIBUTION BY PROVENANCE]', distributionSummary);

    // Performance by Genre across all binary samples (human vs AI)
    const genres = ['academic', 'technical', 'corporate', 'conversational', 'creative'] as const;
    const genreMetrics: Record<string, BinaryMetrics> = {};
    for (const genre of genres) {
      const genreSamples = allScored.filter((s) => s.row.genre === genre);
      genreMetrics[genre] = calculateBinaryMetrics(genreSamples, 0.5);
    }
    console.log('[PERFORMANCE BY GENRE]', genreMetrics);

    // Performance by Length category
    const lengths = ['short', 'medium', 'long'] as const;
    const lengthMetrics: Record<string, BinaryMetrics> = {};
    for (const len of lengths) {
      const lenSamples = allScored.filter((s) => s.row.lengthCategory === len);
      lengthMetrics[len] = calculateBinaryMetrics(lenSamples, 0.5);
    }
    console.log('[PERFORMANCE BY LENGTH]', lengthMetrics);

    // Verify denominator constraints
    expect(overallBinaryMetrics.total).toBe(30); // 15 human + 15 AI across all 45 samples
    expect(overallBinaryMetrics.fp).toBe(0); // Zero false positives on verified human text (0/15)
  });
});
