import type { Intensity } from './types';
import { computeAiScore } from '../../src/lib/detector/detectorCore';
import { SimilarityEngine } from '../../src/lib/similarity/engine';
import { humanizeWithRules } from '../../src/lib/humanizer/ruleEngine';
import type { VocabularyIntensity } from '../../src/types';

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

const intensityMap: Record<Intensity, VocabularyIntensity> = {
  low: 'conservative',
  med: 'balanced',
  high: 'dynamic',
  max: 'maximum',
};

export const adapters: EvalAdapters = {
  scoreText: (text: string) => {
    const res = computeAiScore(text);
    return res.aiProbability;
  },

  similarity: (source: string, candidate: string) => {
    return SimilarityEngine.computePassageSimilarity(source, candidate);
  },

  humanize: (text: string, options: HumanizeOptions) => {
    const vocabIntensity = intensityMap[options.intensity] ?? 'balanced';
    const result = humanizeWithRules(text, {
      mode: 'natural',
      vocabularyIntensity: vocabIntensity,
      frozenWords: [...options.frozenWords],
    });
    return result.improvedText;
  },
};
