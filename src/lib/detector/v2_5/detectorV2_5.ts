/**
 * ============================================================================
 * HUMANIZETEXT DETECTOR V2.5: TRAINED CANDIDATE INFERENCE ADAPTER
 * Zero-dependency, pure TypeScript client-side inference engine.
 * 
 * Pipeline:
 *   1. Extracts 21 stylometric features using deterministic feature extractor.
 *   2. Enforces minimum word count gating (minimum 40 words).
 *   3. Normalizes features strictly with TRAIN-fitted parameters.
 *   4. Evaluates linear decision margin: intercept + sum(w_i * x_i).
 *   5. Evaluates Platt scaling probability calibrated on CAL partition:
 *      P(AI | margin) = 1 / (1 + exp(-(A * margin + B))).
 *   6. Executes selective 3-class policy:
 *      - AI: P >= 0.65
 *      - Human: P <= 0.35
 *      - Inconclusive: 0.35 < P < 0.65
 * ============================================================================
 */

import type {
  V25FeatureName,
  V25ModelArtifact,
  V25InferenceResult,
  V25Verdict,
} from './types';
import { extractV24Features } from '../v2_4/featureExtractor';
import modelArtifactJson from '../../../../data/v2_5/model_artifact.json';

export const DEFAULT_V25_MODEL: V25ModelArtifact = modelArtifactJson as unknown as V25ModelArtifact;

export interface V25InferenceOptions {
  model?: V25ModelArtifact;
  minWordCount?: number;
}

/**
 * Predicts whether a text exhibits AI or Human stylometric patterns using
 * the V2.5 trained candidate model.
 */
export function predictV25Text(
  text: string,
  options: V25InferenceOptions = {}
): V25InferenceResult {
  const startTime = performance.now();
  const model = options.model ?? DEFAULT_V25_MODEL;
  const minWords = options.minWordCount ?? model.decisionPolicy.minimumWordCount ?? 40;

  const rawFeatures = extractV24Features(text);
  const words = text ? text.trim().split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;

  // 1. Guard against undersized input (Abstention Rule)
  if (wordCount < minWords) {
    const emptyNorm = {} as Record<V25FeatureName, number>;
    for (const f of model.featureNames) {
      emptyNorm[f] = 0;
    }

    return {
      rawLinearMargin: 0,
      calibratedProbability: 0.5,
      verdict: 'inconclusive',
      isAbstained: true,
      abstentionReason: 'length_below_minimum',
      wordCount,
      features: rawFeatures,
      normalizedFeatures: emptyNorm,
      inferenceDurationMs: Number((performance.now() - startTime).toFixed(3)),
      modelInfo: {
        modelId: model.modelId,
        architecture: model.modelArchitecture,
        version: model.modelVersion,
      },
    };
  }

  // 2. Feature Normalization (Strictly using TRAIN-fitted parameters)
  const normalizedFeatures = {} as Record<V25FeatureName, number>;
  for (const f of model.featureNames) {
    const mean = model.normalizationParams.means[f] ?? 0;
    const std = model.normalizationParams.stds[f] ?? 1.0;
    const rawVal = rawFeatures[f] ?? 0;
    normalizedFeatures[f] = (rawVal - mean) / std;
  }

  // 3. Linear Model Evaluation: intercept + sum(w_i * x_i)
  let linearMargin = model.intercept;
  for (const f of model.featureNames) {
    const coef = model.coefficients[f] ?? 0;
    linearMargin += coef * normalizedFeatures[f];
  }

  // 4. Probability Calibration (Platt Scaling)
  // Formula: P(AI) = 1 / (1 + exp(-(A * margin + B)))
  let calibratedProbability: number;
  if (model.calibrationParams && typeof model.calibrationParams.A === 'number') {
    const { A, B } = model.calibrationParams;
    const z = A * linearMargin + B;
    const clampedZ = Math.max(-30.0, Math.min(30.0, z));
    calibratedProbability = 1.0 / (1.0 + Math.exp(-clampedZ));
  } else {
    // Uncalibrated fallback
    const clampedMargin = Math.max(-30.0, Math.min(30.0, linearMargin));
    calibratedProbability = 1.0 / (1.0 + Math.exp(-clampedMargin));
  }

  // Bound probability strictly in [0.0001, 0.9999]
  calibratedProbability = Math.max(0.0001, Math.min(0.9999, calibratedProbability));

  // 5. Selective 3-Class Decision Policy
  const tauAi = model.decisionPolicy.tauAi;
  const tauHuman = model.decisionPolicy.tauHuman;

  let verdict: V25Verdict;
  let isAbstained = false;
  let abstentionReason: string | null = null;

  if (calibratedProbability >= tauAi) {
    verdict = 'ai';
  } else if (calibratedProbability <= tauHuman) {
    verdict = 'human';
  } else {
    verdict = 'inconclusive';
    isAbstained = true;
    abstentionReason = 'uncertainty_band';
  }

  return {
    rawLinearMargin: Number(linearMargin.toFixed(6)),
    calibratedProbability: Number(calibratedProbability.toFixed(6)),
    verdict,
    isAbstained,
    abstentionReason,
    wordCount,
    features: rawFeatures,
    normalizedFeatures,
    inferenceDurationMs: Number((performance.now() - startTime).toFixed(3)),
    modelInfo: {
      modelId: model.modelId,
      architecture: model.modelArchitecture,
      version: model.modelVersion,
    },
  };
}

