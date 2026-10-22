import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  extractNumbers,
  extractCitations,
  extractUrls,
  extractQuotes,
  validateInvariants,
} from '../../src/lib/pipeline/invariants';
import { humanizeWithRules } from '../../src/lib/humanizer/ruleEngine';

interface InvariantRow {
  id: string;
  genre: string;
  length: string;
  sourceText: string;
  expectedNumbers?: string[];
  expectedCitations?: string[];
  expectedUrls?: string[];
  expectedQuotes?: string[];
  expectedProperNouns?: string[];
  split: 'validation' | 'test';
}

function loadInvariantFixtures(): InvariantRow[] {
  const filePath = fileURLToPath(new URL('./fixtures/humanizer_invariants.json', import.meta.url));
  return JSON.parse(readFileSync(filePath, 'utf-8'));
}

describe('Humanizer Invariants & Quality Evaluation Suite (Task 2.A)', () => {
  const fixtures = loadInvariantFixtures();

  it('verifies deterministic entity extraction on benchmark passages', () => {
    for (const row of fixtures) {
      if (row.expectedNumbers) {
        const nums = extractNumbers(row.sourceText);
        for (const expectedNum of row.expectedNumbers) {
          expect(nums).toContain(expectedNum);
        }
      }

      if (row.expectedCitations) {
        const cites = extractCitations(row.sourceText);
        expect(cites.length).toBeGreaterThanOrEqual(1);
      }

      if (row.expectedUrls) {
        const urls = extractUrls(row.sourceText);
        for (const expectedUrl of row.expectedUrls) {
          expect(urls).toContain(expectedUrl);
        }
      }

      if (row.expectedQuotes) {
        const quotes = extractQuotes(row.sourceText);
        expect(quotes.length).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('validates that humanization preserves factual invariants without omissions', () => {
    for (const row of fixtures) {
      // Run through humanizer engine
      const humanized = humanizeWithRules(row.sourceText, {
        mode: 'natural',
        vocabularyIntensity: 'balanced',
      });

      const invResult = validateInvariants(row.sourceText, humanized.improvedText);
      if (!invResult.urlsPreserved) {
        console.error(`URL PRESERVATION FAILED [${row.id}]:`, invResult.missingUrls, 'Improved:', humanized.improvedText);
      }

      // Invariants must pass without critical violations
      expect(invResult.criticalViolation).toBe(false);
      expect(invResult.numbersPreserved).toBe(true);
      expect(invResult.citationsPreserved).toBe(true);
      expect(invResult.urlsPreserved).toBe(true);
      expect(invResult.quotesPreserved).toBe(true);
      expect(invResult.lengthRatio).toBeGreaterThan(0.65);
      expect(invResult.lengthRatio).toBeLessThan(1.45);
    }
  });

  it('detects and flags omitted facts or deleted entities when present in faulty candidates', () => {
    const original = 'Dr. Elena Vance documented 42 confirmed clinical cases at Harvard University in 2024.';
    const faultyOmittedNumber = 'Dr. Elena Vance documented confirmed clinical cases at Harvard University.';
    const faultyOmittedDate = 'Dr. Elena Vance documented 42 confirmed clinical cases at Harvard University.';

    const checkNum = validateInvariants(original, faultyOmittedNumber);
    expect(checkNum.numbersPreserved).toBe(false);
    expect(checkNum.missingNumbers).toContain('42');
    expect(checkNum.criticalViolation).toBe(true);

    const checkDate = validateInvariants(original, faultyOmittedDate);
    expect(checkDate.missingNumbers).toContain('2024');
    expect(checkDate.preservationWarnings.some((w) => w.toLowerCase().includes('number'))).toBe(true);
  });

  it('measures sentence length variance (burstiness) improvement for natural human rhythm', () => {
    const roboticAiText =
      'Artificial intelligence is rapidly transforming global industry. Machine learning models automate routine administrative operations. Automated workflows significantly enhance workplace organizational efficiency. Modern computer vision systems inspect manufacturing quality control lines.';

    // Measure baseline standard deviation of sentence lengths
    const computeBurstiness = (text: string) => {
      const sentences = text.split(/[.!?]+/).map((s) => s.trim()).filter((s) => s.length > 5);
      const lengths = sentences.map((s) => s.split(/\s+/).filter(Boolean).length);
      const mean = lengths.reduce((a, b) => a + b, 0) / (lengths.length || 1);
      const variance = lengths.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (lengths.length || 1);
      return Math.sqrt(variance);
    };

    const initialBurstiness = computeBurstiness(roboticAiText);
    const humanized = humanizeWithRules(roboticAiText, { mode: 'natural', vocabularyIntensity: 'dynamic' });
    const improvedBurstiness = computeBurstiness(humanized.improvedText);

    // Initial robotic text has nearly uniform sentences (stdDev is low ~ 0.5 - 1.5)
    expect(initialBurstiness).toBeLessThan(3.0);
    expect(improvedBurstiness).toBeGreaterThanOrEqual(initialBurstiness);
  });
});
