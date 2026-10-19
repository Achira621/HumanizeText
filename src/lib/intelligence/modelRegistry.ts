// ============================================================================
// ADAPTIVE INTELLIGENCE LAYER — MODEL REGISTRY & VERSION MANAGEMENT
// Central tracking for current production baseline, canary, and experimental models
// ============================================================================

import type { RegistryModelEntry } from './types';
import { TEXT_DETECTOR_MANIFEST, IMAGE_DETECTOR_MANIFEST } from '../detector/manifest';

export class ModelRegistry {
  private registry: Map<string, RegistryModelEntry> = new Map();
  private activeProductionModelId: string = TEXT_DETECTOR_MANIFEST.modelId;

  constructor() {
    this.seedDefaultRegistry();
  }

  private seedDefaultRegistry(): void {
    // 1. Current Production Text Detector Baseline
    this.registerModel({
      modelId: TEXT_DETECTOR_MANIFEST.modelId,
      version: TEXT_DETECTOR_MANIFEST.version,
      type: 'text-detection',
      displayName: TEXT_DETECTOR_MANIFEST.displayName,
      description: TEXT_DETECTOR_MANIFEST.description,
      license: TEXT_DETECTOR_MANIFEST.license,
      author: TEXT_DETECTOR_MANIFEST.author,
      sourceUrl: TEXT_DETECTOR_MANIFEST.sourceUrl,
      compatibleAppVersion: TEXT_DETECTOR_MANIFEST.compatibleAppVersion,
      expectedRuntime: 'wasm',
      totalSizeBytes: TEXT_DETECTOR_MANIFEST.totalSizeBytes,
      requiredMemoryMb: TEXT_DETECTOR_MANIFEST.requiredMemoryMb,
      integritySha256: TEXT_DETECTOR_MANIFEST.artifacts[0]?.sha256Hex || 'unknown',
      preprocessingVersion: 'v2.1-bpe',
      deploymentStatus: 'production-default',
      isCompatibleWithBrowser: this.checkBrowserCompatibility(),
    });

    // 2. Pure Statistical / Linguistic Core Fallback Model
    this.registerModel({
      modelId: 'humanizetext-linguistic-core-v2',
      version: '2.4.0',
      type: 'text-detection',
      displayName: 'HumanizeText Pure Linguistic & Perplexity Scorer',
      description: 'Zero-download deterministic linguistic feature extractor and burstiness evaluator.',
      license: 'MIT',
      author: 'HumanizeText Open Engineering',
      sourceUrl: 'https://humanizetext-nine.vercel.app/docs',
      compatibleAppVersion: '>=1.0.0',
      expectedRuntime: 'main-thread',
      totalSizeBytes: 14500, // < 15 KB pure code
      requiredMemoryMb: 16,
      integritySha256: '9dc3f8b000000000000000000000000000000000',
      preprocessingVersion: 'v1.0-whitespace-regex',
      deploymentStatus: 'production-default',
      rollbackTargetId: TEXT_DETECTOR_MANIFEST.modelId,
      isCompatibleWithBrowser: true,
    });

    // 3. Vision Image Synthetic Detector
    this.registerModel({
      modelId: IMAGE_DETECTOR_MANIFEST.modelId,
      version: IMAGE_DETECTOR_MANIFEST.version,
      type: 'image-detection',
      displayName: IMAGE_DETECTOR_MANIFEST.displayName,
      description: IMAGE_DETECTOR_MANIFEST.description,
      license: IMAGE_DETECTOR_MANIFEST.license,
      author: IMAGE_DETECTOR_MANIFEST.author,
      sourceUrl: IMAGE_DETECTOR_MANIFEST.sourceUrl,
      compatibleAppVersion: IMAGE_DETECTOR_MANIFEST.compatibleAppVersion,
      expectedRuntime: 'wasm',
      totalSizeBytes: IMAGE_DETECTOR_MANIFEST.totalSizeBytes,
      requiredMemoryMb: IMAGE_DETECTOR_MANIFEST.requiredMemoryMb,
      integritySha256: IMAGE_DETECTOR_MANIFEST.artifacts[0]?.sha256Hex || 'unknown',
      preprocessingVersion: 'v1.2-bicubic-norm',
      deploymentStatus: 'production-default',
      isCompatibleWithBrowser: this.checkBrowserCompatibility(),
    });

    // 4. Experimental / Canary Model: Multi-Gram Entropy Classifier
    this.registerModel({
      modelId: 'experimental-entropy-ngram-v1',
      version: '0.9.1-beta',
      type: 'text-detection',
      displayName: 'High-Order N-Gram Information Entropy Model (Canary)',
      description: 'Experimental Shannon entropy calculator over 3-gram character transitions.',
      license: 'Apache-2.0',
      author: 'HumanizeText AI Lab',
      sourceUrl: 'https://humanizetext-nine.vercel.app/docs',
      compatibleAppVersion: '>=1.2.0',
      expectedRuntime: 'webworker',
      totalSizeBytes: 18000,
      requiredMemoryMb: 32,
      integritySha256: 'a1b2c3d4e5f60718293a4b5c6d7e8f9a0b1c2d3e',
      preprocessingVersion: 'v1.0-ngram',
      deploymentStatus: 'experimental-opt-in',
      rollbackTargetId: TEXT_DETECTOR_MANIFEST.modelId,
      isCompatibleWithBrowser: true,
    });
  }

  private checkBrowserCompatibility(): boolean {
    if (typeof window === 'undefined') return true;
    return typeof WebAssembly !== 'undefined' && typeof Worker !== 'undefined';
  }

  public registerModel(entry: RegistryModelEntry): void {
    this.registry.set(entry.modelId, entry);
  }

  public getModel(modelId: string): RegistryModelEntry | undefined {
    return this.registry.get(modelId);
  }

  public listAllModels(): RegistryModelEntry[] {
    return Array.from(this.registry.values());
  }

  public getProductionDefault(type: 'text-detection' | 'image-detection' = 'text-detection'): RegistryModelEntry {
    for (const model of this.registry.values()) {
      if (model.type === type && model.deploymentStatus === 'production-default') {
        return model;
      }
    }
    // Fallback to text detector manifest
    return this.registry.get(this.activeProductionModelId)!;
  }

  public setProductionDefault(modelId: string): boolean {
    const candidate = this.registry.get(modelId);
    if (!candidate) return false;
    if (candidate.deploymentStatus === 'deprecated' || candidate.deploymentStatus === 'retired') {
      console.warn(`Cannot set retired model ${modelId} as production default.`);
      return false;
    }
    this.activeProductionModelId = modelId;
    return true;
  }

  public rollbackToSafeDefault(): string {
    const current = this.registry.get(this.activeProductionModelId);
    const targetId = current?.rollbackTargetId || TEXT_DETECTOR_MANIFEST.modelId;
    this.activeProductionModelId = targetId;
    return targetId;
  }
}

export const defaultModelRegistry = new ModelRegistry();
