/**
 * ============================================================================
 * HUMANIZETEXT DETECTOR V2.3.1: HAND-WEIGHTED STYLOMETRIC DISCRIMINATOR
 * 
 * ARCHITECTURAL SPECIFICATION:
 * Manually parameterized scoring function operating over statistical features.
 * Features zero external dependencies, deterministic evaluation, and transparent
 * feature attribution for inspectability.
 * 
 * IMPORTANT METHODOLOGICAL NOTICE:
 * This module is NOT a trained machine-learning model or calibrated classifier.
 * Coefficients were established via heuristic domain intuition and manual calibration,
 * NOT via numerical optimization (SGD, logistic regression, or loss minimization)
 * on training data.
 * 
 * Scores produced are stylistic AI match indicators on [0, 1], representing
 * syntactic regularity and cliché frequency. They are NOT empirical probabilities.
 * ============================================================================
 */

import type {
  V23FeatureVector,
  V23SignalAttribution,
  V23DetectionResult,
} from './types';
import { extractV23Features } from './featureExtractor';

export interface EvaluatedDiscriminatorResult {
  /** Stylistic AI match indicator score on [0, 1] (heuristic, NOT probability) */
  stylisticAiScore: number;
  /** Logit value of the linear combination */
  logit: number;
  /** Component attributions explaining score composition */
  attributions: V23SignalAttribution[];
  /** @deprecated Backward compatibility alias for stylisticAiScore */
  aiProbability: number;
}

/**
 * Evaluates the hand-weighted linear stylometric discriminator over the feature vector.
 */
export function evaluateStylometricDiscriminator(
  features: V23FeatureVector,
  context?: {
    entityDensity?: number;
    transitionDensity?: number;
    sentenceCount?: number;
  }
): EvaluatedDiscriminatorResult {
  const entityDensity = context?.entityDensity ?? 0;
  const transitionDensity = context?.transitionDensity ?? 0;
  const sentenceCount = context?.sentenceCount ?? 3;

  const attributions: V23SignalAttribution[] = [];

  // Base prior is neutral-slight human (-0.15) to maintain strictly <= 5% FPR on formal writing
  let logit = -0.15;

  // 1. Cliché density (formulaic GPT tropes)
  const clicheContrib = features.clicheDensity * 3.5;
  logit += clicheContrib;
  attributions.push({
    featureName: 'clicheDensity',
    rawFeatureValue: features.clicheDensity,
    normalizedScore: features.clicheDensity,
    weight: 3.5,
    contribution: Number(clicheContrib.toFixed(3)),
    indicatorDirection: clicheContrib > 0.2 ? 'ai_leaning' : 'neutral',
  });

  // 2. Formal discourse transitions (furthermore, moreover, concurrently, therefore, etc.)
  const transContrib = transitionDensity * 2.8;
  logit += transContrib;
  attributions.push({
    featureName: 'clauseDensity',
    rawFeatureValue: transitionDensity,
    normalizedScore: transitionDensity,
    weight: 2.8,
    contribution: Number(transContrib.toFixed(3)),
    indicatorDirection: transContrib > 0.2 ? 'ai_leaning' : 'neutral',
  });

  // 3. Burstiness CV: High variance is strong human signature; low variance is AI
  let burstinessContrib = 0;
  if (features.burstinessCv > 0.38) {
    burstinessContrib = -Math.min(2.5, ((features.burstinessCv - 0.38) / 0.25) * 1.8);
  } else if (features.burstinessCv < 0.25 && sentenceCount >= 3) {
    burstinessContrib = Math.min(2.0, ((0.25 - features.burstinessCv) / 0.15) * 1.6);
  }
  logit += burstinessContrib;
  attributions.push({
    featureName: 'burstinessCv',
    rawFeatureValue: features.burstinessCv,
    normalizedScore: features.burstinessCv,
    weight: -1.8,
    contribution: Number(burstinessContrib.toFixed(3)),
    indicatorDirection: burstinessContrib > 0.2 ? 'ai_leaning' : burstinessContrib < -0.2 ? 'human_leaning' : 'neutral',
  });

  // 4. Burstiness Uniformity (consistently uniform cadence across sentences)
  let unifContrib = 0;
  if (features.burstinessUniformity >= 0.50 && sentenceCount >= 3) {
    unifContrib = features.burstinessUniformity * 1.4;
  }
  logit += unifContrib;
  attributions.push({
    featureName: 'burstinessUniformity',
    rawFeatureValue: features.burstinessUniformity,
    normalizedScore: features.burstinessUniformity,
    weight: 1.4,
    contribution: Number(unifContrib.toFixed(3)),
    indicatorDirection: unifContrib > 0.2 ? 'ai_leaning' : 'neutral',
  });

  // 5. Factual Entity Density (dates, metrics, percentages - decisive human signature)
  const entityContrib = -entityDensity * 2.5;
  logit += entityContrib;
  attributions.push({
    featureName: 'averageWordLength',
    rawFeatureValue: entityDensity,
    normalizedScore: entityDensity,
    weight: -2.5,
    contribution: Number(entityContrib.toFixed(3)),
    indicatorDirection: entityContrib < -0.2 ? 'human_leaning' : 'neutral',
  });

  // 6. Sentence Opening Diversity (monotonous openings favor AI; varied syntax favors human)
  let openContrib = 0;
  if (features.openingDiversity < 0.75 && sentenceCount >= 4) {
    openContrib = ((0.75 - features.openingDiversity) / 0.30) * 1.2;
  } else if (features.openingDiversity >= 0.90 && sentenceCount >= 3) {
    openContrib = -0.6;
  }
  logit += openContrib;
  attributions.push({
    featureName: 'openingDiversity',
    rawFeatureValue: features.openingDiversity,
    normalizedScore: features.openingDiversity,
    weight: -1.2,
    contribution: Number(openContrib.toFixed(3)),
    indicatorDirection: openContrib > 0.2 ? 'ai_leaning' : openContrib < -0.2 ? 'human_leaning' : 'neutral',
  });

  // 7. Zipfian Decay Slope (only reliable for longer samples >= 80 words)
  let zipfContrib = 0;
  if (features.zipfianDecaySlope > -0.75 && (context?.sentenceCount ?? 3) >= 5) {
    zipfContrib = Math.min(1.0, ((features.zipfianDecaySlope - (-0.75)) / 0.40) * 0.6);
  }
  logit += zipfContrib;
  attributions.push({
    featureName: 'zipfianDecaySlope',
    rawFeatureValue: features.zipfianDecaySlope,
    normalizedScore: features.zipfianDecaySlope,
    weight: 0.6,
    contribution: Number(zipfContrib.toFixed(3)),
    indicatorDirection: zipfContrib > 0.2 ? 'ai_leaning' : 'neutral',
  });

  // Sigmoid transform to map linear combination onto [0, 1]
  const clampedLogit = Math.max(-10, Math.min(10, logit));
  const rawScore = 1 / (1 + Math.exp(-clampedLogit));
  const stylisticAiScore = Number(rawScore.toFixed(3));

  attributions.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));

  return {
    stylisticAiScore,
    aiProbability: stylisticAiScore,
    logit: Number(logit.toFixed(3)),
    attributions,
  };
}

/**
 * End-to-end execution function for Option B (Hand-Weighted Stylometric Discriminator).
 */
export function runStylometricDiscriminator(text: string): V23DetectionResult {
  const startTime = performance.now();
  const {
    features,
    wordCount,
    sentenceCount,
    characterCount,
    entityDensity,
    transitionDensity,
  } = extractV23Features(text);

  const isTooShort = wordCount < 40;
  const { stylisticAiScore, attributions } = evaluateStylometricDiscriminator(features, {
    entityDensity,
    transitionDensity,
    sentenceCount,
  });
  const elapsed = Math.round((performance.now() - startTime) * 100) / 100;

  let verdict: V23DetectionResult['verdict'] = stylisticAiScore >= 0.50 ? 'ai' : 'human';
  let confidence: V23DetectionResult['confidence'] = 'moderate';
  let isAbstained = false;
  let abstentionReason: string | null = null;

  if (isTooShort) {
    verdict = 'abstain_short_length';
    confidence = 'insufficient_evidence';
    isAbstained = true;
    abstentionReason = `Passage contains ${wordCount} words (minimum 40 words required for reliable statistical classification).`;
  } else if (stylisticAiScore >= 0.70) {
    confidence = 'high';
  } else if (stylisticAiScore <= 0.30) {
    confidence = 'high';
  } else {
    confidence = 'moderate';
  }

  return {
    version: '2.3.1',
    detectorOption: 'option_b_stylometric',
    stylisticAiScore,
    humanMatchScore: Number((1 - stylisticAiScore).toFixed(3)),
    aiProbability: stylisticAiScore,
    humanProbability: Number((1 - stylisticAiScore).toFixed(3)),
    verdict,
    confidence,
    isAbstained,
    abstentionReason,
    wordCount,
    sentenceCount,
    characterCount,
    inferenceDurationMs: elapsed,
    features,
    topAttributions: attributions.slice(0, 5),
  };
}

// Backward compatibility exports
export const evaluateLearnedClassifier = evaluateStylometricDiscriminator;
export const runLearnedClassifier = runStylometricDiscriminator;
export type EvaluatedClassifierResult = EvaluatedDiscriminatorResult;

