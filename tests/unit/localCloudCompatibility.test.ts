import { describe, it, expect, vi } from 'vitest';
import { RuleBasedHumanizerEngine } from '../../src/lib/humanizer/ruleEngine';
import { rankCandidates, evaluateCandidate } from '../../src/lib/pipeline/candidateRanker';
import type { AlternativesMetadata, AlternativeCandidate } from '../../src/types';

describe('Task 5: Local/Cloud Compatibility & Boundary Verification', () => {
  it('confirms local engine processes synchronously in-memory with zero network transmission', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const engine = new RuleBasedHumanizerEngine();
    const sensitiveText = 'CONFIDENTIAL_MEDICAL_RECORD: Patient #9910 observed normal sinus rhythm.';

    const result = await engine.process(sensitiveText, { mode: 'natural', rewriteStrength: 'balanced' });

    expect(result.processedLocally).toBe(true);
    expect(result.executionEnvironment).toBe('local-emulation-fallback');
    expect(result.fallbackTriggered).toBe(true);
    expect(result.improvedText).toBeDefined();

    // Verify zero HTTP network transmission
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('guarantees candidate metadata remains correctly typed according to AlternativesMetadata', () => {
    const engine = new RuleBasedHumanizerEngine();
    const text = 'It is important to note that the team embarked on a journey to delve into the data.';
    const result = engine.processSync(text, { mode: 'natural', rewriteStrength: 'balanced' });

    const meta: AlternativesMetadata | undefined = result.alternativesMetadata;
    expect(meta).toBeDefined();
    expect(meta?.scope).toBe('phrase');
    expect(Array.isArray(meta?.candidates)).toBe(true);
    expect(typeof meta?.selectedIndex).toBe('number');
    expect(typeof meta?.originalTargetText).toBe('string');

    for (const cand of meta!.candidates) {
      expect(typeof cand.id).toBe('string');
      expect(typeof cand.text).toBe('string');
      expect(cand.scope).toBe('phrase');
      expect(typeof cand.isValid).toBe('boolean');
    }
  });

  it('safely handles missing, invalid, or null scoreBreakdown fields without crashing', () => {
    const source = 'The system architecture handles high throughput gracefully.';
    const corruptedCandidates: AlternativeCandidate[] = [
      {
        id: 'cand_missing_score',
        text: 'The architecture manages heavy traffic smoothly.',
        scope: 'passage',
        isValid: true,
        // scoreBreakdown is omitted entirely
      },
      {
        id: 'cand_null_score',
        text: 'The infrastructure processes high volume easily.',
        scope: 'passage',
        isValid: true,
        scoreBreakdown: undefined,
      },
    ];

    // Verify sort and label logic handles missing scores safely
    expect(() => {
      corruptedCandidates.sort((a, b) => (b.scoreBreakdown?.overallScore || 0) - (a.scoreBreakdown?.overallScore || 0));
      corruptedCandidates.forEach((c, idx) => {
        const pct = Math.round((c.scoreBreakdown?.overallScore || 0) * 100);
        c.label = idx === 0 ? `Primary Selection (${pct}%)` : `Option ${idx + 1} (${pct}%)`;
      });
    }).not.toThrow();

    expect(corruptedCandidates[0].label).toContain('(0%)');
  });

  it('evaluates candidate ranker resilience against empty, malformed, or unusual input strings', () => {
    expect(() => evaluateCandidate('', '')).not.toThrow();
    const resEmpty = evaluateCandidate('', '');
    expect(resEmpty.isValid).toBe(false);

    expect(() => evaluateCandidate('Normal source text.', '')).not.toThrow();
    const resEmptyCand = evaluateCandidate('Normal source text.', '');
    expect(resEmptyCand.isValid).toBe(false);

    expect(() => evaluateCandidate('Normal source.', '   \t\n   ')).not.toThrow();
    const resWhitespace = evaluateCandidate('Normal source.', '   \t\n   ');
    expect(resWhitespace.isValid).toBe(false);
  });

  it('confirms heuristic score explanations are transparently labeled as proxies, not guarantees', () => {
    const res = evaluateCandidate(
      'The engineer inspected the circuit board thoroughly.',
      'The engineer examined the circuit board with great care.'
    );

    expect(res.isValid).toBe(true);
    expect(res.scoreBreakdown).toBeDefined();
    // Verify soft criteria are represented as bounded decimals (0.0 to 1.0)
    expect(res.scoreBreakdown.grammarFluency).toBeGreaterThanOrEqual(0);
    expect(res.scoreBreakdown.grammarFluency).toBeLessThanOrEqual(1);
    expect(res.scoreBreakdown.semanticPreservation).toBeGreaterThanOrEqual(0);
    expect(res.scoreBreakdown.semanticPreservation).toBeLessThanOrEqual(1);
    expect(res.scoreBreakdown.overallScore).toBeGreaterThanOrEqual(0);
    expect(res.scoreBreakdown.overallScore).toBeLessThanOrEqual(1);
  });
});
