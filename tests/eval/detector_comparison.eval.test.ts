import { describe, it, expect, beforeAll } from 'vitest';
import { loadDetection } from './fixtures';
import { adapters } from './adapters';
import { defaultWorkerApiClient } from '../../src/lib/workerApi/client';
import type { DetectionRow } from './types';

interface EvaluationMetrics {
  totalCount: number;
  humanCount: number;
  aiCount: number;
  mixedCount: number;
  falsePositives: number;
  falseNegatives: number;
  falsePositiveRate: number;
  falseNegativeRate: number;
  meanHumanScore: number;
  meanAiScore: number;
  meanMixedScore: number;
  shortTextAccuracy: number;
  longTextAccuracy: number;
  averageLatencyMs: number;
}

describe('AI Detector Baseline vs Candidate Classifiers Evaluation Harness (Phase 6)', () => {
  let dataset: readonly DetectionRow[] = [];
  const scoreText = adapters.scoreText;

  beforeAll(() => {
    dataset = loadDetection();
  });

  function evaluateClassifier(
    results: Array<{ row: DetectionRow; score: number; latencyMs: number }>,
    threshold = 0.5
  ): EvaluationMetrics {
    let falsePositives = 0;
    let falseNegatives = 0;
    const humanScores: number[] = [];
    const aiScores: number[] = [];
    const mixedScores: number[] = [];
    let shortCorrect = 0;
    let shortTotal = 0;
    let longCorrect = 0;
    let longTotal = 0;
    let totalLatency = 0;

    for (const r of results) {
      totalLatency += r.latencyMs;
      const isPredictedAi = r.score >= threshold;
      const wordCount = r.row.text.split(/\s+/).filter(Boolean).length;
      const isShort = wordCount < 50;

      if (r.row.label === 'human') {
        humanScores.push(r.score);
        if (isPredictedAi) falsePositives++;
        if (isShort) {
          shortTotal++;
          if (!isPredictedAi) shortCorrect++;
        } else {
          longTotal++;
          if (!isPredictedAi) longCorrect++;
        }
      } else if (r.row.label === 'ai') {
        aiScores.push(r.score);
        if (!isPredictedAi) falseNegatives++;
        if (isShort) {
          shortTotal++;
          if (isPredictedAi) shortCorrect++;
        } else {
          longTotal++;
          if (isPredictedAi) longCorrect++;
        }
      } else if (r.row.label === 'mixed') {
        mixedScores.push(r.score);
      }
    }

    const mean = (arr: number[]) => (arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

    return {
      totalCount: results.length,
      humanCount: humanScores.length,
      aiCount: aiScores.length,
      mixedCount: mixedScores.length,
      falsePositives,
      falseNegatives,
      falsePositiveRate: humanScores.length > 0 ? falsePositives / humanScores.length : 0,
      falseNegativeRate: aiScores.length > 0 ? falseNegatives / aiScores.length : 0,
      meanHumanScore: Math.round(mean(humanScores) * 1000) / 1000,
      meanAiScore: Math.round(mean(aiScores) * 1000) / 1000,
      meanMixedScore: Math.round(mean(mixedScores) * 1000) / 1000,
      shortTextAccuracy: shortTotal > 0 ? shortCorrect / shortTotal : 1,
      longTextAccuracy: longTotal > 0 ? longCorrect / longTotal : 1,
      averageLatencyMs: results.length > 0 ? Math.round(totalLatency / results.length) : 0,
    };
  }

  it('measures baseline detector performance metrics against evaluation criteria', async () => {
    if (!scoreText) throw new Error('scoreText adapter missing');

    const results = await Promise.all(
      dataset.map(async (row) => {
        const t0 = performance.now();
        const score = await scoreText(row.text);
        const latencyMs = performance.now() - t0;
        return { row, score, latencyMs };
      })
    );

    const metrics = evaluateClassifier(results, 0.45);

    // Verify baseline requirements
    expect(metrics.falsePositiveRate).toBeLessThanOrEqual(0.15); // Low FP on human text
    expect(metrics.meanHumanScore).toBeLessThan(metrics.meanMixedScore); // Mixed text is higher than human
    expect(metrics.meanMixedScore).toBeLessThan(metrics.meanAiScore); // AI text is highest
    expect(metrics.averageLatencyMs).toBeLessThan(100); // Fast local execution
  });

  it('measures worker API detector client on human vs AI sample inputs', async () => {
    const client = defaultWorkerApiClient;
    const humanSample = 'I walked down to the library this morning. The rain had just stopped, and the streets were quiet.';
    const aiSample =
      "In today's fast-paced digital world, it is crucial to delve into the multifaceted tapestry of modern computing. Furthermore, machine learning plays a vital role in our daily lives.";

    const humanRes = await client.detectAi(humanSample);
    const aiRes = await client.detectAi(aiSample);

    expect(humanRes.success).toBe(true);
    expect(aiRes.success).toBe(true);
    expect(humanRes.score.aiProbability).toBeLessThan(0.4);
    expect(aiRes.score.aiProbability).toBeGreaterThan(0.5);
    expect(aiRes.signalsDetected.length).toBeGreaterThan(0);
  });
});
