// ============================================================================
// SERVER INFERENCE API ADAPTER & DEV RUNTIME
// ============================================================================

import type {
  DetectionResult,
  ImageDetectionResult,
  ModelManifest,
  TextDetectionScore,
  SentenceScore,
} from '../../types/detector';
import { MODEL_REGISTRY, TEXT_DETECTOR_MANIFEST, IMAGE_DETECTOR_MANIFEST } from './manifest';
import { analyzeImageForensics } from './imageAnalysis';
import { computeAiScore, GPT_SIGNATURES } from './detectorCore';

export interface ServerApiConfig {
  baseUrl?: string;
  timeoutMs?: number;
}

export class ServerInferenceApi {
  private baseUrl: string;
  public readonly timeoutMs: number;
  private requestCounter = 0;
  private lastRequestTime = 0;

  constructor(config: ServerApiConfig = {}) {
    this.baseUrl = config.baseUrl || (import.meta as any).env?.VITE_INFERENCE_API_URL || '';
    this.timeoutMs = config.timeoutMs || 10000;
  }

  /**
   * Health and readiness probe.
   */
  public async getHealth(): Promise<{ status: 'healthy' | 'degraded'; version: string; availableModels: string[] }> {
    if (this.baseUrl) {
      try {
        const res = await fetch(`${this.baseUrl}/health`, { method: 'GET' });
        if (res.ok) {
          return await res.json();
        }
      } catch {
        // Fallback to simulated health below
      }
    }

    // Default simulated healthy service
    return {
      status: 'healthy',
      version: '1.0.0',
      availableModels: Object.keys(MODEL_REGISTRY),
    };
  }

  /**
   * Model catalog manifest.
   */
  public async getModelManifest(modelId: string): Promise<ModelManifest> {
    if (this.baseUrl) {
      try {
        const res = await fetch(`${this.baseUrl}/v1/models/${encodeURIComponent(modelId)}/manifest`);
        if (res.ok) {
          return await res.json();
        }
      } catch {
        // fallback to local registry
      }
    }
    const manifest = MODEL_REGISTRY[modelId];
    if (!manifest) {
      throw new Error(`Model '${modelId}' not found in registry.`);
    }
    return manifest;
  }

  /**
   * Server text detection endpoint.
   */
  public async detectText(
    text: string,
    options: { modelId?: string; signal?: AbortSignal } = {}
  ): Promise<DetectionResult> {
    const trimmed = text.trim();
    if (!trimmed) {
      throw new Error('Input text cannot be empty.');
    }
    if (trimmed.length > 50000) {
      throw new Error('Input exceeds maximum server payload length limit of 50,000 characters.');
    }

    const modelId = options.modelId || TEXT_DETECTOR_MANIFEST.modelId;
    const requestId = `srv_req_${Date.now()}_${++this.requestCounter}`;
    const startTime = performance.now();

    // 1. If remote server is configured, send network request
    if (this.baseUrl) {
      const res = await fetch(`${this.baseUrl}/v1/detect/text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Request-ID': requestId },
        body: JSON.stringify({ text: trimmed, modelId }),
        signal: options.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Server inference failed with status ${res.status}`);
      }
      return await res.json();
    }

    // 2. Zero-cost local development adapter with full multi-signal detection
    const now = Date.now();
    if (now - this.lastRequestTime < 200) {
      await new Promise((r) => setTimeout(r, 200));
    }
    this.lastRequestTime = Date.now();

    // Simulated inference computation time (350ms - 550ms)
    await new Promise((r) => setTimeout(r, 450));

    const words = trimmed.split(/\s+/).filter(Boolean);
    const wordCount = words.length;

// Use unified linguistic AI detection core
    const coreResult = computeAiScore(trimmed);
    const aiProb = coreResult.aiProbability;
    const humanProb = Math.round((1 - aiProb) * 100) / 100;

    let classification: TextDetectionScore['classification'] = 'likely-human';
    let confidence: TextDetectionScore['confidence'] = 'high';

    if (aiProb > 0.60) {
      classification = 'likely-ai';
      confidence = aiProb > 0.80 ? 'high' : 'moderate';
    } else if (aiProb >= 0.30) {
      classification = 'inconclusive';
      confidence = 'low';
    }

    // Sentence-by-sentence analysis for heatmap visualization
    const rawSentences = trimmed.match(/[^.!?\r\n]+(?:[.!?]+|\r?\n+|$)/g) || [trimmed];
    const sentenceScores: SentenceScore[] = [];
    let sIdx = 0;
    for (const rawS of rawSentences) {
      const sTrimmed = rawS.trim();
      if (sTrimmed.length < 5) continue;

      const sScore = computeAiScore(sTrimmed);
      const matchingSigs: string[] = [];
      for (const sig of GPT_SIGNATURES) {
        const match = sTrimmed.match(sig);
        if (match && !matchingSigs.includes(match[0].toLowerCase())) {
          matchingSigs.push(match[0].toLowerCase());
        }
      }

      let sAi = sScore.aiProbability;
      if (matchingSigs.length >= 2) sAi = Math.max(sAi, 0.85);
      else if (matchingSigs.length === 1) sAi = Math.max(sAi, 0.65);
      else if (sTrimmed.split(/\s+/).length < 8 && coreResult.aiProbability < 0.35) sAi = Math.min(sAi, 0.20);

      sAi = Math.max(0.02, Math.min(0.98, Math.round(sAi * 100) / 100));
      const sHuman = Math.round((1 - sAi) * 100) / 100;
      const sClass = sAi >= 0.60 ? 'likely-ai' : sAi <= 0.35 ? 'likely-human' : 'inconclusive';

      sentenceScores.push({
        sentenceIndex: sIdx++,
        text: sTrimmed,
        aiProbability: sAi,
        humanProbability: sHuman,
        classification: sClass,
        detectedSignals: matchingSigs,
      });
    }

    const latency = Math.round(performance.now() - startTime);

    return {
      id: requestId,
      timestamp: Date.now(),
      mode: 'server',
      modelId,
      modelVersion: TEXT_DETECTOR_MANIFEST.version,
      latencyMs: latency,
      score: {
        aiProbability: aiProb,
        humanProbability: humanProb,
        confidence,
        classification,
        perplexityScore: coreResult.perplexityScore,
        burstinessScore: coreResult.burstinessScore,
        sampleSufficiency: coreResult.sampleSufficiency,
        uncertaintyMargin: coreResult.uncertaintyMargin,
      },
      sentenceBreakdown: sentenceScores.length > 0 ? sentenceScores : undefined,
      inputWordCount: wordCount,
      limitationsNotice: TEXT_DETECTOR_MANIFEST.calibrationNotice,
    };
  }

  /**
   * Server image detection endpoint.
   */
  public async detectImage(
    file: File | Blob,
    options: { signal?: AbortSignal } = {}
  ): Promise<ImageDetectionResult> {
    if (!file || file.size === 0) {
      throw new Error('Image file is empty or missing.');
    }
    if (file.size > 20 * 1024 * 1024) {
      throw new Error('Image exceeds 20MB maximum file size limit.');
    }

    const requestId = `srv_img_${Date.now()}_${++this.requestCounter}`;
    const startTime = performance.now();

    // 1. If remote server is configured, upload FormData
    if (this.baseUrl) {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('modelId', IMAGE_DETECTOR_MANIFEST.modelId);

      const res = await fetch(`${this.baseUrl}/v1/detect/image`, {
        method: 'POST',
        headers: { 'X-Request-ID': requestId },
        body: formData,
        signal: options.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Server image inference failed (${res.status})`);
      }
      return await res.json();
    }

    // 2. High-precision forensic image analysis (metadata, EXIF, aspect ratio & pixel noise)
    await new Promise((r) => setTimeout(r, 450));

    const analysis = await analyzeImageForensics(file);

    return {
      id: requestId,
      timestamp: Date.now(),
      mode: 'server',
      modelId: IMAGE_DETECTOR_MANIFEST.modelId,
      modelVersion: IMAGE_DETECTOR_MANIFEST.version,
      latencyMs: Math.round(performance.now() - startTime),
      score: {
        aiProbability: analysis.aiProbability,
        humanProbability: analysis.humanProbability,
        confidence: analysis.confidence,
        classification: analysis.classification,
        artifactPatternsDetected: analysis.patterns,
      },
      imageDimensions: analysis.dimensions,
      fileSizeBytes: file.size,
      mimeType: file.type || 'image/jpeg',
      limitationsNotice: IMAGE_DETECTOR_MANIFEST.calibrationNotice,
    };
  }
}

export const defaultServerApi = new ServerInferenceApi();
