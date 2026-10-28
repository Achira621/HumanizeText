// ============================================================================
// HYBRID AI DETECTION PLATFORM — CORE TYPE DEFINITIONS
// ============================================================================

export type ModelType = 'text-detection' | 'image-detection';

export type ModelLifecycleState =
  | 'NOT_INSTALLED'
  | 'CONSENT_REQUIRED'
  | 'QUEUED'
  | 'DOWNLOADING'
  | 'PAUSED'
  | 'VERIFYING'
  | 'READY'
  | 'LOADING'
  | 'LOADED'
  | 'UPDATE_AVAILABLE'
  | 'FAILED'
  | 'UNSUPPORTED'
  | 'STORAGE_ERROR';

export type InferenceMode = 'local' | 'server';

export interface ModelArtifact {
  name: string;
  url: string;
  sizeBytes: number;
  sha256Hex: string;
}

export interface ModelManifest {
  modelId: string;
  version: string;
  type: ModelType;
  displayName: string;
  description: string;
  license: string;
  author: string;
  sourceUrl: string;
  compatibleAppVersion: string;
  expectedRuntime: 'wasm' | 'webgpu' | 'webworker';
  totalSizeBytes: number;
  requiredMemoryMb: number;
  artifacts: ModelArtifact[];
  supportedInputTypes: string[];
  maxInputLength?: number;
  maxDimensions?: { width: number; height: number };
  calibrationNotice: string;
}

export interface ModelDownloadProgress {
  state: ModelLifecycleState;
  modelId: string;
  downloadedBytes: number;
  totalBytes: number;
  progressPercent: number;
  currentArtifact?: string;
  error?: string;
}

export interface DetectionOptions {
  preferMode?: 'auto' | 'local-only' | 'server-only';
  allowServerFallback?: boolean;
  userConsentedToServer?: boolean;
  timeoutMs?: number;
}

export interface TextDetectionScore {
  aiProbability: number; // 0 to 1
  humanProbability: number; // 0 to 1
  confidence: 'low' | 'moderate' | 'high';
  classification: 'likely-human' | 'inconclusive' | 'likely-ai';
  perplexityScore?: number;
  burstinessScore?: number;
  sampleSufficiency?: 'insufficient' | 'limited' | 'sufficient';
  uncertaintyMargin?: number;
}

export interface TextChunkScore {
  chunkIndex: number;
  textSnippet: string;
  score: TextDetectionScore;
}

export interface SentenceScore {
  sentenceIndex: number;
  text: string;
  aiProbability: number;
  humanProbability: number;
  classification: 'likely-human' | 'inconclusive' | 'likely-ai';
  detectedSignals: string[];
}

export interface DetectionResult {
  id: string;
  timestamp: number;
  mode: InferenceMode;
  modelId: string;
  modelVersion: string;
  latencyMs: number;
  score: TextDetectionScore;
  chunkBreakdown?: TextChunkScore[];
  sentenceBreakdown?: SentenceScore[];
  inputWordCount: number;
  limitationsNotice: string;
}

export interface ImageDetectionScore {
  aiProbability: number;
  humanProbability: number;
  confidence: 'low' | 'moderate' | 'high';
  classification: 'likely-organic' | 'inconclusive' | 'likely-synthetic';
  artifactPatternsDetected?: string[];
}

export interface ImageDetectionResult {
  id: string;
  timestamp: number;
  mode: InferenceMode;
  modelId: string;
  modelVersion: string;
  latencyMs: number;
  score: ImageDetectionScore;
  imageDimensions: { width: number; height: number };
  fileSizeBytes: number;
  mimeType: string;
  limitationsNotice: string;
}

// Metadata & Signature Inspector Types
export interface ExifTagInfo {
  tag: string;
  label: string;
  value: string;
  category: 'camera' | 'gps' | 'software' | 'provenance' | 'date' | 'general';
  isSensitive: boolean;
  canRemove: boolean;
}

export interface ImageMetadataReport {
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  dimensions?: { width: number; height: number };
  hasExif: boolean;
  hasGps: boolean;
  hasXmp: boolean;
  hasIptc: boolean;
  aiSignaturesFound: string[];
  tags: ExifTagInfo[];
  cleaningNotice: string;
}

export interface CleanedMetadataResult {
  originalSize: number;
  cleanedSize: number;
  cleanedBlob: Blob;
  removedTagsCount: number;
  cleanedAt: number;
}
