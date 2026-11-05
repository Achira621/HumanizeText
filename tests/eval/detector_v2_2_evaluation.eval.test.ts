import { describe, it, expect } from 'vitest';
import crypto from 'node:crypto';
import { loadDetectorV2_2Benchmark } from './fixtures';
import { computeAiScore } from '../../src/lib/detector/detectorCore';
import type { DetectorV2_2BenchmarkRow } from './types';

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
  meanSquaredDistanceDiagnostic: number;
}

function calculateBinaryMetrics(
  scoredSamples: Array<{ row: DetectorV2_2BenchmarkRow; score: number }>,
  threshold = 0.5
): BinaryMetrics {
  const binaryOnly = scoredSamples.filter(
    (s) => s.row.label === 'human_verified' || s.row.label === 'ai_generated'
  );

  let tp = 0;
  let fp = 0;
  let tn = 0;
  let fn = 0;
  let msdSum = 0;

  for (const s of binaryOnly) {
    const isPredictedAi = s.score >= threshold;
    const isGroundTruthAi = s.row.label === 'ai_generated';
    const trueProb = isGroundTruthAi ? 1.0 : 0.0;

    msdSum += Math.pow(s.score - trueProb, 2);

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
  const msd = binaryOnly.length > 0 ? msdSum / binaryOnly.length : 0;

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
    meanSquaredDistanceDiagnostic: Math.round(msd * 1000) / 1000,
  };
}

describe('HumanizeText Detector Intelligence V2.2 Comprehensive Evaluation', () => {
  const dataset = loadDetectorV2_2Benchmark();

  it('verifies dataset cryptographic integrity and partition distribution (N=90)', () => {
    expect(dataset.length).toBe(90);

    // Verify SHA-256 for all 90 samples
    for (const row of dataset) {
      const computedHash = crypto.createHash('sha256').update(row.text.trim()).digest('hex');
      expect(computedHash).toBe(row.sha256);
    }

    // Verify partition distributions
    const partitionCounts: Record<string, number> = {};
    for (const row of dataset) {
      partitionCounts[row.partition] = (partitionCounts[row.partition] || 0) + 1;
    }

    expect(partitionCounts['dev']).toBe(15);
    expect(partitionCounts['calibration']).toBe(15);
    expect(partitionCounts['legacy_eval_examined']).toBe(15);
    expect(partitionCounts['fresh_dev']).toBe(15);
    expect(partitionCounts['fresh_calib']).toBe(15);
    expect(partitionCounts['examined_tuning_holdout']).toBe(15);
  });

  it('evaluates examined tuning holdout partition (formerly fresh_held_out, now documented as tuning data) (N=15, 10 binary)', () => {
    const examinedHeldOut = dataset.filter((d) => d.partition === 'examined_tuning_holdout');
    expect(examinedHeldOut.length).toBe(15);

    const scored = examinedHeldOut.map((row) => {
      const res = computeAiScore(row.text);
      return { row, res, score: res.aiProbability };
    });

    const metrics = calculateBinaryMetrics(scored, 0.5);
    console.log('[EXAMINED TUNING HOLDOUT BINARY METRICS]', JSON.stringify(metrics, null, 2));

    // Zero false positives on verified human writing in examined tuning holdout
    expect(metrics.fp).toBe(0);
    expect(metrics.falsePositiveRate).toBe(0.0);
    expect(metrics.specificity).toBe(1.0);

    // Recall on AI generated writing in examined tuning holdout
    expect(metrics.tp).toBeGreaterThanOrEqual(4); // At least 4 of 5 detected
    expect(metrics.recall).toBeGreaterThanOrEqual(0.80);
  });

  it('computes metrics across legacy and fresh partitions with explicit denominators', () => {
    const allScored = dataset.map((row) => {
      const res = computeAiScore(row.text);
      return { row, res, score: res.aiProbability };
    });

    const partitions = [
      'dev',
      'calibration',
      'legacy_eval_examined',
      'fresh_dev',
      'fresh_calib',
      'examined_tuning_holdout',
    ] as const;

    const perPartition: Record<string, BinaryMetrics> = {};
    for (const p of partitions) {
      perPartition[p] = calculateBinaryMetrics(allScored.filter((s) => s.row.partition === p), 0.5);
    }
    console.log('[PER-PARTITION BINARY METRICS]', perPartition);

    const overallMetrics = calculateBinaryMetrics(allScored, 0.5);
    console.log('[OVERALL 60-SAMPLE BINARY METRICS]', overallMetrics);

    // Verify 60 pure binary samples (30 human, 30 AI)
    expect(overallMetrics.total).toBe(60);
    expect(overallMetrics.fp).toBe(0); // Zero false positives across all 30 human samples!
    expect(overallMetrics.specificity).toBe(1.0);
    expect(overallMetrics.tp).toBe(24); // 24 of 30 AI detected
    expect(overallMetrics.fn).toBe(6); // 6 false negatives, all short/conversational

    // Length breakdown across all 60 binary samples
    const lengths = ['short', 'medium', 'long'] as const;
    const lengthMetrics: Record<string, BinaryMetrics> = {};
    for (const len of lengths) {
      lengthMetrics[len] = calculateBinaryMetrics(allScored.filter((s) => s.row.lengthCategory === len), 0.5);
    }
    console.log('[PER-LENGTH BINARY METRICS (UNDEFINED PRECISION CHECK)]', lengthMetrics);

    // Verify that short precision is undefined (null) because tp=0, fp=0
    expect(lengthMetrics['short'].tp).toBe(0);
    expect(lengthMetrics['short'].fp).toBe(0);
    expect(lengthMetrics['short'].precision).toBeNull(); // Mathematically undefined!
  });

  it('measures continuous distributions for collaborative and mixed cohorts (N=30)', () => {
    const allScored = dataset.map((row) => {
      const res = computeAiScore(row.text);
      return { row, res, score: res.aiProbability };
    });

    const cohorts = ['ai_human_edited', 'human_ai_edited', 'mixed_authorship'] as const;
    const summaries: Record<string, any> = {};

    for (const cohort of cohorts) {
      const rows = allScored.filter((s) => s.row.label === cohort);
      const scores = rows.map((r) => r.score);
      const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
      summaries[cohort] = {
        count: rows.length,
        mean: Math.round(mean * 100) / 100,
        min: Math.min(...scores),
        max: Math.max(...scores),
      };
    }

    console.log('[COLLABORATIVE COHORTS SCORE DISTRIBUTIONS (N=30)]', summaries);

    // Verify expected bounds
    expect(summaries['ai_human_edited'].count).toBe(12);
    expect(summaries['ai_human_edited'].mean).toBeLessThan(0.25);
    expect(summaries['human_ai_edited'].count).toBe(12);
    expect(summaries['human_ai_edited'].mean).toBeLessThanOrEqual(0.25);
    expect(summaries['mixed_authorship'].count).toBe(6);
    expect(summaries['mixed_authorship'].mean).toBeGreaterThanOrEqual(0.60);
  });
});
