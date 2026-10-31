/**
 * ============================================================================
 * HUMANIZETEXT DETECTOR V2.3.1: EXPERIMENTAL CANDIDATE TYPE DEFINITIONS
 * Isolated architecture specifications for experimental detector candidates.
 * 
 * IMPORTANT SEMANTIC NOTICE:
 * Scores produced by these modules are heuristic stylistic match indices on [0, 1].
 * They represent the degree to which a passage exhibits machine-typical syntactic
 * regularity and cliché markers. They are NOT empirically calibrated probabilities
 * and do not represent a statistical likelihood that text was AI-generated.
 * ============================================================================
 */

export type DetectorOptionId =
  | 'option_a_heuristic'       // Option A: Baseline regex & stylistic heuristic (detectorCore.ts)
  | 'option_b_stylometric'     // Option B: Hand-weighted stylometric discriminator (stylometricDiscriminator.ts)
  | 'option_c_hybrid'          // Option C: Heuristic score fusion with selective abstention (hybridDetector.ts)
  | 'option_b_learned';        // Deprecated alias for option_b_stylometric

export type V23Verdict =
  | 'ai'
  | 'human'
  | 'abstain_short_length'
  | 'abstain_ambiguous'
  | 'collaborative_signal';

export type V23Confidence = 'high' | 'moderate' | 'low' | 'insufficient_evidence';

export interface V23BurstinessMetrics {
  stdDev: number;
  mean: number;
  coeffOfVariation: number;
  uniformityRatio: number;
}

export interface V23LexicalMetrics {
  typeTokenRatio: number;
  hapaxRatio: number;
  zipfianDecaySlope: number;
  averageWordLength: number;
  entropy: number;
}

export interface V23SyntacticMetrics {
  openingDiversity: number;
  punctuationCadenceCv: number;
  clauseDensity: number;
  passiveVoiceRatio: number;
  functionWordRatio: number;
}

export interface V23FeatureVector {
  // Burstiness features (higher variation in human text)
  burstinessCv: number;
  burstinessUniformity: number;

  // Lexical features
  typeTokenRatio: number;
  hapaxRatio: number;
  zipfianDecaySlope: number;
  averageWordLength: number;
  shannonEntropy: number;

  // Syntactic & cadence features (higher uniformity in AI text)
  openingDiversity: number;
  punctuationCadenceCv: number;
  clauseDensity: number;
  passiveVoiceRatio: number;
  functionWordRegularity: number;

  // Cliché & stylistic features
  clicheDensity: number;
  structuralRepetition: number;
}

export interface V23SignalAttribution {
  featureName: keyof V23FeatureVector;
  rawFeatureValue: number;
  normalizedScore: number;
  weight: number;
  contribution: number;
  indicatorDirection: 'ai_leaning' | 'human_leaning' | 'neutral';
}

export interface V23DetectionResult {
  version: '2.3.1';
  detectorOption: DetectorOptionId;
  
  /**
   * Stylistic AI match indicator score on [0, 1].
   * NOTE: This is a heuristic scoring index, NOT an empirical probability.
   */
  stylisticAiScore: number;

  /**
   * Stylistic Human match indicator score on [0, 1] (1 - stylisticAiScore).
   */
  humanMatchScore: number;

  /** @deprecated Backward compatibility alias for stylisticAiScore. NOT an empirical probability. */
  aiProbability: number;

  /** @deprecated Backward compatibility alias for humanMatchScore. */
  humanProbability: number;

  verdict: V23Verdict;
  confidence: V23Confidence;
  isAbstained: boolean;
  abstentionReason: string | null;

  // Passage diagnostics
  wordCount: number;
  sentenceCount: number;
  characterCount: number;
  inferenceDurationMs: number;

  // Feature breakdown
  features: V23FeatureVector;
  topAttributions: V23SignalAttribution[];

  // Component model scores (for Hybrid option C)
  componentScores?: {
    heuristicScore: number;
    stylometricScore: number;
    /** @deprecated Backward compatibility alias for stylometricScore. */
    learnedScore?: number;
  };
}

/**
 * Mathematically explicit evaluation metrics with separate abstention tracking.
 * Prevents abstained samples from vanishing from summary reporting.
 */
export interface V23EvaluationMetrics {
  // Sample population counts
  totalSamples: number;
  totalHumanSamples: number;
  totalAiSamples: number;

  // Classified vs Abstained breakdown
  humanSamplesClassified: number;
  aiSamplesClassified: number;
  humanSamplesAbstained: number;
  aiSamplesAbstained: number;
  totalAbstained: number;
  totalClassified: number;

  // Confusion matrix (computed over classified/evaluated samples)
  tp: number;
  fp: number;
  tn: number;
  fn: number;

  // Selective metrics (conditioned on classification / decision)
  selectivePrecision: number | null;
  selectiveRecall: number | null;
  selectiveSpecificity: number | null;
  selectiveFalsePositiveRate: number | null;
  selectiveFalseNegativeRate: number | null;
  selectiveBalancedAccuracy: number | null;
  selectiveF1Score: number | null;

  // Coverage metrics
  humanCoverage: number;
  aiCoverage: number;
  totalCoverage: number;
  abstentionRate: number;

  // Cohort-wide effective metrics (computed over TOTAL population)
  cohortWideEffectiveAiRecall: number;
  cohortWideEffectiveHumanFpr: number;

  // Diagnostics
  auroc: number | null;
  meanSquaredDistance: number;

  // Backward compatibility aliases
  total: number;
  evaluated: number;
  abstained: number;
  precision: number | null;
  recall: number | null;
  specificity: number | null;
  falsePositiveRate: number | null;
  falseNegativeRate: number | null;
  balancedAccuracy: number | null;
  f1Score: number | null;
}
