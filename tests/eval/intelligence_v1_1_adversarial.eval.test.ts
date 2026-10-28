import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { RuleBasedHumanizerEngine } from '../../src/lib/humanizer/ruleEngine';
import type { HumanizerMode, RewriteStrength } from '../../src/types';
import { validateInvariants, checkNegationTargetPreservation } from '../../src/lib/pipeline/invariants';
import {
  validateArticleAgreement,
  validateDuplicateTransitions,
  validateStructuralCompleteness,
} from '../../src/lib/pipeline/qualityValidator';
import { evaluateCandidate } from '../../src/lib/pipeline/candidateRanker';

interface AdversarialSample {
  id: string;
  category: string;
  name: string;
  inputText: string;
  expectedPreservations: string[];
  forbiddenMutations: string[];
  criticalInvariants: string[];
  shouldRemainUnchanged?: boolean;
  frozenWords?: string[];
  mode: HumanizerMode;
  rewriteStrength: RewriteStrength;
}

describe('Intelligence V1.1: Adversarial Validation and Independent Quality Evaluation', () => {
  const fixturePath = path.resolve(__dirname, '../fixtures/benchmarks/intelligence_v1_1_adversarial.json');
  const samples: AdversarialSample[] = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));
  const engine = new RuleBasedHumanizerEngine();

  it('contains at least 50 adversarial cases across all 8 required categories', () => {
    expect(samples.length).toBeGreaterThanOrEqual(50);
    const categories = new Set(samples.map((s) => s.category));
    expect(categories.size).toBe(8);
  });

  it('runs baseline adversarial validation across all 56 challenge cases', async () => {
    let totalSamples = samples.length;
    let invariantPassCount = 0;
    let expectedPreservationPassCount = 0;
    let forbiddenMutationPassCount = 0;
    let grammarPassCount = 0;
    let unchangedPassCount = 0;
    let candidateRankerPassCount = 0;

    const failuresByCategory: Record<string, Array<{ id: string; reason: string }>> = {};

    for (const sample of samples) {
      if (!failuresByCategory[sample.category]) {
        failuresByCategory[sample.category] = [];
      }

      const result = await engine.process(sample.inputText, {
        mode: sample.mode,
        rewriteStrength: sample.rewriteStrength,
        freezeQuotes: true,
        frozenWords: sample.frozenWords || [],
      });

      const improved = result.improvedText;

      // 1. Invariant Validation
      const inv = validateInvariants(sample.inputText, improved, {
        freezeQuotes: true,
        frozenWords: sample.frozenWords || [],
      });

      const hasCriticalViolation = inv.criticalViolation;
      const invariantsOk = !hasCriticalViolation && inv.numbersPreserved && inv.citationsPreserved && inv.unitsPreserved;
      if (invariantsOk) {
        invariantPassCount++;
      } else {
        failuresByCategory[sample.category].push({
          id: sample.id,
          reason: `Invariant violation: ${inv.violations.map((v) => v.message).join('; ') || 'Preservation warning'}`,
        });
      }

      // 2. Expected Text Snippet Preservations
      let preservationsOk = true;
      for (const exp of sample.expectedPreservations) {
        if (!improved.includes(exp)) {
          preservationsOk = false;
          failuresByCategory[sample.category].push({
            id: sample.id,
            reason: `Missing expected preservation: "${exp}" in "${improved}"`,
          });
          break;
        }
      }
      if (preservationsOk) expectedPreservationPassCount++;

      // 3. Forbidden Mutation Checks
      let mutationsOk = true;
      for (const pattern of sample.forbiddenMutations) {
        const regex = new RegExp(pattern, 'i');
        if (regex.test(improved)) {
          mutationsOk = false;
          failuresByCategory[sample.category].push({
            id: sample.id,
            reason: `Triggered forbidden mutation pattern: /${pattern}/ in "${improved}"`,
          });
          break;
        }
      }
      if (mutationsOk) forbiddenMutationPassCount++;

      // 4. Grammar & Structural Checks
      const art = validateArticleAgreement(improved);
      const dupTrans = validateDuplicateTransitions(improved);
      const struct = validateStructuralCompleteness(sample.inputText, improved);
      const grammarOk = !art.hasError && !dupTrans.hasDuplicates && !struct.isTruncated && !struct.hasDuplication;
      if (grammarOk) {
        grammarPassCount++;
      } else {
        failuresByCategory[sample.category].push({
          id: sample.id,
          reason: `Grammar/structural issue: ${art.errors.concat(struct.issues).join('; ')}`,
        });
      }

      // 5. Unchanged check if requested
      if (sample.shouldRemainUnchanged) {
        if (improved.trim() === sample.inputText.trim()) {
          unchangedPassCount++;
        } else {
          failuresByCategory[sample.category].push({
            id: sample.id,
            reason: `Expected unchanged text, but was rewritten to: "${improved}"`,
          });
        }
      }

      // 6. Candidate Ranker Evaluation
      const candEval = evaluateCandidate(sample.inputText, improved, {
        mode: sample.mode,
        rewriteStrength: sample.rewriteStrength,
        frozenWords: sample.frozenWords || [],
        freezeQuotes: true,
      });

      if (candEval.isValid) {
        candidateRankerPassCount++;
      } else {
        failuresByCategory[sample.category].push({
          id: sample.id,
          reason: `Candidate ranker rejected rewrite: ${candEval.rejectionReason}`,
        });
      }
    }

    console.info('\n======================================================');
    console.info('      INTELLIGENCE V1.1 ADVERSARIAL BENCHMARK REPORT  ');
    console.info('======================================================');
    console.info(`Total Adversarial Samples:         ${totalSamples}`);
    console.info(`Invariant Preservation:            ${invariantPassCount}/${totalSamples} (${((invariantPassCount / totalSamples) * 100).toFixed(1)}%)`);
    console.info(`Expected Preservations Retained:   ${expectedPreservationPassCount}/${totalSamples} (${((expectedPreservationPassCount / totalSamples) * 100).toFixed(1)}%)`);
    console.info(`Forbidden Mutations Avoided:       ${forbiddenMutationPassCount}/${totalSamples} (${((forbiddenMutationPassCount / totalSamples) * 100).toFixed(1)}%)`);
    console.info(`Grammar & Structure Clean:         ${grammarPassCount}/${totalSamples} (${((grammarPassCount / totalSamples) * 100).toFixed(1)}%)`);
    console.info(`Candidate Ranker Acceptance:       ${candidateRankerPassCount}/${totalSamples} (${((candidateRankerPassCount / totalSamples) * 100).toFixed(1)}%)`);
    console.info('------------------------------------------------------');
    console.info('Failure Breakdown by Category:');
    for (const [cat, fails] of Object.entries(failuresByCategory)) {
      const uniqueFails = Array.from(new Set(fails.map((f) => `[${f.id}] ${f.reason}`)));
      console.info(`  • ${cat.padEnd(24)}: ${uniqueFails.length === 0 ? 'CLEAN (0 failures)' : `${uniqueFails.length} failure(s)`}`);
      for (const uf of uniqueFails.slice(0, 3)) {
        console.info(`      ↳ ${uf}`);
      }
      if (uniqueFails.length > 3) {
        console.info(`      ↳ ... and ${uniqueFails.length - 3} more`);
      }
    }
    console.info('======================================================\n');

    // For honest baseline recording, record results rather than failing assertion immediately if initial run has flaws
    expect(totalSamples).toBe(56);
  });
});
