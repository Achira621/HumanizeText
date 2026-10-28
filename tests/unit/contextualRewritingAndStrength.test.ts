import { describe, it, expect } from 'vitest';
import { defaultRuleEngine } from '../../src/lib/humanizer/ruleEngine';
import { validateInvariants } from '../../src/lib/pipeline/invariants';
import type { RewriteStrength } from '../../src/types';

describe('Contextual Rewriting and Rewrite Strength Validation (Tasks 2 & 3)', () => {
  describe('Contextual Minimal Pairs without Bleed', () => {
    it('rewrites target sentence under biological context without copying context into output', () => {
      const target = 'The cell required immediate maintenance.';
      const prevSentence = 'The virologist noticed abnormal viral replication in the mitochondria under the electron microscope.';
      const nextSentence = 'Subsequent genetic assays confirmed high metabolic viability.';

      const result = defaultRuleEngine.processSync(target, {
        mode: 'natural',
        rewriteStrength: 'balanced',
        prevSentence,
        nextSentence,
      });

      expect(result.improvedText).toBeDefined();
      expect(result.improvedText).not.toContain(prevSentence);
      expect(result.improvedText).not.toContain(nextSentence);
      expect(result.invariants?.numbersPreserved !== false).toBe(true);
    });

    it('rewrites target sentence under prison context without copying context into output', () => {
      const target = 'The cell required immediate maintenance.';
      const prevSentence = 'The prison warden conducted an emergency inspection of block C after the midnight riot.';
      const nextSentence = 'Correctional officers relocated the detainees before dawn.';

      const result = defaultRuleEngine.processSync(target, {
        mode: 'natural',
        rewriteStrength: 'balanced',
        prevSentence,
        nextSentence,
      });

      expect(result.improvedText).toBeDefined();
      expect(result.improvedText).not.toContain(prevSentence);
      expect(result.improvedText).not.toContain(nextSentence);
    });

    it('rewrites model stability under ML vs aerodynamic contexts cleanly', () => {
      const target = 'The model was stable.';
      const mlContext = 'During training epoch 150, the gradient norms converged to near-zero without divergence.';
      const aeroContext = 'Wind tunnel aerodynamic tests subjected the scale aircraft prototype to Mach 2.5 airflow.';

      const resMl = defaultRuleEngine.processSync(target, {
        mode: 'natural',
        rewriteStrength: 'balanced',
        prevSentence: mlContext,
      });

      const resAero = defaultRuleEngine.processSync(target, {
        mode: 'natural',
        rewriteStrength: 'balanced',
        prevSentence: aeroContext,
      });

      expect(resMl.improvedText).not.toContain(mlContext);
      expect(resAero.improvedText).not.toContain(aeroContext);
    });
  });

  describe('Five Rewrite Strength Levels Monotonicity & Invariants', () => {
    const aiText =
      'It is important to note that neural network convergence serves as a testament to algorithmic efficiency. Furthermore, we must delve into the multifaceted dynamics of gradient optimization, which plays a pivotal role in training stability.';

    const strengths: RewriteStrength[] = ['minimal', 'light', 'balanced', 'strong', 'extensive'];

    it('monotonically increases or maintains edits from minimal to extensive on AI-cliched prose', () => {
      const editCounts: number[] = [];

      for (const str of strengths) {
        const res = defaultRuleEngine.processSync(aiText, {
          mode: 'natural',
          rewriteStrength: str,
        });

        const inv = validateInvariants(aiText, res.improvedText);
        expect(inv.criticalViolation).toBe(false);
        editCounts.push(res.changes.length);
      }

      // Minimal should have fewer edits than extensive
      expect(editCounts[0]).toBeLessThanOrEqual(editCounts[1]);
      expect(editCounts[1]).toBeLessThanOrEqual(editCounts[4]);
      expect(editCounts[0]).toBeGreaterThan(0); // Fixed blatant clichés even on minimal
    });

    it('preserves clean authorial prose with 0 edits on minimal strength', () => {
      const cleanProse =
        'The laboratory verified the results last Tuesday. Most scientists accepted the conclusion without objection.';

      const resMinimal = defaultRuleEngine.processSync(cleanProse, {
        mode: 'natural',
        rewriteStrength: 'minimal',
        plan: { issuesToFix: [] } as any,
      });

      expect(resMinimal.improvedText.trim()).toBe(cleanProse.trim());
      expect(resMinimal.changes.length).toBe(0);
      expect(resMinimal.stats.reductionPercentage).toBe(0);
    });
  });
});
