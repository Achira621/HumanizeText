import { describe, it, expect } from 'vitest';
import { analyzeWritingContext, buildRewritePlan } from '../../src/lib/pipeline/contextEngine';
import { validateInvariants } from '../../src/lib/pipeline/invariants';
import { RuleBasedHumanizerEngine } from '../../src/lib/humanizer/ruleEngine';

interface BenchmarkSample {
  id: string;
  genre: 'academic' | 'technical' | 'professional' | 'conversational';
  sourceText: string;
  criticalNegations?: string[];
  criticalHedges?: string[];
  criticalUnits?: string[];
  split: 'dev' | 'val' | 'held-out';
}

const BENCHMARK_SAMPLES: BenchmarkSample[] = [
  {
    id: 'bench_academic_hedged',
    genre: 'academic',
    sourceText: 'According to Miller et al. (2024), computational linguistic models exhibit noticeable syntactic uniformity [12]. Preliminary empirical data tentatively suggests that prompt engineering may not completely eliminate stylistic uniformity in 45% of cases.',
    criticalNegations: ['not completely eliminate'],
    criticalHedges: ['tentatively suggests', 'may'],
    criticalUnits: ['45%'],
    split: 'dev',
  },
  {
    id: 'bench_technical_system',
    genre: 'technical',
    sourceText: 'The distributed Redis cache reduced endpoint p99 latency to 12ms across 4 cluster nodes. However, failover testing revealed that replication does not guarantee immediate zero-loss recovery without persistent disk checkpoints.',
    criticalNegations: ['does not guarantee', 'without'],
    criticalUnits: ['12ms', '4'],
    split: 'val',
  },
  {
    id: 'bench_financial_projections',
    genre: 'professional',
    sourceText: 'On January 15, 2026, the board reported $42.5 million in Series B funding. Recurring ARR expanded by 128%, but operating margin did not exceed 14.2% due to procurement costs in 3 overseas subsidiaries.',
    criticalNegations: ['did not exceed'],
    criticalUnits: ['42.5 million', '128%', '14.2%'],
    split: 'held-out',
  },
  {
    id: 'bench_conversational_narrative',
    genre: 'conversational',
    sourceText: 'Honestly, I never thought I would enjoy working from home for 2 whole years. My daily commute used to take 90 minutes each way, and I definitely do not miss the 7:15 AM bus in the freezing cold.',
    criticalNegations: ['never thought', 'do not miss'],
    criticalUnits: ['2', '90 minutes'],
    split: 'held-out',
  },
];

describe('Phase 4: Context Engine Benchmark Suite', () => {
  const engine = new RuleBasedHumanizerEngine();

  it('accurately identifies genre and extracts context for all benchmark samples across splits', () => {
    for (const sample of BENCHMARK_SAMPLES) {
      const context = analyzeWritingContext(sample.sourceText);
      expect(context.genre).toBe(sample.genre);
      expect(context.coreThesis).toBeDefined();
      expect(context.coreThesis.length).toBeGreaterThan(10);
    }
  });

  it('constructs structured RewritePlans without falling back on well-formed samples', () => {
    for (const sample of BENCHMARK_SAMPLES) {
      const context = analyzeWritingContext(sample.sourceText);
      const plan = buildRewritePlan(context, sample.sourceText);

      expect(plan.isFallback).toBe(false);
      expect(plan.targetedAdjustments).toBeDefined();
      expect(plan.invariantRequirements.length).toBeGreaterThanOrEqual(4);
    }
  });

  it('preserves critical factual invariants, units, and negations through the rewrite pipeline', async () => {
    let preservedCount = 0;

    for (const sample of BENCHMARK_SAMPLES) {
      const context = analyzeWritingContext(sample.sourceText);
      const plan = buildRewritePlan(context, sample.sourceText);

      const result = await engine.process(sample.sourceText, {
        mode: sample.genre === 'academic' ? 'formal' : sample.genre === 'conversational' ? 'conversational' : 'natural',
        vocabularyIntensity: 'balanced',
        context,
        plan,
      });

      const inv = validateInvariants(sample.sourceText, result.improvedText);

      expect(inv.criticalViolation).toBe(false);
      expect(inv.numbersPreserved).toBe(true);
      expect(inv.citationsPreserved).toBe(true);
      expect(inv.quotesPreserved).toBe(true);
      expect(inv.unitsPreserved).toBe(true);
      expect(inv.negationsPreserved).toBe(true);

      preservedCount++;
    }

    const passRate = preservedCount / BENCHMARK_SAMPLES.length;
    console.info(`[Context Engine Benchmark] Invariant Pass Rate: ${(passRate * 100).toFixed(1)}% across ${BENCHMARK_SAMPLES.length} samples.`);
    expect(passRate).toBe(1.0);
  });

  it('demonstrates that secondary critic is only required when hard invariants fail', () => {
    // Normal passage: clean rewrite requires 0 repair passes (1 total call)
    const sample = BENCHMARK_SAMPLES[0];
    const cleanRewrite = 'According to Miller et al. (2024), computational models show syntactic uniformity [12]. Preliminary data tentatively suggests that prompt engineering may not completely eliminate stylistic uniformity in 45% of cases.';
    const cleanInv = validateInvariants(sample.sourceText, cleanRewrite);
    expect(cleanInv.criticalViolation).toBe(false);

    // Mutilated passage: missing numbers and inverted negation triggers critical violation (would invoke 1x repair)
    const mutilatedRewrite = 'Models show uniformity. Prompt engineering completely eliminates uniformity.';
    const badInv = validateInvariants(sample.sourceText, mutilatedRewrite);
    expect(badInv.criticalViolation).toBe(true);
    expect(badInv.numbersPreserved).toBe(false);
    expect(badInv.negationsPreserved).toBe(false);
  });
});
