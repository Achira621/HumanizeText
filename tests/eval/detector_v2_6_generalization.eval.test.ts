import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { executeDetectorEngine } from '../../src/lib/detector/candidateIntegrationBoundary';
import { analyzeHierarchicalContent } from '../../src/lib/detector/v2_6/hierarchicalDetector';

interface EvalRecord {
  id: string;
  genre: string;
  lengthCategory: 'short' | 'medium' | 'long';
  label: 'human' | 'ai' | 'mixed' | 'human_edited_ai';
  origin: string;
  provenance: string;
  text: string;
}

interface MetricSummary {
  total: number;
  tp: number;
  fp: number;
  tn: number;
  fn: number;
  precision: number;
  recall: number;
  specificity: number;
  fpr: number;
  fnr: number;
  f1: number;
  balancedAccuracy: number;
  brierScore: number;
  ece: number;
}

function computeMetrics(items: { record: EvalRecord; prob: number; predAi: boolean }[]): MetricSummary {
  let tp = 0;
  let fp = 0;
  let tn = 0;
  let fn = 0;
  let sumBrier = 0;

  for (const { record, prob, predAi } of items) {
    const isAi = record.label === 'ai';
    const yTrue = isAi ? 1.0 : 0.0;
    sumBrier += Math.pow(prob - yTrue, 2);

    if (predAi && isAi) tp++;
    else if (predAi && !isAi) fp++;
    else if (!predAi && !isAi) tn++;
    else if (!predAi && isAi) fn++;
  }

  const total = items.length;
  const precision = tp + fp > 0 ? tp / (tp + fp) : 1;
  const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
  const specificity = tn + fp > 0 ? tn / (tn + fp) : 1;
  const fpr = tn + fp > 0 ? fp / (tn + fp) : 0;
  const fnr = tp + fn > 0 ? fn / (tp + fn) : 0;
  const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
  const balancedAccuracy = (recall + specificity) / 2;
  const brierScore = total > 0 ? sumBrier / total : 0;

  // ECE calculation with 5 equal-width bins
  const numBins = 5;
  let totalEce = 0;
  for (let b = 0; b < numBins; b++) {
    const binMin = b / numBins;
    const binMax = (b + 1) / numBins;
    const binItems = items.filter((x) =>
      b === numBins - 1 ? x.prob >= binMin && x.prob <= binMax : x.prob >= binMin && x.prob < binMax
    );
    if (binItems.length > 0) {
      const avgConf = binItems.reduce((acc, cur) => acc + cur.prob, 0) / binItems.length;
      const trueFraction = binItems.filter((x) => x.record.label === 'ai').length / binItems.length;
      totalEce += (binItems.length / total) * Math.abs(avgConf - trueFraction);
    }
  }

  return {
    total,
    tp,
    fp,
    tn,
    fn,
    precision: Math.round(precision * 1000) / 1000,
    recall: Math.round(recall * 1000) / 1000,
    specificity: Math.round(specificity * 1000) / 1000,
    fpr: Math.round(fpr * 1000) / 1000,
    fnr: Math.round(fnr * 1000) / 1000,
    f1: Math.round(f1 * 1000) / 1000,
    balancedAccuracy: Math.round(balancedAccuracy * 1000) / 1000,
    brierScore: Math.round(brierScore * 10000) / 10000,
    ece: Math.round(totalEce * 10000) / 10000,
  };
}

describe('HumanizeText Detector V2.6: Real-World Generalisation & Held-Out Evaluation', () => {
  const fixturePath = path.resolve(__dirname, 'fixtures/detector_v2_6_generalization_heldout.json');
  const dataset: EvalRecord[] = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

  it('maintains permanent regression protection on the verified 72-word known-human instruction', () => {
    const sample = dataset.find((d) => d.id === 'v2_6_eval_01_human_instruction_72w');
    expect(sample).toBeDefined();

    const result = executeDetectorEngine(sample!.text, { engineId: 'v2_6_hierarchical' });
    expect(result.engineId).toBe('v2_6_hierarchical');
    expect(result.verdict).toBe('human');
    expect(result.score).toBeLessThan(0.35);
    const v26 = result.rawCandidateResult as any;
    expect(v26?.humanStyleScore).toBeGreaterThan(65);
    expect(v26?.aiSignatureScore).toBeLessThan(35);
  });

  it('evaluates binary generalisation across held-out verified human and AI cohorts', () => {
    // Exclude inconclusive short texts (< 40 words) for binary metric evaluation
    const evaluableRecords = dataset.filter(
      (d) => (d.label === 'human' || d.label === 'ai') && d.lengthCategory !== 'short'
    );
    expect(evaluableRecords.length).toBeGreaterThanOrEqual(18);

    const results: { record: EvalRecord; prob: number; predAi: boolean }[] = [];

    for (const record of evaluableRecords) {
      const res = executeDetectorEngine(record.text, { engineId: 'v2_6_hierarchical' });
      const prob = res.score;
      const predAi = res.verdict === 'ai' || prob >= 0.5;
      results.push({ record, prob, predAi });
    }

    const metrics = computeMetrics(results);

    console.log('\n======================================================');
    console.log('   DETECTOR V2.6 HELD-OUT GENERALISATION BENCHMARK');
    console.log('======================================================');
    console.log(`Evaluated Binary Samples: ${metrics.total}`);
    console.log(`True Positives (TP):      ${metrics.tp}`);
    console.log(`False Positives (FP):     ${metrics.fp}`);
    console.log(`True Negatives (TN):      ${metrics.tn}`);
    console.log(`False Negatives (FN):     ${metrics.fn}`);
    console.log(`False Positive Rate:      ${(metrics.fpr * 100).toFixed(1)}%`);
    console.log(`False Negative Rate:      ${(metrics.fnr * 100).toFixed(1)}%`);
    console.log(`Precision:                ${(metrics.precision * 100).toFixed(1)}%`);
    console.log(`Recall:                   ${(metrics.recall * 100).toFixed(1)}%`);
    console.log(`F1 Score:                 ${(metrics.f1 * 100).toFixed(1)}%`);
    console.log(`Balanced Accuracy:        ${(metrics.balancedAccuracy * 100).toFixed(1)}%`);
    console.log(`Brier Calibration Score:  ${metrics.brierScore}`);
    console.log(`Expected Calib Error:     ${(metrics.ece * 100).toFixed(2)}%`);
    console.log('======================================================\n');

    // Credible real-world held-out guarantees:
    // AI recall remains exceptional (100% of tested non-short AI caught)
    expect(metrics.recall).toBeGreaterThanOrEqual(0.95);
    expect(metrics.tp).toBeGreaterThanOrEqual(7);
    expect(metrics.fn).toBe(0);
  });

  it('stratifies detector performance by genre (Conversational, Academic, Technical, Corporate, ESL, Creative)', () => {
    const genres = ['conversational', 'academic', 'technical', 'corporate', 'esl', 'creative'];

    console.log('--- RECONCILED SAMPLE-LEVEL TABLE ---');
    console.log('SampleID | Genre | Label | Len | Score | Verdict | Abstained | IncludedInBinary');
    for (const record of dataset) {
      const res = executeDetectorEngine(record.text, { engineId: 'v2_6_hierarchical' });
      const included = record.lengthCategory !== 'short' && (record.label === 'human' || record.label === 'ai');
      console.log(
        `${record.id} | ${record.genre} | ${record.label} | ${record.lengthCategory} | ${res.score.toFixed(3)} | ${res.verdict} | ${res.isAbstained} | ${included}`
      );
    }

    console.log('\n--- GENRE-STRATIFIED PERFORMANCE ---');
    for (const genre of genres) {
      const genreRecords = dataset.filter(
        (d) => d.genre === genre && (d.label === 'human' || d.label === 'ai') && d.lengthCategory !== 'short'
      );
      if (genreRecords.length === 0) continue;

      const results = [];
      for (const record of genreRecords) {
        const res = executeDetectorEngine(record.text, { engineId: 'v2_6_hierarchical' });
        const prob = res.score;
        const predAi = res.verdict === 'ai' || prob >= 0.5;
        results.push({ record, prob, predAi });
      }

      const m = computeMetrics(results);
      console.log(
        `[${genre.toUpperCase()}] N=${m.total} | FP=${m.fp} | FN=${m.fn} | FPR: ${(m.fpr * 100).toFixed(0)}% | Recall: ${(m.recall * 100).toFixed(0)}% | BalAcc: ${(m.balancedAccuracy * 100).toFixed(0)}%`
      );
    }
  });

  it('correctly returns inconclusive for short text samples under 40 words', () => {
    const shortRecords = dataset.filter((d) => d.lengthCategory === 'short');
    expect(shortRecords.length).toBeGreaterThanOrEqual(2);

    for (const record of shortRecords) {
      const res = executeDetectorEngine(record.text, { engineId: 'v2_6_hierarchical' });
      expect(res.verdict).toBe('inconclusive');
      expect(res.isAbstained).toBe(true);
    }
  });
});
