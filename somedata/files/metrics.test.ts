import { describe, expect, it } from 'vitest';
import { bestThreshold, confusion, containsPhrase, contentRetention, prf, rocAuc } from './metrics';

describe('metrics', () => {
  it('rocAuc is 1 for perfect separation, 0.5 for all ties, 0 for inverted', () => {
    expect(rocAuc([0.1, 0.2, 0.8, 0.9], [false, false, true, true])).toBe(1);
    expect(rocAuc([0.5, 0.5, 0.5, 0.5], [false, true, false, true])).toBe(0.5);
    expect(rocAuc([0.9, 0.8, 0.2, 0.1], [false, false, true, true])).toBe(0);
    expect(Number.isNaN(rocAuc([0.1, 0.2], [true, true]))).toBe(true);
  });

  it('confusion + prf compute standard values', () => {
    const c = confusion([0.9, 0.8, 0.3, 0.1], [true, false, true, false], 0.5);
    expect(c).toEqual({ tp: 1, fp: 1, tn: 1, fn: 1 });
    const m = prf(c);
    expect(m.precision).toBe(0.5);
    expect(m.recall).toBe(0.5);
    expect(m.f1).toBe(0.5);
    expect(m.fpr).toBe(0.5);
  });

  it('bestThreshold finds the separating value', () => {
    const { threshold, f1 } = bestThreshold([0.1, 0.2, 0.7, 0.9], [false, false, true, true]);
    expect(threshold).toBe(0.7);
    expect(f1).toBe(1);
  });

  it('text helpers behave', () => {
    expect(containsPhrase('It is Important to note that', 'important to note')).toBe(true);
    expect(containsPhrase('unimportant', 'important')).toBe(false);
    expect(contentRetention('quiet countryside owls', 'quiet countryside owls')).toBe(1);
  });
});
