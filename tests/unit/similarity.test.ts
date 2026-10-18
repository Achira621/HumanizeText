import { describe, it, expect } from 'vitest';
import { tokenizeText } from '../../src/lib/similarity/tokenizer';
import { createWordShingles } from '../../src/lib/similarity/shingles';
import { winnowFingerprints, FingerprintedShingle } from '../../src/lib/similarity/winnowing';
import { SimilarityEngine, ReferenceInput } from '../../src/lib/similarity/engine';

describe('Similarity Module — Tokenizer & Normalization', () => {
  it('tokenizes English text and tracks accurate character offsets', () => {
    const text = 'Privacy-first writing humanization platform.';
    const tokenized = tokenizeText(text);

    expect(tokenized.totalWords).toBe(4);
    expect(tokenized.tokens[0].raw).toBe('Privacy-first');
    expect(tokenized.tokens[0].normalized).toBe('privacy-first');
    expect(tokenized.tokens[0].startChar).toBe(0);
    expect(tokenized.tokens[0].endChar).toBe(13);
  });

  it('correctly handles Unicode accents and multilingual characters', () => {
    const text = 'L\'élève étudie les mathématiques à l\'université de Zürich.';
    const tokenized = tokenizeText(text);

    expect(tokenized.totalWords).toBeGreaterThan(5);
    const tokens = tokenized.tokens.map((t) => t.normalized);
    expect(tokens).toContain('élève');
    expect(tokens).toContain('étudie');
    expect(tokens).toContain('mathématiques');
    expect(tokens).toContain('zürich');
  });
});

describe('Similarity Module — Shingling & Winnowing', () => {
  it('generates sliding n-gram shingles with exact word bounds', () => {
    const text = 'one two three four five six seven';
    const tokenized = tokenizeText(text);
    const shingles = createWordShingles(tokenized, 5);

    expect(shingles).toHaveLength(3);
    expect(shingles[0].normalizedText).toBe('one two three four five');
    expect(shingles[1].normalizedText).toBe('two three four five six');
    expect(shingles[2].normalizedText).toBe('three four five six seven');
  });

  it('applies winnowing to select minimum hashes per window', () => {
    // Construct simulated fingerprinted shingles
    const dummyShingles: FingerprintedShingle[] = [
      { hash: '77', shingle: { shingleIndex: 0 } as any },
      { hash: '68', shingle: { shingleIndex: 1 } as any },
      { hash: '34', shingle: { shingleIndex: 2 } as any },
      { hash: '42', shingle: { shingleIndex: 3 } as any },
      { hash: '99', shingle: { shingleIndex: 4 } as any },
      { hash: '12', shingle: { shingleIndex: 5 } as any },
    ];

    const winnowed = winnowFingerprints(dummyShingles, 4);
    expect(winnowed.length).toBeLessThan(dummyShingles.length);
    // '34' and '12' should be selected as regional minima
    const selectedHashes = winnowed.map((w) => w.hash);
    expect(selectedHashes).toContain('34');
    expect(selectedHashes).toContain('12');
  });
});

describe('Similarity Module — End-to-End Engine Comparison', () => {
  it('detects 100% overlap for identical documents', async () => {
    const text =
      'Security architectures should prioritize authenticated symmetric ciphers. Cryptographic hashing creates a one-way deterministic digest useful for data integrity checks without decrypting payloads.';

    const references: ReferenceInput[] = [
      {
        id: 'ref-identical',
        name: 'Identical Corpus Entry.txt',
        text,
      },
    ];

    const report = await SimilarityEngine.compareDocuments(text, 'Submitted.txt', references);

    expect(report.estimatedOverlapPercentage).toBe(100);
    expect(report.matchedPassagesCount).toBeGreaterThanOrEqual(1);
    expect(report.referenceBreakdown[0].overlapPercentage).toBe(100);
  });

  it('detects 0% overlap for completely unrelated documents', async () => {
    const submitted =
      'Photosynthesis in vascular flora converts solar irradiance into glucose monomers through localized thylakoid membrane reactions.';

    const references: ReferenceInput[] = [
      {
        id: 'ref-unrelated',
        name: 'Economics Textbook.txt',
        text: 'Macroeconomic equilibrium requires liquidity adjustments from central banking authorities regulating short-term benchmark rates.',
      },
    ];

    const report = await SimilarityEngine.compareDocuments(submitted, 'Submitted.txt', references);

    expect(report.estimatedOverlapPercentage).toBe(0);
    expect(report.matchedPassagesCount).toBe(0);
    expect(report.passages).toHaveLength(0);
  });

  it('detects partial copying and isolates the copied passage', async () => {
    const sharedPassage =
      'Security architectures should prioritize authenticated symmetric ciphers with verified tags.';

    const submitted = `Here is our introductory overview. ${sharedPassage} Now we transition to autonomous agent logic.`;
    const reference = `Historical guidelines state that ${sharedPassage} However, legacy protocols often omit this requirement.`;

    const references: ReferenceInput[] = [
      {
        id: 'ref-partial',
        name: 'Reference Doc.txt',
        text: reference,
      },
    ];

    const report = await SimilarityEngine.compareDocuments(submitted, 'Submitted.txt', references, {
      shingleSize: 4,
      windowSize: 2,
    });

    expect(report.estimatedOverlapPercentage).toBeGreaterThan(20);
    expect(report.matchedPassagesCount).toBeGreaterThanOrEqual(1);
    expect(report.passages[0].matchedText.toLowerCase()).toContain('authenticated symmetric ciphers');
  });

  it('detects copied material even when paragraphs are reordered', async () => {
    const p1 = 'First paragraph explaining quantum annealing principles in physical hardware.';
    const p2 = 'Second paragraph detailing cryostat thermal regulation at sub-kelvin temperatures.';

    const submitted = `${p2}\n\n${p1}`;
    const reference = `${p1}\n\n${p2}`;

    const references: ReferenceInput[] = [
      {
        id: 'ref-reordered',
        name: 'Original Article.txt',
        text: reference,
      },
    ];

    const report = await SimilarityEngine.compareDocuments(submitted, 'Submitted.txt', references, {
      shingleSize: 4,
      windowSize: 2,
    });

    expect(report.estimatedOverlapPercentage).toBeGreaterThan(80);
    expect(report.matchedPassagesCount).toBeGreaterThanOrEqual(1);
  });

  it('gracefully handles empty and very short documents without crashing', async () => {
    const emptyReport = await SimilarityEngine.compareDocuments('', 'Empty.txt', []);
    expect(emptyReport.estimatedOverlapPercentage).toBe(0);
    expect(emptyReport.matchedWordsCount).toBe(0);

    const singleWord = await SimilarityEngine.compareDocuments('Word', 'Short.txt', [
      { id: '1', name: 'Ref.txt', text: 'Different' },
    ]);
    expect(singleWord.estimatedOverlapPercentage).toBe(0);
  });
});
