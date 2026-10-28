// ============================================================================
// CLOUDFLARE WORKERS AI BACKEND — TYPE DEFINITIONS
// ============================================================================

export interface Ai {
  run(model: string, inputs: any, options?: any): Promise<any>;
}

export interface Env {
  AI: Ai;
  AI_TEXT_MODEL?: string;
  AI_FALLBACK_TEXT_MODEL?: string;
  AI_EMBEDDING_MODEL?: string;
  AI_FALLBACK_EMBEDDING_MODEL?: string;
  ALLOWED_ORIGINS?: string;
  MAX_INPUT_CHARS?: string;
  MAX_OUTPUT_TOKENS?: string;
  MAX_CONCURRENT_INFERENCE?: string;
  RATE_LIMIT_PER_MINUTE?: string;
}

export type WritingMode = 'natural' | 'concise' | 'conversational' | 'formal' | 'flow';
export type VocabularyIntensity = 'conservative' | 'balanced' | 'dynamic' | 'maximum';
export type RewriteStrength = 'minimal' | 'light' | 'balanced' | 'strong' | 'extensive';

export type AlternativeScope = 'document' | 'passage' | 'sentence' | 'phrase' | 'none';

export interface CandidateScoreBreakdown {
  grammarFluency: number;
  semanticPreservation: number;
  contextualFit: number;
  readabilityScore: number;
  conciseness: number;
  strengthAlignment: number;
  overallScore: number;
}

export interface AlternativeCandidate {
  id: string;
  text: string;
  scope: AlternativeScope;
  label?: string;
  isValid: boolean;
  validationWarnings?: string[];
  rejectionReason?: string;
  scoreBreakdown?: CandidateScoreBreakdown;
  rank?: number;
}

export interface TargetSpan {
  startIndex: number;
  endIndex: number;
  text: string;
  sentenceIndex?: number;
  blockId?: string;
}

export interface AlternativesMetadata {
  scope: AlternativeScope;
  candidates: AlternativeCandidate[];
  selectedIndex: number;
  originalTargetText?: string;
  sourceFingerprint?: string;
  targetSpan?: TargetSpan;
}

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

export interface ProtectedTokensDto {
  numbers: string[];
  dates: string[];
  citations: string[];
  quotes: string[];
  units: string[];
  urls: string[];
  frozenWords: string[];
}

export interface WritingContextDto {
  objective: string;
  genre: WritingGenre;
  audience: WritingAudience;
  tone: ToneRegister;
  epistemicStance: EpistemicStance;
  coreThesis: string;
  supportingClaims: string[];
  protectedTokens: ProtectedTokensDto;
  hedgingMarkers: string[];
  negationMarkers: string[];
  editingIntensity: VocabularyIntensity;
  explicitInstructions?: string;
  missingContext: string[];
}

export interface WritingIssueDto {
  type: 'wordiness' | 'ai_cliche' | 'stiff_transition' | 'monotonous_cadence' | 'redundancy' | 'passive_overuse';
  description: string;
  targetExcerpt?: string;
}

export interface RewritePlanDto {
  planId: string;
  genre: WritingGenre;
  coreMessage: string;
  claimsToPreserve: string[];
  qualificationsToMaintain: string[];
  issuesToFix: WritingIssueDto[];
  sectionsToKeepUnchanged: string[];
  targetedAdjustments: {
    rhythm: string;
    diction: string;
    formality: string;
  };
  invariantRequirements: string[];
  isFallback: boolean;
}

export type GenerationProfile = 'conservative' | 'balanced' | 'creative';

export interface HumanizerRequest {
  text: string;
  mode?: WritingMode;
  vocabularyIntensity?: VocabularyIntensity;
  rewriteStrength?: RewriteStrength;
  generationProfile?: GenerationProfile;
  temperature?: number;
  topP?: number;
  seed?: number;
  frozenWords?: string[];
  freezeQuotes?: boolean;
  smartContractions?: boolean;
  enableSemanticComparison?: boolean;
  context?: Partial<WritingContextDto>;
  plan?: Partial<RewritePlanDto>;
  prevSentence?: string;
  nextSentence?: string;
  multiCandidate?: boolean;
}

export interface DiffTokenDto {
  id: string;
  text: string;
  type: 'unchanged' | 'changed' | 'structural' | 'frozen';
  original?: string;
}

export interface InvariantsSummaryDto {
  numbersPreserved: boolean;
  citationsPreserved: boolean;
  quotesPreserved: boolean;
  urlsPreserved: boolean;
  negationsPreserved: boolean;
  hedgingPreserved: boolean;
  unitsPreserved: boolean;
  causalityPreserved?: boolean;
  hasConfirmedFactualError?: boolean;
  hasSemanticDriftWarning?: boolean;
  lengthRatio: number;
}

export interface HumanizerResponse {
  success: boolean;
  rewrittenText: string;
  mode: WritingMode;
  changesMade: boolean;
  preservationWarnings: string[];
  semanticSimilarity?: {
    score: number;
    status: 'high' | 'moderate' | 'low';
    advisory: string;
  };
  invariants: InvariantsSummaryDto;
  context?: WritingContextDto;
  plan?: RewritePlanDto;
  diffTokens?: DiffTokenDto[];
  alternatives?: string[];
  alternativesMetadata?: AlternativesMetadata;
  stats: {
    originalWords: number;
    improvedWords: number;
    reductionPercentage: number;
    readingTimeSeconds: number;
  };
  modelUsed: string;
  version: string;
  latencyMs: number;
  executionEnvironment?: 'cloud-worker-ai' | 'local-emulation-fallback' | 'mock-test';
  fallbackTriggered?: boolean;
  mockEngine?: boolean;
  timing?: {
    totalWorkerMs: number;
    inferenceMs?: number;
    repairMs?: number;
    embeddingMs?: number;
    overheadMs: number;
  };
  telemetry?: InferenceTelemetryDto;
}

export interface InferenceTelemetryDto {
  requestCount: number;
  successfulBlockRewrites: number;
  failedBlockRewrites: number;
  totalRetries: number;
  modelErrorsCount: number;
  concurrencyLimit: number;
  elapsedInferenceMs: number;
  modelUsed: string;
  fallbackTriggered: boolean;
  estimatedNeuronUsage?: number;
}

export interface CompareMeaningRequest {
  textA: string;
  textB: string;
}

export interface CompareMeaningResponse {
  success: boolean;
  similarityScore: number;
  status: 'high' | 'moderate' | 'low';
  advisory: string;
  chunksCompared: number;
  modelUsed: string;
  latencyMs: number;
}

export interface DetectRequest {
  text: string;
  modelId?: string;
}

export interface DetectResponse {
  success: boolean;
  score: {
    aiProbability: number;
    humanProbability: number;
    confidence: 'low' | 'moderate' | 'high';
    classification: 'likely-human' | 'inconclusive' | 'likely-ai';
    perplexityScore?: number;
    burstinessScore?: number;
  };
  wordCount: number;
  sentenceCount: number;
  signalsDetected: string[];
  modelUsed: string;
  latencyMs: number;
  timing?: {
    executionMs: number;
    overheadDescription: string;
  };
  methodologyNotice?: string;
}

export interface PlagiarismRequest {
  text: string;
  referenceCorpus?: Array<{ id: string; name: string; text: string }>;
  enableSemanticCheck?: boolean;
}

export interface PlagiarismResponse {
  success: boolean;
  overlapPercentage: number;
  matchedPassagesCount: number;
  matchedWordsCount: number;
  totalWordsCount: number;
  matchingClassification: 'original' | 'near-duplicate' | 'paraphrased' | 'significant-overlap';
  passages: Array<{
    matchedText: string;
    referenceName: string;
    wordCount: number;
  }>;
  semanticSimilarityScore?: number;
  sourceScopeNotice: string;
  latencyMs: number;
}
