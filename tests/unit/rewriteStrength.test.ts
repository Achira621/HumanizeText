import { describe, it, expect } from 'vitest';
import { RuleBasedHumanizerEngine } from '../../src/lib/humanizer/ruleEngine';
import type { RewriteStrength } from '../../src/types';

describe('Rewrite Strength Control & Failure Analysis Verifications (Parts 4 & 5)', () => {
  const engine = new RuleBasedHumanizerEngine();

  // Test prose with typical formulaic AI markers
  const roboticProse =
    'It is important to note that neural network convergence serves as a testament to gradient descent efficiency. Furthermore, we must delve into the multifaceted dynamics of stochastic optimization, which plays a pivotal role in training stability. The empirical loss decreased to 0.042 across 1,500 training epochs.';

  // Already-clear human prose without clichés
  const cleanHumanProse =
    'Our team tested three different learning rates on the cluster yesterday. The lowest rate took twice as long to converge, but the validation loss was noticeably more stable.';

  it('demonstrates that "minimal" rewrite strength strictly preserves wording on clean prose without unnecessary edits', async () => {
    const result = await engine.process(cleanHumanProse, {
      mode: 'natural',
      rewriteStrength: 'minimal',
    });

    // Minimal mode on clean text should make zero changes
    expect(result.changes.length).toBe(0);
    expect(result.improvedText).toBe(cleanHumanProse);
  });

  it('demonstrates that "minimal" fixes blatant AI clichés while preserving overall sentence construction', async () => {
    const result = await engine.process(roboticProse, {
      mode: 'natural',
      rewriteStrength: 'minimal',
    });

    // Blatant clichés fixed
    expect(result.improvedText).not.toContain('serves as a testament to');
    expect(result.improvedText).not.toContain('delve into');
    expect(result.improvedText).not.toContain('plays a pivotal role');
    // Numbers preserved exactly
    expect(result.improvedText).toContain('0.042');
    expect(result.improvedText).toContain('1,500');

    // In minimal mode, changes are surgical
    expect(result.changes.length).toBeGreaterThanOrEqual(1);
  });

  it('proves monotonically non-decreasing change intensity across the five strength levels', async () => {
    const strengths: RewriteStrength[] = ['minimal', 'light', 'balanced', 'strong', 'extensive'];
    const changeCounts: number[] = [];

    for (const strength of strengths) {
      const res = await engine.process(roboticProse, {
        mode: 'natural',
        rewriteStrength: strength,
      });
      changeCounts.push(res.changes.length);
    }

    // Monotonicity: minimal <= light <= balanced <= strong <= extensive
    for (let i = 1; i < changeCounts.length; i++) {
      expect(changeCounts[i]).toBeGreaterThanOrEqual(changeCounts[i - 1]);
    }
  });

  it('proves that "extensive" strength permits broader restructuring while strictly enforcing factual and citation invariants', async () => {
    const textWithInvariants =
      'In today’s fast-paced world, CRISPR-Cas9 technology stands as a beacon of biomedical advancement. In order to evaluate off-target cutting frequencies, researchers conducted deep sequencing across 25 target loci, demonstrating a precision threshold of 99.4% [12].';

    const result = await engine.process(textWithInvariants, {
      mode: 'natural',
      rewriteStrength: 'extensive',
      freezeQuotes: true,
    });

    // Clichés removed
    expect(result.improvedText).not.toContain('in today’s fast-paced world');
    expect(result.improvedText).not.toContain('stands as a beacon of');

    // Hard invariants strictly preserved under extensive restructuring
    expect(result.improvedText).toContain('CRISPR-Cas9');
    expect(result.improvedText).toContain('25');
    expect(result.improvedText).toContain('99.4%');
    expect(result.improvedText).toContain('[12]');
  });

  it('verifies conversational mode produces natural idioms rather than stiff academic or corporate replacements', async () => {
    const conversationalText =
      'In today’s fast-paced world, staying consistent with daily workouts is easier said than done. If you do not schedule your runs, you will not stick with them.';

    const result = await engine.process(conversationalText, {
      mode: 'conversational',
      rewriteStrength: 'balanced',
    });

    // Should NOT inject clinical or corporate jargon like "In modern practice" or "Across current workflows"
    expect(result.improvedText).not.toContain('In modern practice');
    expect(result.improvedText).not.toContain('Across current workflows');

    // Should use natural conversational contractions and starters
    expect(result.improvedText).toMatch(/\b(?:don't|won't)\b/);
    expect(result.improvedText).not.toContain('In today’s fast-paced world');
  });

  it('verifies cross-paragraph sliding window continuity in multi-paragraph documents', async () => {
    const multiParagraphText =
      'The primary cluster nodes experienced transient CPU throttling during peak ingestion.\n\nHowever, the secondary standby cluster failed over cleanly within 18 seconds.\n\nHowever, the operator dashboard remained green throughout the incident.';

    const result = await engine.process(multiParagraphText, {
      mode: 'flow',
      rewriteStrength: 'balanced',
    });

    // Paragraph breaks MUST be preserved
    expect(result.improvedText).toContain('\n\n');
    const paragraphs = result.improvedText.split('\n\n');
    expect(paragraphs.length).toBe(3);

    // Redundant consecutive "However" transitions across paragraphs should be eliminated
    const para2StartsWithHowever = /^However/i.test(paragraphs[1].trim());
    const para3StartsWithHowever = /^However/i.test(paragraphs[2].trim());
    // Both paragraphs 2 and 3 should not consecutively start with "However"
    expect(para2StartsWithHowever && para3StartsWithHowever).toBe(false);
  });
});
