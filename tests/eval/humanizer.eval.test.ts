import { beforeAll, describe, expect, it } from 'vitest';
import { adapters } from './adapters';
import { loadHumanizer } from './fixtures';
import { GATES } from './gates';
import { containsPhrase, contentRetention, contentWords, mean, round, words } from './metrics';
import { INTENSITIES, type HumanizerRow, type Intensity } from './types';

const humanize = adapters.humanize;
const scoreText = adapters.scoreText;

async function run(text: string, intensity: Intensity, frozenWords: readonly string[] = []): Promise<string> {
  if (!humanize) throw new Error('humanize adapter not wired');
  return humanize(text, { intensity, frozenWords });
}

describe.skipIf(humanize === undefined)('Humanizer / rule engine evaluation', () => {
  let rows: HumanizerRow[] = [];
  const outputs = new Map<Intensity, string[]>();

  beforeAll(async () => {
    rows = loadHumanizer();
    for (const intensity of INTENSITIES) {
      outputs.set(intensity, await Promise.all(rows.map((r) => run(r.inputAiText, intensity))));
    }
  });

  const outputsFor = (i: Intensity): string[] => outputs.get(i) ?? [];

  it('is deterministic for identical input and options', async () => {
    for (const row of rows.slice(0, 10)) {
      expect(await run(row.inputAiText, 'med')).toBe(await run(row.inputAiText, 'med'));
    }
  });

  it('removes known AI cliché markers', () => {
    let total = 0;
    let removed = 0;
    outputsFor('med').forEach((out, i) => {
      for (const marker of rows[i]?.markers ?? []) {
        total++;
        if (!containsPhrase(out, marker)) removed++;
      }
    });
    const rate = total === 0 ? 1 : removed / total;
    console.info('[humanizer] marker removal rate @med', round(rate));
    expect(rate).toBeGreaterThanOrEqual(GATES.humanizer.minMarkerRemovalRate);
  });

  it('keeps meaning proxy and length in range', () => {
    const outs = outputsFor('med');
    const retention = mean(outs.map((out, i) => contentRetention(rows[i]?.inputAiText ?? '', out)));
    const [lo, hi] = GATES.humanizer.lengthRatioRange;
    console.info('[humanizer] mean content retention @med', round(retention));
    expect(retention).toBeGreaterThanOrEqual(GATES.humanizer.minContentRetentionMed);
    outs.forEach((out, i) => {
      const ratio = words(out).length / Math.max(1, words(rows[i]?.inputAiText ?? '').length);
      expect(ratio).toBeGreaterThanOrEqual(lo);
      expect(ratio).toBeLessThanOrEqual(hi);
    });
  });

  it('intensity tiers change text monotonically (low <= med <= high <= max)', () => {
    const change = INTENSITIES.map((tier) =>
      mean(outputsFor(tier).map((out, i) => 1 - contentRetention(rows[i]?.inputAiText ?? '', out))),
    );
    console.info('[humanizer] mean change by tier', Object.fromEntries(INTENSITIES.map((t, i) => [t, round(change[i] ?? 0)])));
    for (let i = 1; i < change.length; i++) {
      expect(change[i] ?? 0).toBeGreaterThanOrEqual((change[i - 1] ?? 0) - GATES.humanizer.monotonicSlack);
    }
  });

  it('preserves frozen words verbatim even at max intensity', async () => {
    let total = 0;
    let kept = 0;
    for (const row of rows) {
      const frozen = [...new Set(contentWords(row.inputAiText))].filter((w) => w.length >= 6).slice(0, 2);
      const out = await run(row.inputAiText, 'max', frozen);
      for (const w of frozen) {
        total++;
        if (containsPhrase(out, w)) kept++;
      }
    }
    expect(total === 0 ? 1 : kept / total).toBeGreaterThanOrEqual(GATES.humanizer.frozenWordPreservation);
  });

  it.skipIf(scoreText === undefined)('lowers the detector score on average (cross-check with detector)', async () => {
    if (!scoreText) return;
    const before = await Promise.all(rows.map((r) => scoreText(r.inputAiText)));
    const after = await Promise.all(outputsFor('high').map((o) => scoreText(o)));
    const drop = mean(before) - mean(after);
    console.info('[humanizer] mean detector score drop @high', round(drop));
    expect(drop).toBeGreaterThanOrEqual(GATES.humanizer.minMeanDetectorScoreDrop);
  });
});
