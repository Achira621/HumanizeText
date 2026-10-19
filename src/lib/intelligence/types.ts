// ============================================================================
// ADAPTIVE INTELLIGENCE LAYER — CORE TYPE DEFINITIONS
// Contract specifications for models, registry, providers, and evaluation
// ============================================================================

import type { DetectionResult } from '../../types/detector';

export type SignalSource = 'baseline-linguistic' | 'neural-onnx' | 'ngram-entropy' | 'server-api' | 'experimental';

export interface ProviderSignal {
  providerId: string;
  source: SignalSource;
  score: number; // Normalized [0, 1] AI probability
  confidence: 'low' | 'moderate' | 'high';
  rawMetrics?: Record<string, number | string | boolean>;
  latencyMs: number;
  modelVersion: string;
}

export interface DetectorProvider {
  id: string;
  name: string;
  version: string;
  type: 'text' | 'image' | 'hybrid';
  isAvailable: () => boolean | Promise<boolean>;
  analyze: (text: string, options?: Record<string, unknown>) => Promise<ProviderSignal>;
}

export type DeploymentStatus = 'production-default' | 'experimental-opt-in' | 'canary' | 'deprecated' | 'retired';

export interface RegistryModelEntry {
  modelId: string;
  version: string;
  type: 'text-detection' | 'image-detection' | 'similarity' | 'humanizer';
  displayName: string;
  description: string;
  license: string;
  author: string;
  sourceUrl: string;
  compatibleAppVersion: string;
  expectedRuntime: 'wasm' | 'webworker' | 'main-thread' | 'server';
  totalSizeBytes: number;
  requiredMemoryMb: number;
  integritySha256: string;
  preprocessingVersion: string;
  deploymentStatus: DeploymentStatus;
  rollbackTargetId?: string;
  calibrationReportUrl?: string;
  isCompatibleWithBrowser: boolean;
}

export interface IntelligenceFeatureFlags {
  enableExperimentalSignals: boolean;
  enableConsentedFeedback: boolean;
  enableSemanticSimilarity: boolean;
  enablePlagiarismSourceRetrieval: boolean;
  enableDeveloperModelAudit: boolean;
}

export interface ConsentedFeedbackItem {
  id: string;
  timestamp: number;
  textSnippetHash: string; // SHA-256 of text, never plain text without consent
  predictedAiScore: number;
  predictedClassification: string;
  userPerceivedLabel: 'human' | 'ai' | 'mixed';
  userNotes?: string;
  modelId: string;
  modelVersion: string;
  consentedToAnonymousResearch: boolean;
}

export interface AdaptiveAnalysisResult extends DetectionResult {
  adaptiveMetadata?: {
    activeProviderId: string;
    registryVersion: string;
    secondarySignals?: ProviderSignal[];
    calibrationFactor?: number;
    fallbackInvoked?: boolean;
    rollbackAvailable?: boolean;
  };
}
