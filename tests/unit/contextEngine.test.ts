import { describe, it, expect } from 'vitest';
import {
  detectGenre,
  detectAudience,
  detectTone,
  detectEpistemicStance,
  analyzeWritingContext,
  buildRewritePlan,
  identifyWritingIssues,
  extractClaims,
} from '../../src/lib/pipeline/contextEngine';
import {
  validateWritingContext,
  validateRewritePlan,
} from '../../src/types/context';

describe('Phase 4: Context Engine & Writing Intelligence', () => {
  it('correctly detects academic genre and expert audience from citations and terminology', () => {
    const text = 'In accordance with empirical findings in [14], Miller et al. (2024) demonstrated statistically significant variance in syntactic distribution.';
    const genre = detectGenre(text);
    const audience = detectAudience(genre, text);
    const tone = detectTone(genre, text);

    expect(genre).toBe('academic');
    expect(audience).toBe('domain-experts');
    expect(tone).toBe('objective');
  });

  it('correctly detects technical genre from API and architectural parameters', () => {
    const text = 'The backend microservice exposes a REST API that deserializes JSON payloads, queries the SQL database, and optimizes endpoint latency.';
    const genre = detectGenre(text);
    expect(genre).toBe('technical');
  });

  it('correctly detects professional business genre from financial metrics', () => {
    const text = 'Our Series B financing allowed us to accelerate annual recurring ARR by 125% while delivering positive EBITDA to key stakeholders.';
    const genre = detectGenre(text);
    expect(genre).toBe('professional');
  });

  it('correctly detects conversational genre from personal narrative markers', () => {
    const text = "Honestly, my mom and I went for a walk after lunch and talked about how crazy the kids' weekend soccer tournament felt.";
    const genre = detectGenre(text);
    expect(genre).toBe('conversational');
  });

  it('detects epistemic stance as hedged when tentative language is present', () => {
    const hedges = ['suggests', 'may potentially', 'tentatively'];
    const negations = ['no'];
    const stance = detectEpistemicStance(hedges, negations);
    expect(stance).toBe('hedged');
  });

  it('identifies AI clichés, wordy prepositions, and stiff transitions as issues to fix', () => {
    const text = 'In order to delve into the tapestry of this ever-evolving landscape, furthermore, it is important to note that we must act now.';
    const issues = identifyWritingIssues(text);

    expect(issues.length).toBeGreaterThanOrEqual(3);
    expect(issues.some((i) => i.type === 'ai_cliche')).toBe(true);
    expect(issues.some((i) => i.type === 'wordiness')).toBe(true);
    expect(issues.some((i) => i.type === 'stiff_transition')).toBe(true);
  });

  it('extracts core thesis and factual claims from passage', () => {
    const text = 'Global electric vehicle adoption grew by 42% in 2024 according to industry data. Tesla and BYD delivered 3.5 million units combined across 12 primary markets. In conclusion, battery manufacturing capacity expanded rapidly.';
    const { thesis, claims } = extractClaims(text);

    expect(thesis).toContain('electric vehicle adoption');
    expect(claims.length).toBeGreaterThanOrEqual(1);
    expect(claims[0]).toContain('3.5 million');
  });

  it('constructs a complete RewritePlan with invariant requirements and genre adjustments', () => {
    const text = 'Miller et al. (2024) noted that "syntactic homogeneity is common" in synthetic drafts, with 50mg doses tested on October 15, 2025. Data tentatively suggests this may hold true.';
    const context = analyzeWritingContext(text, { genre: 'academic' });
    const plan = buildRewritePlan(context, text);

    expect(plan.genre).toBe('academic');
    expect(plan.sectionsToKeepUnchanged).toContain('syntactic homogeneity is common');
    expect(plan.targetedAdjustments.formality).toContain('scholarly register');
    expect(plan.invariantRequirements.some((r) => r.includes('verbatim'))).toBe(true);
    expect(plan.invariantRequirements.some((r) => r.includes('hedges'))).toBe(true);
    expect(plan.isFallback).toBe(false);
  });

  it('validates and safely normalizes partial or malformed WritingContext and RewritePlan', () => {
    const contextRes = validateWritingContext({
      genre: 'invalid_genre',
      editingIntensity: 'unknown_intensity',
    });
    expect(contextRes.isValid).toBe(true);
    expect(contextRes.data.genre).toBe('general');
    expect(contextRes.data.editingIntensity).toBe('balanced');
    expect(contextRes.data.protectedTokens.numbers).toEqual([]);

    const planRes = validateRewritePlan({
      issuesToFix: null,
    });
    expect(planRes.isValid).toBe(true);
    expect(planRes.data.issuesToFix).toEqual([]);
    expect(planRes.data.planId).toBeDefined();
  });

  it('activates conservative fallback flag for short or fragmented input', () => {
    const shortText = 'Quick note on plans.';
    const context = analyzeWritingContext(shortText);
    const plan = buildRewritePlan(context, shortText);

    expect(context.missingContext).toContain('short_passage_limited_discourse');
    expect(plan.isFallback).toBe(true);
  });
});
