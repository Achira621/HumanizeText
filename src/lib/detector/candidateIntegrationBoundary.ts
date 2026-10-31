/**
 * ============================================================================
 * HUMANIZETEXT DETECTOR: CANDIDATE INTEGRATION BOUNDARY (V2.5.0)
 * 
 * Provides a clean, isolated bridge between detector engines and the client/server
 * inference pipelines.
 * 
 * ENGINES:
 * 1. 'production_default': Stable baseline heuristic (detectorCore.ts).
 * 2. 'v2_5_public_beta': Frozen V2.5.0 trained stylometric model (L2 regularized
 *    logistic regression with Platt scaling and 3-tier selective policy).
 * 3. 'experimental_stylometric': Hand-weighted V2.3 stylometric discriminator.
 * 4. 'experimental_fusion': Hand-tuned V2.3 hybrid heuristic fusion.
 * ============================================================================
 */

import { computeAiScore } from './detectorCore';
import { runStylometricDiscriminator } from './v2_3/stylometricDiscriminator';
import { runHybridDetector, type HybridDetectorConfig } from './v2_3/hybridDetector';
import type { V23DetectionResult } from './v2_3/types';
import { predictV25Text } from './v2_5/detectorV2_5';
import type { V25InferenceResult } from './v2_5/types';

export type CandidateEngineId =
  | 'production_default'          // Option A: Stable baseline heuristic
  | 'v2_5_public_beta'           // V2.5: Trained ML stylometric classifier (PUBLIC BETA)
  | 'experimental_stylometric'    // V2.3: Hand-weighted stylometric discriminator
  | 'experimental_fusion';        // V2.3: Heuristic score fusion with selective abstention

export interface CandidateIntegrationOptions {
  engineId?: CandidateEngineId;
  fusionConfig?: HybridDetectorConfig;
  minWordCount?: number;
}

export interface CandidateExecutionResponse {
  engineId: CandidateEngineId;
  isProductionDefault: boolean;
  score: number;
  scoreLabel: string;
  verdict: 'ai' | 'human' | 'abstained' | 'inconclusive';
  isAbstained: boolean;
  abstentionReason: string | null;
  disclaimer: string;
  rawCandidateResult?: V23DetectionResult | V25InferenceResult;
}

/**
 * Safe execution boundary for detector engines.
 * Modular dispatcher allowing seamless switching between engines.
 */
export function executeDetectorEngine(
  text: string,
  options: CandidateIntegrationOptions = {}
): CandidateExecutionResponse {
  const engineId: CandidateEngineId = options.engineId ?? 'production_default';

  // 1. V2.5 Trained Stylometric Candidate (Public Beta)
  if (engineId === 'v2_5_public_beta') {
    const v25Res = predictV25Text(text, { minWordCount: options.minWordCount });
    return {
      engineId: 'v2_5_public_beta',
      isProductionDefault: false,
      score: v25Res.calibratedProbability,
      scoreLabel: 'calibrated_ai_probability',
      verdict: v25Res.verdict,
      isAbstained: v25Res.isAbstained,
      abstentionReason: v25Res.abstentionReason,
      disclaimer: 'PUBLIC BETA (V2.5.0): Trained statistical stylometric classifier. Results are probabilistic estimations and not proof of authorship.',
      rawCandidateResult: v25Res,
    };
  }

  // 2. Production default (Option A - stable baseline)
  if (engineId === 'production_default') {
    const baseline = computeAiScore(text);
    const score = Number(baseline.aiProbability.toFixed(3));
    return {
      engineId: 'production_default',
      isProductionDefault: true,
      score,
      scoreLabel: 'ai_probability',
      verdict: score >= 0.50 ? 'ai' : 'human',
      isAbstained: false,
      abstentionReason: null,
      disclaimer: 'Stable production baseline heuristic.',
    };
  }

  // 3. Experimental Option B (Stylometric Discriminator)
  if (engineId === 'experimental_stylometric') {
    const candidate = runStylometricDiscriminator(text);
    return {
      engineId: 'experimental_stylometric',
      isProductionDefault: false,
      score: candidate.stylisticAiScore,
      scoreLabel: 'stylistic_ai_match_indicator',
      verdict: candidate.isAbstained ? 'abstained' : candidate.verdict === 'ai' ? 'ai' : 'human',
      isAbstained: candidate.isAbstained,
      abstentionReason: candidate.abstentionReason,
      disclaimer: 'EXPERIMENTAL CANDIDATE (V2.3.1): Hand-weighted stylometric match index on [0, 1]. NOT an empirical probability.',
      rawCandidateResult: candidate,
    };
  }

  // 4. Experimental Option C (Heuristic Score Fusion)
  if (engineId === 'experimental_fusion') {
    const candidate = runHybridDetector(text, options.fusionConfig);
    return {
      engineId: 'experimental_fusion',
      isProductionDefault: false,
      score: candidate.stylisticAiScore,
      scoreLabel: 'fused_stylistic_match_indicator',
      verdict: candidate.isAbstained ? 'abstained' : candidate.verdict === 'ai' ? 'ai' : 'human',
      isAbstained: candidate.isAbstained,
      abstentionReason: candidate.abstentionReason,
      disclaimer: 'EXPERIMENTAL CANDIDATE (V2.3.1): Hand-tuned heuristic score fusion. NOT a calibrated Bayesian probability.',
      rawCandidateResult: candidate,
    };
  }

  throw new Error(`Unknown candidate engine ID: "${engineId}"`);
}
