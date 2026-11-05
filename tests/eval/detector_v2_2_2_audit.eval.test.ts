import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { loadDetectorV2_2_1Holdout } from './fixtures';
import { computeAiScore } from '../../src/lib/detector/detectorCore';
import type { DetectorV2_2_1HoldoutRow } from './types';

interface AuditMetrics {
  total: number;
  tp: number;
  fp: number;
  tn: number;
  fn: number;
  precision: number | null;
  recall: number | null;
  specificity: number | null;
  fpr: number | null;
  fnr: number | null;
  balancedAccuracy: number | null;
  meanSquaredDistance: number;
}

export function computeAuditMetrics(
  items: { row: DetectorV2_2_1HoldoutRow; score: number }[],
  threshold = 0.5
): AuditMetrics {
  let tp = 0;
  let fp = 0;
  let tn = 0;
  let fn = 0;
  let sumSquaredDist = 0;

  for (const { row, score } of items) {
    const isAi = row.label === 'ai_generated';
    const predAi = score >= threshold;
    const yTrue = isAi ? 1.0 : 0.0;
    sumSquaredDist += Math.pow(yTrue - score, 2);

    if (predAi && isAi) tp++;
    else if (predAi && !isAi) fp++;
    else if (!predAi && !isAi) tn++;
    else if (!predAi && isAi) fn++;
  }

  const total = items.length;
  const nPositive = tp + fn;
  const nNegative = tn + fp;

  const precision = tp + fp > 0 ? Math.round((tp / (tp + fp)) * 1000) / 1000 : null;
  const recall = nPositive > 0 ? Math.round((tp / nPositive) * 1000) / 1000 : null;
  const specificity = nNegative > 0 ? Math.round((tn / nNegative) * 1000) / 1000 : null;
  const fpr = nNegative > 0 ? Math.round((fp / nNegative) * 1000) / 1000 : null;
  const fnr = nPositive > 0 ? Math.round((fn / nPositive) * 1000) / 1000 : null;

  let balancedAccuracy: number | null = null;
  if (recall !== null && specificity !== null) {
    balancedAccuracy = Math.round(((recall + specificity) / 2) * 1000) / 1000;
  }

  const meanSquaredDistance = total > 0 ? Math.round((sumSquaredDist / total) * 10000) / 10000 : 0;

  return {
    total,
    tp,
    fp,
    tn,
    fn,
    precision,
    recall,
    specificity,
    fpr,
    fnr,
    balancedAccuracy,
    meanSquaredDistance,
  };
}

describe('Detector V2.2.2 Independent Metric Audit & Integrity Test Suite', () => {
  it('validates candidate behavioral contract and holdout fixture cryptographic hash', () => {
    const HISTORICAL_V2_2_CORE_SHA256 = '095C022E01E4992020EA58FDEC2AE11A9AA9726999724955EE9EF33BFE5F851C';
    expect(HISTORICAL_V2_2_CORE_SHA256).toBeDefined();
    expect(typeof computeAiScore).toBe('function');
    const smokeScore = computeAiScore('Deterministic holdout audit input.');
    expect(smokeScore.aiProbability).toBe(0.18);
    expect(smokeScore.sampleSufficiency).toBe('insufficient');
    expect(smokeScore.wordCount).toBe(4);

    const fixturePath = path.resolve('tests/eval/fixtures/detector_v2_2_1_holdout.json');
    const fixtureContent = fs.readFileSync(fixturePath, 'utf-8').replace(/\r\n/g, '\n');
    const fixtureSha256 = crypto.createHash('sha256').update(fixtureContent, 'utf-8').digest('hex');
    expect(fixtureSha256).toBe('b99092951ff1eb3d06b5bf2f37c4a2636465defbcc466118e264355d48ca60a5');
  });

  it('verifies that computeAuditMetrics returns null for precision when no positives are predicted', () => {
    const mockItems: { row: DetectorV2_2_1HoldoutRow; score: number }[] = [
      {
        row: {
          id: 'test_1',
          partition: 'fresh_held_out_v2_2_1',
          genre: 'creative',
          lengthCategory: 'medium',
          wordCount: 60,
          label: 'human_verified',
          sha256: '',
          provenance: { authorOrSource: '', method: '', date: '', previouslyExamined: false },
          text: '',
        },
        score: 0.1,
      },
    ];

    const res = computeAuditMetrics(mockItems, 0.5);
    expect(res.tp).toBe(0);
    expect(res.fp).toBe(0);
    expect(res.precision).toBeNull(); // Must be null, not 0 or NaN
  });

  it('independently executes detector and verifies exact integer counts across 100 binary holdout samples', () => {
    const dataset = loadDetectorV2_2_1Holdout();
    const binarySamples = dataset.filter((d) => d.label === 'human_verified' || d.label === 'ai_generated');
    expect(binarySamples.length).toBe(100);

    const scored = binarySamples.map((row) => ({
      row,
      score: computeAiScore(row.text).aiProbability,
    }));

    const metrics = computeAuditMetrics(scored, 0.5);

    expect(metrics.total).toBe(100);
    expect(metrics.tp).toBe(13);
    expect(metrics.fp).toBe(3);
    expect(metrics.tn).toBe(47);
    expect(metrics.fn).toBe(37);

    expect(metrics.precision).toBe(0.813);
    expect(metrics.recall).toBe(0.26);
    expect(metrics.specificity).toBe(0.94);
    expect(metrics.fpr).toBe(0.06);
    expect(metrics.fnr).toBe(0.74);
    expect(metrics.balancedAccuracy).toBe(0.60);
    expect(metrics.meanSquaredDistance).toBe(0.2584);
  });

  it('confirms the 3 human false positives and their exact failure modes', () => {
    const dataset = loadDetectorV2_2_1Holdout();
    const humanSamples = dataset.filter((d) => d.label === 'human_verified');
    const scored = humanSamples.map((row) => ({
      row,
      res: computeAiScore(row.text),
    }));

    const fps = scored.filter((s) => s.res.aiProbability >= 0.5);
    expect(fps.length).toBe(3);

    const fpIds = fps.map((s) => s.row.id);
    expect(fpIds).toContain('holdout_h_acad_02');
    expect(fpIds).toContain('holdout_h_corp_22');
    expect(fpIds).toContain('holdout_h_corp_28');

    // Russell sample matches "one of the most"
    const russell = fps.find((s) => s.row.id === 'holdout_h_acad_02');
    expect(russell?.res.matchingSignatures).toContain('one of the most');

    // Federal Reserve report matches "robust"
    const fed = fps.find((s) => s.row.id === 'holdout_h_corp_22');
    expect(fed?.res.matchingSignatures).toContain('robust');

    // FTC statement matches "comprehensive" & "implement"
    const ftc = fps.find((s) => s.row.id === 'holdout_h_corp_28');
    expect(ftc?.res.matchingSignatures).toContain('comprehensive');
    expect(ftc?.res.matchingSignatures).toContain('implement');
  });
});

