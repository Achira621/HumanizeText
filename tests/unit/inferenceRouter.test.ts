import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HybridInferenceRouter } from '../../src/lib/detector/router';
import { ModelLifecycleManager } from '../../src/lib/detector/modelManager';
import { TEXT_DETECTOR_MANIFEST, IMAGE_DETECTOR_MANIFEST } from '../../src/lib/detector/manifest';

describe('Hybrid AI Detection Router — Flowchart Decision Logic', () => {
  let mockStorage: any;
  let textManager: ModelLifecycleManager;
  let imageManager: ModelLifecycleManager;
  let mockWorkerClient: any;
  let mockServerApi: any;
  let router: HybridInferenceRouter;

  beforeEach(() => {
    mockStorage = {
      isModelReady: vi.fn().mockResolvedValue(false),
      getArtifact: vi.fn().mockResolvedValue(null),
      checkStorageQuota: vi.fn().mockResolvedValue({ availableBytes: 1024 * 1024 * 1024 }),
      deleteModel: vi.fn().mockResolvedValue(undefined),
      storeArtifact: vi.fn().mockResolvedValue(undefined),
      markModelReady: vi.fn().mockResolvedValue(undefined),
    };

    textManager = new ModelLifecycleManager(TEXT_DETECTOR_MANIFEST, mockStorage);
    imageManager = new ModelLifecycleManager(IMAGE_DETECTOR_MANIFEST, mockStorage);

    mockWorkerClient = {
      detectText: vi.fn().mockResolvedValue({
        id: 'loc_test_123',
        timestamp: Date.now(),
        mode: 'local',
        modelId: TEXT_DETECTOR_MANIFEST.modelId,
        modelVersion: '1.0.4',
        latencyMs: 120,
        score: {
          aiProbability: 0.12,
          humanProbability: 0.88,
          confidence: 'high',
          classification: 'likely-human',
        },
        inputWordCount: 50,
        limitationsNotice: 'Test limitations',
      }),
    };

    mockServerApi = {
      getHealth: vi.fn().mockResolvedValue({ status: 'healthy', version: '1.0.0' }),
      detectText: vi.fn().mockResolvedValue({
        id: 'srv_test_456',
        timestamp: Date.now(),
        mode: 'server',
        modelId: TEXT_DETECTOR_MANIFEST.modelId,
        modelVersion: '1.0.4',
        latencyMs: 340,
        score: {
          aiProbability: 0.85,
          humanProbability: 0.15,
          confidence: 'high',
          classification: 'likely-ai',
        },
        inputWordCount: 50,
        limitationsNotice: 'Test limitations',
      }),
      detectImage: vi.fn().mockResolvedValue({
        id: 'srv_img_789',
        timestamp: Date.now(),
        mode: 'server',
        modelId: IMAGE_DETECTOR_MANIFEST.modelId,
        modelVersion: '1.2.0',
        latencyMs: 400,
        score: {
          aiProbability: 0.75,
          humanProbability: 0.25,
          confidence: 'moderate',
          classification: 'likely-synthetic',
        },
        imageDimensions: { width: 512, height: 512 },
        fileSizeBytes: 10240,
        mimeType: 'image/jpeg',
        limitationsNotice: 'Test limitations',
      }),
    };

    router = new HybridInferenceRouter(textManager, imageManager, mockWorkerClient, mockServerApi);
  });

  it('Case A: Routes locally when local model is READY without calling server', async () => {
    // Force textManager into READY state
    (textManager as any).state = 'READY';

    const result = await router.detectText('Sample research text for classification.', {
      userConsentedToServer: false,
    });

    expect(result.mode).toBe('local');
    expect(mockWorkerClient.detectText).toHaveBeenCalled();
    expect(mockServerApi.detectText).not.toHaveBeenCalled();
  });

  it('Case B: Throws consent required when local model is not ready and no server consent', async () => {
    (textManager as any).state = 'NOT_INSTALLED';

    await expect(
      router.detectText('Sample research text.', {
        userConsentedToServer: false,
      })
    ).rejects.toThrow('CONSENT_REQUIRED');

    expect(mockServerApi.detectText).not.toHaveBeenCalled();
  });

  it('Case B (with consent): Routes to server when local model is downloading and user consented', async () => {
    (textManager as any).state = 'DOWNLOADING';

    const result = await router.detectText('Sample research text.', {
      userConsentedToServer: true,
    });

    expect(result.mode).toBe('server');
    expect(mockServerApi.detectText).toHaveBeenCalled();
    expect(mockWorkerClient.detectText).not.toHaveBeenCalled();
  });

  it('Case C: Throws error when server is unhealthy and local model is not ready', async () => {
    (textManager as any).state = 'NOT_INSTALLED';
    mockServerApi.getHealth.mockResolvedValue({ status: 'degraded' });

    await expect(
      router.detectText('Sample research text.', {
        userConsentedToServer: true,
      })
    ).rejects.toThrow('SERVER_UNAVAILABLE');
  });

  it('Rejects empty input before any inference attempts', async () => {
    await expect(router.detectText('   ')).rejects.toThrow('Please enter text to analyze.');
  });
});
