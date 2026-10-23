import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AdaptiveIntelligenceCoordinator } from '../../src/lib/intelligence/coordinator';
import { defaultModelRegistry, ModelRegistry } from '../../src/lib/intelligence/modelRegistry';
import { FeatureFlagsManager } from '../../src/lib/intelligence/featureFlags';
import { FeedbackPipeline } from '../../src/lib/intelligence/feedbackPipeline';
import { HybridInferenceRouter } from '../../src/lib/detector/router';
import { TEXT_DETECTOR_MANIFEST } from '../../src/lib/detector/manifest';

describe('Adaptive Intelligence Layer', () => {
  describe('Model Registry & Version Tracking', () => {
    it('initializes with production-default text and image models', () => {
      const prodText = defaultModelRegistry.getProductionDefault('text-detection');
      expect(prodText).toBeDefined();
      expect(prodText.modelId).toBe('tmr-ai-text-detector-v1');
      expect(prodText.deploymentStatus).toBe('production-default');
      expect(prodText.isCompatibleWithBrowser).toBe(true);

      const prodImage = defaultModelRegistry.getProductionDefault('image-detection');
      expect(prodImage).toBeDefined();
      expect(prodImage.modelId).toBe('ai-image-detector-v1');
    });

    it('tracks model metadata, integrity hashes, and licenses', () => {
      const models = defaultModelRegistry.listAllModels();
      expect(models.length).toBeGreaterThanOrEqual(3);
      for (const m of models) {
        expect(m.modelId).toBeTruthy();
        expect(m.version).toBeTruthy();
        expect(m.license).toBeTruthy();
        expect(m.author).toBeTruthy();
        expect(m.integritySha256).toBeTruthy();
      }
    });

    it('supports safe rollback to known working default', () => {
      const registry = new ModelRegistry();
      const rollbackTarget = registry.rollbackToSafeDefault();
      expect(rollbackTarget).toBe('tmr-ai-text-detector-v1');
      expect(registry.getProductionDefault('text-detection').modelId).toBe('tmr-ai-text-detector-v1');
    });
  });

  describe('Feature Flags & Controlled Gating', () => {
    let flags: FeatureFlagsManager;

    beforeEach(() => {
      flags = new FeatureFlagsManager();
      flags.resetToDefaults();
    });

    it('keeps experimental secondary signals disabled by default in production', () => {
      expect(flags.isEnabled('enableExperimentalSignals')).toBe(false);
      expect(flags.isEnabled('enableConsentedFeedback')).toBe(true);
      expect(flags.isEnabled('enableSemanticSimilarity')).toBe(true);
    });

    it('allows runtime updates to flags without crashing', () => {
      flags.updateFlags({ enableExperimentalSignals: true });
      expect(flags.isEnabled('enableExperimentalSignals')).toBe(true);
      flags.resetToDefaults();
      expect(flags.isEnabled('enableExperimentalSignals')).toBe(false);
    });
  });

  describe('Adaptive Coordinator Execution & Isolation', () => {
    it('executes baseline analysis and wraps with adaptive metadata', async () => {
      // Mock router to simulate on-device / server readiness
      const mockRouter = {
        detectText: vi.fn().mockResolvedValue({
          id: 'test_det_1',
          timestamp: Date.now(),
          mode: 'server',
          modelId: TEXT_DETECTOR_MANIFEST.modelId,
          modelVersion: '1.0.4',
          latencyMs: 150,
          score: {
            aiProbability: 0.15,
            humanProbability: 0.85,
            confidence: 'high',
            classification: 'likely-human',
          },
          inputWordCount: 20,
          limitationsNotice: 'Notice',
        }),
      } as unknown as HybridInferenceRouter;

      const coordinator = new AdaptiveIntelligenceCoordinator(mockRouter);
      const text = 'Photosynthesis is the biological process by which green plants convert sunlight into chemical energy.';
      const res = await coordinator.analyzeText(text, {
        preferMode: 'auto',
        userConsentedToServer: true,
      });

      expect(res).toBeDefined();
      expect(res.score.aiProbability).toBe(0.15);
      expect(res.adaptiveMetadata).toBeDefined();
      expect(res.adaptiveMetadata?.activeProviderId).toBe('tmr-ai-text-detector-v1');
      expect(res.adaptiveMetadata?.registryVersion).toBeTruthy();
    });

    it('gathers secondary signals cleanly when feature flag is enabled', async () => {
      const mockRouter = {
        detectText: vi.fn().mockResolvedValue({
          id: 'test_det_2',
          timestamp: Date.now(),
          mode: 'local',
          modelId: TEXT_DETECTOR_MANIFEST.modelId,
          modelVersion: '1.0.4',
          latencyMs: 80,
          score: {
            aiProbability: 0.82,
            humanProbability: 0.18,
            confidence: 'high',
            classification: 'likely-ai',
          },
          inputWordCount: 25,
          limitationsNotice: 'Notice',
        }),
      } as unknown as HybridInferenceRouter;

      const flags = new FeatureFlagsManager();
      flags.updateFlags({ enableExperimentalSignals: true });
      const coordinator = new AdaptiveIntelligenceCoordinator(mockRouter, undefined, flags);

      const text = 'In conclusion, it is important to note that artificial intelligence plays a crucial role in modern technology.';
      const res = await coordinator.analyzeText(text, {
        preferMode: 'auto',
        userConsentedToServer: false,
      });

      expect(res.score.aiProbability).toBe(0.82);
      expect(res.adaptiveMetadata?.secondarySignals).toBeDefined();
      expect(res.adaptiveMetadata?.secondarySignals?.length).toBeGreaterThanOrEqual(1);

      const linguisticSignal = res.adaptiveMetadata?.secondarySignals?.find(
        (s) => s.providerId === 'humanizetext-linguistic-core-v2'
      );
      expect(linguisticSignal).toBeDefined();
      expect(linguisticSignal?.score).toBeGreaterThan(0.5);
    });
  });

  describe('Consented Feedback Pipeline', () => {
    it('stores voluntary feedback with hashed text and separate labels', async () => {
      const pipeline = new FeedbackPipeline();
      const item = await pipeline.submitFeedback(
        'This is a sample student essay on historical architecture.',
        0.12,
        'likely-human',
        'human',
        { userNotes: 'Accurately recognized as human written' }
      );

      expect(item).toBeDefined();
      expect(item.id.startsWith('fb_')).toBe(true);
      expect(item.textSnippetHash).toBeTruthy();
      expect(item.userPerceivedLabel).toBe('human');
      expect(item.predictedClassification).toBe('likely-human');

      const history = pipeline.getFeedbackHistory();
      expect(history.length).toBeGreaterThanOrEqual(1);
      expect(history[0].id).toBe(item.id);

      pipeline.clearFeedbackHistory();
      expect(pipeline.getFeedbackHistory().length).toBe(0);
    });
  });
});
