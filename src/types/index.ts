export type DocumentFormat = 'txt' | 'md' | 'pdf' | 'docx' | 'raw';

export interface DocumentFile {
  id: string;
  name: string;
  format: DocumentFormat;
  size: number;
  text: string;
  wordCount: number;
  characterCount: number;
  createdAt: number;
  sha256Digest?: string;
  normalizedDigest?: string;
}

export interface DocumentDigest {
  rawSha256: string;
  normalizedSha256: string;
  rawByteLength: number;
  normalizedByteLength: number;
  computedAt: number;
}

export interface KeyedFingerprint {
  hash: string;
  shingleText: string;
  position: {
    startWord: number;
    endWord: number;
    startChar: number;
    endChar: number;
  };
}

export interface EncryptedPayload {
  version: 1;
  kdf: 'PBKDF2-SHA-256';
  iterations: number;
  saltHex: string;
  ivHex: string;
  cipherHex: string;
  authTagIncluded: true;
  createdAt: number;
  metadata: {
    id: string;
    title: string;
    originalSize: number;
    previewSummary: string;
  };
}

export interface VaultRecord {
  id: string;
  title: string;
  content: string;
  updatedAt: number;
  category?: 'draft' | 'submission' | 'reference';
}

export interface Shingle {
  text: string;
  startIndex: number;
  endIndex: number;
  words: string[];
}

export interface MatchSpan {
  submittedStartWord: number;
  submittedEndWord: number;
  submittedStartChar: number;
  submittedEndChar: number;
  referenceDocId: string;
  referenceDocName: string;
  referenceStartWord: number;
  referenceEndWord: number;
  referenceStartChar: number;
  referenceEndChar: number;
  passageText: string;
  fingerprintHash: string;
}

export interface ReconstructedPassage {
  id: string;
  submittedStartChar: number;
  submittedEndChar: number;
  referenceDocId: string;
  referenceDocName: string;
  referenceStartChar: number;
  referenceEndChar: number;
  matchedText: string;
  surroundingContext: string;
  shingleCount: number;
}

export interface SimilarityReport {
  sessionId: string;
  generatedAt: number;
  submittedDocumentName: string;
  submittedWordCount: number;
  submittedCharCount: number;
  referenceDocumentsCount: number;
  matchedPassagesCount: number;
  matchedWordsCount: number;
  estimatedOverlapPercentage: number;
  exactMatchesCount: number;
  passages: ReconstructedPassage[];
  referenceBreakdown: {
    referenceId: string;
    referenceName: string;
    matchedPassageCount: number;
    matchedWordCount: number;
    overlapPercentage: number;
  }[];
  formulaExplanation: string;
  limitationsNotice: string;
  integrityDigest: DocumentDigest;
    ephemeralKeyFingerprintSha256: string;
  semanticSimilarityScore?: number;
  matchingClassification?: 'original' | 'near-duplicate' | 'paraphrased' | 'significant-overlap';
  verifiedSourcesCount?: number;
}

export type HumanizerMode =
  | 'natural'
  | 'concise'
  | 'conversational'
  | 'formal'
  | 'flow';

export type VocabularyIntensity = 'conservative' | 'balanced' | 'dynamic' | 'maximum';

export interface DiffToken {
  id: string;
  text: string;
  type: 'unchanged' | 'changed' | 'structural' | 'frozen';
  original?: string;
  alternatives?: string[];
  reason?: string;
  category?: 'filler' | 'passive' | 'phrasing' | 'redundancy' | 'flow' | 'formality' | 'contraction' | 'frozen';
}

export interface AiSignalPhrase {
  id: string;
  phrase: string;
  start: number;
  end: number;
  explainer: string;
  category: string;
}

export * from './context';
import type { WritingContext, RewritePlan } from './context';

export interface HumanizerOptions {
  mode: HumanizerMode;
  targetReadingLevel?: 'general' | 'academic' | 'casual';
  preserveTechnicalTerms?: boolean;
  frozenWords?: string[];
  vocabularyIntensity?: VocabularyIntensity;
  tone?: 'conversational' | 'academic' | 'formal' | 'creative' | 'concise';
  smartContractions?: boolean;
  context?: Partial<WritingContext>;
  plan?: Partial<RewritePlan>;
  explicitInstructions?: string;
}

export type WritingIssueCategory =
  | 'grammar'
  | 'spelling'
  | 'clarity'
  | 'wordiness'
  | 'passive_voice'
  | 'tone'
  | 'split_sentence'
  | 'repetitive_words'
  | 'ai_cliche';

export interface WritingSuggestion {
  id: string;
  original: string;
  replacement: string;
  alternatives?: string[];
  explanation: string;
  category: WritingIssueCategory;
  severity: 'error' | 'warning' | 'suggestion';
  startChar: number;
  endChar: number;
  sentence?: string;
}

export interface WritingAnalysis {
  suggestions: WritingSuggestion[];
  readability: {
    fleschKincaidScore: number;
    gradeLevel: string;
    readingTimeMinutes: number;
    wordCount: number;
    sentenceCount: number;
    avgSentenceLength: number;
    tone: 'Confident' | 'Academic' | 'Conversational' | 'Formal' | 'Neutral';
  };
  aiProbability: number;
  burstinessScore: number;
  passiveSentenceCount: number;
}

export interface HumanizerChange {
  original: string;
  replacement: string;
  reason: string;
  category: 'filler' | 'passive' | 'phrasing' | 'redundancy' | 'flow' | 'formality' | 'contraction' | 'frozen';
  index: number;
  alternatives?: string[];
}

export interface HumanizerResult {
  originalText: string;
  improvedText: string;
  mode: HumanizerMode;
  changes: HumanizerChange[];
  diffTokens?: DiffToken[];
  stats: {
    originalWords: number;
    improvedWords: number;
    reductionPercentage: number;
    readingTimeSeconds: number;
  };
  engineName: string;
  engineType: 'deterministic-rules' | 'browser-ai-local' | 'cloud-api';
  processedLocally: boolean;
  context?: WritingContext;
  plan?: RewritePlan;
  executionEnvironment?: 'cloud-worker-ai' | 'local-emulation-fallback' | 'mock-test';
  fallbackTriggered?: boolean;
  mockEngine?: boolean;
  invariants?: {
    isValid: boolean;
    hasConfirmedFactualError: boolean;
    hasSemanticDriftWarning: boolean;
    numbersPreserved: boolean;
    citationsPreserved: boolean;
    quotesPreserved: boolean;
    urlsPreserved: boolean;
    negationsPreserved: boolean;
    hedgingPreserved: boolean;
    unitsPreserved: boolean;
    causalityPreserved: boolean;
  };
  document?: import('../lib/pipeline/documentModel').StructuredDocument;
  telemetry?: InferenceTelemetry;
}

export interface InferenceTelemetry {
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

export type {
  ContentBlockType,
  ContentBlock,
  StructuredDocument,
  StructuralValidationResult,
} from '../lib/pipeline/documentModel';

export interface LocalHumanizerEngine {
  readonly id: string;
  readonly name: string;
  readonly isAvailable: boolean;
  readonly requiresDownload: boolean;
  readonly downloadSizeMb?: number;
  process(text: string, options: HumanizerOptions): Promise<HumanizerResult>;
}

export interface NetworkRequestLog {
  id: string;
  timestamp: number;
  method: string;
  url: string;
  type: 'document-leak' | 'key-leak' | 'static-asset' | 'model-asset' | 'unknown';
  payloadPreview?: string;
  blocked: boolean;
}
