/**
 * ============================================================================
 * HUMANIZETEXT DETECTOR V2.5: PYTHON / TYPESCRIPT PARITY VERIFICATION
 * Verifies exact floating point match (< 1e-4) between scikit-learn training
 * margins / Platt scaling and TypeScript inference calculation.
 * ============================================================================
 */

import { describe, it, expect } from 'vitest';
import parityVectors from '../../data/v2_5/parity_test_vectors.json';
import { DEFAULT_V25_MODEL } from '../../src/lib/detector/v2_5/detectorV2_5';
import type { V25FeatureName } from '../../src/lib/detector/v2_5/types';

describe('Detector V2.5 Python/TypeScript Numerical Parity', () => {
  it('achieves exact mathematical parity (< 1e-4) on margins and calibrated probabilities', () => {
    const model = DEFAULT_V25_MODEL;
    const { A, B } = model.calibrationParams;

    for (const vector of parityVectors) {
      // Calculate linear margin in TS
      let margin = model.intercept;
      for (const fn of model.featureNames) {
        const coef = model.coefficients[fn as V25FeatureName] ?? 0;
        const normVal = (vector.normalizedFeatures as Record<string, number>)[fn] ?? 0;
        margin += coef * normVal;
      }

      // Calculate Platt scaled probability in TS
      const z = A * margin + B;
      const clampedZ = Math.max(-30.0, Math.min(30.0, z));
      const prob = 1.0 / (1.0 + Math.exp(-clampedZ));

      // Assert parity with Python scikit-learn outputs
      expect(margin).toBeCloseTo(vector.pythonMargin, 4);
      expect(prob).toBeCloseTo(vector.pythonProb, 4);
    }
  });
});
