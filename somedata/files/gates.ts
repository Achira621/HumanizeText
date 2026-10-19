/**
 * Quality gates. These are deliberately loose starting values for the 80/120/20-row seed set.
 * Run once, read the printed report, then tighten them to just under your current results
 * so regressions fail CI.
 */
export const GATES = {
  detector: {
    minAucTest: 0.8,
    minF1Test: 0.7,
    /** mean(human) < mean(mixed) < mean(ai) must hold, with this much slack. */
    orderingSlack: 0.0,
  },
  plagiarism: {
    minF1Test: 0.7,
    minRecallVerbatim: 0.95,
    minRecallSynonymSwap: 0.6,
    minRecallMosaic: 0.4,
    maxFprHardNegative: 0.15,
    maxFprUnrelated: 0.02,
  },
  humanizer: {
    minMarkerRemovalRate: 0.8,
    minContentRetentionMed: 0.4,
    lengthRatioRange: [0.6, 1.6] as readonly [number, number],
    minMeanDetectorScoreDrop: 0.1,
    monotonicSlack: 0.02,
    frozenWordPreservation: 1,
  },
} as const;
