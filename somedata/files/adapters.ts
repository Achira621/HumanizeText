import type { Intensity } from './types';

/** Returns the overall AI probability in [0, 1] for a text. */
export type ScoreText = (text: string) => number | Promise<number>;
/** Returns similarity in [0, 1] between a source passage and a candidate passage. */
export type SimilarityFn = (source: string, candidate: string) => number | Promise<number>;
export interface HumanizeOptions {
  readonly intensity: Intensity;
  readonly frozenWords: readonly string[];
}
export type HumanizeFn = (text: string, options: HumanizeOptions) => string | Promise<string>;

export interface EvalAdapters {
  scoreText?: ScoreText;
  similarity?: SimilarityFn;
  humanize?: HumanizeFn;
}

/**
 * WIRE YOUR APP HERE. Eval suites whose adapter is undefined are skipped, not failed.
 *
 * Recommended: move the scoring maths out of detector.worker.ts into a pure module (detector.core.ts)
 * and have the worker just call it. Vitest can then import the exact code the worker runs.
 *
 *   import { analyzeText } from '../workers/detector.core';
 *   import { compareDocuments } from '../similarity/engine';
 *   import { humanizeText } from '../engine/ruleEngine';
 *
 *   export const adapters: EvalAdapters = {
 *     scoreText: (t) => analyzeText(t).overallScore,                       // 0..1
 *     similarity: async (a, b) => (await compareDocuments(a, b)).score,   // 0..1
 *     humanize: (t, o) => humanizeText(t, { fthresh: o.intensity, freeze: [...o.frozenWords] }),
 *   };
 */
export const adapters: EvalAdapters = {};
