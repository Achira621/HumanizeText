/**
 * ============================================================================
 * HUMANIZETEXT DETECTOR V2.4: MODEL AND INFERENCE TYPE DEFINITIONS
 * Strict specifications for genuinely trained statistical models, feature
 * extraction schema, calibration parameters, and selective decision policies.
 * ============================================================================
 */

export const V24_FEATURE_NAMES = [
  'sentenceLengthMean',
  'sentenceLengthVariance',
  'sentenceLengthCv',
  'paragraphLengthMean',
  'paragraphLengthVariance',
  'typeTokenRatio',
  'hapaxLegomenaRatio',
  'simpsonsIndex',
  'lexicalEntropy',
  'ngramRepetitionRatio',
  'openingPhraseDiversity',
  'transitionPhraseDensity',
  'clicheDensity',
  'commaDensity',
  'semicolonColonDensity',
  'punctuationEntropy',
  'passiveVoiceDensity',
  'clauseComplexity',
  'functionWordRatio',
  'contractionDensity',
  'entityDensity',
] as const;

export type V24FeatureName = (typeof V24_FEATURE_NAMES)[number];

export type V24FeatureVector = Record<V24FeatureName, number>;

export interface V24NormalizationParams {
  means: Record<V24FeatureName, number>;
  stds: Record<V24FeatureName, number>;
}

export interface V24ModelArtifact {
  modelArchitecture: 'regularized_logistic_regression' | 'tree_classifier';
  modelId: string;
  featureSchemaVersion: string;
  featureNames: V24FeatureName[];
  normalizationParams: V24NormalizationParams;
  coefficients: Record<V24FeatureName, number>;
  intercept: number;
  calibrationMethod: 'platt_scaling' | 'none';
  calibrationParams: {
    plattA: number;
    plattB: number;
  } | null;
  decisionThresholds: {
    aiThreshold: number;
    humanThreshold: number;
  };
  metricsOnDev: {
    accuracy: number;
    balancedAccuracy: number;
    precision: number;
    recall: number;
    specificity: number;
    auroc: number;
    brierScore: number;
    logLoss: number;
    ece: number;
  };
  trainingProvenance: {
    trainingDate: string;
    scikitLearnVersion: string;
    pythonVersion: string;
    trainingDataSha256: string;
    devDataSha256: string;
    sampleCountTrain: number;
    sampleCountDev: number;
    hyperparameters: Record<string, unknown>;
  };
  artifactSha256: string;
}

export type V24Verdict = 'ai_like' | 'human_like' | 'inconclusive';

export interface V24InferenceResult {
  rawLinearScore: number;
  calibratedProbability: number;
  verdict: V24Verdict;
  isAbstained: boolean;
  abstentionReason: 'inconclusive_confidence_band' | 'too_short' | null;
  features: V24FeatureVector;
  normalizedFeatures: Record<V24FeatureName, number>;
  inferenceDurationMs: number;
  modelInfo: {
    modelId: string;
    architecture: string;
    version: string;
  };
}

