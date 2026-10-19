// ============================================================================
// ADAPTIVE INTELLIGENCE LAYER — COORDINATOR & ADAPTER
// Non-destructive orchestrator wrapping the existing detector router
// ============================================================================

import type { DetectionOptions, DetectionResult } from '../../types/detector';
import type { AdaptiveAnalysisResult, DetectorProvider, ProviderSignal } from './types';
import { defaultInferenceRouter, HybridInferenceRouter } from '../detector/router';
import { defaultModelRegistry, ModelRegistry } from './modelRegistry';
import { defaultFeatureFlags, FeatureFlagsManager } from './featureFlags';
import { computeAiScore } from '../detector/detectorCore';

export class AdaptiveIntelligenceCoordinator {
  private router: HybridInferenceRouter;
  private registry: ModelRegistry;
  private flags: FeatureFlagsManager;
  private secondaryProviders: Map<string, DetectorProvider> = new Map();

  constructor(
    router = defaultInferenceRouter,
    registry = defaultModelRegistry,
    flags = defaultFeatureFlags
  ) {
    this.router = router;
    this.registry = registry;
    this.flags = flags;
    this.registerBuiltinProviders();
  }

  private registerBuiltinProviders(): void {
    // Built-in Pure Linguistic Provider (Always available on-device)
    this.registerProvider({
      id: 'humanizetext-linguistic-core-v2',
      name: 'Pure Linguistic Scorer v2',
      version: '2.4.0',
      type: 'text',
      isAvailable: () => true,
      analyze: async (text: string) => {
        const start = performance.now();
        const score = computeAiScore(text);
        const confidence = score.aiProbability > 0.8 || score.aiProbability < 0.2 ? 'high' : 'moderate';
        return {
          providerId: 'humanizetext-linguistic-core-v2',
          source: 'baseline-linguistic',
          score: score.aiProbability,
          confidence,
          rawMetrics: {
            perplexity: score.perplexityScore || 0,
            burstiness: score.burstinessScore || 0,
            keywordHits: score.keywordHits || 0,
          },
          latencyMs: Math.round(performance.now() - start),
          modelVersion: '2.4.0',
        };
      },
    });

    // Built-in Shannon Entropy Heuristic Provider
    this.registerProvider({
      id: 'experimental-entropy-ngram-v1',
      name: 'Shannon 3-Gram Entropy Evaluator',
      version: '0.9.1-beta',
      type: 'text',
      isAvailable: () => true,
      analyze: async (text: string) => {
        const start = performance.now();
        // Compute simple normalized character entropy
        const clean = text.toLowerCase().replace(/\s+/g, ' ');
        const freq: Record<string, number> = {};
        for (let i = 0; i < clean.length - 2; i++) {
          const tri = clean.slice(i, i + 3);
          freq[tri] = (freq[tri] || 0) + 1;
        }
        const total = Math.max(1, clean.length - 2);
        let entropy = 0;
        for (const k in freq) {
          const p = freq[k] / total;
          entropy -= p * Math.log2(p);
        }
        // Higher entropy = more human variability; lower entropy = repetitive synthetic pattern
        const maxExpectedEntropy = 8.5;
        const normalizedEntropy = Math.min(1, entropy / maxExpectedEntropy);
        const aiLikelihood = Math.max(0, Math.min(1, 1 - normalizedEntropy * 0.9));

        return {
          providerId: 'experimental-entropy-ngram-v1',
          source: 'ngram-entropy',
          score: Number(aiLikelihood.toFixed(3)),
          confidence: 'moderate',
          rawMetrics: { shannonEntropy: Number(entropy.toFixed(3)) },
          latencyMs: Math.round(performance.now() - start),
          modelVersion: '0.9.1-beta',
        };
      },
    });
  }

  public registerProvider(provider: DetectorProvider): void {
    this.secondaryProviders.set(provider.id, provider);
  }

  /**
   * Main text analysis method.
   * Delegates cleanly to the production inference router, and optionally gathers
   * non-interfering secondary signals when feature flags are active.
   */
  public async analyzeText(
    text: string,
    options: DetectionOptions = {}
  ): Promise<AdaptiveAnalysisResult> {
    const prodModel = this.registry.getProductionDefault('text-detection');

    // 1. Run the trusted, existing production baseline
    const baseResult: DetectionResult = await this.router.detectText(text, options);

    // 2. Prepare adaptive result object
    const result: AdaptiveAnalysisResult = {
      ...baseResult,
      adaptiveMetadata: {
        activeProviderId: prodModel.modelId,
        registryVersion: prodModel.version,
        rollbackAvailable: !!prodModel.rollbackTargetId,
      },
    };

    // 3. Optional secondary signals (only evaluated if feature flag is active)
    if (this.flags.isEnabled('enableExperimentalSignals')) {
      try {
        const secondarySignals: ProviderSignal[] = [];
        for (const [id, provider] of this.secondaryProviders.entries()) {
          if (id !== prodModel.modelId && (await provider.isAvailable())) {
            const signal = await provider.analyze(text);
            secondarySignals.push(signal);
          }
        }
        if (result.adaptiveMetadata) {
          result.adaptiveMetadata.secondarySignals = secondarySignals;
        }
      } catch (secErr) {
        // Absolute isolation: secondary signal errors never fail the production request
        console.warn('Adaptive Intelligence: secondary signal collection skipped:', secErr);
      }
    }

    return result;
  }
}

export const defaultAdaptiveCoordinator = new AdaptiveIntelligenceCoordinator();
