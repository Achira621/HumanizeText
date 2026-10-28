import { describe, it, expect } from 'vitest';
import { evaluateCandidate, rankCandidates } from '../../src/lib/pipeline/candidateRanker';

describe('Task 3: Candidate Ranker Comprehensive Safety & Quality Audit', () => {
  // 1. Hard Invariant Rejections (Must Be Rejected with OverallScore = 0)
  describe('Hard Invariant & Semantic Safeguards (Zero Tolerance)', () => {
    it('rejects negation reversal: "did not approve" -> "approved"', () => {
      const source = 'The oversight committee did not approve the emergency funding request.';
      const candidate = 'The oversight committee approved the emergency funding request.';
      const res = evaluateCandidate(source, candidate);
      expect(res.isValid).toBe(false);
      expect(res.rejectionReason).toMatch(/negation|polarity/i);
      expect(res.scoreBreakdown.overallScore).toBe(0);
    });

    it('rejects modality changes from possibility to predictive certainty: "may cause" -> "will cause"', () => {
      const source = 'Sudden voltage fluctuations may cause data corruption on the NAND flash.';
      const candidate = 'Sudden voltage fluctuations will cause data corruption on the NAND flash.';
      const res = evaluateCandidate(source, candidate);
      expect(res.isValid).toBe(false);
      expect(res.rejectionReason).toMatch(/hedging|epistemic/i);
      expect(res.scoreBreakdown.overallScore).toBe(0);
    });

    it('rejects obligation weakened to permission: "must submit" -> "may choose to submit"', () => {
      const source = 'All contract employees must submit their security clearance documents.';
      const candidate = 'All contract employees may choose to submit their security clearance documents.';
      const res = evaluateCandidate(source, candidate);
      expect(res.isValid).toBe(false);
      expect(res.rejectionReason).toMatch(/obligation|conditionality/i);
      expect(res.scoreBreakdown.overallScore).toBe(0);
    });

    it('rejects causal direction reversal: "inflation rose because supply dropped"', () => {
      const source = 'Inflation rose sharply because component supplies dropped.';
      const candidate = 'Component supplies dropped sharply because inflation rose.';
      const res = evaluateCandidate(source, candidate);
      expect(res.isValid).toBe(false);
      expect(res.rejectionReason).toMatch(/causality/i);
      expect(res.scoreBreakdown.overallScore).toBe(0);
    });

    it('rejects necessary vs sufficient condition inversion: "required for" -> "sufficient for"', () => {
      const source = 'A passing score on the cryptographic safety exam is required for deployment access.';
      const candidate = 'A passing score on the cryptographic safety exam is sufficient for deployment access.';
      const res = evaluateCandidate(source, candidate);
      expect(res.isValid).toBe(false);
      expect(res.rejectionReason).toMatch(/necessary|condition/i);
      expect(res.scoreBreakdown.overallScore).toBe(0);
    });

    it('rejects weakening of restrictive "only if" to unconditional "if"', () => {
      const source = 'Users may access the production cluster only if biometric MFA is enabled.';
      const candidate = 'Users may access the production cluster if biometric MFA is enabled.';
      const res = evaluateCandidate(source, candidate);
      expect(res.isValid).toBe(false);
      expect(res.rejectionReason).toMatch(/conditionality/i);
      expect(res.scoreBreakdown.overallScore).toBe(0);
    });

    it('rejects corrupted alphanumeric identifiers: "CVE-2024-3094" -> "CVE-2024-9999"', () => {
      const source = 'The patch mitigates the supply chain compromise cataloged in CVE-2024-3094.';
      const candidate = 'The patch mitigates the supply chain compromise cataloged in CVE-2024-9999.';
      const res = evaluateCandidate(source, candidate);
      expect(res.isValid).toBe(false);
      expect(res.rejectionReason).toMatch(/alphanumeric|number|identifier/i);
      expect(res.scoreBreakdown.overallScore).toBe(0);
    });

    it('rejects dropped alphanumeric identifiers: "RFC-9110" omitted without trace', () => {
      const source = 'The HTTP headers strictly conform to the specifications in RFC-9110.';
      const candidate = 'The HTTP headers strictly conform to the specifications in the standard.';
      const res = evaluateCandidate(source, candidate);
      expect(res.isValid).toBe(false);
      expect(res.rejectionReason).toMatch(/alphanumeric|number|identifier|discrepancy/i);
      expect(res.scoreBreakdown.overallScore).toBe(0);
    });

    it('rejects missing finite verbs (incomplete sentence fragments)', () => {
      const source = 'The engineering team inspected all server nodes before the launch.';
      const candidate = 'The engineering team all server nodes before the launch.';
      const res = evaluateCandidate(source, candidate);
      expect(res.isValid).toBe(false);
      expect(res.rejectionReason).toMatch(/verb/i);
      expect(res.scoreBreakdown.overallScore).toBe(0);
    });

    it('rejects ungrammatical count determiners modifying mass nouns: "numerous equipment"', () => {
      const source = 'The maintenance crew brought substantial equipment to the datacenter.';
      const candidate = 'The maintenance crew brought numerous equipment to the datacenter.';
      const res = evaluateCandidate(source, candidate);
      expect(res.isValid).toBe(false);
      expect(res.rejectionReason).toMatch(/mass noun|quantif/i);
      expect(res.scoreBreakdown.overallScore).toBe(0);
    });
  });

  // 2. Soft Quality Signals vs Heuristic Penalties
  describe('Soft Quality Signals and Permissive Paraphrase Preservation', () => {
    it('accepts faithful paraphrases with low lexical overlap without false rejection', () => {
      const source = 'The speedy amber fox bounded effortlessly above the dormant canine.';
      const candidate = 'A swift orange vulpine leaped smoothly over a sleeping dog.';
      const res = evaluateCandidate(source, candidate);
      expect(res.isValid).toBe(true);
      expect(res.rejectionReason).toBeUndefined();
      expect(res.scoreBreakdown.overallScore).toBeGreaterThan(0.65);
      expect(res.scoreBreakdown.grammarFluency).toBe(1.0);
    });

    it('accepts complex philosophical rephrasings with near-zero unigram overlap', () => {
      const source = 'Deep intellectual contemplation illuminates existential queries.';
      const candidate = 'Profound meditation sheds clarity on philosophical dilemmas.';
      const res = evaluateCandidate(source, candidate);
      expect(res.isValid).toBe(true);
      expect(res.scoreBreakdown.overallScore).toBeGreaterThan(0.60);
    });

    it('penalizes lost restrictive qualifications softly without rejecting the candidate', () => {
      const source = 'The experimental catalyst exhibited high reactivity under laboratory conditions.';
      const candidate = 'The experimental catalyst exhibited high reactivity.';
      const res = evaluateCandidate(source, candidate);
      // Soft signal: Candidate is grammatically sound, but lost qualification is recorded in warnings
      expect(res.isValid).toBe(true);
      expect(res.warnings.some((w) => w.includes('Lost qualification'))).toBe(true);
      // Soft semantic preservation penalty reflected:
      expect(res.scoreBreakdown.semanticPreservation).toBeLessThanOrEqual(0.70);
    });

    it('preserves valid rhetorical idiom changes: "it goes without saying" -> "obviously"', () => {
      const source = 'It goes without saying that data security remains our top priority.';
      const candidate = 'Obviously, data security remains our top priority.';
      const res = evaluateCandidate(source, candidate);
      expect(res.isValid).toBe(true);
      expect(res.scoreBreakdown.overallScore).toBeGreaterThan(0.70);
    });
  });

  // 3. Deduplication and Multi-Candidate Selection
  describe('Deduplication and Candidate Selection Behavior', () => {
    it('deduplicates candidates that differ only by casing or whitespace', () => {
      const source = 'The system architecture handles high throughput gracefully.';
      const candidates = [
        'The system architecture handles high throughput gracefully.',
        '  The system architecture handles high throughput gracefully.  ',
        'the system architecture handles high throughput gracefully.',
        'The architecture processes high traffic with ease.',
      ];

      const ranking = rankCandidates(source, candidates);
      // The 3 identical candidates should collapse into a single evaluated candidate
      expect(ranking.rankedCandidates.length).toBe(2);
      expect(ranking.bestCandidate).toBeDefined();
    });

    it('orders valid candidates in strict descending order of overall score', () => {
      const source = 'The engineers conducted an investigation into the issue.';
      const candidates = [
        'The engineers investigated the issue.', // concise, fluent, high retention
        'The engineers studied the problem.',    // synonymous, good
        'The team looked at it.',                // brief, lower retention
      ];

      const ranking = rankCandidates(source, candidates);
      expect(ranking.rankedCandidates.length).toBe(3);
      for (let i = 0; i < ranking.rankedCandidates.length - 1; i++) {
        const currScore = ranking.rankedCandidates[i].scoreBreakdown?.overallScore || 0;
        const nextScore = ranking.rankedCandidates[i + 1].scoreBreakdown?.overallScore || 0;
        expect(currScore).toBeGreaterThanOrEqual(nextScore);
      }
    });

    it('assigns clear, unambiguous ranking metadata and percentage labels', () => {
      const source = 'We need to analyze the data.';
      const candidates = [
        'We must analyze the data.',
        'We should examine the data.',
      ];

      const ranking = rankCandidates(source, candidates);
      expect(ranking.rankedCandidates[0].rank).toBe(1);
      expect(ranking.rankedCandidates[0].label).toMatch(/Primary Selection \(\d+%\)/);
      expect(ranking.rankedCandidates[1].rank).toBe(2);
      expect(ranking.rankedCandidates[1].label).toMatch(/Option 2 \(\d+%\)/);
    });
  });
});
