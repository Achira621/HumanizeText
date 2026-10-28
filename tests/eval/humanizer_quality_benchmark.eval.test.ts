import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { RuleBasedHumanizerEngine } from '../../src/lib/humanizer/ruleEngine';
import type { HumanizerMode } from '../../src/types';

interface BenchmarkSample {
  id: string;
  category: string;
  name: string;
  inputAiText: string;
  expectedPreservations: string[];
  sourceWeaknesses: string[];
  recommendedMode: HumanizerMode;
  targetReadingLevel: 'general' | 'academic' | 'casual';
}

export interface QualityScore {
  semanticFidelity: number;
  factualFidelity: number;
  grammarFluency: number;
  contextualCoherence: number;
  lexicalQuality: number;
  readabilityAppropriateness: number;
  formattingIntegrity: number;
  editingNecessity: number;
  overallScore: number;
}

const AI_CLICHE_PATTERNS = [
  /delve into/i,
  /tapestry of/i,
  /serves as a testament/i,
  /beacon of/i,
  /plays a pivotal role/i,
  /plays a vital role/i,
  /in today'?s (?:fast-paced|rapidly evolving|competitive) (?:world|marketplace|clinical world)/i,
  /in the realm of/i,
  /it is important to note/i,
  /it should be noted that/i,
  /first and foremost/i,
  /vital asset/i,
  /furthermore/i,
  /moreover/i,
  /consequently/i,
  /in conclusion/i,
  /in essence/i,
  /at the end of the day/i,
  /taking everything into consideration/i,
  /treasure trove of/i,
  /blanket of fog/i,
  /danced gracefully/i,
];

function evaluateSampleQuality(
  sample: BenchmarkSample,
  original: string,
  improved: string
): QualityScore {
  // 1. Semantic Fidelity (content words retention)
  const origTokens = original.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
  const impTokens = new Set(improved.toLowerCase().match(/\b[a-z]{3,}\b/g) || []);
  let retained = 0;
  for (const t of origTokens) {
    if (impTokens.has(t)) retained++;
  }
  const retentionRatio = origTokens.length > 0 ? retained / origTokens.length : 1;
  let semanticFidelity = 3.0;
  if (retentionRatio >= 0.75) semanticFidelity = 5.0;
  else if (retentionRatio >= 0.60) semanticFidelity = 4.0;
  else if (retentionRatio >= 0.45) semanticFidelity = 3.0;
  else if (retentionRatio >= 0.30) semanticFidelity = 2.0;
  else semanticFidelity = 1.0;

  // 2. Factual Fidelity (preservation of expected invariants)
  let preservedCount = 0;
  for (const item of sample.expectedPreservations) {
    if (improved.includes(item)) {
      preservedCount++;
    }
  }
  const factualRatio =
    sample.expectedPreservations.length > 0
      ? preservedCount / sample.expectedPreservations.length
      : 1;
  let factualFidelity = 1.0;
  if (factualRatio >= 1.0) factualFidelity = 5.0;
  else if (factualRatio >= 0.8) factualFidelity = 4.0;
  else if (factualRatio >= 0.6) factualFidelity = 3.0;
  else if (factualRatio >= 0.4) factualFidelity = 2.0;

  // 3. Grammar & Fluency
  let grammarFluency = 5.0;
  if (/\s{2,}/.test(improved)) grammarFluency -= 0.5;
  if (/\b(?:[A-Z]{2,})\b/.test(improved) && !/[A-Z]{3,}/.test(original)) grammarFluency -= 0.5;
  if (/\s+[,.:;!?]/.test(improved)) grammarFluency -= 1.0;
  if (/[.!?]\s+[a-z]/.test(improved)) grammarFluency -= 1.0;
  if (/([,.])\1/.test(improved)) grammarFluency -= 1.0;
  grammarFluency = Math.max(1.0, Math.min(5.0, grammarFluency));

  // 4. Contextual Coherence (sentence length variety and starter repetition)
  const sentences = improved
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  let contextualCoherence = 5.0;
  if (sentences.length > 1) {
    const starters = sentences.map((s) => s.split(' ')[0]?.toLowerCase());
    for (let i = 1; i < starters.length; i++) {
      if (starters[i] && starters[i] === starters[i - 1]) {
        contextualCoherence -= 1.0; // penalized for consecutive identical starters
      }
    }
    const lengths = sentences.map((s) => s.split(/\s+/).length);
    const avgLen = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance =
      lengths.map((l) => Math.pow(l - avgLen, 2)).reduce((a, b) => a + b, 0) / lengths.length;
    if (lengths.length >= 3 && variance < 2) {
      contextualCoherence -= 0.5; // too monotonous
    }
  }
  contextualCoherence = Math.max(1.0, Math.min(5.0, contextualCoherence));

  // 5. Lexical Quality (eradication of AI clichés)
  let foundOriginalClichés = 0;
  let remainingClichés = 0;
  for (const pat of AI_CLICHE_PATTERNS) {
    if (pat.test(original)) {
      foundOriginalClichés++;
      if (pat.test(improved)) {
        remainingClichés++;
      }
    }
  }
  let lexicalQuality = 5.0;
  if (foundOriginalClichés > 0) {
    const removalRate = (foundOriginalClichés - remainingClichés) / foundOriginalClichés;
    if (removalRate >= 0.9) lexicalQuality = 5.0;
    else if (removalRate >= 0.7) lexicalQuality = 4.0;
    else if (removalRate >= 0.4) lexicalQuality = 3.0;
    else lexicalQuality = 2.0;
  }

  // 6. Readability Appropriateness
  const words = improved.trim().split(/\s+/).filter(Boolean);
  const syllables = words.reduce((acc, w) => acc + Math.max(1, w.length / 3), 0);
  const sentenceCount = Math.max(1, sentences.length);
  const wordCount = Math.max(1, words.length);
  const fkGrade = 0.39 * (wordCount / sentenceCount) + 11.8 * (syllables / wordCount) - 15.59;

  let readabilityAppropriateness = 5.0;
  if (sample.targetReadingLevel === 'casual') {
    if (fkGrade > 10) readabilityAppropriateness = 3.0;
    else if (fkGrade > 8) readabilityAppropriateness = 4.0;
  } else if (sample.targetReadingLevel === 'academic') {
    if (fkGrade < 8) readabilityAppropriateness = 3.0;
    else if (fkGrade < 10) readabilityAppropriateness = 4.0;
  }

  // 7. Formatting & Invariant Integrity
  let formattingIntegrity = 5.0;
  if (original.includes('```') && !improved.includes('```')) formattingIntegrity -= 2.0;
  if (original.includes('- ') && !improved.includes('- ')) formattingIntegrity -= 1.5;
  if (original.includes('`') && !improved.includes('`')) formattingIntegrity -= 1.0;
  const quoteMatchesOrig = original.match(/"([^"]+)"/g) || [];
  for (const q of quoteMatchesOrig) {
    if (!improved.includes(q)) {
      formattingIntegrity -= 1.0;
    }
  }
  formattingIntegrity = Math.max(1.0, Math.min(5.0, formattingIntegrity));

  // 8. Editing Necessity
  const origLen = original.trim().length;
  const impLen = improved.trim().length;
  const lenRatio = origLen > 0 ? impLen / origLen : 1;
  let editingNecessity = 5.0;
  if (lenRatio < 0.5 || lenRatio > 1.6) editingNecessity = 2.0;
  else if (lenRatio < 0.65 || lenRatio > 1.35) editingNecessity = 3.5;

  const overallScore = Number(
    (
      (semanticFidelity +
        factualFidelity +
        grammarFluency +
        contextualCoherence +
        lexicalQuality +
        readabilityAppropriateness +
        formattingIntegrity +
        editingNecessity) /
      8
    ).toFixed(2)
  );

  return {
    semanticFidelity,
    factualFidelity,
    grammarFluency,
    contextualCoherence,
    lexicalQuality,
    readabilityAppropriateness,
    formattingIntegrity,
    editingNecessity,
    overallScore,
  };
}

describe('Humanizer 60-Sample Quality Benchmark & Rubric Evaluation', () => {
  const datasetPath = path.resolve(__dirname, '../fixtures/benchmarks/humanizer_benchmark_60.json');
  const samples: BenchmarkSample[] = JSON.parse(fs.readFileSync(datasetPath, 'utf-8'));
  const engine = new RuleBasedHumanizerEngine();

  it('contains exactly 60 diverse samples across 8 categories', () => {
    expect(samples.length).toBe(60);
    const categories = new Set(samples.map((s) => s.category));
    expect(categories.size).toBe(8);
  });

  it('runs baseline evaluation across all 60 samples and computes rubric metrics', async () => {
    const scores: QualityScore[] = [];
    const categoryAverages: Record<string, { total: number; count: number }> = {};

    for (const sample of samples) {
      const result = await engine.process(sample.inputAiText, {
        mode: sample.recommendedMode,
        freezeQuotes: true,
      });

      const score = evaluateSampleQuality(sample, sample.inputAiText, result.improvedText);
      scores.push(score);

      if (!categoryAverages[sample.category]) {
        categoryAverages[sample.category] = { total: 0, count: 0 };
      }
      categoryAverages[sample.category].total += score.overallScore;
      categoryAverages[sample.category].count += 1;
    }

    const mean = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
    const avgOverall = mean(scores.map((s) => s.overallScore));
    const avgSemantic = mean(scores.map((s) => s.semanticFidelity));
    const avgFactual = mean(scores.map((s) => s.factualFidelity));
    const avgGrammar = mean(scores.map((s) => s.grammarFluency));
    const avgContext = mean(scores.map((s) => s.contextualCoherence));
    const avgLexical = mean(scores.map((s) => s.lexicalQuality));
    const avgReadability = mean(scores.map((s) => s.readabilityAppropriateness));
    const avgFormatting = mean(scores.map((s) => s.formattingIntegrity));
    const avgEditing = mean(scores.map((s) => s.editingNecessity));

    console.info('\n======================================================');
    console.info('      HUMANIZER 60-SAMPLE QUALITY BENCHMARK REPORT    ');
    console.info('======================================================');
    console.info(`Total Benchmark Samples: ${samples.length}`);
    console.info(`Mean Overall Score (1-5): ${avgOverall.toFixed(2)}`);
    console.info(`  - Semantic Fidelity:            ${avgSemantic.toFixed(2)} / 5.0`);
    console.info(`  - Factual Fidelity:             ${avgFactual.toFixed(2)} / 5.0`);
    console.info(`  - Grammar & Fluency:            ${avgGrammar.toFixed(2)} / 5.0`);
    console.info(`  - Contextual Coherence:         ${avgContext.toFixed(2)} / 5.0`);
    console.info(`  - Lexical Quality:              ${avgLexical.toFixed(2)} / 5.0`);
    console.info(`  - Readability Appropriateness:  ${avgReadability.toFixed(2)} / 5.0`);
    console.info(`  - Formatting & Invariants:      ${avgFormatting.toFixed(2)} / 5.0`);
    console.info(`  - Editing Necessity:            ${avgEditing.toFixed(2)} / 5.0`);
    console.info('------------------------------------------------------');
    console.info('Category Breakdown (Mean Overall Score):');
    for (const [cat, data] of Object.entries(categoryAverages)) {
      console.info(`  - ${cat.padEnd(18)}: ${(data.total / data.count).toFixed(2)} / 5.0`);
    }
    console.info('======================================================\n');

    expect(avgOverall).toBeGreaterThanOrEqual(3.5);
    expect(avgFactual).toBeGreaterThanOrEqual(4.0);
  });
});
