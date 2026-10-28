import { describe, it, expect } from 'vitest';
import { evaluateCandidate, rankCandidates } from '../../src/lib/pipeline/candidateRanker';

describe('CandidateRanker Adversarial Audit', () => {
  const cases = [
    {
      name: 'Negation drop: does not support -> supports',
      source: 'The algorithm does not support multi-threading.',
      cand: 'The algorithm supports multi-threading.',
      shouldBeValid: false,
    },
    {
      name: 'Modality strengthening: may reduce -> will reduce',
      source: 'The caching layer may reduce latency under high concurrency.',
      cand: 'The caching layer will reduce latency under high concurrency.',
      shouldBeValid: false,
    },
    {
      name: 'Causality reversal: throttling caused by AC failure',
      source: 'System throttling occurred because the room air conditioner failed.',
      cand: 'The room air conditioner failure occurred because the system throttled.',
      shouldBeValid: false,
    },
    {
      name: 'Quantifier scope shift: not all -> no nodes',
      source: 'Not all nodes in the cluster synchronized within 100ms.',
      cand: 'No nodes in the cluster synchronized within 100ms.',
      shouldBeValid: false,
    },
    {
      name: 'Double negative corruption: not impossible -> impossible',
      source: 'It is not impossible to achieve zero downtime during deployment.',
      cand: 'It is impossible to achieve zero downtime during deployment.',
      shouldBeValid: false,
    },
    {
      name: 'Copular negation drop: is not vulnerable -> is vulnerable (with other negation present)',
      source: 'The new kernel is not vulnerable to Meltdown, but we have no benchmark.',
      cand: 'The new kernel is vulnerable to Meltdown, but we have no benchmark.',
      shouldBeValid: false,
    },
    {
      name: 'Mass noun corruption: water -> numerous water',
      source: 'The experiment required a lot of water.',
      cand: 'The experiment required numerous water.',
      shouldBeValid: false,
    },
    {
      name: 'Grammar failure: completely missing verb',
      source: 'The engineer inspected the circuit board thoroughly.',
      cand: 'The engineer the circuit board thoroughly.',
      shouldBeValid: false,
    },
  ];

  for (const c of cases) {
    it(`audits candidate ranker on "${c.name}"`, () => {
      const res = evaluateCandidate(c.source, c.cand);
      expect(res.isValid).toBe(c.shouldBeValid);
      if (!c.shouldBeValid) {
        expect(res.rejectionReason).toBeDefined();
        expect(res.scoreBreakdown.overallScore).toBe(0);
      }
    });
  }
});
