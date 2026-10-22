import { describe, it, expect } from 'vitest';
import {
  extractNumbers,
  extractCitations,
  extractDates,
  extractQuotes,
  validateInvariants,
} from '../../src/lib/pipeline/invariants';
import { computeCosineSimilarity, chunkText, interpretSemanticScore } from '../../src/lib/pipeline/semantic';

describe('Deterministic Invariants Pipeline', () => {
  it('extracts numbers, decimals, and percentages correctly', () => {
    const text = 'Revenue grew 14.5% to $3,250 million across 12 countries in 2024.';
    const nums = extractNumbers(text);
    expect(nums).toContain('14.5%');
    expect(nums).toContain('3250');
    expect(nums).toContain('12');
    expect(nums).toContain('2024');
  });

  it('extracts dates and years accurately', () => {
    const text = 'Published on October 15, 2024 and updated on 2025-01-20 in the 2026 cycle.';
    const dates = extractDates(text);
    expect(dates).toContain('October 15, 2024');
    expect(dates).toContain('2025-01-20');
    expect(dates).toContain('2026');
  });

  it('extracts academic bracket and author-year citations', () => {
    const text = 'Prior research [1, 2] and extensive trials (Vaswani et al., 2017) demonstrated high fidelity [14].';
    const cites = extractCitations(text);
    expect(cites).toContain('[1, 2]');
    expect(cites).toContain('[14]');
    expect(cites).toContain('(Vaswani et al., 2017)');
  });

  it('extracts quoted passages', () => {
    const text = 'The report concluded: "Quantum coherence remained stable" during phase 1.';
    const quotes = extractQuotes(text);
    expect(quotes).toContain('Quantum coherence remained stable');
  });

  it('passes validation when all invariants are preserved', () => {
    const orig = 'In 2024, experimental trials [1] reported a 98.2% accuracy in 45 patients.';
    const rewr = 'During 2024, clinical trials [1] achieved a 98.2% success rate across 45 patients.';
    const res = validateInvariants(orig, rewr);
    expect(res.isValid).toBe(true);
    expect(res.numbersPreserved).toBe(true);
    expect(res.citationsPreserved).toBe(true);
    expect(res.criticalViolation).toBe(false);
    expect(res.preservationWarnings).toHaveLength(0);
  });

  it('flags warning and critical violation when numbers or citations are dropped', () => {
    const orig = 'The study [3] tracked 1,500 subjects and noted a 42% decrease.';
    const badRewrite = 'The study observed subjects and noted a decrease.';
    const res = validateInvariants(orig, badRewrite);
    expect(res.isValid).toBe(false);
    expect(res.criticalViolation).toBe(true);
    expect(res.numbersPreserved).toBe(false);
    expect(res.citationsPreserved).toBe(false);
    expect(res.missingCitations).toContain('[3]');
    expect(res.missingNumbers).toContain('1500');
    expect(res.missingNumbers).toContain('42%');
  });

  it('detects omitted frozen words', () => {
    const orig = 'The algorithm utilizes Transformer architectures for NLP.';
    const rewr = 'The system uses deep neural models for language processing.';
    const res = validateInvariants(orig, rewr, { frozenWords: ['Transformer', 'NLP'] });
    expect(res.isValid).toBe(false);
    expect(res.preservationWarnings.some((w) => w.includes('Frozen words omitted'))).toBe(true);
  });

  it('detects dropped negation polarity (flipping negative claim)', () => {
    const orig = 'The phase 3 clinical trial did not find a significant difference between groups and observed no secondary toxicity.';
    const badRewrite = 'The phase 3 clinical trial found a significant difference between groups and observed secondary toxicity.';
    const res = validateInvariants(orig, badRewrite);

    expect(res.negationsPreserved).toBe(false);
    expect(res.criticalViolation).toBe(true);
    expect(res.negationWarnings.length).toBeGreaterThan(0);
    expect(res.preservationWarnings.some((w) => w.includes('Negation polarity dropped'))).toBe(true);
  });

  it('detects lost epistemic hedging and dogmatic assertion shifts', () => {
    const orig = 'Preliminary empirical data tentatively suggests that the intervention may potentially reduce symptoms, though future trials are required.';
    const dogmaticRewrite = 'Empirical data definitively proves that the intervention reduces symptoms without question.';
    const res = validateInvariants(orig, dogmaticRewrite);

    expect(res.hedgingPreserved).toBe(false);
    expect(res.hedgingWarnings.length).toBeGreaterThan(0);
    expect(res.preservationWarnings.some((w) => w.includes('Epistemic hedging'))).toBe(true);
  });

  it('detects altered or dropped measurement units', () => {
    const orig = 'The patient was prescribed 50mg of the compound and achieved a 35% reduction in 28 days.';
    const badRewrite = 'The patient was prescribed 50 of the compound and achieved a 35 reduction in 28.';
    const res = validateInvariants(orig, badRewrite);

    expect(res.unitsPreserved).toBe(false);
    expect(res.criticalViolation).toBe(true);
    expect(res.hasConfirmedFactualError).toBe(true);
    expect(res.missingUnits.length).toBeGreaterThan(0);
  });

  it('handles negative contractions without falsely flagging dropped negations', () => {
    const orig = 'We could not finish the migration and they have not approved the PR.';
    const contractedRewrite = "We couldn't finish the migration and they haven't approved the PR.";
    const res = validateInvariants(orig, contractedRewrite);

    expect(res.negationsPreserved).toBe(true);
    expect(res.hasConfirmedFactualError).toBe(false);
  });

  it('detects inverted causality direction', () => {
    const orig = 'Because protein folding degradation occurred rapidly, enzymes failed to catalyze the synthesis reaction.';
    const invertedRewrite = 'Because enzymes failed to catalyze the synthesis reaction, protein folding degradation occurred rapidly.';
    const res = validateInvariants(orig, invertedRewrite);

    expect(res.causalityPreserved).toBe(false);
    expect(res.criticalViolation).toBe(true);
    expect(res.hasConfirmedFactualError).toBe(true);
    expect(res.causalityWarnings.length).toBeGreaterThan(0);
    expect(res.violations.some((v) => v.type === 'reversed_causality' && v.severity === 'critical')).toBe(true);
  });

  it('detects unsupported numerical additions and hallucinated stats', () => {
    const orig = 'The model achieved improved latency across benchmark trials.';
    const hallucinatedRewrite = 'The model achieved improved latency by 45% and reduced memory to $58.2 million across 3 hubs.';
    const res = validateInvariants(orig, hallucinatedRewrite);

    expect(res.numbersPreserved).toBe(false);
    expect(res.hasConfirmedFactualError).toBe(true);
    expect(res.unsupportedAdditions.length).toBeGreaterThan(0);
    expect(res.violations.some((v) => v.type === 'unsupported_addition')).toBe(true);
  });

  it('detects mutated measurement units (e.g. 50mg to 50kg, 145ms to 145s)', () => {
    const orig = 'The dosage was set at 50mg and latency stabilized at 145ms.';
    const mutatedRewrite = 'The dosage was set at 50kg and latency stabilized at 145s.';
    const res = validateInvariants(orig, mutatedRewrite);

    expect(res.unitsPreserved).toBe(false);
    expect(res.hasConfirmedFactualError).toBe(true);
    expect(res.mutatedUnits.length).toBeGreaterThan(0);
    expect(res.violations.some((v) => v.type === 'mutated_unit')).toBe(true);
  });

  it('strictly separates confirmed factual errors from soft semantic drift warnings', () => {
    // 1. Factual Error only
    const origFact = 'The cluster runs 12 nodes across 3 regions.';
    const rewrFact = 'The cluster runs 10 nodes across 3 regions.';
    const factRes = validateInvariants(origFact, rewrFact);
    expect(factRes.hasConfirmedFactualError).toBe(true);
    expect(factRes.hasSemanticDriftWarning).toBe(false);

    // 2. Soft Semantic Drift only (lost hedging without fact mutation)
    const origDrift = 'Preliminary observations tentatively suggest that the pattern may be cyclical.';
    const rewrDrift = 'Observations suggest the pattern is cyclical in rhythm and cadence.';
    const driftRes = validateInvariants(origDrift, rewrDrift);
    expect(driftRes.hasConfirmedFactualError).toBe(false);
  });
});

describe('Semantic Cosine Similarity & Limits', () => {
  it('calculates exact cosine similarity for identical vectors', () => {
    const vecA = [0.2, 0.5, 0.8, 0.1];
    const score = computeCosineSimilarity(vecA, vecA);
    expect(score).toBeCloseTo(1.0, 5);
  });

  it('calculates orthogonal vectors as 0 similarity', () => {
    const vecA = [1, 0, 0];
    const vecB = [0, 1, 0];
    const score = computeCosineSimilarity(vecA, vecB);
    expect(score).toBeCloseTo(0.0, 5);
  });

  it('interprets high vs low semantic scores with advisory notices', () => {
    const high = interpretSemanticScore(0.92);
    expect(high.status).toBe('high');
    expect(high.advisory).toContain('High semantic alignment');

    const low = interpretSemanticScore(0.55);
    expect(low.status).toBe('low');
    expect(low.advisory).toContain('Low semantic alignment');
  });

  it('demonstrates that high cosine similarity does NOT guarantee fact or negation preservation', () => {
    // Negated sentence vs affirmative sentence often have high vector cosine similarity in general models
    // e.g., "The drug is effective" vs "The drug is not effective" differ by 1 word in high-dimensional space
    const affirmativeVector = [0.91, 0.42, 0.05, 0.12];
    const negatedVector = [0.89, 0.44, 0.04, 0.11];
    const cosmeticSim = computeCosineSimilarity(affirmativeVector, negatedVector);
    expect(cosmeticSim).toBeGreaterThan(0.95);

    // Despite >95% cosine score, deterministic invariant check catches the critical negation flip
    const orig = 'The drug was not effective in reducing patient symptoms.';
    const reversed = 'The drug was effective in reducing patient symptoms.';
    const inv = validateInvariants(orig, reversed);
    expect(inv.negationsPreserved).toBe(false);
    expect(inv.criticalViolation).toBe(true);
  });

  it('splits long text into bounded paragraph chunks', () => {
    const longText = Array(10).fill('This is a test paragraph with several words discussing a topic.').join('\n\n');
    const chunks = chunkText(longText, 25);
    expect(chunks.length).toBeGreaterThan(1);
  });
});
