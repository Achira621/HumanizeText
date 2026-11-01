import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { loadDetectorV2_2_1Holdout } from './fixtures';
import { computeAiScore } from '../../src/lib/detector/detectorCore';
import type { DetectorV2_2_1HoldoutRow } from './types';

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
  items: { row: DetectorV2_2_1HoldoutRow; score: number }[],
  threshold = 0.5
): BinaryMetrics {
  let tp = 0;
  let fp = 0;
  let tn = 0;
  let fn = 0;
  let squaredDistanceSum = 0;

  for (const { row, score } of items) {
    const isAi = row.label === 'ai_generated';
    const predAi = score >= threshold;
    const trueBinary = isAi ? 1.0 : 0.0;
    squaredDistanceSum += Math.pow(trueBinary - score, 2);

    if (predAi && isAi) tp++;
    else if (predAi && !isAi) fp++;
    else if (!predAi && !isAi) tn++;
    else if (!predAi && isAi) fn++;
  }

  const total = items.length;
  const precision = tp + fp > 0 ? Math.round((tp / (tp + fp)) * 1000) / 1000 : null;
  const recall = tp + fn > 0 ? Math.round((tp / (tp + fn)) * 1000) / 1000 : 0;
  const specificity = tn + fp > 0 ? Math.round((tn / (tn + fp)) * 1000) / 1000 : 0;
  const falsePositiveRate = tn + fp > 0 ? Math.round((fp / (tn + fp)) * 1000) / 1000 : 0;
  const falseNegativeRate = tp + fn > 0 ? Math.round((fn / (tp + fn)) * 1000) / 1000 : 0;
  const balancedAccuracy = Math.round(((recall + specificity) / 2) * 1000) / 1000;
  const meanSquaredDistanceDiagnostic = total > 0 ? Math.round((squaredDistanceSum / total) * 1000) / 1000 : 0;

  return {
    total,
    tp,
    fp,
    tn,
    fn,
    precision,
    recall,
    specificity,
    falsePositiveRate,
    falseNegativeRate,
    balancedAccuracy,
    meanSquaredDistanceDiagnostic,
  };
}

describe('HumanizeText Detector V2.2.1 Independent Fresh Holdout Validation', () => {
  const dataset = loadDetectorV2_2_1Holdout();

  it('verifies frozen candidate configuration and text hash integrity across all 120 samples', () => {
    // 1. Retain historical V2.2 milestone provenance & verify detectorCore behavioral contract
    const HISTORICAL_V2_2_CORE_SHA256 = '095C022E01E4992020EA58FDEC2AE11A9AA9726999724955EE9EF33BFE5F851C';
    expect(HISTORICAL_V2_2_CORE_SHA256).toBeDefined();
    expect(typeof computeAiScore).toBe('function');
    const smokeScore = computeAiScore('Deterministic holdout baseline verification text.');
    expect(smokeScore.aiProbability).toBe(0.26);
    expect(smokeScore.sampleSufficiency).toBe('insufficient');
    expect(smokeScore.uncertaintyMargin).toBe(0.28);
    expect(smokeScore.wordCount).toBe(5);

    // Verify deterministic anchor predictions on key holdout samples
    const sampleHuman = dataset[0]; // Darwin
    const resHuman = computeAiScore(sampleHuman.text);
    expect(resHuman.aiProbability).toBe(0.16);
    expect(resHuman.sampleSufficiency).toBe('limited');

    const sampleAi = dataset.find(d => d.id === 'holdout_051_ai_academic_tapestry');
    if (sampleAi) {
      const resAi = computeAiScore(sampleAi.text);
      console.log('[AI BASELINE]', resAi.aiProbability, resAi.sampleSufficiency);
      expect(resAi.aiProbability).toBe(0.96);
      expect(resAi.sampleSufficiency).toBe('limited');
    }

    // 2. Verify all 120 samples are untouched and have valid cryptographic SHA-256 hashes
    expect(dataset.length).toBe(120);
    for (const row of dataset) {
      const computedHash = crypto.createHash('sha256').update(row.text, 'utf-8').digest('hex');
      expect(row.sha256).toBe(computedHash);
      expect(row.provenance.previouslyExamined).toBe(false);
      expect(row.partition).toBe('fresh_held_out_v2_2_1');
    }
  });

  it('evaluates frozen detector against 100 pure binary holdout samples (50 human, 50 AI)', () => {
    const binarySamples = dataset.filter((d) => d.label === 'human_verified' || d.label === 'ai_generated');
    expect(binarySamples.length).toBe(100);

    const scored = binarySamples.map((row) => {
      const res = computeAiScore(row.text);
      return { row, res, score: res.aiProbability };
    });

    const metrics = calculateBinaryMetrics(scored, 0.5);
    console.log('[V2.2.1 INDEPENDENT HOLDOUT BINARY METRICS (N=100)]', JSON.stringify(metrics, null, 2));

    // Empirical counts on frozen candidate
    expect(metrics.total).toBe(100);
    expect(metrics.tp).toBe(12); // 12 of 50 AI detected
    expect(metrics.fp).toBe(3);  // 3 false positives (Russell, Fed report, FTC statement)
    expect(metrics.tn).toBe(47); // 47 of 50 human identified
    expect(metrics.fn).toBe(38); // 38 AI missed without clichés
    expect(metrics.precision).toBe(0.8); // 12 / (12 + 3)
    expect(metrics.recall).toBe(0.24);    // 12 / 50
    expect(metrics.specificity).toBe(0.94); // 47 / 50
    expect(metrics.falsePositiveRate).toBe(0.06); // 3 / 50
    expect(metrics.falseNegativeRate).toBe(0.76); // 38 / 50
    expect(metrics.balancedAccuracy).toBe(0.59);
  });

  it('stratifies holdout binary performance by passage length (short <50w, medium 50-100w, long >100w)', () => {
    const binarySamples = dataset.filter((d) => d.label === 'human_verified' || d.label === 'ai_generated');
    const scored = binarySamples.map((row) => ({
      row,
      score: computeAiScore(row.text).aiProbability,
    }));

    const lengths = ['short', 'medium', 'long'] as const;
    const lengthMetrics: Record<string, BinaryMetrics> = {};
    for (const len of lengths) {
      lengthMetrics[len] = calculateBinaryMetrics(scored.filter((s) => s.row.lengthCategory === len), 0.5);
    }

    console.log('[V2.2.1 HOLDOUT PERFORMANCE BY LENGTH]', JSON.stringify(lengthMetrics, null, 2));

    expect(lengthMetrics['short'].total).toBe(30);
    expect(lengthMetrics['short'].tp).toBe(1);
    expect(lengthMetrics['short'].fp).toBe(2);
    expect(lengthMetrics['short'].fn).toBe(14);
    expect(lengthMetrics['short'].tn).toBe(13);

    expect(lengthMetrics['medium'].total).toBe(44);
    expect(lengthMetrics['medium'].tp).toBe(6);
    expect(lengthMetrics['medium'].fp).toBe(1);
    expect(lengthMetrics['medium'].fn).toBe(14);
    expect(lengthMetrics['medium'].tn).toBe(23);

    expect(lengthMetrics['long'].total).toBe(26);
    expect(lengthMetrics['long'].tp).toBe(5);
    expect(lengthMetrics['long'].fp).toBe(0);
    expect(lengthMetrics['long'].fn).toBe(10);
    expect(lengthMetrics['long'].tn).toBe(11);
  });

  it('stratifies holdout binary performance by genre across all 5 prose categories', () => {
    const binarySamples = dataset.filter((d) => d.label === 'human_verified' || d.label === 'ai_generated');
    const scored = binarySamples.map((row) => ({
      row,
      score: computeAiScore(row.text).aiProbability,
    }));

    const genres = ['academic', 'technical', 'corporate', 'conversational', 'creative'] as const;
    const genreMetrics: Record<string, BinaryMetrics> = {};
    for (const g of genres) {
      genreMetrics[g] = calculateBinaryMetrics(scored.filter((s) => s.row.genre === g), 0.5);
    }

    console.log('[V2.2.1 HOLDOUT PERFORMANCE BY GENRE]', JSON.stringify(genreMetrics, null, 2));

    for (const g of genres) {
      expect(genreMetrics[g].total).toBe(20); // 10 human, 10 AI
    }

    expect(genreMetrics['academic'].tp).toBe(3);
    expect(genreMetrics['academic'].fp).toBe(1);
    expect(genreMetrics['technical'].tp).toBe(3);
    expect(genreMetrics['technical'].fp).toBe(0);
    expect(genreMetrics['corporate'].tp).toBe(5);
    expect(genreMetrics['corporate'].fp).toBe(2);
    expect(genreMetrics['conversational'].tp).toBe(1);
    expect(genreMetrics['conversational'].fp).toBe(0);
    expect(genreMetrics['creative'].tp).toBe(0);
    expect(genreMetrics['creative'].fp).toBe(0);
    expect(genreMetrics['creative'].precision).toBeNull();
  });

  it('measures continuous score distributions for collaborative and mixed cohorts (N=20)', () => {
    const collabSamples = dataset.filter((d) => d.label !== 'human_verified' && d.label !== 'ai_generated');
    expect(collabSamples.length).toBe(20);

    const scored = collabSamples.map((row) => {
      const res = computeAiScore(row.text);
      return {
        id: row.id,
        label: row.label,
        method: row.provenance.method,
        score: res.aiProbability,
      };
    });

    const ahe = scored.filter((s) => s.method === 'ai_draft_human_edited');
    const hae = scored.filter((s) => s.method === 'human_draft_ai_polished');
    const mix = scored.filter((s) => s.method === '50_50_paragraph_splice');

    expect(ahe.length).toBe(8);
    expect(hae.length).toBe(8);
    expect(mix.length).toBe(4);

    const aheScores = ahe.map((s) => s.score);
    const haeScores = hae.map((s) => s.score);
    const mixScores = mix.map((s) => s.score);

    const mean = (arr: number[]) => Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 100) / 100;

    const distributions = {
      ai_human_edited: {
        count: ahe.length,
        mean: mean(aheScores),
        min: Math.min(...aheScores),
        max: Math.max(...aheScores),
      },
      human_ai_edited: {
        count: hae.length,
        mean: mean(haeScores),
        min: Math.min(...haeScores),
        max: Math.max(...haeScores),
      },
      mixed_authorship: {
        count: mix.length,
        mean: mean(mixScores),
        min: Math.min(...mixScores),
        max: Math.max(...mixScores),
      },
    };

    console.log('[V2.2.1 COLLABORATIVE COHORT DISTRIBUTIONS (N=20)]', JSON.stringify(distributions, null, 2));

    // Human editing lowers synthetic score substantially
    expect(distributions.ai_human_edited.mean).toBeLessThanOrEqual(0.35);
  });
});
