// ============================================================================
// PHASE 4: CONTEXT ENGINE & COORDINATED WRITING INTELLIGENCE SCHEMAS
// Strongly-typed definitions for WritingContext, RewritePlan, and Invariant gates.
// ============================================================================

export type WritingGenre =
  | 'academic'
  | 'technical'
  | 'professional'
  | 'conversational'
  | 'creative'
  | 'general';

export type WritingAudience =
  | 'general-public'
  | 'domain-experts'
  | 'business-executives'
  | 'students'
  | 'colleagues';

export type ToneRegister =
  | 'formal'
  | 'objective'
  | 'engaging'
  | 'persuasive'
  | 'casual'
  | 'authoritative';

export type EpistemicStance =
  | 'certain'
  | 'hedged'
  | 'exploratory'
  | 'skeptical';

export type EditingIntensity =
  | 'conservative'
  | 'balanced'
  | 'dynamic'
  | 'maximum';

export interface ProtectedTokens {
  numbers: string[];
  dates: string[];
  citations: string[];
  quotes: string[];
  units: string[];
  urls: string[];
  frozenWords: string[];
}

export interface WritingContext {
  /** High-level purpose of the rewrite */
  objective: string;
  /** Primary writing genre */
  genre: WritingGenre;
  /** Intended target readership */
  audience: WritingAudience;
  /** Expressive register and tone */
  tone: ToneRegister;
  /** Degree of certainty / qualification expressed in source */
  epistemicStance: EpistemicStance;
  /** Core thesis statement extracted or supplied */
  coreThesis: string;
  /** Specific factual assertions or arguments to preserve */
  supportingClaims: string[];
  /** Verbatim tokens that must not be altered */
  protectedTokens: ProtectedTokens;
  /** Epistemic hedge terms extracted from source (e.g. "suggests", "may", "potentially") */
  hedgingMarkers: string[];
  /** Negation structures to preserve (to prevent polarity flips) */
  negationMarkers: string[];
  /** Editing depth requested */
  editingIntensity: EditingIntensity;
  /** Explicit 5-level user rewrite strength */
  rewriteStrength?: 'minimal' | 'light' | 'balanced' | 'strong' | 'extensive';
  /** Optional sliding-window sentence context (QuillBot prevSentence / nextSentence architecture) */
  prevSentence?: string;
  nextSentence?: string;
  /** Optional explicit user instructions */
  explicitInstructions?: string;
  /** Flags for missing or ambiguous context (e.g., "author_intent_unspecified") */
  missingContext: string[];
}

export interface WritingIssue {
  type: 'wordiness' | 'ai_cliche' | 'stiff_transition' | 'monotonous_cadence' | 'redundancy' | 'passive_overuse';
  description: string;
  targetExcerpt?: string;
}

export interface RewritePlan {
  /** Unique plan identifier */
  planId: string;
  /** Confirmed writing genre */
  genre: WritingGenre;
  /** Core message that must remain unchanged in substance */
  coreMessage: string;
  /** Claims and propositions that must be preserved */
  claimsToPreserve: string[];
  /** Epistemic hedges that must NOT be converted to absolute assertions */
  qualificationsToMaintain: string[];
  /** Specific detected issues to fix */
  issuesToFix: WritingIssue[];
  /** Passages, quotes, or formulas to leave completely untouched */
  sectionsToKeepUnchanged: string[];
  /** Targeted prose adjustments */
  targetedAdjustments: {
    rhythm: string;
    diction: string;
    formality: string;
  };
  /** Explicit invariant conditions post-generation must satisfy */
  invariantRequirements: string[];
  /** True if context extraction was limited and a conservative fallback plan was used */
  isFallback: boolean;
}

export interface ContextValidationResult<T> {
  isValid: boolean;
  errors: string[];
  data: T;
}

/**
 * Validates and normalizes WritingContext with safe defaults.
 */
export function validateWritingContext(input: unknown): ContextValidationResult<WritingContext> {
  const errors: string[] = [];
  const raw = (typeof input === 'object' && input !== null ? input : {}) as Record<string, any>;

  const validGenres: WritingGenre[] = ['academic', 'technical', 'professional', 'conversational', 'creative', 'general'];
  const genre: WritingGenre = validGenres.includes(raw.genre) ? raw.genre : 'general';

  const validAudiences: WritingAudience[] = ['general-public', 'domain-experts', 'business-executives', 'students', 'colleagues'];
  const audience: WritingAudience = validAudiences.includes(raw.audience) ? raw.audience : 'general-public';

  const validTones: ToneRegister[] = ['formal', 'objective', 'engaging', 'persuasive', 'casual', 'authoritative'];
  const tone: ToneRegister = validTones.includes(raw.tone) ? raw.tone : 'objective';

  const validStances: EpistemicStance[] = ['certain', 'hedged', 'exploratory', 'skeptical'];
  const epistemicStance: EpistemicStance = validStances.includes(raw.epistemicStance) ? raw.epistemicStance : 'certain';

  const validIntensities: EditingIntensity[] = ['conservative', 'balanced', 'dynamic', 'maximum'];
  const editingIntensity: EditingIntensity = validIntensities.includes(raw.editingIntensity) ? raw.editingIntensity : 'balanced';

  const protectedTokens: ProtectedTokens = {
    numbers: Array.isArray(raw.protectedTokens?.numbers) ? raw.protectedTokens.numbers.filter((x: any) => typeof x === 'string') : [],
    dates: Array.isArray(raw.protectedTokens?.dates) ? raw.protectedTokens.dates.filter((x: any) => typeof x === 'string') : [],
    citations: Array.isArray(raw.protectedTokens?.citations) ? raw.protectedTokens.citations.filter((x: any) => typeof x === 'string') : [],
    quotes: Array.isArray(raw.protectedTokens?.quotes) ? raw.protectedTokens.quotes.filter((x: any) => typeof x === 'string') : [],
    units: Array.isArray(raw.protectedTokens?.units) ? raw.protectedTokens.units.filter((x: any) => typeof x === 'string') : [],
    urls: Array.isArray(raw.protectedTokens?.urls) ? raw.protectedTokens.urls.filter((x: any) => typeof x === 'string') : [],
    frozenWords: Array.isArray(raw.protectedTokens?.frozenWords) ? raw.protectedTokens.frozenWords.filter((x: any) => typeof x === 'string') : [],
  };

  const context: WritingContext = {
    objective: typeof raw.objective === 'string' && raw.objective.trim() ? raw.objective.trim() : 'Improve human cadence and readability while preserving core intent',
    genre,
    audience,
    tone,
    epistemicStance,
    coreThesis: typeof raw.coreThesis === 'string' ? raw.coreThesis : '',
    supportingClaims: Array.isArray(raw.supportingClaims) ? raw.supportingClaims.filter((c: any) => typeof c === 'string') : [],
    protectedTokens,
    hedgingMarkers: Array.isArray(raw.hedgingMarkers) ? raw.hedgingMarkers.filter((h: any) => typeof h === 'string') : [],
    negationMarkers: Array.isArray(raw.negationMarkers) ? raw.negationMarkers.filter((n: any) => typeof n === 'string') : [],
    editingIntensity,
    explicitInstructions: typeof raw.explicitInstructions === 'string' ? raw.explicitInstructions : undefined,
    missingContext: Array.isArray(raw.missingContext) ? raw.missingContext.filter((m: any) => typeof m === 'string') : [],
  };

  return {
    isValid: errors.length === 0,
    errors,
    data: context,
  };
}

/**
 * Validates and normalizes RewritePlan.
 */
export function validateRewritePlan(input: unknown): ContextValidationResult<RewritePlan> {
  const errors: string[] = [];
  const raw = (typeof input === 'object' && input !== null ? input : {}) as Record<string, any>;

  const validGenres: WritingGenre[] = ['academic', 'technical', 'professional', 'conversational', 'creative', 'general'];
  const genre: WritingGenre = validGenres.includes(raw.genre) ? raw.genre : 'general';

  const plan: RewritePlan = {
    planId: typeof raw.planId === 'string' && raw.planId ? raw.planId : `plan_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    genre,
    coreMessage: typeof raw.coreMessage === 'string' && raw.coreMessage ? raw.coreMessage : 'Preserve author core message without distortion',
    claimsToPreserve: Array.isArray(raw.claimsToPreserve) ? raw.claimsToPreserve.filter((c: any) => typeof c === 'string') : [],
    qualificationsToMaintain: Array.isArray(raw.qualificationsToMaintain) ? raw.qualificationsToMaintain.filter((q: any) => typeof q === 'string') : [],
    issuesToFix: Array.isArray(raw.issuesToFix) ? raw.issuesToFix : [],
    sectionsToKeepUnchanged: Array.isArray(raw.sectionsToKeepUnchanged) ? raw.sectionsToKeepUnchanged.filter((s: any) => typeof s === 'string') : [],
    targetedAdjustments: {
      rhythm: typeof raw.targetedAdjustments?.rhythm === 'string' ? raw.targetedAdjustments.rhythm : 'Vary sentence lengths naturally',
      diction: typeof raw.targetedAdjustments?.diction === 'string' ? raw.targetedAdjustments.diction : 'Eliminate robotic formulaic markers',
      formality: typeof raw.targetedAdjustments?.formality === 'string' ? raw.targetedAdjustments.formality : 'Match specified genre register',
    },
    invariantRequirements: Array.isArray(raw.invariantRequirements) ? raw.invariantRequirements.filter((i: any) => typeof i === 'string') : [],
    isFallback: Boolean(raw.isFallback),
  };

  return {
    isValid: errors.length === 0,
    errors,
    data: plan,
  };
}
