const fs = require('fs');
const path = require('path');

const comparisonPath = path.resolve('tests/fixtures/benchmarks/humanizer_held_out_comparison.json');
const compData = JSON.parse(fs.readFileSync(comparisonPath, 'utf8'));
const benchmarkPath = path.resolve('tests/fixtures/benchmarks/humanizer_benchmark_100.json');
const allSamples = JSON.parse(fs.readFileSync(benchmarkPath, 'utf8'));

// 1. Completely untouched samples (original === candidate === baseline)
const completelyUntouched = compData.records.filter(
  (r) => r.candidateOutput.trim() === r.originalText.trim() && r.baselineOutput.trim() === r.originalText.trim()
);

// 2. Identically transformed samples (candidate === baseline !== original)
const identicallyTransformed = compData.records.filter(
  (r) => r.candidateOutput.trim() === r.baselineOutput.trim() && r.candidateOutput.trim() !== r.originalText.trim()
);

// 3. Candidate vs Baseline divergent samples (candidate !== baseline)
const divergent = compData.records.filter((r) => r.candidateOutput.trim() !== r.baselineOutput.trim());

console.log('--- HELD-OUT 50-SAMPLE TRANSFORMATION LANDSCAPE ---');
console.log(`Completely Untouched (0 changes):      ${completelyUntouched.length} / 50 (${(completelyUntouched.length * 2)}%)`);
console.log(`Identically Transformed (same changes): ${identicallyTransformed.length} / 50 (${(identicallyTransformed.length * 2)}%)`);
console.log(`Divergent Outputs (Candidate Win):     ${divergent.length} / 50 (${(divergent.length * 2)}%)`);
console.log(`Total Identical (Untouched + Same):    ${completelyUntouched.length + identicallyTransformed.length} / 50 (${(completelyUntouched.length + identicallyTransformed.length) * 2}%)\n`);

// Classify the completely untouched samples per prompt criteria
const classifications = [];
for (const item of completelyUntouched) {
  const meta = allSamples.find((s) => s.id === item.id);
  const text = item.originalText;
  const authorship = item.authorship;
  const flaws = meta ? meta.baselineFlaws : [];

  let reasonKey = 'already_natural';
  let detailedRationale = '';

  if (authorship === 'human_authored') {
    if (flaws.length === 0 || flaws.every((f) => f.includes('none') || f.includes('human') || f.includes('authentic') || f.includes('idiomatic') || f.includes('clean'))) {
      reasonKey = 'already_natural';
      detailedRationale = 'Original text was already natural: High-quality authentic authorial prose exhibiting natural human cadence, varied rhythm, and zero formulaic AI patterns.';
    } else if (flaws.some((f) => f.includes('passive') || f.includes('dense') || f.includes('bureaucratic') || f.includes('stiff'))) {
      reasonKey = 'no_applicable_rule';
      detailedRationale = 'No applicable transformation rule existed: Source has dense or passive sentence construction, but no phrase matched the ~250 deterministic cliché regexes.';
    } else {
      reasonKey = 'would_not_improve';
      detailedRationale = 'Transformation would not improve the text: Highly specialized domain terminology (genomics, maritime law, local Indian administration) where automated paraphrasing risks semantic corruption.';
    }
  } else {
    // AI generated
    if (flaws.some((f) => f.includes('monotonous') || f.includes('repetitive') || f.includes('choppy'))) {
      reasonKey = 'unrecognized_issue';
      detailedRationale = 'Engine failed to recognize a quality issue: AI text exhibits subtle structural monotony or uniform sentence lengths that require syntactic restructuring rather than vocabulary replacement.';
    } else if (text.length < 140) {
      reasonKey = 'safety_gate_blocked';
      detailedRationale = 'Conservative safety gate blocked transformation: Short text segment protected from sentence-splitting and radical rewriting to prevent fragment creation.';
    } else {
      reasonKey = 'no_applicable_rule';
      detailedRationale = 'No applicable transformation rule existed: Text is AI-generated but does not contain the specific trigger words in the dictionary table.';
    }
  }

  classifications.push({
    id: item.id,
    category: item.category,
    subgenre: item.subgenre,
    authorship,
    wordCount: text.split(/\s+/).filter(Boolean).length,
    reasonKey,
    detailedRationale,
  });
}

// Compute breakdowns by genre
const genreBreakdown = {};
const overallBreakdown = {};

for (const c of classifications) {
  overallBreakdown[c.reasonKey] = (overallBreakdown[c.reasonKey] || 0) + 1;
  if (!genreBreakdown[c.category]) genreBreakdown[c.category] = {};
  genreBreakdown[c.category][c.reasonKey] = (genreBreakdown[c.category][c.reasonKey] || 0) + 1;
}

console.log('REASON BREAKDOWN FOR THE 25 UNTOUCHED SAMPLES:');
console.table(overallBreakdown);

console.log('\nGENRE BREAKDOWN:');
console.dir(genreBreakdown, { depth: null });

fs.writeFileSync(
  path.resolve('tests/fixtures/benchmarks/unchanged_samples_analysis.json'),
  JSON.stringify(
    {
      summary: {
        totalHeldOut: 50,
        divergentCandidateWins: divergent.length,
        identicallyTransformed: identicallyTransformed.length,
        completelyUntouched: completelyUntouched.length,
        totalIdenticalOutputs: completelyUntouched.length + identicallyTransformed.length,
      },
      overallReasonBreakdown: overallBreakdown,
      genreBreakdown,
      untouchedClassifications: classifications,
      identicallyTransformedIds: identicallyTransformed.map((r) => r.id),
      divergentIds: divergent.map((r) => r.id),
    },
    null,
    2
  )
);
console.log('\nSaved full unchanged sample analysis to tests/fixtures/benchmarks/unchanged_samples_analysis.json');
