import { describe, it, expect } from 'vitest';
import benchmarkData from '../fixtures/benchmarks/rewrite_strength_matched_30.json';
import { RuleBasedHumanizerEngine } from '../../src/lib/humanizer/ruleEngine';
import { validateInvariants } from '../../src/lib/pipeline/invariants';
import { validateSentenceVerbs, validateArticleAgreement, validateMassNounQuantification } from '../../src/lib/pipeline/qualityValidator';
import type { RewriteStrength } from '../../src/types';

function computeLevenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

function computeEditRatio(orig: string, rewr: string): number {
  if (orig === rewr) return 0;
  const maxLen = Math.max(orig.length, rewr.length);
  if (maxLen === 0) return 0;
  return Number((computeLevenshtein(orig, rewr) / maxLen).toFixed(4));
}

function computeLexicalRetention(orig: string, rewr: string): number {
  const origTokens = orig.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
  if (origTokens.length === 0) return 1.0;
  const rewrTokenSet = new Set(rewr.toLowerCase().match(/\b[a-z]{3,}\b/g) || []);
  const retained = origTokens.filter((t) => rewrTokenSet.has(t)).length;
  return Number((retained / origTokens.length).toFixed(4));
}

function countSentenceStructureChanges(orig: string, rewr: string): number {
  const origSentences = orig.split(/(?<=[.!?])\s+/).filter(Boolean);
  const rewrSentences = rewr.split(/(?<=[.!?])\s+/).filter(Boolean);

  // Count sentence splits and merges
  const lengthDelta = Math.abs(origSentences.length - rewrSentences.length);
  return lengthDelta;
}

interface ModeMetrics {
  strength: RewriteStrength;
  inputsTransformed: number;
  totalInputs: number;
  meanEditRatio: number;
  meanLexicalRetention: number;
  totalStructureChanges: number;
  unnecessaryChangeCases: number;
  detectedInvariantViolations: number;
  detectedGrammarRegressions: number;
  worseOutputCases: number;
  sameOutputCases: number;
}

describe('Task 2: Rewrite-Strength Validation across 5 Modes (Matched 32 Dataset)', () => {
  const engine = new RuleBasedHumanizerEngine();
  const modes: RewriteStrength[] = ['minimal', 'light', 'balanced', 'strong', 'extensive'];

  it('evaluates all 32 matched inputs across all five rewrite-strength modes under identical conditions', () => {
    const items = benchmarkData.items;
    const modeResults: Record<RewriteStrength, ModeMetrics> = {
      minimal: { strength: 'minimal', inputsTransformed: 0, totalInputs: items.length, meanEditRatio: 0, meanLexicalRetention: 0, totalStructureChanges: 0, unnecessaryChangeCases: 0, detectedInvariantViolations: 0, detectedGrammarRegressions: 0, worseOutputCases: 0, sameOutputCases: 0 },
      light: { strength: 'light', inputsTransformed: 0, totalInputs: items.length, meanEditRatio: 0, meanLexicalRetention: 0, totalStructureChanges: 0, unnecessaryChangeCases: 0, detectedInvariantViolations: 0, detectedGrammarRegressions: 0, worseOutputCases: 0, sameOutputCases: 0 },
      balanced: { strength: 'balanced', inputsTransformed: 0, totalInputs: items.length, meanEditRatio: 0, meanLexicalRetention: 0, totalStructureChanges: 0, unnecessaryChangeCases: 0, detectedInvariantViolations: 0, detectedGrammarRegressions: 0, worseOutputCases: 0, sameOutputCases: 0 },
      strong: { strength: 'strong', inputsTransformed: 0, totalInputs: items.length, meanEditRatio: 0, meanLexicalRetention: 0, totalStructureChanges: 0, unnecessaryChangeCases: 0, detectedInvariantViolations: 0, detectedGrammarRegressions: 0, worseOutputCases: 0, sameOutputCases: 0 },
      extensive: { strength: 'extensive', inputsTransformed: 0, totalInputs: items.length, meanEditRatio: 0, meanLexicalRetention: 0, totalStructureChanges: 0, unnecessaryChangeCases: 0, detectedInvariantViolations: 0, detectedGrammarRegressions: 0, worseOutputCases: 0, sameOutputCases: 0 },
    };

    const itemOutputs: Record<string, Record<RewriteStrength, string>> = {};

    for (const item of items) {
      itemOutputs[item.id] = {} as any;

      for (const st of modes) {
        const res = engine.processSync(item.text, {
          mode: item.mode as any,
          rewriteStrength: st,
          context: { genre: item.genre as any },
          plan: item.isCleanAuthorial ? { issuesToFix: [] } : undefined,
        });

        const output = res.improvedText;
        itemOutputs[item.id][st] = output;
        const metrics = modeResults[st];

        const isTransformed = output !== item.text;
        if (isTransformed) metrics.inputsTransformed++;

        const editRatio = computeEditRatio(item.text, output);
        metrics.meanEditRatio += editRatio;

        const lexRet = computeLexicalRetention(item.text, output);
        metrics.meanLexicalRetention += lexRet;

        const structChanges = countSentenceStructureChanges(item.text, output);
        metrics.totalStructureChanges += structChanges;

        // Unnecessary changes to clean authorial prose
        if (item.isCleanAuthorial && editRatio > 0.05) {
          metrics.unnecessaryChangeCases++;
        }

        // Invariant check
        const inv = validateInvariants(item.text, output);
        if (inv.criticalViolation || !inv.numbersPreserved || !inv.citationsPreserved || !inv.negationsPreserved || !inv.causalityPreserved) {
          metrics.detectedInvariantViolations++;
        }

        // Grammar checks
        const art = validateArticleAgreement(output);
        const mass = validateMassNounQuantification(output);
        const verb = validateSentenceVerbs(item.text, output);
        if (art.hasError || mass.hasError || !verb.isValid) {
          metrics.detectedGrammarRegressions++;
        }
      }
    }

    // Cross-mode analysis: Same output appropriately selected & worse output cases
    for (const item of items) {
      const outputs = itemOutputs[item.id];
      // If minimal and light produce same output
      if (outputs.minimal === outputs.light) {
        modeResults.light.sameOutputCases++;
      }
      if (outputs.balanced === outputs.strong) {
        modeResults.strong.sameOutputCases++;
      }
      if (outputs.strong === outputs.extensive) {
        modeResults.extensive.sameOutputCases++;
      }
    }

    // Finalize averages
    for (const st of modes) {
      const m = modeResults[st];
      m.meanEditRatio = Number((m.meanEditRatio / m.totalInputs).toFixed(4));
      m.meanLexicalRetention = Number((m.meanLexicalRetention / m.totalInputs).toFixed(4));
    }

    console.log('\n======================================================');
    console.log('    REWRITE-STRENGTH EVALUATION REPORT (TASK 2)');
    console.log('======================================================');
    console.table(modeResults);

    // Assertions reflecting the natural behavioral progression
    // 1. Zero invariant violations across all modes
    for (const st of modes) {
      expect(modeResults[st].detectedInvariantViolations).toBe(0);
      expect(modeResults[st].detectedGrammarRegressions).toBe(0);
    }

    // 2. Minimal preserves the most original wording (highest lexical retention)
    expect(modeResults.minimal.meanLexicalRetention).toBeGreaterThan(0.92);

    // 3. Edit ratio progression: minimal <= light <= balanced <= strong <= extensive
    expect(modeResults.minimal.meanEditRatio).toBeLessThanOrEqual(modeResults.light.meanEditRatio);
    expect(modeResults.light.meanEditRatio).toBeLessThanOrEqual(modeResults.balanced.meanEditRatio);
    expect(modeResults.balanced.meanEditRatio).toBeLessThanOrEqual(modeResults.strong.meanEditRatio);
    expect(modeResults.strong.meanEditRatio).toBeLessThanOrEqual(modeResults.extensive.meanEditRatio);

    // 4. Structure changes progression
    expect(modeResults.minimal.totalStructureChanges).toBe(0); // minimal never restructures sentences
    expect(modeResults.extensive.totalStructureChanges).toBeGreaterThanOrEqual(modeResults.balanced.totalStructureChanges);

    // 5. Unnecessary changes to clean authorial prose should be 0 in minimal and light
    expect(modeResults.minimal.unnecessaryChangeCases).toBe(0);
    expect(modeResults.light.unnecessaryChangeCases).toBe(0);
  });
});
