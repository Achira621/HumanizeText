/**
 * ============================================================================
 * HUMANIZETEXT DETECTOR V2.5: CANDIDATE FUNCTIONALITY TESTS
 * Verifies model artifact loading, 21-feature extraction, normalization,
 * Platt scaling probability calculation, and 3-class selective decision policy.
 * ============================================================================
 */

import { describe, it, expect } from 'vitest';
import { predictV25Text, DEFAULT_V25_MODEL } from '../../src/lib/detector/v2_5/detectorV2_5';
import { executeDetectorEngine } from '../../src/lib/detector/candidateIntegrationBoundary';

describe('Detector V2.5 Candidate Unit Tests', () => {
  it('loads valid V2.5 model artifact with complete metadata', () => {
    expect(DEFAULT_V25_MODEL.modelId).toBe('humanizetext-detector-v2-5-0');
    expect(DEFAULT_V25_MODEL.modelVersion).toBe('2.5.0');
    expect(DEFAULT_V25_MODEL.featureNames.length).toBe(21);
    expect(DEFAULT_V25_MODEL.calibrationMethod).toBe('Platt_Scaling_Univariate_Logistic');
    expect(DEFAULT_V25_MODEL.calibrationParams.A).toBeCloseTo(0.9647, 3);
    expect(DEFAULT_V25_MODEL.decisionPolicy.tauAi).toBe(0.65);
    expect(DEFAULT_V25_MODEL.decisionPolicy.tauHuman).toBe(0.35);
    expect(DEFAULT_V25_MODEL.decisionPolicy.minimumWordCount).toBe(40);
  });

  it('abstains on text shorter than minimum word count (40 words)', () => {
    const shortText = 'This is a brief passage that falls well short of forty words.';
    const result = predictV25Text(shortText);

    expect(result.verdict).toBe('inconclusive');
    expect(result.isAbstained).toBe(true);
    expect(result.abstentionReason).toBe('length_below_minimum');
    expect(result.calibratedProbability).toBe(0.5);
  });

  it('correctly processes long passage and yields bounded probability in [0, 1]', () => {
    const longText = `
      Furthermore, it is crucial to recognize that the multifaceted nature of automated technological
      advancements plays a pivotal role in modern organizational structures. Moreover, harnessing the
      power of digital transformation fosters unprecedented operational efficiency across diverse domains.
      In conclusion, embracing these innovative paradigms remains an essential requirement for sustainable growth,
      ensuring that all interconnected components seamlessly integrate into a unified tapestry of enterprise capability.
      Additionally, strategic foresight enables proactive mitigation of potential operational risks.
    `;
    const result = predictV25Text(longText);

    expect(result.wordCount).toBeGreaterThanOrEqual(40);
    expect(result.calibratedProbability).toBeGreaterThan(0);
    expect(result.calibratedProbability).toBeLessThan(1);
    expect(['ai', 'human', 'inconclusive']).toContain(result.verdict);
    expect(Object.keys(result.features).length).toBe(21);
    expect(Object.keys(result.normalizedFeatures).length).toBe(21);
  });

  it('confirms candidate integration boundary maintains production default safety', () => {
    const sampleText = 'The quick brown fox jumps over the lazy dog in the sunny afternoon.';
    const res = executeDetectorEngine(sampleText);

    expect(res.isProductionDefault).toBe(true);
    expect(res.engineId).toBe('production_default');
    expect(typeof res.score).toBe('number');
  });

  it('executes V2.5 public beta engine via candidate integration boundary with selective policy', () => {
    const passage = `
      Furthermore, it is crucial to recognize that the multifaceted nature of automated technological
      advancements plays a pivotal role in modern organizational structures. Moreover, harnessing the
      power of digital transformation fosters unprecedented operational efficiency across diverse domains.
      In conclusion, embracing these innovative paradigms remains an essential requirement for sustainable growth,
      ensuring that all interconnected components seamlessly integrate into a unified tapestry of enterprise capability.
      Additionally, strategic foresight enables proactive mitigation of potential operational risks.
    `;
    const res = executeDetectorEngine(passage, { engineId: 'v2_5_public_beta' });

    expect(res.engineId).toBe('v2_5_public_beta');
    expect(res.isProductionDefault).toBe(false);
    expect(res.disclaimer).toContain('PUBLIC BETA');
    expect(typeof res.score).toBe('number');
    expect(res.score).toBeGreaterThanOrEqual(0);
    expect(res.score).toBeLessThanOrEqual(1);
    expect(['ai', 'human', 'inconclusive']).toContain(res.verdict);
    expect(res.rawCandidateResult).toBeDefined();
    if (res.rawCandidateResult && 'wordCount' in res.rawCandidateResult) {
      expect(res.rawCandidateResult.wordCount).toBeGreaterThanOrEqual(40);
    }
  });
});
