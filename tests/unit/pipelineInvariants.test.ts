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
});

describe('Semantic Cosine Similarity', () => {
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

  it('splits long text into bounded paragraph chunks', () => {
    const longText = Array(10).fill('This is a test paragraph with several words discussing a topic.').join('\n\n');
    const chunks = chunkText(longText, 25);
    expect(chunks.length).toBeGreaterThan(1);
  });
});
