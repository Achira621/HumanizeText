export interface Confusion {
  readonly tp: number;
  readonly fp: number;
  readonly tn: number;
  readonly fn: number;
}

export interface Prf {
  readonly precision: number;
  readonly recall: number;
  readonly f1: number;
  readonly accuracy: number;
  readonly fpr: number;
}

export function confusion(
  scores: readonly number[],
  labels: readonly boolean[],
  threshold: number,
): Confusion {
  if (scores.length !== labels.length) throw new Error('scores and labels must have equal length');
  let tp = 0;
  let fp = 0;
  let tn = 0;
  let fn = 0;
  for (let i = 0; i < scores.length; i++) {
    const predicted = (scores[i] ?? 0) >= threshold;
    const actual = labels[i] === true;
    if (predicted && actual) tp++;
    else if (predicted && !actual) fp++;
    else if (!predicted && actual) fn++;
    else tn++;
  }
  return { tp, fp, tn, fn };
}

const safeDiv = (a: number, b: number): number => (b === 0 ? 0 : a / b);

export function prf(c: Confusion): Prf {
  const precision = safeDiv(c.tp, c.tp + c.fp);
  const recall = safeDiv(c.tp, c.tp + c.fn);
  return {
    precision,
    recall,
    f1: safeDiv(2 * precision * recall, precision + recall),
    accuracy: safeDiv(c.tp + c.tn, c.tp + c.fp + c.tn + c.fn),
    fpr: safeDiv(c.fp, c.fp + c.tn),
  };
}

/** ROC-AUC via the Mann–Whitney U statistic with average ranks for ties. Returns NaN if a class is missing. */
export function rocAuc(scores: readonly number[], labels: readonly boolean[]): number {
  if (scores.length !== labels.length) throw new Error('scores and labels must have equal length');
  const items = scores
    .map((score, i) => ({ score, positive: labels[i] === true }))
    .sort((a, b) => a.score - b.score);
  const n = items.length;
  let positives = 0;
  let positiveRankSum = 0;
  let i = 0;
  while (i < n) {
    let j = i;
    while (j + 1 < n && items[j + 1]?.score === items[i]?.score) j++;
    const averageRank = (i + j) / 2 + 1;
    for (let k = i; k <= j; k++) {
      if (items[k]?.positive) {
        positives++;
        positiveRankSum += averageRank;
      }
    }
    i = j + 1;
  }
  const negatives = n - positives;
  if (positives === 0 || negatives === 0) return Number.NaN;
  return (positiveRankSum - (positives * (positives + 1)) / 2) / (positives * negatives);
}

/** Picks the decision threshold (predict positive when score >= threshold) that maximises F1 on the given data. */
export function bestThreshold(
  scores: readonly number[],
  labels: readonly boolean[],
): { threshold: number; f1: number } {
  const candidates = [...new Set(scores)].sort((a, b) => a - b);
  let best = { threshold: 0.5, f1: -1 };
  for (const t of candidates) {
    const { f1 } = prf(confusion(scores, labels, t));
    if (f1 > best.f1) best = { threshold: t, f1 };
  }
  return best;
}

export const mean = (xs: readonly number[]): number =>
  xs.length === 0 ? 0 : xs.reduce((a, b) => a + b, 0) / xs.length;

export const round = (x: number, digits = 3): number => {
  const f = 10 ** digits;
  return Math.round(x * f) / f;
};

const STOPWORDS: ReadonlySet<string> = new Set(
  (
    'a an the and or but if then so of to in on at by for with from as is are was were be been being it its ' +
    'this that these those i me my we our you your he she they them their not no do does did have has had will ' +
    'would can could should may might just than too very also into over about out up down off more most some any ' +
    'such only own same other each few both all one two'
  ).split(' '),
);

export function words(text: string): string[] {
  return text.toLowerCase().match(/[a-z0-9']+/g) ?? [];
}

export function contentWords(text: string): string[] {
  return words(text).filter((w) => w.length > 3 && !STOPWORDS.has(w));
}

/** Fraction of the original's distinct content words still present in the rewrite (crude meaning-preservation proxy). */
export function contentRetention(original: string, rewritten: string): number {
  const originalSet = new Set(contentWords(original));
  if (originalSet.size === 0) return 1;
  const rewrittenSet = new Set(contentWords(rewritten));
  let kept = 0;
  for (const w of originalSet) if (rewrittenSet.has(w)) kept++;
  return kept / originalSet.size;
}

export function containsPhrase(text: string, phrase: string): boolean {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, 'i').test(text);
}
