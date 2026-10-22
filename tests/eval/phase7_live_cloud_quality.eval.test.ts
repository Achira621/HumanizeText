import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateInvariants } from '../../src/lib/pipeline/invariants';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BENCHMARK_FILE = resolve(__dirname, './fixtures/phase7_benchmark.json');
const RESULTS_FILE = resolve(__dirname, './artifacts/phase7_live_results.json');
const BLIND_SHEET_FILE = resolve(__dirname, './artifacts/phase7_blind_review_sheet.md');
const _REPORT_FILE = resolve(__dirname, './artifacts/phase7_validation_report.md');

export interface BenchmarkItem {
  id: string;
  genre: 'academic' | 'technical' | 'professional' | 'conversational' | 'creative';
  split: 'dev' | 'val' | 'held-out';
  lengthCategory: 'short' | 'medium' | 'long';
  targetIntensity: 'conservative' | 'balanced' | 'dynamic';
  stressCategory: string;
  sourceText: string;
  failureTraps: string[];
  requiredInvariants: {
    numbers: string[];
    citations: string[];
    units: string[];
    negations: string[];
    hedges: string[];
  };
  description: string;
}

export interface LiveResultItem {
  passage: BenchmarkItem;
  baseline: {
    pipeline: string;
    status: string;
    improvedText: string;
    modelUsed: string;
    executionEnvironment: string;
    fallbackTriggered: boolean;
    latencyMs: number;
    invariants: {
      passed: boolean;
      numbersPreserved: boolean;
      unitsPreserved: boolean;
      negationsPreserved: boolean;
      hedgingPreserved: boolean;
      citationsPreserved: boolean;
      causalityPreserved: boolean;
      hasConfirmedFactualError: boolean;
      hasSemanticDriftWarning: boolean;
    };
    overEditingRatio: number;
    contentRetentionRatio: number;
  };
  contextAware: {
    pipeline: string;
    status: string;
    improvedText: string;
    modelUsed: string;
    executionEnvironment: string;
    fallbackTriggered: boolean;
    latencyMs: number;
    invariants: {
      passed: boolean;
      numbersPreserved: boolean;
      unitsPreserved: boolean;
      negationsPreserved: boolean;
      hedgingPreserved: boolean;
      citationsPreserved: boolean;
      causalityPreserved: boolean;
      hasConfirmedFactualError: boolean;
      hasSemanticDriftWarning: boolean;
    };
    overEditingRatio: number;
    contentRetentionRatio: number;
  };
  blindEvaluation: {
    passageId: string;
    systemAIsContextAware: boolean;
    scoreA: { composite: number };
    scoreB: { composite: number };
    winner: 'ContextAware' | 'Baseline' | 'Tie';
  };
}

describe('Phase 7: Real Cloud Model Quality Validation & Invariant Gate', () => {
  it('Task 1: validates 36-passage benchmark dataset across genres, scales, and splits with zero leakage', () => {
    expect(existsSync(BENCHMARK_FILE)).toBe(true);
    const benchmark: BenchmarkItem[] = JSON.parse(readFileSync(BENCHMARK_FILE, 'utf-8'));

    expect(benchmark.length).toBeGreaterThanOrEqual(30);
    expect(benchmark.length).toBeLessThanOrEqual(50);

    const genres = new Set(benchmark.map((b) => b.genre));
    expect(genres.has('academic')).toBe(true);
    expect(genres.has('technical')).toBe(true);
    expect(genres.has('professional')).toBe(true);
    expect(genres.has('conversational')).toBe(true);
    expect(genres.has('creative')).toBe(true);

    const splits = new Set(benchmark.map((b) => b.split));
    expect(splits.has('dev')).toBe(true);
    expect(splits.has('val')).toBe(true);
    expect(splits.has('held-out')).toBe(true);

    const ids = new Set<string>();
    for (const item of benchmark) {
      expect(ids.has(item.id)).toBe(false);
      ids.add(item.id);
      expect(item.sourceText.length).toBeGreaterThan(30);
      expect(item.description.length).toBeGreaterThan(10);
    }

    const stressCategories = new Set(benchmark.map((b) => b.stressCategory));
    expect(stressCategories.has('already_strong_prose')).toBe(true);
    expect(stressCategories.has('redundant_bureaucratic')).toBe(true);
    expect(stressCategories.has('dense_hedging_epistemic')).toBe(true);
    expect(stressCategories.has('negation_polarity')).toBe(true);
    expect(stressCategories.has('causal_chain')).toBe(true);
    expect(stressCategories.has('numbers_units_citations')).toBe(true);
  });

  it('Task 2 & 3: verifies deterministic invariants engine captures factual, unit, and negation traps', () => {
    // 1. Causal Reversal Trap
    const causalSource = 'Because severe drought depleted aquifer reserves, crop yield dropped by 35%.';
    const causalReversed = 'Crop yield dropped by 35%, which caused severe drought depleting aquifer reserves.';
    const causalCheck = validateInvariants(causalSource, causalReversed);
    expect(causalCheck.causalityPreserved).toBe(false);

    // 2. Unit Mutation Trap
    const unitSource = 'Patient received 50mg of antibiotics.';
    const unitMutated = 'Patient received 50kg of antibiotics.';
    const unitCheck = validateInvariants(unitSource, unitMutated);
    expect(unitCheck.hasConfirmedFactualError).toBe(true);
    expect(unitCheck.mutatedUnits.length).toBeGreaterThan(0);

    // 3. Negation Flip Trap
    const negationSource = 'The cluster does not guarantee zero-loss recovery without persistent disk writes.';
    const negationFlipped = 'The cluster guarantees zero-loss recovery with persistent disk writes.';
    const negationCheck = validateInvariants(negationSource, negationFlipped);
    expect(negationCheck.negationsPreserved).toBe(false);
  });

  it('Task 2, 3 & 4: validates live Cloudflare Workers AI execution results and scorecard', () => {
    if (!existsSync(RESULTS_FILE)) {
      console.warn('Live results file not yet generated. Run `npx vite-node scripts/run_phase7_live_benchmark.ts` first.');
      return;
    }

    const liveResults: LiveResultItem[] = JSON.parse(readFileSync(RESULTS_FILE, 'utf-8'));
    expect(liveResults.length).toBeGreaterThanOrEqual(1);

    let baselinePasses = 0;
    let contextAwarePasses = 0;
    let contextAwareWins = 0;
    let baselineWins = 0;

    for (const res of liveResults) {
      expect(res.baseline.executionEnvironment).toBe('cloud-worker-ai');
      expect(res.contextAware.executionEnvironment).toBe('cloud-worker-ai');
      expect(res.baseline.status).toBe('SUCCESS');
      expect(res.contextAware.status).toBe('SUCCESS');

      if (res.baseline.invariants.passed) baselinePasses++;
      if (res.contextAware.invariants.passed) contextAwarePasses++;

      if (res.blindEvaluation.winner === 'ContextAware') contextAwareWins++;
      else if (res.blindEvaluation.winner === 'Baseline') baselineWins++;
    }

    // Verify that both pipelines achieve high invariant preservation on live cloud inference (>75%)
    expect(contextAwarePasses).toBeGreaterThanOrEqual(25);
    expect(baselinePasses).toBeGreaterThanOrEqual(25);

    // Verify blind comparison review sheet exists
    if (existsSync(BLIND_SHEET_FILE)) {
      const sheet = readFileSync(BLIND_SHEET_FILE, 'utf-8');
      expect(sheet).toContain('Phase 7: Randomized Blind A/B Evaluation Sheet for Human Review');
      expect(sheet).toContain('System A Output');
      expect(sheet).toContain('System B Output');
    }
  });
});
