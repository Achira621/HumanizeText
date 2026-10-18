// ============================================================================
// HYBRID INFERENCE ROUTER
// Seamlessly routes between on-device local execution and server API
// ============================================================================

import type {
  DetectionOptions,
  DetectionResult,
  ImageDetectionResult,
} from '../../types/detector';
import { ModelLifecycleManager, textModelManager, imageModelManager } from './modelManager';
import { defaultDetectorWorker, DetectorWorkerClient } from './workerClient';
import { ServerInferenceApi, defaultServerApi } from './serverApi';

export interface RouterStatus {
  activeMode: 'local' | 'server' | 'preparing';
  localModelReady: boolean;
  serverAvailable: boolean;
  userConsentedToServer: boolean;
  modelState: string;
}

export class HybridInferenceRouter {
  private textModel: ModelLifecycleManager;
  private imageModel: ModelLifecycleManager;
  private workerClient: DetectorWorkerClient;
  private serverApi: ServerInferenceApi;
  private isRequestActive = false;

  constructor(
    textModel = textModelManager,
    imageModel = imageModelManager,
    workerClient = defaultDetectorWorker,
    serverApi = defaultServerApi
  ) {
    this.textModel = textModel;
    this.imageModel = imageModel;
    this.workerClient = workerClient;
    this.serverApi = serverApi;
  }

  /**
   * Primary Text Detection router implementing the decision flowchart.
   */
  public async detectText(
    text: string,
    options: DetectionOptions = {}
  ): Promise<DetectionResult> {
    if (this.isRequestActive) {
      throw new Error('Another inference request is currently being processed.');
    }

    const trimmed = text.trim();
    if (!trimmed) {
      throw new Error('Please enter text to analyze.');
    }

    this.isRequestActive = true;

    try {
      // 1. Check local model readiness
      const localReady = this.textModel.getState() === 'READY';

      // CASE A: Local model ready & preferred
      if (localReady && options.preferMode !== 'server-only') {
        try {
          const localResult = await this.workerClient.detectText(trimmed, options.timeoutMs || 10000);
          return localResult;
        } catch (localErr: any) {
          // CASE E: Local inference failure -> fallback to server if permitted & consented
          if (options.allowServerFallback && options.userConsentedToServer) {
            console.warn('Local inference failed, attempting server fallback:', localErr);
            return await this.serverApi.detectText(trimmed);
          }
          throw new Error(
            `Local on-device inference failed: ${localErr?.message || 'Execution error'}. You can try server analysis or reinstall the local model.`
          );
        }
      }

      // CASE B: Model missing or downloading & user requests immediate score
      // Check if server is permitted & user consented
      if (options.preferMode === 'local-only') {
        throw new Error(
          'Local model is not yet ready on this device. Please complete the model download or allow secure server processing.'
        );
      }

      if (!options.userConsentedToServer) {
        throw new Error(
          'CONSENT_REQUIRED: Local model is downloading or not yet prepared. To analyze your text immediately, please consent to secure server processing, or wait for the on-device model download to finish.'
        );
      }

      // Check server availability
      const health = await this.serverApi.getHealth().catch(() => null);
      if (!health || health.status !== 'healthy') {
        // CASE C: Server inference unavailable
        throw new Error(
          'SERVER_UNAVAILABLE: The server analysis service is currently unavailable. Please wait for the on-device model download to finish, or retry in a few moments.'
        );
      }

      // Run server inference
      return await this.serverApi.detectText(trimmed);
    } finally {
      this.isRequestActive = false;
    }
  }

  /**
   * Primary Image Detection router.
   */
  public async detectImage(
    file: File | Blob,
    options: DetectionOptions = {}
  ): Promise<ImageDetectionResult> {
    if (this.isRequestActive) {
      throw new Error('Another inference request is currently being processed.');
    }

    this.isRequestActive = true;

    try {
      const localReady = this.imageModel.getState() === 'READY';

      if (localReady && options.preferMode !== 'server-only') {
        // On-device image analysis (fallback to server simulation if wasm memory exceeded)
        // For development we route through server API adapter with client-side labeling
        return await this.serverApi.detectImage(file);
      }

      if (options.preferMode === 'local-only') {
        throw new Error('Local vision model is not installed. Please prepare the on-device model first.');
      }

      if (!options.userConsentedToServer) {
        throw new Error(
          'CONSENT_REQUIRED: Local image model is not prepared. Please consent to secure server processing or download the local model.'
        );
      }

      return await this.serverApi.detectImage(file);
    } finally {
      this.isRequestActive = false;
    }
  }

  /**
   * Retrieve aggregate router state.
   */
  public async getStatus(): Promise<RouterStatus> {
    const textState = this.textModel.getState();
    const localReady = textState === 'READY';
    let serverOk = true;

    try {
      const h = await this.serverApi.getHealth();
      serverOk = h.status === 'healthy';
    } catch {
      serverOk = false;
    }

    let activeMode: 'local' | 'server' | 'preparing' = 'server';
    if (localReady) {
      activeMode = 'local';
    } else if (textState === 'DOWNLOADING' || textState === 'VERIFYING') {
      activeMode = 'preparing';
    }

    return {
      activeMode,
      localModelReady: localReady,
      serverAvailable: serverOk,
      userConsentedToServer: false,
      modelState: textState,
    };
  }
}

export const defaultInferenceRouter = new HybridInferenceRouter();
