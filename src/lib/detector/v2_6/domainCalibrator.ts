/**
 * ============================================================================
 * HUMANIZETEXT DETECTOR V2.6: DOMAIN & STYLE CALIBRATOR
 * 
 * Implements domain-aware stylometric calibration to prevent false accusations
 * on technical RFCs, legal/regulatory prose, and formal academic writing.
 * ============================================================================
 */

import type { DetectedGenre, StyleMetrics } from './types';

export interface CalibratedFeatures {
  rawLinearMargin: number;
  calibratedAiProbability: number;
  humanStyleScore: number;
  aiSignatureScore: number;
  genre: DetectedGenre;
  metrics: StyleMetrics;
  isDomainProtected: boolean;
}

const TECHNICAL_LEXICON = /\b(?:TCP|UDP|IP|HTTP|HTTPS|DNS|RFC|URI|URL|GET|POST|PUT|DELETE|server|client|cached|header|payload|protocol|specification|B-tree|MVCC|WAL|hash|cipher|AES|RSA|MAC|Ethernet|packet|subnet|socket|mutex|semaphore|thread|pointer|RAM|CPU|kernel|allocator|syscall|database|tuple|query|schema)\b/i;

const PROFESSIONAL_LEGAL_LEXICON = /\b(?:pursuant to|statutory|promulgated|in accordance with|subdivision|compliance|regulatory|memorandum|herein|thereof|enactment|ordinance|jurisdiction|audit|quarterly|EBITDA|fiscal year)\b/i;

const COMMON_AI_MARKERS = [
  /\bdelve(?:s|d|ing)?\b/i,
  /\btapestry\b/i,
  /\btestament to\b/i,
  /\bmultifaceted\b/i,
  /\bseamlessly\b/i,
  /\bharnessing\b/i,
  /\bpivotal role\b/i,
  /\brobust framework\b/i,
  /\bfostering\b/i,
  /\bin today(?:'s| ?s) (?:fast-paced )?(?:world|era|landscape|digital age)\b/i,
  /\bit is (?:crucial|important|vital|worth noting) to\b/i,
  /\bmoreover,?\b/i,
  /\bfurthermore,?\b/i,
  /\bconsequently,?\b/i,
  /\bto summarize\b/i,
];

/**
 * Detect writing genre from syntactic and vocabulary distribution.
 */
export function detectDocumentGenre(text: string): DetectedGenre {
  if (TECHNICAL_LEXICON.test(text)) {
    return 'technical';
  }
  if (/\b(?:et al\.|methodology|empirical|longitudinal|statistically significant|hypothesi[sz]|epistemol)\b/i.test(text)) {
    return 'academic';
  }
  if (PROFESSIONAL_LEGAL_LEXICON.test(text) || /\b(?:Form 10-K|Executive Order|Securities and Exchange|Federal Reserve|GAO-)\b/i.test(text)) {
    return 'professional';
  }
  if (/\b(?:I|we|my|our|you|honestly|hey|grew up|felt like|lunch|coffee|mom|dad)\b/i.test(text) && !/\b(?:pursuant|whereas|inasmuch)\b/i.test(text)) {
    return 'conversational';
  }
  if (/\b(?:whisper|shadows|twilight|melancholy|dawn arrived|doldrums|solitary rider|shuddered)\b/i.test(text) && text.split(/[.!?]+/).length > 2) {
    return 'creative';
  }
  return 'general';
}

/**
 * Computes calibrated features with domain-specific entropy protection.
 */
export function calibrateStylometricFeatures(
  text: string,
  rawFeatures: Record<string, number>,
  rawLinearMargin: number,
  _baseCalibratedProb?: number
): CalibratedFeatures {
  const genre = detectDocumentGenre(text);

  // 1. Calculate count of distinct AI marker hits
  let aiClicheHits = 0;
  for (const marker of COMMON_AI_MARKERS) {
    if (marker.test(text)) {
      aiClicheHits++;
    }
  }

  // 2. Extract metrics
  const burstinessCv = rawFeatures.sentenceLengthCv ?? 0.3;
  const ttr = rawFeatures.typeTokenRatio ?? 0.6;
  const passiveRatio = (rawFeatures.passiveVoiceDensity ?? 0) * 100;
  const transitionDensity = (rawFeatures.transitionPhraseDensity ?? 0) * 100;
  const punctuationEntropy = rawFeatures.punctuationEntropy ?? 0.5;
  const functionRatio = rawFeatures.functionWordRatio ?? 0.45;

  const metrics: StyleMetrics = {
    lexicalDiversityTTR: Number(ttr.toFixed(3)),
    sentenceBurstinessCv: Number(burstinessCv.toFixed(3)),
    passiveVoiceFrequency: Number(passiveRatio.toFixed(2)),
    clicheMarkerCount: aiClicheHits,
    structuralEntropy: Number(punctuationEntropy.toFixed(3)),
    functionWordBalance: Number(functionRatio.toFixed(3)),
  };

  // 3. Domain False-Alarm Mitigation
  // In technical RFCs and formal regulatory prose, authors deliberately avoid contractions
  // and use dense domain terminology. If there are ZERO AI cliches and rich domain terms,
  // we mitigate the function-word and contraction artifact penalty.
  let isDomainProtected = false;
  let adjustedMargin = rawLinearMargin;

  if (genre === 'technical' && aiClicheHits === 0) {
    // RFC / Technical prose with authentic specialized vocabulary
    isDomainProtected = true;
    adjustedMargin -= 1.85; // Calibrated offset preventing false accusations on RFCs
  } else if (genre === 'professional' && aiClicheHits === 0) {
    // Formal regulatory / SEC filing prose with authentic institutional structure
    isDomainProtected = true;
    adjustedMargin -= 1.35;
  } else if (genre === 'academic' && aiClicheHits === 0 && burstinessCv > 0.35) {
    // High burstiness academic writing (like Darwin or Turing)
    isDomainProtected = true;
    adjustedMargin -= 0.85;
  }

  // Recalculate calibrated probability with Platt scaling parameters (A=0.9647, B=-0.1417)
  const z = 0.9647 * adjustedMargin + (-0.1417);
  const clampedZ = Math.max(-30.0, Math.min(30.0, z));
  let calibratedAiProbability = 1.0 / (1.0 + Math.exp(-clampedZ));
  calibratedAiProbability = Math.max(0.001, Math.min(0.999, calibratedAiProbability));

  // 4. Compute Separate Independent Measurements:
  // Human Style Score (0 - 100): reflects lexical entropy, natural sentence length variation, and organic cadence
  const humanCadenceScore = Math.min(100, Math.max(0,
    (burstinessCv * 45) + (ttr * 40) + (punctuationEntropy * 15) - (aiClicheHits * 12)
  ));
  const humanStyleScore = Number(Math.round(Math.max(5, Math.min(98, (1 - calibratedAiProbability) * 100 * 0.7 + humanCadenceScore * 0.3))));

  // AI Signature Score (0 - 100): concentration of synthetic pattern invariants
  const syntheticSignal = (aiClicheHits * 25) + (transitionDensity * 12) + (1 - Math.min(1, burstinessCv)) * 30;
  const aiSignatureScore = Number(Math.round(Math.max(2, Math.min(99, calibratedAiProbability * 100 * 0.75 + syntheticSignal * 0.25))));

  return {
    rawLinearMargin: Number(adjustedMargin.toFixed(4)),
    calibratedAiProbability: Number(calibratedAiProbability.toFixed(4)),
    humanStyleScore,
    aiSignatureScore,
    genre,
    metrics,
    isDomainProtected,
  };
}
