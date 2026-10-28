import { describe, it, expect } from 'vitest';
import independentData from '../fixtures/benchmarks/intelligence_v1_2_independent_30.json';
import { RuleBasedHumanizerEngine } from '../../src/lib/humanizer/ruleEngine';
import { validateInvariants } from '../../src/lib/pipeline/invariants';
import {
  validateArticleAgreement,
  validateMassNounQuantification,
  validateSentenceVerbs,
} from '../../src/lib/pipeline/qualityValidator';
import { rankCandidates } from '../../src/lib/pipeline/candidateRanker';

describe('Task 4: Independent Regression Suite (Intelligence V1.2 - 30 Challenge Cases)', () => {
  const engine = new RuleBasedHumanizerEngine();
  const items = independentData.items;

  it('runs all 30 independent challenge cases and verifies factual fidelity, grammar, and ranking', () => {
    let invariantPassCount = 0;
    let grammarPassCount = 0;
    let rankerPassCount = 0;
    const failures: Array<{ id: string; domain: string; reason: string }> = [];

    for (const item of items) {
      const res = engine.processSync(item.input, {
        mode: 'natural',
        rewriteStrength: 'balanced',
        freezeQuotes: true,
      });

      const output = res.improvedText;

      // 1. Invariant Validation
      const inv = validateInvariants(item.input, output);
      const isInvValid =
        !inv.criticalViolation &&
        inv.numbersPreserved &&
        inv.citationsPreserved &&
        inv.quotesPreserved &&
        inv.urlsPreserved &&
        inv.negationsPreserved &&
        inv.unitsPreserved &&
        inv.causalityPreserved;

      if (isInvValid) {
        invariantPassCount++;
      } else {
        failures.push({
          id: item.id,
          domain: item.domain,
          reason: `Invariant violation: ${inv.violations[0]?.message || 'Unknown invariant failure'}`,
        });
      }

      // 2. Grammar & Structural Validation
      const art = validateArticleAgreement(output);
      const mass = validateMassNounQuantification(output);
      const verb = validateSentenceVerbs(item.input, output);
      const isGrammarValid = !art.hasError && !mass.hasError && verb.isValid;

      if (isGrammarValid) {
        grammarPassCount++;
      } else {
        failures.push({
          id: item.id,
          domain: item.domain,
          reason: `Grammar defect: ${[...art.errors, ...mass.errors, ...verb.errors].join('; ')}`,
        });
      }

      // 3. Candidate Ranker Validation
      const ranking = rankCandidates(item.input, [output], {
        rewriteStrength: 'balanced',
        mode: 'natural',
      });
      const isRankerValid = ranking.rankedCandidates.length > 0 && ranking.bestCandidate?.isValid === true;

      if (isRankerValid) {
        rankerPassCount++;
      } else {
        failures.push({
          id: item.id,
          domain: item.domain,
          reason: `Candidate ranker rejected output: ${ranking.rejectedCandidates[0]?.rejectionReason || 'Unknown rejection'}`,
        });
      }
    }

    console.log('\n======================================================');
    console.log('   INDEPENDENT REGRESSION EVALUATION REPORT (TASK 4)  ');
    console.log('======================================================');
    console.log(`Total Independent Challenge Cases: ${items.length}`);
    console.log(`Invariant Preserved: ${invariantPassCount}/${items.length} (${((invariantPassCount / items.length) * 100).toFixed(1)}%)`);
    console.log(`Grammar Intact:      ${grammarPassCount}/${items.length} (${((grammarPassCount / items.length) * 100).toFixed(1)}%)`);
    console.log(`Ranker Approved:     ${rankerPassCount}/${items.length} (${((rankerPassCount / items.length) * 100).toFixed(1)}%)`);
    if (failures.length > 0) {
      console.log('Failures detected:', failures);
    }
    console.log('======================================================\n');

    expect(failures).toHaveLength(0);
    expect(invariantPassCount).toBe(items.length);
    expect(grammarPassCount).toBe(items.length);
    expect(rankerPassCount).toBe(items.length);
  });
});
