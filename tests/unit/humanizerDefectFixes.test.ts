import { describe, it, expect } from 'vitest';
import { RuleBasedHumanizerEngine } from '../../src/lib/humanizer/ruleEngine';

describe('Humanizer Defect Fixes & Regression Suite (Post-Evaluation Sprint)', () => {
  const engine = new RuleBasedHumanizerEngine();

  it('Defect 1 Regression: eliminates regex capture corruption in "in the realm of" without emitting "$1"', async () => {
    const input =
      'In the realm of genomic engineering, CRISPR-Cas9 technology stands as a beacon of biomedical advancement.';
    const result = await engine.process(input, {
      mode: 'formal',
      rewriteStrength: 'balanced',
    });

    // Must NOT contain "$1" or corrupted token fragments
    expect(result.improvedText).not.toContain('$1');
    expect(result.improvedText).not.toMatch(/\benomic\b/); // No standalone truncated word
    expect(result.improvedText).toContain('genomic engineering');
    expect(result.improvedText).toContain('CRISPR-Cas9');
    expect(result.improvedText).toMatch(/^(?:In|Within|Across) genomic engineering/);
  });

  it('Defect 2 Regression: safely normalizes unmapped or legacy modes ("standard", "casual") to valid modes', async () => {
    const input =
      'It is important to note that neural network convergence serves as a testament to gradient descent efficiency.';
    const result = await engine.process(input, {
      mode: 'standard' as any,
      rewriteStrength: 'balanced',
    });

    // Should not silently bypass transformations
    expect(result.changes.length).toBeGreaterThanOrEqual(1);
    expect(result.improvedText).not.toContain('It is important to note that');
    expect(result.improvedText).toContain('neural network convergence');
    expect(result.improvedText).toContain('gradient descent');
  });

  it('Defect 3 Regression: simplifies clumsy prepositional chains into active monitoring syntax', async () => {
    const input =
      'The implementation of the monitoring of the status of the clusters in the data center by the operations team occurred on Tuesday.';
    const result = await engine.process(input, {
      mode: 'natural',
      rewriteStrength: 'balanced',
    });

    expect(result.improvedText).toContain('The operations team started monitoring the clusters in the data center on Tuesday.');
    expect(result.improvedText).not.toContain('The implementation of the monitoring of');
  });

  it('Defect 3 Regression: eliminates double passive bureaucratic phrasing in oversight investigations', async () => {
    const input =
      'It was determined by the regional oversight committee that an investigation should be conducted by outside legal counsel into the $2.4M discrepancy.';
    const result = await engine.process(input, {
      mode: 'natural',
      rewriteStrength: 'balanced',
    });

    expect(result.improvedText).toContain('The regional oversight committee directed outside legal counsel to investigate');
    expect(result.improvedText).toContain('$2.4M');
    expect(result.improvedText).not.toContain('It was determined by');
  });

  it('Defect 3 Regression: purges wordy pleonasms and tautologies', async () => {
    const input =
      'At this present point in time, we must combine together all past historical records into an advance preview before making a final end decision.';
    const result = await engine.process(input, {
      mode: 'natural',
      rewriteStrength: 'balanced',
    });

    expect(result.improvedText).not.toContain('At this present point in time');
    expect(result.improvedText).not.toContain('combine together');
    expect(result.improvedText).not.toContain('past historical');
    expect(result.improvedText).not.toContain('final end decision');
    expect(result.improvedText).toContain('combine');
    expect(result.improvedText).toContain('final decision');
  });
});
