import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { RuleBasedHumanizerEngine } from '../../src/lib/humanizer/ruleEngine';
import type { HumanizerMode } from '../../src/types';

interface Benchmark100Sample {
  id: string;
  category: 'academic' | 'technical' | 'professional' | 'conversational' | 'creative';
  subgenre: string;
  authorship: string;
  dialect_register: string;
  complexity: 'simple' | 'complex';
  length_tier: 'short' | 'medium' | 'long';
  partition: 'dev' | 'eval';
  name: string;
  provenance: string;
  originalText: string;
  expectedInvariants: string[];
  baselineFlaws: string[];
  recommendedMode: HumanizerMode;
  wordCount: number;
}

interface SampleEvalResult {
  id: string;
  category: string;
  partition: 'dev' | 'eval';
  inputWords: number;
  outputWords: number;
  wordRatio: number;
  improvedText: string;
  preservedCount: number;
  expectedCount: number;
  preservationRate: number;
  missingInvariants: string[];
  injectedHedges: string[];
  injectedMonotonousStarters: string[];
  grammarDefects: string[];
  avgSentenceLen: number;
  sentenceLenStdDev: number;
  fkGrade: number;
  fleschEase: number;
}

const CASUAL_HEDGES = [
  /here's the thing:/i,
  /thing is,/i,
  /honestly,/i,
  /to be fair,/i,
  /admittedly,/i,
  /broadly speaking,/i,
  /worth noting:/i,
  /the short answer:/i,
];

const MONOTONOUS_STARTER_INJECTIONS = [
  /meanwhile, the/i,
  /at the same time, the/i,
  /in addition, the/i,
];

function countSyllables(word: string): number {
  const clean = word.toLowerCase().replace(/[^a-z]/g, '');
  if (clean.length <= 3) return 1;
  const matches = clean.match(/[aeiouy]{1,2}/g);
  let count = matches ? matches.length : 1;
  if (clean.endsWith('e') && !clean.endsWith('le')) count = Math.max(1, count - 1);
  return Math.max(1, count);
}

function computeReadability(text: string): { fkGrade: number; fleschEase: number; avgLen: number; stdDev: number } {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const words = text.trim().split(/\s+/).filter(Boolean);

  const numSentences = Math.max(1, sentences.length);
  const numWords = Math.max(1, words.length);
  const totalSyllables = words.reduce((acc, w) => acc + countSyllables(w), 0);

  const asl = numWords / numSentences;
  const asw = totalSyllables / numWords;

  const fkGrade = 0.39 * asl + 11.8 * asw - 15.59;
  const fleschEase = 206.835 - 1.015 * asl - 84.6 * asw;

  const lengths = sentences.map((s) => s.split(/\s+/).filter(Boolean).length);
  const variance = lengths.reduce((acc, l) => acc + Math.pow(l - asl, 2), 0) / numSentences;
  const stdDev = Math.sqrt(variance);

  return { fkGrade, fleschEase, avgLen: asl, stdDev };
}

describe('Humanizer 100-Sample Quality Baseline Benchmark', () => {
  const benchmarkPath = path.resolve(__dirname, '../fixtures/benchmarks/humanizer_benchmark_100.json');
  const benchmarkData = JSON.parse(fs.readFileSync(benchmarkPath, 'utf8'));
  const samples: Benchmark100Sample[] = Array.isArray(benchmarkData) ? benchmarkData : benchmarkData.samples;
  const engine = new RuleBasedHumanizerEngine();

  it('evaluates baseline RuleBasedHumanizerEngine across all 100 samples and catalogs failures', () => {
    const results: SampleEvalResult[] = [];

    for (const sample of samples) {
      const mode = sample.recommendedMode || 'natural';
      const res = engine.processSync(sample.originalText, {
        mode,
        rewriteStrength: 'balanced',
        smartContractions: mode === 'conversational',
        freezeQuotes: true,
      });

      const improved = res.improvedText;
      const inputWords = sample.originalText.split(/\s+/).filter(Boolean).length;
      const outputWords = improved.split(/\s+/).filter(Boolean).length;

      // Invariants check
      const missingInvariants: string[] = [];
      let preservedCount = 0;
      for (const inv of sample.expectedInvariants) {
        if (improved.includes(inv)) {
          preservedCount++;
        } else {
          missingInvariants.push(inv);
        }
      }
      const preservationRate =
        sample.expectedInvariants.length > 0
          ? preservedCount / sample.expectedInvariants.length
          : 1.0;

      // Unwanted hedge injection check (especially in non-casual domains)
      const injectedHedges: string[] = [];
      if (['academic', 'technical', 'professional'].includes(sample.category)) {
        for (const h of CASUAL_HEDGES) {
          if (h.test(improved) && !h.test(sample.originalText)) {
            const match = improved.match(h);
            if (match) injectedHedges.push(match[0]);
          }
        }
      }

      // Monotonous starter injection check
      const injectedMonotonousStarters: string[] = [];
      for (const m of MONOTONOUS_STARTER_INJECTIONS) {
        if (m.test(improved) && !m.test(sample.originalText)) {
          const match = improved.match(m);
          if (match) injectedMonotonousStarters.push(match[0]);
        }
      }

      // Grammar defects
      const grammarDefects: string[] = [];
      if (/\s+[,.:;!?]/.test(improved)) grammarDefects.push('Whitespace before punctuation');
      if (/([,.])\1/.test(improved)) grammarDefects.push('Double punctuation');
      if (/[.!?]\s+[a-z]/.test(improved)) grammarDefects.push('Lowercase after sentence end');
      if (/\b(?:the|a|an)\s+(?:the|a|an)\b/i.test(improved)) grammarDefects.push('Duplicated article');

      const { fkGrade, fleschEase, avgLen, stdDev } = computeReadability(improved);

      results.push({
        id: sample.id,
        category: sample.category,
        partition: sample.partition,
        inputWords,
        outputWords,
        wordRatio: outputWords / inputWords,
        improvedText: improved,
        preservedCount,
        expectedCount: sample.expectedInvariants.length,
        preservationRate,
        missingInvariants,
        injectedHedges,
        injectedMonotonousStarters,
        grammarDefects,
        avgSentenceLen: avgLen,
        sentenceLenStdDev: stdDev,
        fkGrade,
        fleschEase,
      });
    }

    // Save baseline outputs
    const outputPath = path.resolve(__dirname, '../fixtures/benchmarks/humanizer_baseline_outputs.json');
    fs.writeFileSync(
      outputPath,
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          totalSamples: results.length,
          results,
        },
        null,
        2
      )
    );

    // Compute partition metrics
    const devResults = results.filter((r) => r.partition === 'dev');
    const evalResults = results.filter((r) => r.partition === 'eval');

    const computeSummary = (subset: SampleEvalResult[], name: string) => {
      const avgPreservation = subset.reduce((acc, r) => acc + r.preservationRate, 0) / subset.length;
      const totalHedgeInjections = subset.reduce((acc, r) => acc + r.injectedHedges.length, 0);
      const samplesWithHedgeInjections = subset.filter((r) => r.injectedHedges.length > 0).length;
      const totalStarterInjections = subset.reduce((acc, r) => acc + r.injectedMonotonousStarters.length, 0);
      const samplesWithStarterInjections = subset.filter((r) => r.injectedMonotonousStarters.length > 0).length;
      const totalGrammarDefects = subset.reduce((acc, r) => acc + r.grammarDefects.length, 0);
      const avgWordRatio = subset.reduce((acc, r) => acc + r.wordRatio, 0) / subset.length;
      const avgStdDev = subset.reduce((acc, r) => acc + r.sentenceLenStdDev, 0) / subset.length;

      console.log(`\n======================================================`);
      console.log(`  BASELINE EVALUATION SUMMARY: ${name} (${subset.length} samples)`);
      console.log(`======================================================`);
      console.log(`- Invariant Preservation Rate:     ${(avgPreservation * 100).toFixed(1)}%`);
      console.log(`- Samples with Inappropriate Hedges: ${samplesWithHedgeInjections} / ${subset.length} (${((samplesWithHedgeInjections / subset.length) * 100).toFixed(1)}%) [Total: ${totalHedgeInjections}]`);
      console.log(`- Samples with Starter Injections:   ${samplesWithStarterInjections} / ${subset.length} (${((samplesWithStarterInjections / subset.length) * 100).toFixed(1)}%) [Total: ${totalStarterInjections}]`);
      console.log(`- Total Grammar Defects:             ${totalGrammarDefects}`);
      console.log(`- Avg Word Count Ratio:              ${avgWordRatio.toFixed(3)}`);
      console.log(`- Avg Sentence Length StdDev:        ${avgStdDev.toFixed(2)} words`);

      // Category breakdown
      const categories = ['academic', 'technical', 'professional', 'conversational', 'creative'];
      console.log(`\n  Category Invariant Preservation:`);
      for (const cat of categories) {
        const catSubset = subset.filter((r) => r.category === cat);
        if (catSubset.length > 0) {
          const catPres = catSubset.reduce((a, b) => a + b.preservationRate, 0) / catSubset.length;
          const catHedges = catSubset.reduce((a, b) => a + b.injectedHedges.length, 0);
          console.log(`  * ${cat.padEnd(16)}: ${(catPres * 100).toFixed(1)}% preserved | ${catHedges} hedges injected`);
        }
      }
    };

    computeSummary(devResults, 'DEV SET');
    computeSummary(evalResults, 'HELD-OUT EVAL SET');

    // Test specific verified paired samples
    const checkPairs = ['bench_acad_07', 'bench_prof_01', 'bench_prof_04', 'bench_creat_01', 'bench_creat_04', 'bench_tech_01'];
    console.log('\n======================================================');
    console.log('  VERIFYING TARGETED QUALITY FIXES ON PAIRED SAMPLES');
    console.log('======================================================');
    for (const id of checkPairs) {
      const s = samples.find((x) => x.id === id);
      const r = results.find((x) => x.id === id);
      if (s && r) {
        console.log(`\nSample ${id} (${s.category}):`);
        console.log(`ORIGINAL:\n${s.originalText}`);
        console.log(`CANDIDATE OUTPUT:\n${r.improvedText}`);
      }
    }

    expect(results.length).toBe(100);
  });
});
