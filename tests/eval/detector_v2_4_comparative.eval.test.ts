/**
 * ============================================================================
 * HUMANIZETEXT DETECTOR V2.4: COMPARATIVE BENCHMARK EVALUATION HARNESS
 * Rigorously benchmarks across identical frozen final test records (N=103):
 *   - Option A: Production Baseline Heuristic (detectorCore.ts)
 *   - Option B: Hand-Weighted Stylometric Discriminator (v2_3/stylometricDiscriminator.ts)
 *   - Option C: Heuristic Score Fusion (v2_3/hybridDetector.ts)
 *   - Option D: V2.4 Genuinely Trained Stylometric Classifier (v2_4/trainedModelInference.ts)
 * ============================================================================
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { computeAiScore } from '../../src/lib/detector/detectorCore';
import { runStylometricDiscriminator } from '../../src/lib/detector/v2_3/stylometricDiscriminator';
import { runHybridDetector } from '../../src/lib/detector/v2_3/hybridDetector';
import { predictV24Text } from '../../src/lib/detector/v2_4/trainedModelInference';
import { DatasetRegistryRecord } from '../../src/lib/detector/v2_4/datasetRegistrySchema';

export interface CandidateEvaluationMetrics {
  optionName: string;
  totalSamples: number;
  totalHuman: number;
  totalAi: number;
  denseTp: number;
  denseFp: number;
  denseTn: number;
  denseFn: number;
  denseAccuracy: number;
  denseBalancedAccuracy: number;
  densePrecision: number;
  denseRecall: number;
  denseSpecificity: number;
  denseFpr: number;
  denseFnr: number;
  denseBrierScore: number;
  selectiveTp: number;
  selectiveFp: number;
  selectiveTn: number;
  selectiveFn: number;
  abstainedCount: number;
  coverageRatio: number;
  selectivePrecision: number;
  selectiveRecall: number;
  cohortEffectiveRecall: number;
  cohortEffectiveFpr: number;
}

function computeMetrics(
  optionName: string,
  records: DatasetRegistryRecord[],
  evaluator: (text: string) => {
    score: number;
    verdict: 'ai' | 'human' | 'inconclusive';
    isAbstained: boolean;
  }
): CandidateEvaluationMetrics {
  const binaryRecords = records.filter((r) => r.authorClass === 'human' || r.authorClass === 'ai');
  const totalSamples = binaryRecords.length;
  const totalHuman = binaryRecords.filter((r) => r.authorClass === 'human').length;
  const totalAi = binaryRecords.filter((r) => r.authorClass === 'ai').length;

  let denseTp = 0;
  let denseFp = 0;
  let denseTn = 0;
  let denseFn = 0;
  let brierSum = 0;

  let selectiveTp = 0;
  let selectiveFp = 0;
  let selectiveTn = 0;
  let selectiveFn = 0;
  let abstainedCount = 0;

  for (const rec of binaryRecords) {
    const isAiGroundTruth = rec.authorClass === 'ai';
    const res = evaluator(rec.text);

    // Dense metric (threshold >= 0.5 is AI)
    const denseIsAi = res.score >= 0.5;
    if (isAiGroundTruth) {
      if (denseIsAi) denseTp++;
      else denseFn++;
      brierSum += Math.pow(res.score - 1.0, 2);
    } else {
      if (denseIsAi) denseFp++;
      else denseTn++;
      brierSum += Math.pow(res.score - 0.0, 2);
    }

    // Selective policy
    if (res.isAbstained || res.verdict === 'inconclusive') {
      abstainedCount++;
    } else {
      const selectiveIsAi = res.verdict === 'ai';
      if (isAiGroundTruth) {
        if (selectiveIsAi) selectiveTp++;
        else selectiveFn++;
      } else {
        if (selectiveIsAi) selectiveFp++;
        else selectiveTn++;
      }
    }
  }

  const denseAccuracy = (denseTp + denseTn) / totalSamples;
  const denseSensitivity = totalAi > 0 ? denseTp / totalAi : 0;
  const denseSpecificity = totalHuman > 0 ? denseTn / totalHuman : 0;
  const denseBalancedAccuracy = (denseSensitivity + denseSpecificity) / 2;
  const densePrecision = (denseTp + denseFp) > 0 ? denseTp / (denseTp + denseFp) : 0;
  const denseRecall = denseSensitivity;
  const denseFpr = 1 - denseSpecificity;
  const denseFnr = 1 - denseSensitivity;
  const denseBrierScore = brierSum / totalSamples;

  const classifiedCount = totalSamples - abstainedCount;
  const coverageRatio = totalSamples > 0 ? classifiedCount / totalSamples : 0;
  const selectivePrecision = (selectiveTp + selectiveFp) > 0 ? selectiveTp / (selectiveTp + selectiveFp) : 0;
  const selectiveRecall = (selectiveTp + selectiveFn) > 0 ? selectiveTp / (selectiveTp + selectiveFn) : 0;
  const cohortEffectiveRecall = totalAi > 0 ? selectiveTp / totalAi : 0;
  const cohortEffectiveFpr = totalHuman > 0 ? selectiveFp / totalHuman : 0;

  return {
    optionName,
    totalSamples,
    totalHuman,
    totalAi,
    denseTp,
    denseFp,
    denseTn,
    denseFn,
    denseAccuracy,
    denseBalancedAccuracy,
    densePrecision,
    denseRecall,
    denseSpecificity,
    denseFpr,
    denseFnr,
    denseBrierScore,
    selectiveTp,
    selectiveFp,
    selectiveTn,
    selectiveFn,
    abstainedCount,
    coverageRatio,
    selectivePrecision,
    selectiveRecall,
    cohortEffectiveRecall,
    cohortEffectiveFpr,
  };
}

describe('V2.4 Comparative Evaluation Across Identical Frozen Records', () => {
  const finalTestPath = resolve(process.cwd(), 'data/v2_4/final_test.jsonl');

  it('runs comparative benchmark on untouched final test records', () => {
    expect(existsSync(finalTestPath)).toBe(true);
    const testRecords: DatasetRegistryRecord[] = readFileSync(finalTestPath, 'utf8')
      .split('\n')
      .filter((l) => l.trim().length > 0)
      .map((l) => JSON.parse(l));

    // Option A: Production Baseline Heuristic
    const optA = computeMetrics('Option A (Production Baseline)', testRecords, (text) => {
      const res = computeAiScore(text);
      const score = res.aiProbability / 100;
      return {
        score,
        verdict: score >= 0.5 ? 'ai' : 'human',
        isAbstained: false,
      };
    });

    // Option B: Hand-Weighted Stylometric Discriminator
    const optB = computeMetrics('Option B (Hand-Weighted Stylometric)', testRecords, (text) => {
      const res = runStylometricDiscriminator(text);
      const score = res.stylisticAiScore;
      return {
        score,
        verdict: score >= 0.5 ? 'ai' : 'human',
        isAbstained: false,
      };
    });

    // Option C: Heuristic Score Fusion (with selective abstention)
    const optC = computeMetrics('Option C (Heuristic Score Fusion)', testRecords, (text) => {
      const res = runHybridDetector(text);
      const score = res.stylisticAiScore;
      const verdict = res.verdict === 'ai' ? 'ai' : (res.verdict === 'human' ? 'human' : 'inconclusive');
      return {
        score,
        verdict,
        isAbstained: res.verdict.startsWith('abstain'),
      };
    });

    // Option D / V2.4: Genuinely Trained Stylometric ML Candidate
    const optD = computeMetrics('Option D (V2.4 Genuinely Trained ML)', testRecords, (text) => {
      const res = predictV24Text(text);
      const score = res.calibratedProbability;
      const verdict = res.verdict === 'ai_like' ? 'ai' : (res.verdict === 'human_like' ? 'human' : 'inconclusive');
      return {
        score,
        verdict,
        isAbstained: res.isAbstained,
      };
    });

    console.log('\n========================================================================');
    console.log('COMPARATIVE BENCHMARK REPORT ON FROZEN UNTOUCHED TEST SET (N=103)');
    console.log('========================================================================');
    const tableData = [optA, optB, optC, optD].map((m) => ({
      Option: m.optionName,
      'Dense Bal Acc': (m.denseBalancedAccuracy * 100).toFixed(1) + '%',
      'Dense Prec': (m.densePrecision * 100).toFixed(1) + '%',
      'Dense Rec': (m.denseRecall * 100).toFixed(1) + '%',
      'Dense Spec': (m.denseSpecificity * 100).toFixed(1) + '%',
      'Dense Brier': m.denseBrierScore.toFixed(3),
      Coverage: (m.coverageRatio * 100).toFixed(1) + '%',
      Abstained: m.abstainedCount,
      'Sel Prec': (m.selectivePrecision * 100).toFixed(1) + '%',
      'Sel Rec': (m.selectiveRecall * 100).toFixed(1) + '%',
      'Cohort Eff Rec': (m.cohortEffectiveRecall * 100).toFixed(1) + '%',
      'Cohort Eff FPR': (m.cohortEffectiveFpr * 100).toFixed(1) + '%',
    }));
    console.table(tableData);

    expect(optD.denseBalancedAccuracy).toBeGreaterThan(0.70);
    expect(optD.selectiveRecall).toBeGreaterThanOrEqual(0.90);
    expect(optD.coverageRatio).toBeGreaterThan(0.70);
  });
});

