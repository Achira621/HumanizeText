import { describe, it, expect } from 'vitest';
import { buildPrompt } from '../../workers/api/src/routes/humanize';
import type { WritingContextDto, RewritePlanDto } from '../../workers/api/src/types';

describe('Prompt Construction & WritingContext Specialization (Task 1)', () => {
  const baseContext: WritingContextDto = {
    objective: 'Humanize text while preserving facts',
    genre: 'general',
    audience: 'general-public',
    tone: 'formal',
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
    planId: 'plan_test_01',
    genre: 'general',
    coreMessage: 'General topic message',
    claimsToPreserve: [],
    qualificationsToMaintain: [],
    issuesToFix: [
      {
        type: 'ai_cliche',
        description: 'Remove overused cliché "delve into"',
        targetExcerpt: 'delve into',
      },
    ],
    sectionsToKeepUnchanged: [],
    targetedAdjustments: {
      rhythm: 'Standard sentence rhythm',
      diction: 'Standard diction',
      formality: 'Standard formality',
    },
    invariantRequirements: ['preserve_numbers'],
    isFallback: false,
  };

  it('generates distinct system instructions for academic vs conversational genres', () => {
    const academicContext: WritingContextDto = {
      ...baseContext,
      genre: 'academic',
      audience: 'domain-experts',
      tone: 'objective',
      epistemicStance: 'hedged',
    };
    const academicPlan: RewritePlanDto = {
      ...basePlan,
      genre: 'academic',
      targetedAdjustments: {
        rhythm: 'Retain syntactically sophisticated subordinate clauses',
        diction: 'Precise scientific terminology',
        formality: 'Maintain scholarly register',
      },
    };

    const conversationalContext: WritingContextDto = {
      ...baseContext,
      genre: 'conversational',
      audience: 'colleagues',
      tone: 'casual',
      epistemicStance: 'certain',
    };
    const conversationalPlan: RewritePlanDto = {
      ...basePlan,
      genre: 'conversational',
      targetedAdjustments: {
        rhythm: 'Dynamic, conversational cadence',
        diction: 'Authentic idiomatic rhythm',
        formality: 'Casual and warm',
      },
    };

    const academicPrompt = buildPrompt('formal', 'balanced', academicContext, academicPlan);
    const conversationalPrompt = buildPrompt('conversational', 'balanced', conversationalContext, conversationalPlan);

    // Validate material differentiation
    expect(academicPrompt).not.toEqual(conversationalPrompt);
    expect(academicPrompt).toContain('Target Genre: academic');
    expect(academicPrompt).toContain('scholarly register');
    expect(academicPrompt).toContain('Precise scientific terminology');

    expect(conversationalPrompt).toContain('Target Genre: conversational');
    expect(conversationalPrompt).toContain('natural contractions');
    expect(conversationalPrompt).toContain('Dynamic, conversational cadence');
  });

  it('injects epistemic hedging constraints when cautious hedging is detected', () => {
    const hedgedContext: WritingContextDto = {
      ...baseContext,
      genre: 'academic',
      epistemicStance: 'hedged',
      hedgingMarkers: ['tentatively suggests', 'may potentially'],
    };

    const promptWithHedging = buildPrompt('formal', 'balanced', hedgedContext, basePlan);
    expect(promptWithHedging).toContain('EPISTEMIC HEDGING CONSTRAINTS');
    expect(promptWithHedging).toContain('tentatively suggests, may potentially');
    expect(promptWithHedging).toContain('Do NOT convert tentative hypotheses or preliminary findings into absolute facts');

    const promptWithoutHedging = buildPrompt('formal', 'balanced', baseContext, basePlan);
    expect(promptWithoutHedging).not.toContain('EPISTEMIC HEDGING CONSTRAINTS');
  });

  it('injects polarity constraints when negative qualifications exist', () => {
    const negationContext: WritingContextDto = {
      ...baseContext,
      negationMarkers: ['does not guarantee', 'without checkpoints'],
    };

    const prompt = buildPrompt('natural', 'balanced', negationContext, basePlan);
    expect(prompt).toContain('POLARITY CONSTRAINTS');
    expect(prompt).toContain('Preserve all negative qualifications');
    expect(prompt).toContain('Never flip a negative statement into a positive claim');
  });

  it('injects verbatim frozen words constraints', () => {
    const frozen = ['Transformer', 'Kubernetes', 'p99'];
    const prompt = buildPrompt('natural', 'balanced', baseContext, basePlan, frozen);

    expect(prompt).toContain('CRITICAL - FROZEN WORDS TO PRESERVE VERBATIM');
    expect(prompt).toContain('Transformer, Kubernetes, p99');
    expect(prompt).toContain('Do NOT change, rephrase, or substitute');
  });

  it('injects core factual claims to preserve', () => {
    const planWithClaims: RewritePlanDto = {
      ...basePlan,
      claimsToPreserve: [
        'ARR expanded by 128% to $58.2 million',
        'Net operating cash flow did not turn positive',
      ],
    };

    const prompt = buildPrompt('natural', 'balanced', baseContext, planWithClaims);
    expect(prompt).toContain('CORE FACTUAL CLAIMS TO PRESERVE (DO NOT DISTORT OR OMIT)');
    expect(prompt).toContain('"ARR expanded by 128% to $58.2 million"');
    expect(prompt).toContain('"Net operating cash flow did not turn positive"');
  });

  it('applies minimal-edit high-quality directive when text has 0 writing issues', () => {
    const cleanPlan: RewritePlanDto = {
      ...basePlan,
      issuesToFix: [], // Clean prose!
    };

    const prompt = buildPrompt('natural', 'conservative', baseContext, cleanPlan);
    expect(prompt).toContain('HIGH-QUALITY PROSE DIRECTIVE');
    expect(prompt).toContain('Apply minimal, surgical edits only where strictly necessary');
    expect(prompt).not.toContain('TARGETED WRITING ISSUES TO REMOVE');
  });
});
