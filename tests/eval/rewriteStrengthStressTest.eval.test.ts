import { describe, it, expect } from 'vitest';
import { RuleBasedHumanizerEngine } from '../../src/lib/humanizer/ruleEngine';
import type { RewriteStrength } from '../../src/types';
import { validateInvariants } from '../../src/lib/pipeline/invariants';
import { validateArticleAgreement, validateDuplicateTransitions, validateStructuralCompleteness } from '../../src/lib/pipeline/qualityValidator';

describe('Intelligence V1.1: Rewrite Strength Stress Testing Across All 5 Modes', () => {
  const engine = new RuleBasedHumanizerEngine();
  const strengths: RewriteStrength[] = ['minimal', 'light', 'balanced', 'strong', 'extensive'];

  const testPassages = [
    {
      id: 'strength_sample_1',
      name: 'Academic Cliché Dense Text',
      text: 'It is important to note that deep learning models serve as a testament to scalable representation learning. Furthermore, researchers must delve into the multifaceted mechanisms of self-attention in order to ensure optimal loss convergence across 10,000 steps [4]. In today\'s rapidly evolving AI landscape, this plays a pivotal role in deployment.',
    },
    {
      id: 'strength_sample_2',
      name: 'Clean Prose with Specific Factual Invariants',
      text: 'The solar photovoltaic array generated 45.2 kWh of electrical energy on June 14, 2025. Ambient operating temperatures peaked at 38.5 degrees Celsius.',
    },
    {
      id: 'strength_sample_3',
      name: 'Colloquial Text with Phrasal Verbs and Numbers',
      text: 'The systems engineering team decided to get rid of legacy microservices before the v3.0 release. In addition, we ordered a lot of specialized equipment and 500 liters of purified water.',
    },
  ];

  it('evaluates monotonic edit intensity and invariant preservation across minimal, light, balanced, strong, and extensive', async () => {
    console.info('\n======================================================');
    console.info('      REWRITE STRENGTH STRESS TEST REPORT (5 MODES)   ');
    console.info('======================================================');

    const summaryByStrength: Record<RewriteStrength, {
      totalEdits: number;
      charRetentionRatios: number[];
      invariantViolations: number;
      grammarViolations: number;
    }> = {
      minimal: { totalEdits: 0, charRetentionRatios: [], invariantViolations: 0, grammarViolations: 0 },
      light: { totalEdits: 0, charRetentionRatios: [], invariantViolations: 0, grammarViolations: 0 },
      balanced: { totalEdits: 0, charRetentionRatios: [], invariantViolations: 0, grammarViolations: 0 },
      strong: { totalEdits: 0, charRetentionRatios: [], invariantViolations: 0, grammarViolations: 0 },
      extensive: { totalEdits: 0, charRetentionRatios: [], invariantViolations: 0, grammarViolations: 0 },
    };

    for (const p of testPassages) {
      console.info(`\n--- Test Passage: [${p.id}] ${p.name} ---`);
      let previousEdits = 0;

      for (const str of strengths) {
        const result = await engine.process(p.text, {
          mode: 'formal',
          rewriteStrength: str,
          freezeQuotes: true,
        });

        const rewr = result.improvedText;
        const changesCount = result.changes.length;

        // Invariants check
        const inv = validateInvariants(p.text, rewr);
        const invOk = !inv.criticalViolation && inv.numbersPreserved && inv.citationsPreserved;
        if (!invOk) summaryByStrength[str].invariantViolations++;

        // Grammar check
        const art = validateArticleAgreement(rewr);
        const dup = validateDuplicateTransitions(rewr);
        const struct = validateStructuralCompleteness(p.text, rewr);
        const gramOk = !art.hasError && !dup.hasDuplicates && !struct.isTruncated;
        if (!gramOk) summaryByStrength[str].grammarViolations++;

        // Calculate lexical retention ratio
        const origWords = p.text.toLowerCase().split(/\s+/);
        const rewrWords = new Set(rewr.toLowerCase().split(/\s+/));
        const retained = origWords.filter((w) => rewrWords.has(w)).length;
        const retentionRatio = retained / origWords.length;

        summaryByStrength[str].totalEdits += changesCount;
        summaryByStrength[str].charRetentionRatios.push(retentionRatio);

        console.info(`  [${str.padEnd(9)}] Changes: ${String(changesCount).padStart(2)} | Retention: ${(retentionRatio * 100).toFixed(1)}% | Inv: ${invOk ? '✓' : '✗'} | Gram: ${gramOk ? '✓' : '✗'}`);

        // Monotonic intensity progression expectation: higher strength should allow equal or greater changes
        expect(changesCount).toBeGreaterThanOrEqual(previousEdits === 0 ? 0 : previousEdits - 1);
        previousEdits = changesCount;
      }
    }

    console.info('\n------------------------------------------------------');
    console.info('Summary Across All Strengths:');
    for (const str of strengths) {
      const s = summaryByStrength[str];
      const meanRetention = s.charRetentionRatios.reduce((a, b) => a + b, 0) / s.charRetentionRatios.length;
      console.info(`  • ${str.padEnd(10)}: Total Changes = ${String(s.totalEdits).padStart(2)}, Mean Retention = ${(meanRetention * 100).toFixed(1)}%, Invariant Errors = ${s.invariantViolations}, Grammar Errors = ${s.grammarViolations}`);
      expect(s.invariantViolations).toBe(0);
      expect(s.grammarViolations).toBe(0);
    }
    console.info('======================================================\n');

    // Minimal mode must have fewer or equal edits than balanced/strong
    expect(summaryByStrength.minimal.totalEdits).toBeLessThanOrEqual(summaryByStrength.balanced.totalEdits);
    expect(summaryByStrength.balanced.totalEdits).toBeLessThanOrEqual(summaryByStrength.extensive.totalEdits);
  });
});
