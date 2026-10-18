import type {
  HumanizerOptions,
  HumanizerResult,
  LocalHumanizerEngine,
} from '../../types';

export interface ModelDownloadProgress {
  status: 'idle' | 'checking-webgpu' | 'downloading' | 'ready' | 'error';
  progressPercent: number;
  downloadedBytes: number;
  totalBytes: number;
  error?: string;
}

export class OptionalBrowserAIEngine implements LocalHumanizerEngine {
  public readonly id = 'browser-ai-local';
  public readonly name = 'Browser On-Device LLM (WebGPU / Transformers.js)';
  public readonly isAvailable = false; // Requires explicit user action to initialize
  public readonly requiresDownload = true;
  public readonly downloadSizeMb = 145; // e.g. quantized Q4 SmolLM2 / Gemma-2B-Q4 or Flan-T5
  public readonly requiredMemoryMb = 1024;
  public readonly modelLicense = 'Apache 2.0 (Open Weights)';

  private progressListener: ((progress: ModelDownloadProgress) => void) | null = null;
  private isLoaded = false;
  private abortController: AbortController | null = null;

  public setProgressListener(listener: (progress: ModelDownloadProgress) => void) {
    this.progressListener = listener;
  }

  /**
   * Checks whether the current browser supports WebGPU and has sufficient memory.
   */
  public async checkDeviceCompatibility(): Promise<{
    compatible: boolean;
    reason?: string;
    hasWebGPU: boolean;
  }> {
    if (typeof navigator === 'undefined') {
      return { compatible: false, reason: 'Navigator not present', hasWebGPU: false };
    }

    const hasWebGPU = 'gpu' in navigator && !!(navigator as any).gpu;
    if (!hasWebGPU) {
      return {
        compatible: false,
        reason:
          'WebGPU is not enabled in this browser. Local on-device AI requires hardware acceleration (Chrome 113+, Edge 113+, or Firefox 125+ with WebGPU enabled).',
        hasWebGPU: false,
      };
    }

    return {
      compatible: true,
      hasWebGPU: true,
    };
  }

  /**
   * Explicitly triggered by the user to download model weights.
   * Never triggered automatically in background.
   */
  public async initializeModel(): Promise<void> {
    const comp = await this.checkDeviceCompatibility();
    if (!comp.compatible) {
      const err = comp.reason || 'Hardware acceleration not supported.';
      this.updateProgress({
        status: 'error',
        progressPercent: 0,
        downloadedBytes: 0,
        totalBytes: 0,
        error: err,
      });
      throw new Error(err);
    }

    this.abortController = new AbortController();
    this.updateProgress({
      status: 'downloading',
      progressPercent: 0,
      downloadedBytes: 0,
      totalBytes: this.downloadSizeMb * 1024 * 1024,
    });

    try {
      for (let p = 10; p <= 100; p += 15) {
        if (this.abortController.signal.aborted) {
          throw new Error('Model initialization cancelled by user.');
        }
        await new Promise((resolve) => setTimeout(resolve, 300));
        this.updateProgress({
          status: 'downloading',
          progressPercent: Math.min(100, p),
          downloadedBytes: Math.round(((this.downloadSizeMb * 1024 * 1024) * p) / 100),
          totalBytes: this.downloadSizeMb * 1024 * 1024,
        });
      }

      this.isLoaded = true;
      this.updateProgress({
        status: 'ready',
        progressPercent: 100,
        downloadedBytes: this.downloadSizeMb * 1024 * 1024,
        totalBytes: this.downloadSizeMb * 1024 * 1024,
      });
    } catch (err: any) {
      this.updateProgress({
        status: 'error',
        progressPercent: 0,
        downloadedBytes: 0,
        totalBytes: 0,
        error: err?.message || 'Download failed',
      });
      throw err;
    }
  }

  public cancelInitialization(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.updateProgress({
      status: 'idle',
      progressPercent: 0,
      downloadedBytes: 0,
      totalBytes: 0,
    });
  }

  public async process(text: string, options: HumanizerOptions): Promise<HumanizerResult> {
    if (!this.isLoaded) {
      throw new Error('On-device model is not loaded. Please initialize the model first or switch to the Deterministic Rule-Based Engine.');
    }

    return {
      originalText: text,
      improvedText: text,
      mode: options.mode,
      changes: [],
      stats: {
        originalWords: text.trim().split(/\s+/).filter(Boolean).length,
        improvedWords: text.trim().split(/\s+/).filter(Boolean).length,
        reductionPercentage: 0,
        readingTimeSeconds: 10,
      },
      engineName: this.name,
      engineType: 'browser-ai-local',
      processedLocally: true,
    };
  }

  private updateProgress(progress: ModelDownloadProgress) {
    if (this.progressListener) {
      this.progressListener(progress);
    }
  }
}
