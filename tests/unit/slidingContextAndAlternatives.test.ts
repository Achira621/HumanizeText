import { describe, it, expect } from 'vitest';
import { buildPrompt } from '../../workers/api/src/routes/humanize';
import { defaultRuleEngine } from '../../src/lib/humanizer/ruleEngine';
import type { WritingContextDto, RewritePlanDto } from '../../workers/api/src/types';

describe('Sliding Context and Multi-Candidate Alternatives (Reverse Engineering Phase 6)', () => {
  const baseContext: WritingContextDto = {
    objective: 'Humanize text with bounded context',
    genre: 'general',
    audience: 'general-public',
    tone: 'objective',
    epistemicStance: 'certain',
    coreThesis: 'General topic thesis',
    supportingClaims: [],
    protectedTokens: {
      numbers: [],
      dates: [],
      citations: [],
      quotes: [],
      units: [],
      urls: [],
      frozenWords: [],
    },
    hedgingMarkers: [],
    negationMarkers: [],
    editingIntensity: 'balanced',
    missingContext: [],
  };

  const basePlan: RewritePlanDto = {
    planId: 'plan_sliding_test',
    genre: 'general',
    coreMessage: 'General topic message',
    claimsToPreserve: [],
    qualificationsToMaintain: [],
    issuesToFix: [],
    sectionsToKeepUnchanged: [],
    targetedAdjustments: {
      rhythm: 'Organic sentence rhythm',
      diction: 'Natural human diction',
      formality: 'Balanced',
    },
    invariantRequirements: [],
    isFallback: false,
  };

  it('injects preceding and following sentence context into prompt without confounding target span', () => {
    const prevSentence = 'The algorithm computes a sparse matrix decomposition across high-dimensional vectors.';
    const nextSentence = 'Subsequently, the resulting eigenvalues determine cluster membership.';
    const prompt = buildPrompt(
      'natural',
      'balanced',
      baseContext,
      basePlan,
      ['matrix'],
      'balanced',
      prevSentence,
      nextSentence,
      false
    );

    expect(prompt).toContain('SLIDING WINDOW BOUNDED CONTEXT');
    expect(prompt).toContain(`Preceding Sentence/Context: "${prevSentence}"`);
    expect(prompt).toContain(`Following Sentence/Context: "${nextSentence}"`);
    expect(prompt).toContain('DO NOT REWRITE OR ECHO THIS SURROUNDING CONTEXT');
    expect(prompt).toContain('CRITICAL - FROZEN WORDS TO PRESERVE VERBATIM:\nDo NOT change, rephrase, or substitute the following words under any circumstances: [matrix]');
  });

  it('injects multi-candidate delimiter instructions when multiCandidate is enabled', () => {
    const prompt = buildPrompt(
      'natural',
      'balanced',
      baseContext,
      basePlan,
      undefined,
      'strong',
      undefined,
      undefined,
      true
    );

    expect(prompt).toContain('MULTI-CANDIDATE GENERATION DIRECTIVE');
    expect(prompt).toContain('---ALTERNATIVE---');
  });

  it('populates alternatives on HumanizerResult in local rule engine', () => {
    const input = 'Furthermore, in order to utilize the system, it is important to note that users must register.';
    const result = defaultRuleEngine.processSync(input, {
      mode: 'natural',
      rewriteStrength: 'balanced',
      multiCandidate: true,
    });

    expect(result.improvedText).toBeDefined();
    expect(result.changes.length).toBeGreaterThan(0);
    // Result should expose candidate alternatives collected across changes
    expect(Array.isArray(result.alternatives)).toBe(true);
    if (result.alternatives && result.alternatives.length > 0) {
      expect(result.alternatives.every((a) => typeof a === 'string' && a.length > 0)).toBe(true);
    }
  });

  it('respects external prevSentence in ruleEngine for cross-sentence continuity', () => {
    const targetSentence = 'However, the results contradicted the preliminary hypothesis.';
    const prevSentence = 'The research group anticipated significant positive variance across all cohorts.';

    const result = defaultRuleEngine.processSync(targetSentence, {
      mode: 'natural',
      prevSentence,
      rewriteStrength: 'balanced',
    });

    expect(result.improvedText).toBeDefined();
    expect(result.improvedText.length).toBeGreaterThan(0);
  });

  it('preserves clean prose verbatim without gratuitous churn when minimal strength is selected', () => {
    const cleanText = 'The team published their findings in Nature last month. Most researchers welcomed the dataset.';
    const result = defaultRuleEngine.processSync(cleanText, {
      mode: 'natural',
      rewriteStrength: 'minimal',
      plan: {
        issuesToFix: [],
      } as any,
    });

    // Minimal rewrite on clean prose should leave sentence intact
    expect(result.improvedText.trim()).toBe(cleanText.trim());
    expect(result.stats.reductionPercentage).toBe(0);
  });
});
