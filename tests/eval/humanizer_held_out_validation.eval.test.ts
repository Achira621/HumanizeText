import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { RuleBasedHumanizerEngine as CandidateEngine } from '../../src/lib/humanizer/ruleEngine';
import { RuleBasedHumanizerEngine as BaselineEngine } from '../fixtures/baseline/ruleEngine.baseline';
import type { HumanizerMode } from '../../src/types';

interface BenchmarkSample {
  id: string;
  category: 'academic' | 'technical' | 'professional' | 'conversational' | 'creative';
  subgenre: string;
  authorship: 'human_authored' | 'ai_generated';
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

interface QuantitativeMetrics {
  structuralPreservation: number; // 0 to 1
  entityPreservation: number; // 0 to 1
  numericalPreservation: number; // 0 to 1
  citationPreservation: number; // 0 to 1
  semanticSimilarity: number; // 0 to 1
  grammaticalErrorCount: number; // integer count
  naturalnessRating: number; // 1 to 5
  voicePreservation: number; // 1 to 5
  wordCountExpansion: number; // output / input
}

interface SampleHeldOutRecord {
  id: string;
  category: string;
  subgenre: string;
  authorship: string;
  originalText: string;
  baselineOutput: string;
  candidateOutput: string;
  blindAssignment: {
    engineA: 'baseline' | 'candidate';
    outputA: string;
    engineB: 'baseline' | 'candidate';
    outputB: string;
  };
  metricsBaseline: QuantitativeMetrics;
  metricsCandidate: QuantitativeMetrics;
  candidateWinsCategory: boolean;
  notes: string[];
}

function countParagraphs(text: string): number {
  return text.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length;
}

function extractNumbers(text: string): string[] {
  const matches = text.match(/\b\d+(?:[.,]\d+)*(?:%|\$|Mg|kg|g|ml|L|ARR|EBITDA|GB|MB|ms|s|h)?\b/gi) || [];
  return matches;
}

function extractCitations(text: string): string[] {
  const brackets = text.match(/\[\d+(?:,\s*\d+)*\]/g) || [];
  const authorYear = text.match(/\([A-Z][a-zA-Z\s]+,\s*(?:19|20)\d{2}[a-z]?\)/g) || [];
  return [...brackets, ...authorYear];
}

function computeShingleJaccard(t1: string, t2: string): number {
  const w1 = t1.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
  const w2 = t2.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
  const s1 = new Set<string>();
  const s2 = new Set<string>();
  for (let i = 0; i < w1.length - 1; i++) s1.add(`${w1[i]} ${w1[i + 1]}`);
  for (let i = 0; i < w2.length - 1; i++) s2.add(`${w2[i]} ${w2[i + 1]}`);
  if (s1.size === 0 && s2.size === 0) return 1.0;
  let inter = 0;
  s1.forEach((x) => {
    if (s2.has(x)) inter++;
  });
  const union = s1.size + s2.size - inter;
  return union > 0 ? inter / union : 0;
}

function evaluateQuantitativeMetrics(
  original: string,
  output: string,
  invariants: string[],
  category: string
): QuantitativeMetrics {
  // 1. Structural preservation
  const origParas = countParagraphs(original);
  const outParas = countParagraphs(output);
  const structuralPreservation = origParas > 0 ? Math.min(1.0, outParas / origParas) : 1.0;

  // 2. Entity / Invariant preservation
  let preservedInv = 0;
  for (const inv of invariants) {
    if (output.includes(inv)) preservedInv++;
  }
  const entityPreservation = invariants.length > 0 ? preservedInv / invariants.length : 1.0;

  // 3. Numerical preservation
  const origNumbers = extractNumbers(original);
  let preservedNumbers = 0;
  for (const num of origNumbers) {
    if (output.includes(num)) preservedNumbers++;
  }
  const numericalPreservation = origNumbers.length > 0 ? preservedNumbers / origNumbers.length : 1.0;

  // 4. Citation preservation
  const origCitations = extractCitations(original);
  let preservedCitations = 0;
  for (const cit of origCitations) {
    if (output.includes(cit)) preservedCitations++;
  }
  const citationPreservation = origCitations.length > 0 ? preservedCitations / origCitations.length : 1.0;

  // 5. Semantic similarity
  const semanticSimilarity = computeShingleJaccard(original, output);

  // 6. Grammatical error count
  let grammaticalErrorCount = 0;
  if (/\s+[,.:;!?]/.test(output)) grammaticalErrorCount++;
  if (/([,.])\1/.test(output)) grammaticalErrorCount++;
  if (/[.!?]\s+[a-z]/.test(output)) grammaticalErrorCount++;
  if (/\b(?:the|a|an)\s+(?:the|a|an)\b/i.test(output)) grammaticalErrorCount++;
  // Concord bugs
  if (/\b(?:banks|notifications|systems|nodes|activists)\s+makes\b/i.test(output)) grammaticalErrorCount++;
  if (/\bteam\s+examine\b/i.test(output)) grammaticalErrorCount++;
  if (/\bserv(?:ed|es)\s+as\s+a\s+proof\s+of\b/i.test(output)) grammaticalErrorCount++;

  // 7. Naturalness rating (1 to 5)
  let naturalnessRating = 5.0;
  const clicheRegex = /\b(?:delve into|tapestry of|serves as a testament|stands as a beacon|pivotal role|in the realm of|it is important to note|in today's fast-paced)\b/i;
  if (clicheRegex.test(output)) naturalnessRating -= 1.0;
  if (/\bAlso,\s+[a-z]/i.test(output)) naturalnessRating -= 0.5;
  if (/\bHere's the thing:\b/i.test(output)) naturalnessRating -= 0.5;
  naturalnessRating = Math.max(1.0, Math.min(5.0, naturalnessRating));

  // 8. Voice preservation (1 to 5)
  let voicePreservation = 5.0;
  if (category === 'academic' || category === 'technical') {
    if (/makes a big difference/i.test(output)) voicePreservation -= 1.5;
    if (/\bAlso,\s+/i.test(output)) voicePreservation -= 0.8;
    if (/\b(?:can't|don't|won't|couldn't|wasn't)\b/i.test(output) && !/\b(?:can't|don't|won't|couldn't|wasn't)\b/i.test(original)) {
      voicePreservation -= 0.8;
    }
  }
  voicePreservation = Math.max(1.0, Math.min(5.0, voicePreservation));

  // 9. Word count expansion ratio
  const origWords = original.split(/\s+/).filter(Boolean).length;
  const outWords = output.split(/\s+/).filter(Boolean).length;
  const wordCountExpansion = origWords > 0 ? outWords / origWords : 1.0;

  return {
    structuralPreservation,
    entityPreservation,
    numericalPreservation,
    citationPreservation,
    semanticSimilarity,
    grammaticalErrorCount,
    naturalnessRating,
    voicePreservation,
    wordCountExpansion,
  };
}

describe('PHASE 2 & 5: Independent Held-Out Evaluation', () => {
  const benchmarkPath = path.resolve(__dirname, '../fixtures/benchmarks/humanizer_benchmark_100.json');
  const samples: BenchmarkSample[] = JSON.parse(fs.readFileSync(benchmarkPath, 'utf8'));
  const evalSamples = samples.filter((s) => s.partition === 'eval');

  const candidateEngine = new CandidateEngine();
  const baselineEngine = new BaselineEngine();

  it('evaluates untouched held-out partition across Baseline and Candidate Humanizer 2.0', () => {
    const heldOutRecords: SampleHeldOutRecord[] = [];

    let candidatePreferredCount = 0;
    let baselinePreferredCount = 0;
    let equalCount = 0;

    for (let i = 0; i < evalSamples.length; i++) {
      const sample = evalSamples[i];
      const original = sample.originalText;
      const opts = {
        mode: sample.recommendedMode || 'natural',
        rewriteStrength: 'balanced' as const,
        smartContractions: sample.recommendedMode === 'conversational',
        freezeQuotes: true,
      };

      // 1. Original production baseline output
      const baseRes = baselineEngine.processSync(original, opts);
      const baselineOutput = baseRes.improvedText;

      // 2. Candidate Humanizer 2.0 output (identical settings)
      const candRes = candidateEngine.processSync(original, opts);
      const candidateOutput = candRes.improvedText;

      // 3. Quantitative metrics evaluation
      const metricsBaseline = evaluateQuantitativeMetrics(original, baselineOutput, sample.expectedInvariants, sample.category);
      const metricsCandidate = evaluateQuantitativeMetrics(original, candidateOutput, sample.expectedInvariants, sample.category);

      // 4. Deterministic pseudo-random blind assignment for Phase 3 evaluation
      // (hash of sample.id to swap A/B deterministically without bias)
      const isCandidateA = (sample.id.charCodeAt(sample.id.length - 1) + i) % 2 === 0;
      const blindAssignment = isCandidateA
        ? {
            engineA: 'candidate' as const,
            outputA: candidateOutput,
            engineB: 'baseline' as const,
            outputB: baselineOutput,
          }
        : {
            engineA: 'baseline' as const,
            outputA: baselineOutput,
            engineB: 'candidate' as const,
            outputB: candidateOutput,
          };

      // Comparison notes
      const notes: string[] = [];
      if (candidateOutput === baselineOutput) {
        notes.push('Candidate and baseline produced identical output.');
        equalCount++;
      } else {
        if (metricsCandidate.grammaticalErrorCount < metricsBaseline.grammaticalErrorCount) {
          notes.push(`Candidate eliminated ${metricsBaseline.grammaticalErrorCount - metricsCandidate.grammaticalErrorCount} grammatical defects present in baseline.`);
        }
        if (metricsCandidate.voicePreservation > metricsBaseline.voicePreservation) {
          notes.push('Candidate better preserved formal/scholarly voice without colloquial degradation.');
        }
        if (metricsCandidate.naturalnessRating > metricsBaseline.naturalnessRating) {
          notes.push('Candidate eliminated AI cliché patterns while baseline retained them.');
        }

        // Determine quality advantage
        const candComposite = metricsCandidate.naturalnessRating + metricsCandidate.voicePreservation - metricsCandidate.grammaticalErrorCount * 1.5;
        const baseComposite = metricsBaseline.naturalnessRating + metricsBaseline.voicePreservation - metricsBaseline.grammaticalErrorCount * 1.5;

        if (candComposite > baseComposite) {
          candidatePreferredCount++;
        } else if (baseComposite > candComposite) {
          baselinePreferredCount++;
        } else {
          equalCount++;
        }
      }

      heldOutRecords.push({
        id: sample.id,
        category: sample.category,
        subgenre: sample.subgenre,
        authorship: sample.authorship,
        originalText: original,
        baselineOutput,
        candidateOutput,
        blindAssignment,
        metricsBaseline,
        metricsCandidate,
        candidateWinsCategory: candidateOutput !== baselineOutput && metricsCandidate.grammaticalErrorCount <= metricsBaseline.grammaticalErrorCount,
        notes,
      });
    }

    // Persist comparison dataset
    const comparisonOutputPath = path.resolve(__dirname, '../fixtures/benchmarks/humanizer_held_out_comparison.json');
    fs.writeFileSync(
      comparisonOutputPath,
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          totalHeldOutSamples: heldOutRecords.length,
          candidatePreferredCount,
          baselinePreferredCount,
          equalCount,
          records: heldOutRecords,
        },
        null,
        2
      )
    );

    console.log('\n======================================================');
    console.log('       INDEPENDENT HELD-OUT EVALUATION SUMMARY (50 EVAL)');
    console.log('======================================================');
    console.log(`Candidate Humanizer 2.0 Better:  ${candidatePreferredCount} / 50 (${((candidatePreferredCount / 50) * 100).toFixed(1)}%)`);
    console.log(`Baseline Humanizer 1.0 Better:   ${baselinePreferredCount} / 50 (${((baselinePreferredCount / 50) * 100).toFixed(1)}%)`);
    console.log(`Identical / Equivalent:          ${equalCount} / 50 (${((equalCount / 50) * 100).toFixed(1)}%)`);
    console.log('------------------------------------------------------');

    // Aggregate quantitative metrics
    const computeAggregates = (subset: SampleHeldOutRecord[]) => {
      const n = subset.length;
      const avg = (fn: (r: SampleHeldOutRecord) => number) => subset.reduce((acc, r) => acc + fn(r), 0) / n;
      return {
        baseEntity: avg((r) => r.metricsBaseline.entityPreservation),
        candEntity: avg((r) => r.metricsCandidate.entityPreservation),
        baseNum: avg((r) => r.metricsBaseline.numericalPreservation),
        candNum: avg((r) => r.metricsCandidate.numericalPreservation),
        baseCit: avg((r) => r.metricsBaseline.citationPreservation),
        candCit: avg((r) => r.metricsCandidate.citationPreservation),
        baseSem: avg((r) => r.metricsBaseline.semanticSimilarity),
        candSem: avg((r) => r.metricsCandidate.semanticSimilarity),
        baseGrammarErrors: subset.reduce((acc, r) => acc + r.metricsBaseline.grammaticalErrorCount, 0),
        candGrammarErrors: subset.reduce((acc, r) => acc + r.metricsCandidate.grammaticalErrorCount, 0),
        baseNat: avg((r) => r.metricsBaseline.naturalnessRating),
        candNat: avg((r) => r.metricsCandidate.naturalnessRating),
        baseVoice: avg((r) => r.metricsBaseline.voicePreservation),
        candVoice: avg((r) => r.metricsCandidate.voicePreservation),
        baseExpansion: avg((r) => r.metricsBaseline.wordCountExpansion),
        candExpansion: avg((r) => r.metricsCandidate.wordCountExpansion),
      };
    };

    const overallAgg = computeAggregates(heldOutRecords);
    console.log('Held-Out Quantitative Comparison (Overall 50 Samples):');
    console.log(`- Entity / Invariant Preservation:  Baseline=${(overallAgg.baseEntity * 100).toFixed(1)}% vs Candidate=${(overallAgg.candEntity * 100).toFixed(1)}%`);
    console.log(`- Numerical Preservation:           Baseline=${(overallAgg.baseNum * 100).toFixed(1)}% vs Candidate=${(overallAgg.candNum * 100).toFixed(1)}%`);
    console.log(`- Citation Preservation:            Baseline=${(overallAgg.baseCit * 100).toFixed(1)}% vs Candidate=${(overallAgg.candCit * 100).toFixed(1)}%`);
    console.log(`- Semantic Jaccard Similarity:      Baseline=${overallAgg.baseSem.toFixed(3)} vs Candidate=${overallAgg.candSem.toFixed(3)}`);
    console.log(`- Total Grammatical Errors Flagged: Baseline=${overallAgg.baseGrammarErrors} vs Candidate=${overallAgg.candGrammarErrors}`);
    console.log(`- Naturalness Rating (1-5):         Baseline=${overallAgg.baseNat.toFixed(2)} vs Candidate=${overallAgg.candNat.toFixed(2)}`);
    console.log(`- Voice Preservation Rating (1-5):  Baseline=${overallAgg.baseVoice.toFixed(2)} vs Candidate=${overallAgg.candVoice.toFixed(2)}`);
    console.log(`- Word-Count Expansion Ratio:       Baseline=${overallAgg.baseExpansion.toFixed(3)} vs Candidate=${overallAgg.candExpansion.toFixed(3)}`);

    // Category breakdown
    const categories = ['academic', 'technical', 'professional', 'conversational', 'creative'];
    console.log('\n  Held-Out By Category:');
    for (const cat of categories) {
      const catSubset = heldOutRecords.filter((r) => r.category === cat);
      const catAgg = computeAggregates(catSubset);
      const catWins = catSubset.filter((r) => r.candidateWinsCategory).length;
      console.log(`  * ${cat.padEnd(14)}: ${catWins}/${catSubset.length} cand wins | Grammar errors: base=${catAgg.baseGrammarErrors} vs cand=${catAgg.candGrammarErrors} | Nat: base=${catAgg.baseNat.toFixed(2)} vs cand=${catAgg.candNat.toFixed(2)}`);
    }
    console.log('======================================================\n');

    expect(heldOutRecords.length).toBe(50);
    expect(overallAgg.candGrammarErrors).toBeLessThanOrEqual(overallAgg.baseGrammarErrors);
    expect(overallAgg.candNum).toBeGreaterThanOrEqual(0.95);
  });
});
