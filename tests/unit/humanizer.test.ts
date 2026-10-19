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

  it('preserves user-specified frozen words verbatim even if they are clichés', async () => {
    const input = 'We will delve into the rich tapestry of proprietary MachineLearning.';
    const result = await engine.process(input, {
      mode: 'natural',
      frozenWords: ['delve into', 'MachineLearning'],
    });

    // "delve into" was frozen, so it MUST remain verbatim
    expect(result.improvedText).toContain('delve into');
    expect(result.improvedText).toContain('MachineLearning');
    // "tapestry of" was NOT frozen, so it gets humanized
    expect(result.improvedText).not.toContain('tapestry of');

    const frozenTokens = result.diffTokens?.filter((t) => t.type === 'frozen');
    expect(frozenTokens?.length).toBeGreaterThanOrEqual(1);
  });

  it('generates interactive diff tokens with alternative synonyms', async () => {
    const input = 'We will delve into the rich tapestry of technology.';
    const result = await engine.process(input, { mode: 'natural' });

    expect(result.diffTokens).toBeDefined();
    expect(result.diffTokens!.length).toBeGreaterThan(0);

    const changedToken = result.diffTokens!.find((t) => t.type === 'changed');
    expect(changedToken).toBeDefined();
    expect(changedToken?.alternatives).toBeDefined();
    expect(changedToken!.alternatives!.length).toBeGreaterThan(0);
  });

  it('detects AI signals with explainers and spans', async () => {
    const { detectAiSignals } = await import('../../src/lib/humanizer/ruleEngine');
    const input = 'Furthermore, we must delve into the multifaceted nature of AI. In conclusion, it is crucial to note.';
    const signals = detectAiSignals(input);

    expect(signals.length).toBeGreaterThanOrEqual(3);
    const delveSignal = signals.find((s) => s.phrase.toLowerCase().includes('delve into'));
    expect(delveSignal).toBeDefined();
    expect(delveSignal?.explainer).toContain('delve into');
  });

  it('safely handles empty input without error', async () => {
    const result = await engine.process('', { mode: 'natural' });
    expect(result.improvedText).toBe('');
    expect(result.changes).toHaveLength(0);
    expect(result.stats.originalWords).toBe(0);
  });
});
