/**
 * ============================================================================
 * HUMANIZETEXT DETECTOR V2.5: TYPES & SCHEMAS
 * ============================================================================
 */

import type { V24FeatureName, V24FeatureVector, V24NormalizationParams } from '../v2_4/types';

export type V25FeatureName = V24FeatureName;
export type V25FeatureVector = V24FeatureVector;
export type V25NormalizationParams = V24NormalizationParams;

export type V25Verdict = 'ai' | 'human' | 'inconclusive';

export interface V25ModelArtifact {
  modelArchitecture: string;
  modelId: string;
  modelVersion: string;
  featureSchemaVersion: string;
  featureNames: V25FeatureName[];
  normalizationParams: V25NormalizationParams;
  coefficients: Record<V25FeatureName, number>;
  intercept: number;
  calibrationMethod: string;
  calibrationParams: {
    A: number;
    B: number;
  };
  decisionPolicy: {
    policyType: string;
    tauAi: number;
    tauHuman: number;
    minimumWordCount: number;
    verdicts: {
      ai: string;
      human: string;
      inconclusive: string;
    };
  };
  metricsOnDev: {
    dense: {
      accuracy: number;
      balancedAccuracy: number;
      precision: number;
      recall: number;
      fpr: number;
      aucRoc: number;
      brierScore: number;
      ece: number;
    };
    selective: {
      coverage: number;
      abstentionRate: number;
      accuracy: number;
      balancedAccuracy: number;
      fpr: number;
      tp: number;
      fp: number;
      tn: number;
      fn: number;
    };
  };
  trainingProvenance: {
    trainPartitionSize: number;
    devPartitionSize: number;
    calPartitionSize: number;
    finalTestStatus: string;
    regularization: string;
    optimalC: number;
    trainingDate: string;
    crossValidation: string;
    cvBalancedAccuracy: number;
  };
  artifactSha256?: string;
}

export interface V25InferenceResult {
  rawLinearMargin: number;
  calibratedProbability: number;
  verdict: V25Verdict;
  isAbstained: boolean;
  abstentionReason: string | null;
  wordCount: number;
  features: V25FeatureVector;
  normalizedFeatures: Record<V25FeatureName, number>;
  inferenceDurationMs: number;
  modelInfo: {
    modelId: string;
    architecture: string;
    version: string;
  };
}

