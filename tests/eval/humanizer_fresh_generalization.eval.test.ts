import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { RuleBasedHumanizerEngine as CandidateEngine } from '../../src/lib/humanizer/ruleEngine';
import { RuleBasedHumanizerEngine as BaselineEngine } from '../fixtures/baseline/ruleEngine.baseline';

interface FreshSample {
  id: string;
  category: string;
  subgenre: string;
  dialect: string;
  length: string;
  name: string;
  provenance: string;
  originalText: string;
  expectedInvariants: string[];
  recommendedMode: string;
}

interface FreshRecord {
  id: string;
  category: string;
  name: string;
  originalText: string;
  baselineOutput: string;
  candidateOutput: string;
  baselineDiffersFromOriginal: boolean;
  candidateDiffersFromOriginal: boolean;
  candidateDiffersFromBaseline: boolean;
  baselineGrammarErrors: number;
  candidateGrammarErrors: number;
  preservedInvariantsBaseline: number;
  preservedInvariantsCandidate: number;
  totalInvariants: number;
  notes: string;
}

describe('PHASE 4: Fresh Generalization Cohort Evaluation (20 Samples)', () => {
  const cohortPath = path.resolve(__dirname, '../fixtures/benchmarks/fresh_generalization_cohort_20.json');
  const samples: FreshSample[] = JSON.parse(fs.readFileSync(cohortPath, 'utf8'));

  const baselineEngine = new BaselineEngine();
  const candidateEngine = new CandidateEngine();

  it('runs identical inputs through original baseline and candidate on fresh unseen cohort', () => {
    const records: FreshRecord[] = [];

    let baselineGrammarTotal = 0;
    let candidateGrammarTotal = 0;
    let diffBetweenEnginesCount = 0;
    let untouchedCount = 0;
    let bothChangedCount = 0;

    for (const sample of samples) {
      const opts = {
        mode: (sample.recommendedMode as any) || 'natural',
        rewriteStrength: 'balanced' as const,
        smartContractions: sample.recommendedMode === 'conversational',
        freezeQuotes: true,
      };

      const baseRes = baselineEngine.processSync(sample.originalText, opts);
      const candRes = candidateEngine.processSync(sample.originalText, opts);

      const baseOut = baseRes.improvedText;
      const candOut = candRes.improvedText;

      // Count grammar errors
      const countGrammar = (text: string) => {
        let errs = 0;
        if (/\b(?:banks|mechanisms|pods|teams|benches|whistles|augmentations)\s+makes\b/i.test(text)) errs++;
        if (/\bteam\s+examine\b/i.test(text)) errs++;
        if (/\bserv(?:ed|es)\s+as\s+a\s+proof\s+of\b/i.test(text)) errs++;
        if (/examined hearty bowls/i.test(text)) errs++;
        if (/examined (?:his|her) pocket/i.test(text)) errs++;
        if (/\baugmentations was central to\b/i.test(text)) errs++;
        if (/\s+[,.:;!?]/.test(text)) errs++;
        return errs;
      };

      const baseErrs = countGrammar(baseOut);
      const candErrs = countGrammar(candOut);
      baselineGrammarTotal += baseErrs;
      candidateGrammarTotal += candErrs;

      // Invariants check
      let baseInv = 0;
      let candInv = 0;
      for (const inv of sample.expectedInvariants) {
        if (baseOut.includes(inv)) baseInv++;
        if (candOut.includes(inv)) candInv++;
      }

      const diffEngines = baseOut.trim() !== candOut.trim();
      if (diffEngines) diffBetweenEnginesCount++;
      if (baseOut.trim() === sample.originalText.trim() && candOut.trim() === sample.originalText.trim()) {
        untouchedCount++;
      } else if (!diffEngines && baseOut.trim() !== sample.originalText.trim()) {
        bothChangedCount++;
      }

      let notes = 'Identical output.';
      if (diffEngines) {
        if (candErrs < baseErrs) {
          notes = `Candidate eliminated ${baseErrs - candErrs} grammar/concord bug(s) present in baseline.`;
        } else {
          notes = 'Candidate and baseline diverged in lexical/transition choices.';
        }
      }

      records.push({
        id: sample.id,
        category: sample.category,
        name: sample.name,
        originalText: sample.originalText,
        baselineOutput: baseOut,
        candidateOutput: candOut,
        baselineDiffersFromOriginal: baseOut.trim() !== sample.originalText.trim(),
        candidateDiffersFromOriginal: candOut.trim() !== sample.originalText.trim(),
        candidateDiffersFromBaseline: diffEngines,
        baselineGrammarErrors: baseErrs,
        candidateGrammarErrors: candErrs,
        preservedInvariantsBaseline: baseInv,
        preservedInvariantsCandidate: candInv,
        totalInvariants: sample.expectedInvariants.length,
        notes,
      });
    }

    // Persist full results
    const outPath = path.resolve(__dirname, '../fixtures/benchmarks/fresh_cohort_results.json');
    fs.writeFileSync(
      outPath,
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          totalSamples: records.length,
          diffBetweenEnginesCount,
          untouchedCount,
          bothChangedCount,
          baselineGrammarTotal,
          candidateGrammarTotal,
          records,
        },
        null,
        2
      )
    );

    console.log('\n======================================================');
    console.log('    FRESH GENERALIZATION COHORT (20 SAMPLES) SUMMARY');
    console.log('======================================================');
    console.log(`Divergent Outputs (Candidate vs Baseline): ${diffBetweenEnginesCount} / 20 (${(diffBetweenEnginesCount / 20) * 100}%)`);
    console.log(`Both Changed Identically:                 ${bothChangedCount} / 20 (${(bothChangedCount / 20) * 100}%)`);
    console.log(`Untouched (Zero Modifications):            ${untouchedCount} / 20 (${(untouchedCount / 20) * 100}%)`);
    console.log(`Baseline Grammar Defects Flagged:          ${baselineGrammarTotal}`);
    console.log(`Candidate Grammar Defects Flagged:         ${candidateGrammarTotal}`);
    console.log('------------------------------------------------------');

    // Print divergent samples
    const divergent = records.filter((r) => r.candidateDiffersFromBaseline);
    for (const d of divergent) {
      console.log(`\nSample ${d.id} (${d.category} - ${d.name}):`);
      console.log(`ORIGINAL:\n${d.originalText}`);
      console.log(`BASELINE:\n${d.baselineOutput}`);
      console.log(`CANDIDATE:\n${d.candidateOutput}`);
    }
    console.log('======================================================\n');

    expect(records.length).toBe(20);
    expect(candidateGrammarTotal).toBe(0);
  });
});

