import { predictV25Text } from '../../src/lib/detector/v2_5/detectorV2_5';
import { computeAiScore } from '../../src/lib/detector/detectorCore';
import fs from 'fs';
import readline from 'readline';

async function run() {
  const fileStream = fs.createReadStream('data/v2_4_4/qualified_corpus_registry.jsonl');
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let agreements = 0;
  let totalCompared = 0;
  const diffs: { id: string; label: string; v25: number; v25Ver: string; legacy: number; legacyVer: string; diff: number; textSnippet: string }[] = [];

  for await (const line of rl) {
    if (!line.trim()) continue;
    const item = JSON.parse(line);
    // STRICT EMBARGO: Do NOT evaluate on FINAL_TEST cohort
    if (item.partition === 'FINAL_TEST') continue;
    if (item.partition !== 'DEV') continue; // Use DEV set for comparison

    const text = item.text || '';
    const words = text.trim().split(/\s+/).filter(Boolean);
    if (words.length < 40) continue;

    const v25 = predictV25Text(text);
    const legacy = computeAiScore(text);

    const diff = Math.abs(v25.calibratedProbability - legacy.aiProbability);
    const v25Ver = v25.verdict;
    const legacyVer = legacy.aiProbability >= 0.65 ? 'ai' : legacy.aiProbability <= 0.35 ? 'human' : 'inconclusive';

    totalCompared++;
    if (v25Ver === legacyVer) agreements++;

    diffs.push({
      id: item.sampleId,
      label: item.authorClass,
      v25: Number(v25.calibratedProbability.toFixed(3)),
      v25Ver,
      legacy: Number(legacy.aiProbability.toFixed(3)),
      legacyVer,
      diff: Number(diff.toFixed(3)),
      textSnippet: text.substring(0, 65).replace(/[\r\n]+/g, ' ') + '...',
    });
  }

  console.log(`Total DEV Samples Evaluated: ${totalCompared}`);
  console.log(`Verdicts Agreed: ${agreements} / ${totalCompared} (${Math.round((agreements / totalCompared) * 100)}%)`);
  console.log(`Verdicts Disagreed: ${totalCompared - agreements} / ${totalCompared} (${Math.round(((totalCompared - agreements) / totalCompared) * 100)}%)`);

  const avgDiff = diffs.reduce((a, b) => a + b.diff, 0) / diffs.length;
  console.log(`Mean Absolute Score Difference: ${avgDiff.toFixed(3)}`);

  console.log('\n--- AGREEMENT EXAMPLES (Engines agree on verdict) ---');
  diffs.filter(d => d.v25Ver === d.legacyVer).slice(0, 5).forEach(d => {
    console.log(`[${d.id} | ${d.label}] V2.5: ${d.v25} (${d.v25Ver}) vs Legacy: ${d.legacy} (${d.legacyVer}) | Diff: ${d.diff}`);
    console.log(`   "${d.textSnippet}"`);
  });

  console.log('\n--- DISAGREEMENT EXAMPLES (Engines disagree on verdict) ---');
  diffs.filter(d => d.v25Ver !== d.legacyVer).slice(0, 8).forEach(d => {
    console.log(`[${d.id} | ${d.label}] V2.5: ${d.v25} (${d.v25Ver}) vs Legacy: ${d.legacy} (${d.legacyVer}) | Diff: ${d.diff}`);
    console.log(`   "${d.textSnippet}"`);
  });
}

run().catch(console.error);
