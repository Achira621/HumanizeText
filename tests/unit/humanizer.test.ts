import { describe, it, expect } from 'vitest';
import { RuleBasedHumanizerEngine } from '../../src/lib/humanizer/ruleEngine';

describe('Humanizer Module — Deterministic Rule-Based Engine', () => {
  const engine = new RuleBasedHumanizerEngine();

  it('eliminates redundant filler in concise mode while preserving core facts', async () => {
    const input =
      'In order to analyze the data, due to the fact that the sample size was 500, we utilized modern methods.';
    const result = await engine.process(input, { mode: 'concise' });

    expect(result.improvedText).toContain('To analyze');
    expect(result.improvedText).toContain('because');
    expect(result.improvedText).toContain('used');
    expect(result.improvedText).toContain('500'); // factual number preserved
    expect(result.stats.reductionPercentage).toBeGreaterThan(0);
    expect(result.changes.length).toBeGreaterThanOrEqual(3);
  });

  it('replaces AI clichés in natural mode', async () => {
    const input = 'We will delve into the rich tapestry of historical evidence.';
    const result = await engine.process(input, { mode: 'natural' });

    expect(result.improvedText).not.toContain('delve into');
    expect(result.improvedText).not.toContain('tapestry of');
    expect(result.improvedText).toContain('examine');
    expect(result.improvedText).toContain('blend of');
  });

  it('applies conversational contractions in conversational mode', async () => {
    const input = 'It is evident that you do not need to worry, and we will not fail.';
    const result = await engine.process(input, { mode: 'conversational' });

    expect(result.improvedText).toContain("don't");
    expect(result.improvedText).toContain("won't");
    expect(result.improvedText).toContain("It's");
  });

  it('expands contractions and elevates colloquial slang in formal mode', async () => {
    const input = "We don't think the kids need a lot of stuff for the experiment.";
    const result = await engine.process(input, { mode: 'formal' });

    expect(result.improvedText).toContain('do not');
    expect(result.improvedText).toContain('children');
    expect(result.improvedText).toContain('numerous');
    expect(result.improvedText).toContain('materials');
  });

  it('safely handles empty input without error', async () => {
    const result = await engine.process('', { mode: 'natural' });
    expect(result.improvedText).toBe('');
    expect(result.changes).toHaveLength(0);
    expect(result.stats.originalWords).toBe(0);
  });
});
