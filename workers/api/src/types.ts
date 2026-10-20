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
  RATE_LIMIT_PER_MINUTE?: string;
}

export type WritingMode = 'natural' | 'concise' | 'conversational' | 'formal' | 'flow';
export type VocabularyIntensity = 'conservative' | 'balanced' | 'dynamic' | 'maximum';

export interface HumanizerRequest {
  text: string;
  mode?: WritingMode;
  vocabularyIntensity?: VocabularyIntensity;
  frozenWords?: string[];
  smartContractions?: boolean;
  enableSemanticComparison?: boolean;
}

export interface DiffTokenDto {
  id: string;
  text: string;
  type: 'unchanged' | 'changed' | 'structural' | 'frozen';
  original?: string;
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
  invariants: {
    numbersPreserved: boolean;
    citationsPreserved: boolean;
    quotesPreserved: boolean;
    lengthRatio: number;
  };
  diffTokens?: DiffTokenDto[];
  stats: {
    originalWords: number;
    improvedWords: number;
    reductionPercentage: number;
    readingTimeSeconds: number;
  };
  modelUsed: string;
  version: string;
  latencyMs: number;
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
