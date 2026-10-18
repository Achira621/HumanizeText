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
}

export type HumanizerMode =
  | 'natural'
  | 'concise'
  | 'conversational'
  | 'formal'
  | 'flow';

export interface HumanizerOptions {
  mode: HumanizerMode;
  targetReadingLevel?: 'general' | 'academic' | 'casual';
  preserveTechnicalTerms?: boolean;
}

export interface HumanizerChange {
  original: string;
  replacement: string;
  reason: string;
  category: 'filler' | 'passive' | 'phrasing' | 'redundancy' | 'flow' | 'formality';
  index: number;
}

export interface HumanizerResult {
  originalText: string;
  improvedText: string;
  mode: HumanizerMode;
  changes: HumanizerChange[];
  stats: {
    originalWords: number;
    improvedWords: number;
    reductionPercentage: number;
    readingTimeSeconds: number;
  };
  engineName: string;
  engineType: 'deterministic-rules' | 'browser-ai-local';
  processedLocally: true;
}

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
