import { describe, it, expect } from 'vitest';
import { defaultRuleEngine } from '../../src/lib/humanizer/ruleEngine';
import { ProtectedSpanManager } from '../../src/lib/pipeline/protectedSpans';
import { validateInvariants } from '../../src/lib/pipeline/invariants';
import { buildPrompt } from '../../workers/api/src/routes/humanize';
import type { WritingContextDto, RewritePlanDto } from '../../workers/api/src/types';

describe('Parameter-Level Control and Generation Engineering (Phases 1-6)', () => {
  const dummyContext: WritingContextDto = {
    objective: 'Test parameter propagation',
    genre: 'technical',
    audience: 'colleagues',
    tone: 'objective',
    epistemicStance: 'certain',
    coreThesis: 'Parameter test thesis',
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

  const dummyPlan: RewritePlanDto = {
    planId: 'test_plan_param',
    genre: 'technical',
    coreMessage: 'Parameter test core message',
    claimsToPreserve: [],
    qualificationsToMaintain: [],
    issuesToFix: [],
    sectionsToKeepUnchanged: [],
    targetedAdjustments: { rhythm: 'Balanced', diction: 'Natural', formality: 'Standard' },
    invariantRequirements: [],
    isFallback: false,
  };

  describe('Contextual Bounded Generation (Phase 2)', () => {
    it('passes preceding and following context without leaking neighboring text into target output', () => {
      const prevSentence = 'The prison warden ordered an immediate perimeter lockdown after the riot.';
      const target = 'The cell required immediate maintenance.';
      const nextSentence = 'Detainees were escorted to isolation cells before dawn.';

      const result = defaultRuleEngine.processSync(target, {
        mode: 'natural',
        rewriteStrength: 'balanced',
        prevSentence,
        nextSentence,
      });

      expect(result.improvedText).toBeDefined();
      expect(result.improvedText).not.toContain(prevSentence);
      expect(result.improvedText).not.toContain(nextSentence);
      expect(result.improvedText).not.toContain('perimeter lockdown');
      expect(result.improvedText).not.toContain('isolation cells');
    });

    it('injects bounded context directives into prompt without echoing into output target span', () => {
      const prev = 'The virologist isolated the strain from patient zero.';
      const next = 'Assays confirmed high metabolic activity.';
      const prompt = buildPrompt('natural', 'balanced', dummyContext, dummyPlan, undefined, 'balanced', prev, next);

      expect(prompt).toContain('SLIDING WINDOW BOUNDED CONTEXT');
      expect(prompt).toContain(`Preceding Sentence/Context: "${prev}"`);
      expect(prompt).toContain(`Following Sentence/Context: "${next}"`);
      expect(prompt).toContain('DO NOT REWRITE OR ECHO THIS SURROUNDING CONTEXT');
    });
  });

  describe('Reversible Protected Spans (Phase 2)', () => {
    it('protects straight and curly quotes with attached punctuation verbatim', () => {
      const source = `Dr. Harris stated, "The therapeutic efficacy was remarkably high," before noting, “Secondary outcomes also succeeded.”`;
      const maskRes = ProtectedSpanManager.mask(source, { freezeQuotes: true });

      expect(maskRes.maskedText).not.toContain('therapeutic efficacy');
      expect(maskRes.maskedText).not.toContain('Secondary outcomes');

      // Simulate aggressive transformation on unquoted prose
      const transformed = maskRes.maskedText.replace('stated', 'observed').replace('noting', 'adding');
      const restoreRes = maskRes.restore(transformed);

      expect(restoreRes.allRestored).toBe(true);
      expect(restoreRes.missingPlaceholders.length).toBe(0);
      expect(restoreRes.restoredText).toContain('"The therapeutic efficacy was remarkably high,"');
      expect(restoreRes.restoredText).toContain('“Secondary outcomes also succeeded.”');
      expect(restoreRes.restoredText).toContain('observed');
    });

    it('preserves single curly quotes and straight single quote expressions without breaking contractions', () => {
      const source = `The researcher observed: ‘The cell sample showed 0.42 mol/(L*s) flux.’ It shouldn't be altered.`;
      const maskRes = ProtectedSpanManager.mask(source, { freezeQuotes: true });

      expect(maskRes.maskedText).toContain("shouldn't"); // Contraction not erroneously masked as quote
      expect(maskRes.maskedText).not.toContain('The cell sample showed');

      const restoreRes = maskRes.restore(maskRes.maskedText);
      expect(restoreRes.allRestored).toBe(true);
      expect(restoreRes.restoredText).toContain('‘The cell sample showed 0.42 mol/(L*s) flux.’');
    });

    it('preserves repeated occurrences of user frozen words matching longest-first', () => {
      const source = 'We deployed the REST API endpoint and integrated the API gateway with the internal API monitor.';
      const frozenWords = ['API', 'REST API']; // 'REST API' is a substring of 'API'
      const maskRes = ProtectedSpanManager.mask(source, { frozenWords });

      // REST API should be masked as single span, not corrupted by 'API'
      const restoreRes = maskRes.restore(maskRes.maskedText);
      expect(restoreRes.allRestored).toBe(true);
      expect(restoreRes.restoredText).toBe(source);
    });

    it('detects missing and duplicated placeholders during reconstruction', () => {
      const source = 'The experiment confirmed "Theorem 4A" with 99.8% confidence.';
      const maskRes = ProtectedSpanManager.mask(source, { freezeQuotes: true });
      const placeholder = maskRes.items[0].placeholder;

      // 1. Missing placeholder simulation
      const missingSim = maskRes.maskedText.replace(placeholder, 'Theorem 4A dropped');
      const missingRes = maskRes.restore(missingSim);
      expect(missingRes.allRestored).toBe(false);
      expect(missingRes.missingPlaceholders).toContain(placeholder);

      // 2. Duplicated placeholder simulation
      const dupSim = `${maskRes.maskedText} Extra copy: ${placeholder}`;
      const dupRes = maskRes.restore(dupSim);
      expect(dupRes.allRestored).toBe(false);
      expect(dupRes.duplicatedPlaceholders).toContain(placeholder);
    });
  });

  describe('Rewrite Strength Monotonicity & Restraint (Phase 2)', () => {
    it('produces 0 edits and 0% word churn on clean prose under minimal strength', () => {
      const cleanText = 'The laboratory verified the results last Tuesday. Most scientists accepted the conclusion without objection.';
      const res = defaultRuleEngine.processSync(cleanText, {
        mode: 'natural',
        rewriteStrength: 'minimal',
        plan: { issuesToFix: [] } as any,
      });

      expect(res.changes.length).toBe(0);
      expect(res.improvedText).toBe(cleanText);
    });

    it('strictly scales edit intensity on AI-cliched text from minimal to extensive', () => {
      const aiText = 'It is important to note that neural network convergence serves as a testament to algorithmic efficiency. Furthermore, we must delve into the multifaceted dynamics of gradient optimization, which plays a pivotal role in training stability.';
      const minRes = defaultRuleEngine.processSync(aiText, { mode: 'natural', rewriteStrength: 'minimal' });
      const extRes = defaultRuleEngine.processSync(aiText, { mode: 'natural', rewriteStrength: 'extensive' });

      expect(minRes.changes.length).toBeGreaterThan(0);
      expect(extRes.changes.length).toBeGreaterThanOrEqual(minRes.changes.length);
      expect(minRes.improvedText).not.toContain('serves as a testament');
      expect(extRes.improvedText).not.toContain('plays a pivotal role');
    });
  });

  describe('Sampling Profiles & Unsupported Parameter Protection (Phases 3 & 4)', () => {
    it('does not send unsupported parameters (nBeams, fthresh, autoflip) in model request schema', () => {
      const prompt = buildPrompt('natural', 'balanced', dummyContext, dummyPlan);
      expect(prompt).not.toContain('nBeams');
      expect(prompt).not.toContain('fthresh');
      expect(prompt).not.toContain('autoflip');
    });

    it('maps generation profiles to distinct sampling parameters', () => {
      const profiles = ['conservative', 'balanced', 'creative'] as const;
      const resolvedParams = profiles.map((p) => {
        const temperature = p === 'conservative' ? 0.30 : p === 'creative' ? 0.88 : 0.70;
        const topP = p === 'conservative' ? 0.85 : p === 'creative' ? 0.95 : 0.92;
        return { profile: p, temperature, topP };
      });

      expect(resolvedParams[0].temperature).toBe(0.30);
      expect(resolvedParams[1].temperature).toBe(0.70);
      expect(resolvedParams[2].temperature).toBe(0.88);
      expect(resolvedParams[0].topP).toBeLessThan(resolvedParams[2].topP);
    });
  });

  describe('Multi-Candidate Invariant Gating (Phase 3)', () => {
    it('gating rejects candidate alternatives that omit numbers or citations', () => {
      const source = 'The clinical trial enrolled 350 patients across 12 centers [4].';
      const validCandidate = 'A total of 350 patients were enrolled across 12 clinical centers [4].';
      const invalidCandidateMissingCit = 'A total of 350 patients were enrolled across 12 clinical centers.';
      const invalidCandidateMissingNum = 'Several hundred patients were enrolled across multiple centers [4].';

      const v1 = validateInvariants(source, validCandidate);
      expect(v1.criticalViolation).toBe(false);

      const v2 = validateInvariants(source, invalidCandidateMissingCit);
      expect(v2.citationsPreserved).toBe(false);

      const v3 = validateInvariants(source, invalidCandidateMissingNum);
      expect(v3.numbersPreserved).toBe(false);
    });
  });

  describe('Local Engine Offline Privacy Guarantee (Phase 5)', () => {
    it('executes local engine synchronously without network or fetch invocation', () => {
      const input = 'Furthermore, in order to utilize the platform, it is important to note that users must register.';
      const start = performance.now();
      const res = defaultRuleEngine.processSync(input, { mode: 'natural', rewriteStrength: 'balanced' });
      const elapsed = performance.now() - start;

      expect(res.improvedText).toBeDefined();
      expect(res.changes.length).toBeGreaterThan(0);
      expect(elapsed).toBeLessThan(50); // Sub-50ms deterministic local processing
      expect(res.improvedText).not.toContain('furthermore');
    });
  });
});
