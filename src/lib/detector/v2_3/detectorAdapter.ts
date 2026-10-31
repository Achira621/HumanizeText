/**
 * ============================================================================
 * HUMANIZETEXT DETECTOR V2.3.1: EXPERIMENTAL COMPARATIVE DETECTOR ADAPTER
 * Unified execution and benchmarking harness for Options A, B, and C.
 * 
 * Provides mathematically explicit accounting for selective abstentions,
 * tracking class-specific coverage and cohort-wide effective recall.
 * ============================================================================
 */

import type {
  DetectorOptionId,
  V23DetectionResult,
  V23EvaluationMetrics,
  V23Verdict,
} from './types';
import { computeAiScore } from '../detectorCore';
import { extractV23Features } from './featureExtractor';
import { runStylometricDiscriminator } from './stylometricDiscriminator';
import { runHybridDetector, type HybridDetectorConfig } from './hybridDetector';

/**
 * Unified execution adapter for benchmarking all three detector options on identical inputs.
 */
export function evaluateDetectorOption(
  text: string,
  option: DetectorOptionId,
  config?: HybridDetectorConfig
): V23DetectionResult {
  const startTime = performance.now();

  if (option === 'option_a_heuristic') {
    // Unchanged Option A production baseline
    const analysis = computeAiScore(text);
    const elapsed = Math.round((performance.now() - startTime) * 100) / 100;
    const { features, wordCount, sentenceCount, characterCount } = extractV23Features(text);

    const aiScore = Number(analysis.aiProbability.toFixed(3));
    const isAi = aiScore >= 0.50;
    const verdict: V23Verdict = isAi ? 'ai' : 'human';
    const confidence = aiScore >= 0.80 || aiScore <= 0.20 ? 'high' : 'moderate';

    return {
      version: '2.3.1',
      detectorOption: 'option_a_heuristic',
      stylisticAiScore: aiScore,
      humanMatchScore: Number((1 - aiScore).toFixed(3)),
      aiProbability: aiScore,
      humanProbability: Number((1 - aiScore).toFixed(3)),
      verdict,
      confidence,
      isAbstained: false,
      abstentionReason: null,
      wordCount,
      sentenceCount,
      characterCount,
      inferenceDurationMs: elapsed,
      features,
      topAttributions: [],
      componentScores: {
        heuristicScore: aiScore,
        stylometricScore: 0,
        learnedScore: 0,
      },
    };
  }

  if (option === 'option_b_stylometric' || option === 'option_b_learned') {
    return runStylometricDiscriminator(text);
  }

  if (option === 'option_c_hybrid') {
    return runHybridDetector(text, config);
  }

  throw new Error(`Unknown detector option: "${option}"`);
}

/**
 * Computes mathematically explicit diagnostic metrics across a scored evaluation cohort.
 * Tracks class-specific coverage, selective precision/recall, and cohort-wide effective recall.
 */
export function computeEvaluationMetrics(
  scoredItems: Array<{
    label: string;
    result: V23DetectionResult;
  }>,
  threshold = 0.50
): V23EvaluationMetrics {
  let totalHumanSamples = 0;
  let totalAiSamples = 0;
  let humanSamplesClassified = 0;
  let aiSamplesClassified = 0;
  let humanSamplesAbstained = 0;
  let aiSamplesAbstained = 0;

  let tp = 0;
  let fp = 0;
  let tn = 0;
  let fn = 0;
  let squaredDistanceSum = 0;

  const validContinuous: Array<{ trueLabel: number; score: number }> = [];

  for (const { label, result } of scoredItems) {
    const isAiGroundTruth = label === 'ai_generated' || label === 'ai';
    const isHumanGroundTruth = label === 'human_verified' || label === 'human';

    // Only binary samples are included in confusion matrix calculation
    if (!isAiGroundTruth && !isHumanGroundTruth) {
      continue;
    }

    if (isAiGroundTruth) totalAiSamples++;
    if (isHumanGroundTruth) totalHumanSamples++;

    const trueBinary = isAiGroundTruth ? 1.0 : 0.0;
    const score = result.stylisticAiScore ?? result.aiProbability;
    squaredDistanceSum += Math.pow(trueBinary - score, 2);

    if (result.isAbstained) {
      if (isAiGroundTruth) aiSamplesAbstained++;
      if (isHumanGroundTruth) humanSamplesAbstained++;
      continue;
    }

    if (isAiGroundTruth) aiSamplesClassified++;
    if (isHumanGroundTruth) humanSamplesClassified++;

    validContinuous.push({ trueLabel: trueBinary, score });

    const predictedAi = result.verdict === 'ai' || (result.verdict !== 'human' && score >= threshold);

    if (isAiGroundTruth) {
      if (predictedAi) tp++;
      else fn++;
    } else {
      if (predictedAi) fp++;
      else tn++;
    }
  }

  const totalSamples = totalHumanSamples + totalAiSamples;
  const totalClassified = tp + fp + tn + fn;
  const totalAbstained = humanSamplesAbstained + aiSamplesAbstained;

  // Selective metrics (computed strictly over classified/evaluated samples)
  const selectivePrecision = tp + fp > 0 ? Number((tp / (tp + fp)).toFixed(3)) : null;
  const selectiveRecall = tp + fn > 0 ? Number((tp / (tp + fn)).toFixed(3)) : null;
  const selectiveSpecificity = tn + fp > 0 ? Number((tn / (tn + fp)).toFixed(3)) : null;
  const selectiveFalsePositiveRate = tn + fp > 0 ? Number((fp / (tn + fp)).toFixed(3)) : null;
  const selectiveFalseNegativeRate = tp + fn > 0 ? Number((fn / (tp + fn)).toFixed(3)) : null;

  let selectiveBalancedAccuracy: number | null = null;
  if (selectiveRecall !== null && selectiveSpecificity !== null) {
    selectiveBalancedAccuracy = Number(((selectiveRecall + selectiveSpecificity) / 2).toFixed(3));
  }

  let selectiveF1Score: number | null = null;
  if (selectivePrecision !== null && selectiveRecall !== null && selectivePrecision + selectiveRecall > 0) {
    selectiveF1Score = Number(((2 * selectivePrecision * selectiveRecall) / (selectivePrecision + selectiveRecall)).toFixed(3));
  }

  // Coverage metrics
  const humanCoverage = totalHumanSamples > 0 ? Number((humanSamplesClassified / totalHumanSamples).toFixed(3)) : 0;
  const aiCoverage = totalAiSamples > 0 ? Number((aiSamplesClassified / totalAiSamples).toFixed(3)) : 0;
  const totalCoverage = totalSamples > 0 ? Number((totalClassified / totalSamples).toFixed(3)) : 0;
  const abstentionRate = totalSamples > 0 ? Number((totalAbstained / totalSamples).toFixed(3)) : 0;

  // Cohort-wide effective metrics (computed over TOTAL sample cohort)
  const cohortWideEffectiveAiRecall = totalAiSamples > 0 ? Number((tp / totalAiSamples).toFixed(3)) : 0;
  const cohortWideEffectiveHumanFpr = totalHumanSamples > 0 ? Number((fp / totalHumanSamples).toFixed(3)) : 0;

  const meanSquaredDistance = totalSamples > 0 ? Number((squaredDistanceSum / totalSamples).toFixed(4)) : 0;

  // AUROC calculation via Wilcoxon-Mann-Whitney U-statistic
  let auroc: number | null = null;
  const positives = validContinuous.filter((item) => item.trueLabel === 1).map((item) => item.score);
  const negatives = validContinuous.filter((item) => item.trueLabel === 0).map((item) => item.score);

  if (positives.length > 0 && negatives.length > 0) {
    let uSum = 0;
    for (const posScore of positives) {
      for (const negScore of negatives) {
        if (posScore > negScore) uSum += 1.0;
        else if (posScore === negScore) uSum += 0.5;
      }
    }
    auroc = Number((uSum / (positives.length * negatives.length)).toFixed(3));
  }

  return {
    totalSamples,
    totalHumanSamples,
    totalAiSamples,
    humanSamplesClassified,
    aiSamplesClassified,
    humanSamplesAbstained,
    aiSamplesAbstained,
    totalAbstained,
    totalClassified,
    tp,
    fp,
    tn,
    fn,
    selectivePrecision,
    selectiveRecall,
    selectiveSpecificity,
    selectiveFalsePositiveRate,
    selectiveFalseNegativeRate,
    selectiveBalancedAccuracy,
    selectiveF1Score,
    humanCoverage,
    aiCoverage,
    totalCoverage,
    abstentionRate,
    cohortWideEffectiveAiRecall,
    cohortWideEffectiveHumanFpr,
    auroc,
    meanSquaredDistance,

    // Backward compatibility aliases
    total: totalSamples,
    evaluated: totalClassified,
    abstained: totalAbstained,
    precision: selectivePrecision,
    recall: selectiveRecall,
    specificity: selectiveSpecificity,
    falsePositiveRate: selectiveFalsePositiveRate,
    falseNegativeRate: selectiveFalseNegativeRate,
    balancedAccuracy: selectiveBalancedAccuracy,
    f1Score: selectiveF1Score,
  };
}
