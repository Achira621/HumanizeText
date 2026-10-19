import { beforeAll, describe, expect, it } from 'vitest';
import { adapters } from './adapters';
import { loadPlagiarism } from './fixtures';
import { GATES } from './gates';
import { bestThreshold, confusion, prf, rocAuc, round } from './metrics';
import type { PlagiarismRow, PlagiarismType } from './types';

interface Scored {
  readonly row: PlagiarismRow;
  readonly score: number;
}

const similarity = adapters.similarity;

describe.skipIf(similarity === undefined)('Plagiarism / similarity evaluation', () => {
  let scored: Scored[] = [];
  let threshold = 0.5;

  beforeAll(async () => {
    if (!similarity) throw new Error('similarity adapter not wired');
    const rows = loadPlagiarism();
    scored = await Promise.all(
      rows.map(async (row) => ({ row, score: await similarity(row.sourceText, row.candidateText) })),
    );
    const train = scored.filter((s) => s.row.split === 'train');
    threshold = bestThreshold(
      train.map((s) => s.score),
      train.map((s) => s.row.isPlagiarised),
    ).threshold;
  });

  const rateAbove = (type: PlagiarismType): number => {
    const subset = scored.filter((s) => s.row.split === 'test' && s.row.type === type);
    if (subset.length === 0) return 0;
    return subset.filter((s) => s.score >= threshold).length / subset.length;
  };

  it('is symmetric-safe: identical text scores at (or very near) 1', () => {
    const verbatim = scored.filter((s) => s.row.type === 'verbatim_copy');
    for (const s of verbatim) expect(s.score).toBeGreaterThan(0.95);
  });

  it('meets overall F1 on held-out topics', () => {
    const test = scored.filter((s) => s.row.split === 'test');
    const scores = test.map((s) => s.score);
    const labels = test.map((s) => s.row.isPlagiarised);
    const m = prf(confusion(scores, labels, threshold));
    console.info('[plagiarism]', {
      threshold: round(threshold),
      auc: round(rocAuc(scores, labels)),
      precision: round(m.precision),
      recall: round(m.recall),
      f1: round(m.f1),
    });
    expect(m.f1).toBeGreaterThanOrEqual(GATES.plagiarism.minF1Test);
  });

  it('per-type detection rates', () => {
    const rates = {
      verbatim: rateAbove('verbatim_copy'),
      synonymSwap: rateAbove('synonym_swap'),
      sentenceReorder: rateAbove('sentence_reorder'),
      mosaic: rateAbove('mosaic_partial'),
      fprHardNegative: rateAbove('same_topic_different_text'),
      fprUnrelated: rateAbove('unrelated_original'),
    };
    console.info('[plagiarism] per-type', Object.fromEntries(Object.entries(rates).map(([k, v]) => [k, round(v)])));
    expect(rates.verbatim).toBeGreaterThanOrEqual(GATES.plagiarism.minRecallVerbatim);
    expect(rates.synonymSwap).toBeGreaterThanOrEqual(GATES.plagiarism.minRecallSynonymSwap);
    expect(rates.mosaic).toBeGreaterThanOrEqual(GATES.plagiarism.minRecallMosaic);
    expect(rates.fprHardNegative).toBeLessThanOrEqual(GATES.plagiarism.maxFprHardNegative);
    expect(rates.fprUnrelated).toBeLessThanOrEqual(GATES.plagiarism.maxFprUnrelated);
  });
});
