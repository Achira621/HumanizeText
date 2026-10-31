/**
 * ============================================================================
 * HUMANIZETEXT DETECTOR V2.4: TRAINED MODEL INFERENCE ADAPTER
 * Lightweight, zero-dependency, pure TypeScript client-side inference engine.
 * Loads the V2.4 trained logistic regression model artifact, normalizes input
 * features, evaluates linear decision margin, applies Platt probability scaling,
 * and executes the 3-class selective decision policy with explicit abstentions.
 * ============================================================================
 */

import type {
  V24FeatureName,
  V24ModelArtifact,
  V24InferenceResult,
  V24Verdict,
} from './types';
import { extractV24Features } from './featureExtractor';
import modelArtifactJson from '../../../../data/v2_4/model_artifact.json';

export const DEFAULT_V24_MODEL: V24ModelArtifact = modelArtifactJson as unknown as V24ModelArtifact;

export interface InferenceOptions {
  model?: V24ModelArtifact;
  minWordCount?: number;
}

/**
 * Executes statistical inference on a raw text passage using the genuinely
 * trained V2.4 model candidate.
 */
export function predictV24Text(
  text: string,
  options: InferenceOptions = {}
): V24InferenceResult {
  const startTime = performance.now();
  const model = options.model ?? DEFAULT_V24_MODEL;
  const minWords = options.minWordCount ?? 20;

  const rawFeatures = extractV24Features(text);
  const words = text ? text.trim().split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;

  // 1. Guard against undersized input
  if (wordCount < minWords) {
    const normFeatures = {} as Record<V24FeatureName, number>;
    for (const f of model.featureNames) {
      normFeatures[f] = 0;
    }

    return {
      rawLinearScore: 0,
      calibratedProbability: 0.5,
      verdict: 'inconclusive',
      isAbstained: true,
      abstentionReason: 'too_short',
      features: rawFeatures,
      normalizedFeatures: normFeatures,
      inferenceDurationMs: Number((performance.now() - startTime).toFixed(3)),
      modelInfo: {
        modelId: model.modelId,
        architecture: model.modelArchitecture,
        version: model.featureSchemaVersion,
      },
    };
  }

  // 2. Feature Normalization (Strictly using train-fitted mean and std)
  const normalizedFeatures = {} as Record<V24FeatureName, number>;
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
  let calibratedProbability: number;
  if (model.calibrationMethod === 'platt_scaling' && model.calibrationParams) {
    const { plattA, plattB } = model.calibrationParams;
    const exponent = -(plattA * linearMargin + plattB);
    calibratedProbability = 1.0 / (1.0 + Math.exp(exponent));
  } else {
    // Uncalibrated sigmoid
    calibratedProbability = 1.0 / (1.0 + Math.exp(-linearMargin));
  }

  // Bound probability strictly within [0, 1]
  calibratedProbability = Math.max(0.0001, Math.min(0.9999, calibratedProbability));

  // 5. Selective 3-Class Decision Policy
  const tauAi = model.decisionThresholds.aiThreshold;
  const tauHuman = model.decisionThresholds.humanThreshold;

  let verdict: V24Verdict;
  let isAbstained = false;
  let abstentionReason: 'inconclusive_confidence_band' | 'too_short' | null = null;

  if (calibratedProbability >= tauAi) {
    verdict = 'ai_like';
  } else if (calibratedProbability <= tauHuman) {
    verdict = 'human_like';
  } else {
    verdict = 'inconclusive';
    isAbstained = true;
    abstentionReason = 'inconclusive_confidence_band';
  }

  const duration = Number((performance.now() - startTime).toFixed(3));

  return {
    rawLinearScore: Number(linearMargin.toFixed(6)),
    calibratedProbability: Number(calibratedProbability.toFixed(6)),
    verdict,
    isAbstained,
    abstentionReason,
    features: rawFeatures,
    normalizedFeatures,
    inferenceDurationMs: duration,
    modelInfo: {
      modelId: model.modelId,
      architecture: model.modelArchitecture,
      version: model.featureSchemaVersion,
    },
  };
}
