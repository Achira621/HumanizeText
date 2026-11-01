import { describe, it } from 'vitest';
import fs from 'fs';
import path from 'path';
import { executeDetectorEngine } from '../../src/lib/detector/candidateIntegrationBoundary';

interface BenchmarkRow {
  id: string;
  partition: string;
  genre: string;
  lengthCategory: string;
  wordCount: number;
  label: string;
  text: string;
}

describe('HUMANIZETEXT V2.6: Historical Exploratory Threshold Research on 60-Sample Benchmark', () => {
  const benchmarkPath = path.resolve('tests/eval/fixtures/detector_v2_2_benchmark.json');
  const allRows: BenchmarkRow[] = JSON.parse(fs.readFileSync(benchmarkPath, 'utf8'));
  const binaryValidationRows = allRows.filter(
    (r) => r.label === 'human_verified' || r.label === 'ai_generated'
  );

  it('evaluates threshold-performance trade-offs across 60 benchmark samples', () => {
    // Score all benchmark rows with V2.6 Hierarchical detector
    const scoredRows = binaryValidationRows.map((row) => {
      const res = executeDetectorEngine(row.text, { engineId: 'v2_6_hierarchical' });
      return {
        row,
        score: res.score,
        isAi: row.label === 'ai_generated',
        genre: row.genre,
      };
    });

    console.log('\n========================================================================================');
    console.log('   DETECTOR V2.6 HISTORICAL EXPLORATORY THRESHOLD RESEARCH (N=60 BENCHMARK)');
    console.log('========================================================================================');

    const keyBands = [
      { name: 'Band 1: [0.50, 0.50] (Forced Binary)', low: 0.50, high: 0.50 },
      { name: 'Band 2: [0.35, 0.65] (Current V2.6)', low: 0.35, high: 0.65 },
      { name: 'Band 3: [0.20, 0.80] (Conservative 60%)', low: 0.20, high: 0.80 },
      { name: 'Band 4: [0.10, 0.90] (Forensic Audit 80%)', low: 0.10, high: 0.90 },
    ];

    const totalSamples = scoredRows.length; // 60
    const totalHuman = scoredRows.filter((r) => !r.isAi).length; // 30
    const totalAi = scoredRows.filter((r) => r.isAi).length; // 30

    for (const cfg of keyBands) {
      let tp = 0;
      let fp = 0;
      let tn = 0;
      let fn = 0;
      let humanInconclusive = 0;
      let aiInconclusive = 0;

      for (const item of scoredRows) {
        if (item.score >= cfg.high) {
          // Classified as AI
          if (item.isAi) tp++;
          else fp++;
        } else if (item.score <= cfg.low) {
          // Classified as Human
          if (!item.isAi) tn++;
          else fn++;
        } else {
          // Inconclusive
          if (item.isAi) aiInconclusive++;
          else humanInconclusive++;
        }
      }

      const totalInconclusive = humanInconclusive + aiInconclusive;
      const aiClassified = tp + fp;
      const humanClassified = tn + fn;
      const covered = totalSamples - totalInconclusive;

      const humanFprCohort = (fp / totalHuman) * 100; // False positive over all 30 human samples
      const aiRecallCohort = (tp / totalAi) * 100; // Cohort-wide recall: TP / total AI (30)
      const aiRecallDecisive = tp + fn > 0 ? (tp / (tp + fn)) * 100 : 0; // Decisive recall on covered AI

      const coveragePct = (covered / totalSamples) * 100;
      const decisiveAccuracy = covered > 0 ? ((tp + tn) / covered) * 100 : 0;
      const humanAbstentionRate = (humanInconclusive / totalHuman) * 100;
      const aiAbstentionRate = (aiInconclusive / totalAi) * 100;

      console.log(`\n--- ${cfg.name} ---`);
      console.log(`  TP: ${tp} | FP: ${fp} | TN: ${tn} | FN: ${fn}`);
      console.log(`  AI-Classified (TP+FP):       ${aiClassified}`);
      console.log(`  Human-Classified (TN+FN):    ${humanClassified}`);
      console.log(`  Inconclusive Total:          ${totalInconclusive} (Human: ${humanInconclusive}, AI: ${aiInconclusive})`);
      console.log(`  Human FPR (Cohort-Wide):     ${humanFprCohort.toFixed(1)}% (${fp}/${totalHuman})`);
      console.log(`  AI Recall (Cohort-Wide):     ${aiRecallCohort.toFixed(1)}% (${tp}/${totalAi})`);
      console.log(`  AI Recall (Decisive Only):   ${aiRecallDecisive.toFixed(1)}% (${tp}/${tp + fn})`);
      console.log(`  Coverage Rate:               ${coveragePct.toFixed(1)}% (${covered}/${totalSamples})`);
      console.log(`  Decisive Accuracy:           ${decisiveAccuracy.toFixed(1)}% (${tp + tn}/${covered})`);
      console.log(`  Class Abstention - Human:    ${humanAbstentionRate.toFixed(1)}% (${humanInconclusive}/${totalHuman})`);
      console.log(`  Class Abstention - AI:       ${aiAbstentionRate.toFixed(1)}% (${aiInconclusive}/${totalAi})`);
    }
    console.log('\n========================================================================================\n');
  });

  it('measures genre-specific trade-offs at key operating thresholds (0.50, 0.65, 0.80)', () => {
    const genres = ['academic', 'technical', 'corporate', 'conversational', 'creative'];
    const thresholds = [0.50, 0.65, 0.80];

    console.log('\n--- GENRE-SPECIFIC TRADE-OFF ANALYSIS (N=60 Validation) ---');
    for (const T of thresholds) {
      const low = 1 - T;
      const high = T;
      console.log(`\nOperating Band: [${low.toFixed(2)}, ${high.toFixed(2)}]`);

      for (const genre of genres) {
        const genreRows = binaryValidationRows.filter((r) => r.genre === genre);
        const scored = genreRows.map((r) => ({
          score: executeDetectorEngine(r.text, { engineId: 'v2_6_hierarchical' }).score,
          isAi: r.label === 'ai_generated',
        }));

        const gHuman = scored.filter((r) => !r.isAi);
        const gAi = scored.filter((r) => r.isAi);

        const fp = gHuman.filter((r) => r.score >= high).length;
        const tp = gAi.filter((r) => r.score >= high).length;
        const inconc = scored.filter((r) => r.score > low && r.score < high).length;

        const fpr = gHuman.length > 0 ? (fp / gHuman.length) * 100 : 0;
        const recall = gAi.length > 0 ? (tp / gAi.length) * 100 : 0;
        const inconcPct = (inconc / scored.length) * 100;

        console.log(
          `  [${genre.toUpperCase().padEnd(14)}] N=${scored.length} | Human FPR: ${fpr.toFixed(0).padStart(3)}% (${fp}/${gHuman.length}) | AI Recall: ${recall.toFixed(0).padStart(3)}% (${tp}/${gAi.length}) | Inconclusive: ${inconcPct.toFixed(0)}%`
        );
      }
    }
  });
});

