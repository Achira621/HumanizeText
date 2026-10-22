import { beforeAll, describe, expect, it } from 'vitest';
import { adapters } from './adapters';
import { loadDetection } from './fixtures';
import { GATES } from './gates';
import { bestThreshold, confusion, mean, prf, rocAuc, round, wilsonConfidenceInterval } from './metrics';
import type { DetectionRow } from './types';

interface Scored {
  readonly row: DetectionRow;
  readonly score: number;
}

const scoreText = adapters.scoreText;

describe.skipIf(scoreText === undefined)('AI detector evaluation', () => {
  let scored: Scored[] = [];

  beforeAll(async () => {
    if (!scoreText) throw new Error('scoreText adapter not wired');
    const rows = loadDetection();
    scored = await Promise.all(rows.map(async (row) => ({ row, score: await scoreText(row.text) })));
  });

  const binary = (split: 'train' | 'test'): { scores: number[]; labels: boolean[] } => {
    const subset = scored.filter((s) => s.row.split === split && s.row.label !== 'mixed');
    return { scores: subset.map((s) => s.score), labels: subset.map((s) => s.row.label === 'ai') };
  };

  it('scores stay within [0, 1]', () => {
    for (const s of scored) {
      expect(s.score).toBeGreaterThanOrEqual(0);
      expect(s.score).toBeLessThanOrEqual(1);
    }
  });

  it('separates AI from human on held-out topics (threshold calibrated on train only)', () => {
    const train = binary('train');
    const test = binary('test');
    const { threshold } = bestThreshold(train.scores, train.labels);
    const conf = confusion(test.scores, test.labels, threshold);
    const metrics = prf(conf);
    const auc = rocAuc(test.scores, test.labels);

    const precCi = wilsonConfidenceInterval(conf.tp, conf.tp + conf.fp);
    const recallCi = wilsonConfidenceInterval(conf.tp, conf.tp + conf.fn);
    const fprCi = wilsonConfidenceInterval(conf.fp, conf.fp + conf.tn);

    console.info('[detector evaluation report]', {
      trainSampleSize: train.scores.length,
      testSampleSize: test.scores.length,
      threshold,
      confusion: conf,
      auc: round(auc),
      precision: round(metrics.precision),
      precision95CI: precCi,
      recall: round(metrics.recall),
      recall95CI: recallCi,
      f1: round(metrics.f1),
      fpr: round(metrics.fpr),
      fpr95CI: fprCi,
    });
    expect(auc).toBeGreaterThanOrEqual(GATES.detector.minAucTest);
    expect(metrics.f1).toBeGreaterThanOrEqual(GATES.detector.minF1Test);
  });

  it('ranks mixed text between human and AI on average', () => {
    const avg = (label: DetectionRow['label']): number =>
      mean(scored.filter((s) => s.row.label === label).map((s) => s.score));
    const [human, mixed, ai] = [avg('human'), avg('mixed'), avg('ai')];
    console.info('[detector] mean score', { human: round(human), mixed: round(mixed), ai: round(ai) });
    expect(human + GATES.detector.orderingSlack).toBeLessThan(mixed);
    expect(mixed + GATES.detector.orderingSlack).toBeLessThan(ai);
  });
});
