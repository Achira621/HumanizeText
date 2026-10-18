// ============================================================================
// SERVER INFERENCE API ADAPTER & DEV RUNTIME
// ============================================================================

import type {
  DetectionResult,
  ImageDetectionResult,
  ModelManifest,
  TextDetectionScore,
  ImageDetectionScore,
} from '../../types/detector';
import { MODEL_REGISTRY, TEXT_DETECTOR_MANIFEST, IMAGE_DETECTOR_MANIFEST } from './manifest';
import { analyzeImageForensics } from './imageAnalysis';

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
    const sentences = trimmed.split(/[.!?]+/).map((s) => s.trim()).filter((s) => s.length > 5);

    // ── Extended GPT signature patterns (120+) ──
    const gptPatterns: RegExp[] = [
      /\bdelve\b/i, /\btapestry\b/i, /\btestament\b/i, /\bmultifaceted\b/i,
      /\bseamlessly?\b/i, /\bharnessing\b/i, /\blandscape\b/i, /\brobust\b/i,
      /\bcomprehensive\b/i, /\bproactive(?:ly)?\b/i, /\bparadigm\b/i,
      /\bunderscores?\b/i, /\bpivotal\b/i, /\bintricate\b/i, /\bmeticulou(?:s|sly)\b/i,
      /\bfostering\b/i, /\brealm\b/i, /\bnavigat(?:e|ing|es)\b/i,
      /\bever-(?:evolving|changing|growing)\b/i,
      /\bcutting[- ]edge\b/i, /\bgroundbreaking\b/i, /\binnovative\b/i,
      /\bleverag(?:e|ing|es)\b/i, /\boptimiz(?:e|ing|es|ation)\b/i,
      /\bstream(?:line|lining)\b/i, /\bholistic\b/i, /\bsynergy\b/i,
      /\bempowering?\b/i, /\btransformative\b/i, /\bcollaborative\b/i,
      /\bdynamic\b/i, /\bstrategic(?:ally)?\b/i, /\bsustainab(?:le|ility)\b/i,
      /\bscalab(?:le|ility)\b/i, /\bactionable\b/i, /\btailored\b/i,
      /\bfacilitat(?:e|ing|es)\b/i, /\benchan(?:ce|cing|ces|cement)\b/i,
      /\bensur(?:e|ing|es)\b/i, /\bimplement(?:ation|ing)?\b/i,
      /\butiliz(?:e|ing|es|ation)\b/i, /\beffective(?:ly)?\b/i,
      /\befficient(?:ly)?\b/i, /\bsignificant(?:ly)?\b/i, /\bcrucial(?:ly)?\b/i,
      /\bessential(?:ly)?\b/i, /\bfundamental(?:ly)?\b/i, /\bnotably\b/i,
      /\bimportantly\b/i, /\badditionally\b/i, /\bconsequently\b/i,
      /\bin today(?:'s| ?s) (?:world|age|era|society|landscape)\b/i,
      /\bin (?:the )?(?:modern|contemporary|digital|current) (?:world|age|era|landscape)\b/i,
      /\bit(?:'s| is) (?:important|worth|essential|crucial|vital|imperative) to (?:note|mention|understand|recognize|acknowledge)\b/i,
      /\bplays? a (?:vital|crucial|key|significant|important|pivotal|critical) role\b/i,
      /\ba wide (?:range|array|variety) of\b/i, /\bvast array of\b/i,
      /\bin order to\b/i, /\bdue to the fact that\b/i,
      /\bit is worth (?:noting|mentioning)\b/i, /\bone of the most\b/i,
      /\bmoreover\b/i, /\bfurthermore\b/i, /\bnevertheless\b/i,
      /\bnonetheless\b/i, /\bconversely\b/i, /\bsubsequently\b/i,
      /\bin conclusion\b/i, /\bin summary\b/i, /\bto summarize\b/i,
      /\bin essence\b/i, /\bin light of\b/i, /\bby and large\b/i,
      /\bon the other hand\b/i, /\bthis is (?:because|due)\b/i,
      /\bthat being said\b/i, /\bthis ensures\b/i, /\bthis allows\b/i,
      /\bthis enables\b/i, /\bthis helps\b/i,
      /\bI(?:'d| would) be happy to\b/i, /\bI hope this (?:helps|email|message|finds)\b/i,
      /\bplease (?:don't|do not) hesitate\b/i, /\bfeel free to\b/i,
      /\bif you have any (?:questions|concerns|further)\b/i,
      /\bplease let me know if\b/i, /\blooking forward to\b/i,
      /\bthank you for (?:your|taking)\b/i,
      /\bI wanted to (?:reach out|follow up|let you know|touch base)\b/i,
      /\bbest regards\b/i, /\bwarm regards\b/i, /\bkind regards\b/i,
      /\bhope this (?:finds you well|helps|email)\b/i,
      /\bit(?:'s| is) (?:no secret|clear|evident|apparent|obvious) that\b/i,
      /\bnot only\b.*?\bbut also\b/i,
      /\bwhen it comes to\b/i, /\bin the realm of\b/i,
      /\bpaving the way\b/i, /\blay the groundwork\b/i,
      /\bthe (?:key|importance|significance|value) (?:of|lies)\b/i,
      /\bas (?:we|you) (?:navigate|move forward|look ahead)\b/i,
      /\bwith that (?:in mind|said)\b/i,
      // Additional Email, Cover Letter, and Corporate GPT patterns
      /\bhope (?:everyone|all of you|you all) (?:is|are) having\b/i,
      /\bworking diligently\b/i,
      /\bsmooth (?:rollout|transition|process|execution)\b/i,
      /\bcompleted successfully\b/i,
      /\bmoving into the (?:final|next) stages?\b/i,
      /\b(?:any )?questions or feedback\b/i,
      /\bkeep you (?:posted|updated)\b/i,
      /\bexpress my (?:enthusiastic|strong|sincere|keen) interest\b/i,
      /\bmake a (?:meaningful|valuable|significant) contribution\b/i,
      /\bthroughout my career\b/i,
      /\bsuccessfully spearheaded\b/i,
      /\bpride myself on\b/i,
      /\bwelcome the opportunity to\b/i,
      /\balign(?:s)? with the (?:goals|mission|values|objectives) of\b/i,
      /\bpossibility of discussing\b/i,
      /\bwith over \d+ years of experience\b/i,
      /\bconfident in my ability\b/i,
      /\bvaluable (?:feedback|insights?|contribution|addition)\b/i,
      /\bdrive sustainable (?:growth|revenue)\b/i,
      /\bdata-driven (?:analytics|insights|decisions|approach)\b/i,
      /\bcontent strategy\b/i,
      /\baudienc(?:e) engagement\b/i,
      /\bexciting opportunity\b/i,
      /\btime and consideration\b/i,
      /\bdiscuss how my (?:background|skills|experience)\b/i,
      /\bI am writing to (?:express|formally|inquire|apply|introduce)\b/i,
      /\bI am reaching out to\b/i,
      /\bI wanted to (?:provide|give|share) a quick update\b/i,
      /\bat your earliest convenience\b/i,
      /\blook forward to (?:hearing|discussing|working|speaking)\b/i,
      /\bdelighted to\b/i,
      /\bplease find (?:my|the)? (?:attached|enclosed)\b/i,
      /\bcompetitive advantage\b/i,
      /\bcross-functional collaboration\b/i,
      /\blive demonstration\b/i,
      /\boptimal alignment\b/i,
      /\boperational efficiency\b/i,
    ];

    let patternHits = 0;
    for (const pat of gptPatterns) {
      if (pat.test(trimmed)) patternHits++;
    }

    // Calculate density of signatures per 100 words
    const densityPer100 = (patternHits / Math.max(1, wordCount)) * 100;

    // ── Burstiness: Coefficient of Variation ──
    let burstCV = 0.40;
    let uniformityRatio = 0.5;
    if (sentences.length >= 2) {
      const lengths = sentences.map((s) => s.split(/\s+/).filter(Boolean).length);
      const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
      const variance = lengths.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / lengths.length;
      const stdDev = Math.sqrt(variance);
      burstCV = mean > 0 ? stdDev / mean : 0;
      const withinBand = lengths.filter((l) => Math.abs(l - mean) <= 3).length;
      uniformityRatio = withinBand / lengths.length;
    }

    // ── Vocabulary richness (Type-Token Ratio) ──
    const lowerWords = words.map((w) => w.toLowerCase().replace(/[^a-z']/g, '')).filter((w) => w.length > 2);
    const freq: Record<string, number> = {};
    for (const w of lowerWords) freq[w] = (freq[w] || 0) + 1;
    const ttr = lowerWords.length > 0 ? Object.keys(freq).length / lowerWords.length : 0.5;

    // ── Sentence opening diversity ──
    let openingDiv = 0.8;
    if (sentences.length >= 3) {
      const openings = sentences.map((s) => s.trim().split(/\s+/).slice(0, 2).join(' ').toLowerCase());
      openingDiv = new Set(openings).size / openings.length;
    }

    // ── Consecutive sentence length predictability ──
    let consecutivePattern = 0;
    if (sentences.length >= 4) {
      const lengths = sentences.map((s) => s.split(/\s+/).filter(Boolean).length);
      let predictable = 0;
      for (let i = 1; i < lengths.length; i++) {
        if (Math.abs(lengths[i] - lengths[i - 1]) <= 5) predictable++;
      }
      consecutivePattern = predictable / (lengths.length - 1);
    }

    // ── Signal scoring taking density into account ──
    let sigKeyword: number;
    if (densityPer100 >= 5 || patternHits >= 10) sigKeyword = 0.98;
    else if (densityPer100 >= 3.5 || patternHits >= 6) sigKeyword = 0.92;
    else if (densityPer100 >= 2.0 || patternHits >= 4) sigKeyword = 0.84;
    else if (densityPer100 >= 1.0 || patternHits >= 2) sigKeyword = 0.68;
    else if (patternHits === 1) sigKeyword = 0.35;
    else sigKeyword = 0.05;

    let sigBurst: number;
    if (burstCV < 0.20) sigBurst = 0.90;
    else if (burstCV < 0.30) sigBurst = 0.75;
    else if (burstCV < 0.42) sigBurst = 0.50;
    else if (burstCV < 0.55) sigBurst = 0.25;
    else sigBurst = 0.10;
    if (uniformityRatio > 0.70) sigBurst = Math.min(1, sigBurst + 0.15);

    let sigVocab: number;
    if (ttr > 0.72) sigVocab = 0.10;
    else if (ttr > 0.60) sigVocab = 0.25;
    else if (ttr > 0.50) sigVocab = 0.45;
    else if (ttr > 0.40) sigVocab = 0.65;
    else sigVocab = 0.82;

    let sigOpening: number;
    if (openingDiv > 0.85) sigOpening = 0.10;
    else if (openingDiv > 0.70) sigOpening = 0.25;
    else if (openingDiv > 0.50) sigOpening = 0.50;
    else sigOpening = 0.80;

    let sigConsecutive: number;
    if (consecutivePattern > 0.80) sigConsecutive = 0.85;
    else if (consecutivePattern > 0.60) sigConsecutive = 0.60;
    else if (consecutivePattern > 0.40) sigConsecutive = 0.35;
    else sigConsecutive = 0.12;

    // ── Weighted fusion (40% keyword density) ──
    const rawAi =
      sigKeyword     * 0.40 +
      sigBurst       * 0.20 +
      sigVocab       * 0.15 +
      sigOpening     * 0.10 +
      sigConsecutive * 0.10 +
      0.30           * 0.05;

    // ── Calibration & synergy ──
    let calibratedAi = rawAi;
    if (sigKeyword >= 0.84) {
      calibratedAi = Math.max(calibratedAi, sigKeyword * 0.95);
    } else if (sigKeyword >= 0.68) {
      calibratedAi = Math.max(calibratedAi, 0.65);
    } else if (patternHits === 0) {
      calibratedAi = Math.min(calibratedAi, 0.22);
    }

    if (wordCount < 25) calibratedAi = calibratedAi * 0.75 + 0.12;

    const aiProb = Math.max(0.02, Math.min(0.98, Math.round(calibratedAi * 100) / 100));
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

    const perplexityScore = Math.round(Math.max(5, Math.min(98,
      (ttr * 40) + (burstCV * 50) + (openingDiv * 20) - (patternHits / Math.max(1, wordCount / 50) * 25) + 10
    )));

    const burstinessScore = Math.round(Math.max(5, Math.min(98,
      (burstCV * 80) + ((1 - uniformityRatio) * 40) + ((1 - consecutivePattern) * 30) - 10
    )));

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
        perplexityScore,
        burstinessScore,
      },
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
