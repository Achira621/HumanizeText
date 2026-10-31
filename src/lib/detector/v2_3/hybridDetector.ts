/**
 * ============================================================================
 * HUMANIZETEXT DETECTOR V2.3.1: HEURISTIC SCORE FUSION CANDIDATE (OPTION C)
 * 
 * ARCHITECTURAL SPECIFICATION:
 * Combines hand-weighted stylometric feature scoring with baseline cliché heuristic
 * signals using a linear log-odds fusion formula.
 * Enforces risk-controlled selective abstention for short or ambiguous texts.
 * 
 * IMPORTANT METHODOLOGICAL NOTICE:
 * This module is NOT an empirically calibrated Bayesian probability model.
 * The log-odds combination is a hand-tuned heuristic weighting formula.
 * Features violate Bayesian conditional independence assumptions.
 * 
 * Scores produced are stylistic AI match indicators on [0, 1], representing
 * syntactic regularity and cliché frequency. They are NOT empirical probabilities.
 * ============================================================================
 */

import type {
  V23DetectionResult,
  V23Verdict,
  V23Confidence,
} from './types';
import { extractV23Features } from './featureExtractor';
import { evaluateStylometricDiscriminator } from './stylometricDiscriminator';
import { computeAiScore } from '../detectorCore';

export interface HybridDetectorConfig {
  /** Minimum word count required before issuing a definitive verdict (default: 40) */
  minWordCount?: number;
  /** Lower bound of ambiguity abstention region (default: 0.45) */
  ambiguityLower?: number;
  /** Upper bound of ambiguity abstention region (default: 0.55) */
  ambiguityUpper?: number;
  /** Stylometric discriminator fusion weight (default: 0.75) */
  stylometricWeight?: number;
  /** @deprecated Backward compatibility alias for stylometricWeight */
  learnedWeight?: number;
  /** Heuristic fusion weight (default: 0.25) */
  heuristicWeight?: number;
  /** Bias offset (default: 0.0) */
  biasOffset?: number;
  /** Enable selective abstention (default: true) */
  enableSelectiveAbstention?: boolean;
}

export const DEFAULT_HYBRID_CONFIG: Required<Omit<HybridDetectorConfig, 'learnedWeight'>> = {
  minWordCount: 40,
  ambiguityLower: 0.45,
  ambiguityUpper: 0.55,
  stylometricWeight: 0.75,
  heuristicWeight: 0.25,
  biasOffset: 0.0,
  enableSelectiveAbstention: true,
};

/**
 * Executes the hand-tuned Heuristic Score Fusion Engine (Option C).
 */
export function runHybridDetector(
  text: string,
  userConfig: HybridDetectorConfig = {}
): V23DetectionResult {
  const startTime = performance.now();
  const config = {
    ...DEFAULT_HYBRID_CONFIG,
    ...userConfig,
    stylometricWeight: userConfig.stylometricWeight ?? userConfig.learnedWeight ?? DEFAULT_HYBRID_CONFIG.stylometricWeight,
  };

  // 1. Extract multi-scale feature vector & contextual metrics
  const {
    features,
    wordCount,
    sentenceCount,
    characterCount,
    entityDensity,
    transitionDensity,
  } = extractV23Features(text);

  // 2. Evaluate Stylometric Component (Option B)
  const stylometricResult = evaluateStylometricDiscriminator(features, {
    entityDensity,
    transitionDensity,
    sentenceCount,
  });
  const stylometricScore = stylometricResult.stylisticAiScore;
  const stylometricLogit = stylometricResult.logit;

  // 3. Evaluate Baseline Heuristic Component (Option A - frozen baseline)
  const heuristicAnalysis = computeAiScore(text);
  const rawHeuristicScore = heuristicAnalysis.aiProbability;

  // The heuristic is an asymmetric stylistic indicator: high score indicates formulaic AI clichés,
  // but a low score merely indicates absence of clichés. Modern frontier models (GPT-4o, Claude 3.5)
  // produce natural prose without clichés; treating absence of clichés as proof of human writing
  // causes severe recall collapse. We calibrate heuristic logit to treat 0-cliché baseline as neutral.
  let calibratedHeuristicScore = rawHeuristicScore;
  if (heuristicAnalysis.matchingSignatures.length === 0) {
    calibratedHeuristicScore = Math.max(0.48, rawHeuristicScore);
  }

  // Convert heuristic score to logit
  const clampedHeuristicScore = Math.max(0.01, Math.min(0.99, calibratedHeuristicScore));
  const heuristicLogit = Math.log(clampedHeuristicScore / (1 - clampedHeuristicScore));

  // 4. Heuristic log-odds fusion:
  // logit_hybrid = w_stylometric * logit_stylometric + w_heuristic * logit_heuristic + bias
  const fusedLogit =
    config.stylometricWeight * stylometricLogit +
    config.heuristicWeight * heuristicLogit +
    config.biasOffset;

  const clampedFusedLogit = Math.max(-10, Math.min(10, fusedLogit));
  const rawScore = 1 / (1 + Math.exp(-clampedFusedLogit));
  const stylisticAiScore = Number(rawScore.toFixed(3));
  const humanMatchScore = Number((1 - stylisticAiScore).toFixed(3));

  // 5. Selective Decision Gate & Abstention Policy
  let verdict: V23Verdict;
  let confidence: V23Confidence;
  let isAbstained = false;
  let abstentionReason: string | null = null;

  if (config.enableSelectiveAbstention && wordCount < config.minWordCount) {
    verdict = 'abstain_short_length';
    confidence = 'insufficient_evidence';
    isAbstained = true;
    abstentionReason = `Passage contains ${wordCount} words (minimum ${config.minWordCount} words required for reliable statistical detection).`;
  } else if (
    config.enableSelectiveAbstention &&
    stylisticAiScore >= config.ambiguityLower &&
    stylisticAiScore <= config.ambiguityUpper
  ) {
    verdict = 'abstain_ambiguous';
    confidence = 'low';
    isAbstained = true;
    abstentionReason = `Stylistic match score (${stylisticAiScore}) falls within the ambiguity interval [${config.ambiguityLower}, ${config.ambiguityUpper}]. Signal is insufficient for conclusive binary classification; expert review recommended.`;
  } else {
    // Definitive verdicts
    if (stylisticAiScore > config.ambiguityUpper) {
      verdict = 'ai';
      confidence = stylisticAiScore >= 0.65 ? 'high' : 'moderate';
    } else {
      verdict = 'human';
      confidence = stylisticAiScore <= 0.35 ? 'high' : 'moderate';
    }
  }

  const elapsed = Math.round((performance.now() - startTime) * 100) / 100;

  return {
    version: '2.3.1',
    detectorOption: 'option_c_hybrid',
    stylisticAiScore,
    humanMatchScore,
    aiProbability: stylisticAiScore,
    humanProbability: humanMatchScore,
    verdict,
    confidence,
    isAbstained,
    abstentionReason,
    wordCount,
    sentenceCount,
    characterCount,
    inferenceDurationMs: elapsed,
    features,
    topAttributions: stylometricResult.attributions.slice(0, 5),
    componentScores: {
      heuristicScore: rawHeuristicScore,
      stylometricScore,
      learnedScore: stylometricScore,
    },
  };
}
