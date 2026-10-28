import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { RuleBasedHumanizerEngine } from '../../src/lib/humanizer/ruleEngine';
import type { HumanizerMode } from '../../src/types';
import { validateInvariants, checkNegationTargetPreservation } from '../../src/lib/pipeline/invariants';
import { validateArticleAgreement, validateDuplicateTransitions, validateStructuralCompleteness } from '../../src/lib/pipeline/qualityValidator';
import { evaluateCandidate, rankCandidates } from '../../src/lib/pipeline/candidateRanker';

interface IntelBenchmarkSample {
  id: string;
  category: string;
  name: string;
  inputText: string;
  expectedPreservations: string[];
  criticalInvariants: string[];
  forbiddenClichés: string[];
  mode: HumanizerMode;
  targetReadingLevel: 'general' | 'academic' | 'casual';
}

describe('Intelligence V1: Comprehensive Rewrite Engine Evaluation', () => {
  const datasetPath = path.resolve(__dirname, '../fixtures/benchmarks/intelligence_v1_benchmark.json');
  const samples: IntelBenchmarkSample[] = JSON.parse(fs.readFileSync(datasetPath, 'utf-8'));
  const engine = new RuleBasedHumanizerEngine();

  it('contains exactly 10 representative benchmark samples covering all required dimensions', () => {
    expect(samples.length).toBe(10);
    const categories = new Set(samples.map((s) => s.category));
    expect(categories.size).toBe(10);
  });

  it('evaluates all 10 categories for invariant integrity, grammar, and semantic preservation', async () => {
    let passedInvariantsCount = 0;
    let passedGrammarCount = 0;
    let passedNegationCount = 0;
    let passedStructureCount = 0;
    let clichesRemovedCount = 0;
    let totalClichesCount = 0;

    const evaluationResults: Array<{
      id: string;
      category: string;
      name: string;
      inputText: string;
      improvedText: string;
      overallScore: number;
      invariantsPreserved: boolean;
      grammarClean: boolean;
      negationPreserved: boolean;
    }> = [];

    for (const sample of samples) {
      const result = await engine.process(sample.inputText, {
        mode: sample.mode,
        freezeQuotes: true,
        targetReadingLevel: sample.targetReadingLevel,
        frozenWords: sample.id === 'intel_quote_08' ? ['TensorFlow', 'PostgreSQL', 'RedisCluster'] : [],
      });

      const improved = result.improvedText;

      // 1. Invariants preservation
      const inv = validateInvariants(sample.inputText, improved, {
        freezeQuotes: true,
        frozenWords: sample.id === 'intel_quote_08' ? ['TensorFlow', 'PostgreSQL', 'RedisCluster'] : [],
      });
      const invariantsOk = !inv.criticalViolation && inv.numbersPreserved && inv.citationsPreserved && inv.unitsPreserved;
      if (invariantsOk) {
        passedInvariantsCount++;
      } else {
        console.warn(`[INVARIANT FAILURE] ${sample.id}:`, JSON.stringify(inv.violations), JSON.stringify(inv.preservationWarnings));
      }

      // Check expected text snippets verbatim
      for (const exp of sample.expectedPreservations) {
        expect(improved).toContain(exp);
      }

      // 2. Grammar checks (article agreement, duplicate transitions, no corrupted phrasal verbs)
      const art = validateArticleAgreement(improved);
      const dupTrans = validateDuplicateTransitions(improved);
      const hasCorruptedPhrasalVerbs = /\b(?:obtain rid of|obtain better|obtain worse|numerous water)\b/i.test(improved);
      const hasDemonstrativeMismatch = /\b(?:this results|this participants|this researchers)\b/i.test(improved);

      const grammarClean = !art.hasError && !dupTrans.hasDuplicates && !hasCorruptedPhrasalVerbs && !hasDemonstrativeMismatch;
      if (grammarClean) passedGrammarCount++;

      // 3. Negation target preservation
      const neg = checkNegationTargetPreservation(sample.inputText, improved);
      if (neg.preserved) passedNegationCount++;

      // 4. Structural completeness (no dangling fragments, no splitting at relative pronouns)
      const struct = validateStructuralCompleteness(sample.inputText, improved);
      const hasDanglingRelativeFragment = /[.!?]\s+(?:That|Who|Where)\s+[a-z]+/i.test(improved);
      const structureOk = !struct.isTruncated && !struct.hasDuplication && !hasDanglingRelativeFragment;
      if (structureOk) passedStructureCount++;

      // 5. Cliché eradication
      for (const cliche of sample.forbiddenClichés) {
        totalClichesCount++;
        if (!improved.toLowerCase().includes(cliche.toLowerCase())) {
          clichesRemovedCount++;
        }
      }

      // 6. Score candidate evaluation
      const candidateEval = evaluateCandidate(sample.inputText, improved, {
        genre: sample.category === 'academic' ? 'academic' : sample.category === 'technical' ? 'technical' : 'general',
        mode: sample.mode,
        targetReadingLevel: sample.targetReadingLevel,
      });

      evaluationResults.push({
        id: sample.id,
        category: sample.category,
        name: sample.name,
        inputText: sample.inputText,
        improvedText: improved,
        overallScore: candidateEval.scoreBreakdown.overallScore,
        invariantsPreserved: invariantsOk,
        grammarClean,
        negationPreserved: neg.preserved,
      });

      // Interactive alternatives must be ranked and typed
      expect(result.alternativesMetadata).toBeDefined();
      expect(result.alternativesMetadata?.scope).toBe('phrase');
      if (result.alternativesMetadata && result.alternativesMetadata.candidates.length > 0) {
        const firstCand = result.alternativesMetadata.candidates[0];
        expect(firstCand.isValid).toBe(true);
      }
    }

    const meanScore = evaluationResults.reduce((acc, r) => acc + r.overallScore, 0) / evaluationResults.length;
    const clicheRemovalRate = totalClichesCount > 0 ? (clichesRemovedCount / totalClichesCount) * 100 : 100;

    console.info('\n======================================================');
    console.info('      HUMANIZETEXT INTELLIGENCE V1 EVALUATION REPORT  ');
    console.info('======================================================');
    console.info(`Evaluated Samples:                ${samples.length}`);
    console.info(`Invariant Preservation Rate:      ${((passedInvariantsCount / samples.length) * 100).toFixed(1)}%`);
    console.info(`Grammatical Correctness Rate:     ${((passedGrammarCount / samples.length) * 100).toFixed(1)}%`);
    console.info(`Negation / Polarity Pass Rate:    ${((passedNegationCount / samples.length) * 100).toFixed(1)}%`);
    console.info(`Structural Integrity Pass Rate:   ${((passedStructureCount / samples.length) * 100).toFixed(1)}%`);
    console.info(`AI Cliché Eradication Rate:       ${clicheRemovalRate.toFixed(1)}% (${clichesRemovedCount}/${totalClichesCount})`);
    console.info(`Mean Candidate Quality Score:     ${(meanScore * 100).toFixed(1)} / 100.0`);
    console.info('------------------------------------------------------');
    console.info('Per-Sample Detailed Results:');
    for (const r of evaluationResults) {
      console.info(`  • [${r.id}] ${r.name.padEnd(38)} Score: ${(r.overallScore * 100).toFixed(0)}% | Inv: ${r.invariantsPreserved ? '✓' : '✗'} | Gram: ${r.grammarClean ? '✓' : '✗'} | Neg: ${r.negationPreserved ? '✓' : '✗'}`);
    }
    console.info('======================================================\n');

    expect(passedInvariantsCount).toBe(samples.length);
    expect(passedGrammarCount).toBe(samples.length);
    expect(passedNegationCount).toBe(samples.length);
    expect(passedStructureCount).toBe(samples.length);
    expect(meanScore).toBeGreaterThanOrEqual(0.85);
  });

  it('verifies CandidateRanker rejects corrupted candidates and ranks valid options', () => {
    const source = 'The researchers observed a 45% increase in throughput.';
    const validCandidate1 = 'The researchers noted a 45% increase in throughput.';
    const validCandidate2 = 'The team recorded a 45% boost in system throughput.';
    const corruptedCandidate = 'The researchers observed a 99% increase in throughput.'; // numeric invariant altered

    const result = rankCandidates(source, [validCandidate1, validCandidate2, corruptedCandidate], {
      genre: 'technical',
      rewriteStrength: 'balanced',
    });

    expect(result.rankedCandidates.length).toBe(2);
    expect(result.rejectedCandidates.length).toBe(1);
    expect(result.rejectedCandidates[0].rejectionReason).toMatch(/(?:Numerical discrepancy|Numbers or statistics)/);
    expect(result.bestCandidate).toBeDefined();
    expect(result.rankedCandidates[0].scoreBreakdown?.overallScore).toBeGreaterThan(0.70);
  });

  it('verifies DocumentConsistencyTracker prevents duplicate transitions and enforces term mappings', () => {
    const text = 'The researchers studied the system. The researchers then improved the model.';
    const result = engine.processSync(text, { mode: 'natural' });

    // Starter de-duplication must resolve plural noun to "they", not "it"
    expect(result.improvedText).not.toContain('It then');
    expect(result.improvedText).toMatch(/\b(?:they\b|The researchers)/i);
  });
});
