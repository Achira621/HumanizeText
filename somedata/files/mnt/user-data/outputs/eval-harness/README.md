# Eval harness for the client-side detector / similarity / humanizer

Vitest suites that score your real modules against the dataset and fail CI on regressions.
Strict TS (no `any`), typechecked under `strict` + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`.

## Setup
1. Copy `src/eval/` into your repo (fixtures included).
2. Edit `src/eval/adapters.ts` and wire three functions (suites with an unwired adapter are SKIPPED):
   - `scoreText(text) -> 0..1`   (extract the maths from `detector.worker.ts` into a pure `detector.core.ts`; the worker just wraps it)
   - `similarity(source, candidate) -> 0..1`   (your winnowing/HMAC engine)
   - `humanize(text, { intensity, frozenWords }) -> string`   (`ruleEngine.ts`)
3. Add scripts: `"eval": "vitest run src/eval"`. Include `src/eval/**/*.test.ts` in vitest `include`; it must run in the `node` environment.
4. Regenerate fixtures from CSVs any time: `python scripts/export_fixtures.py ../dataset src/eval/fixtures`

## What is measured
| Suite | Metrics |
|---|---|
| detector | ROC-AUC and F1 on held-out TOPICS (threshold picked on train only); mean score ordering human < mixed < ai |
| plagiarism | F1; recall per attack type (verbatim, synonym swap, reorder, mosaic); false-positive rate on same-topic and unrelated text |
| humanizer | determinism; known-cliché removal rate; content-word retention + length ratio; monotonic Low<=Med<=High<=Max change; frozen words preserved at Max; mean detector-score drop |

Thresholds live in `gates.ts`. Run once, read the `console.info` report, then tighten them.

## Tips for the plagiarism engine on short text
Passages here are ~45 words. Use small k-grams (k=3-5) and a small winnowing window (w=3-4), otherwise
synonym-swap and mosaic cases will be missed.

## IMPORTANT limitation of the seed data
A trivial baseline (count of "moreover/however/crucial..." and plain 3-gram Jaccard) already scores
AUC=1.0 / F1=1.0 on this set. So the seed data is too easy to separate a good detector from a bad one;
it proves your pipeline runs and catches gross breakage only. Before trusting the numbers, add hard cases:
human text that uses formal/cliché phrasing, AI text in a casual register or with no cliché markers,
heavy paraphrases (not synonym swaps), and real corpora (HC3, RAID, PAN, PAWS).
