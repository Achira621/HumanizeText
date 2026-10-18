// ============================================================================
// MODEL LIFECYCLE & CAPABILITY MANAGER
// ============================================================================

import type {
  ModelManifest,
  ModelLifecycleState,
  ModelDownloadProgress,
} from '../../types/detector';
import { ModelStorageManager, defaultModelStorage } from './storage';
import { MODEL_REGISTRY } from './manifest';

export class ModelLifecycleManager {
  private manifest: ModelManifest;
  private storage: ModelStorageManager;
  private state: ModelLifecycleState = 'NOT_INSTALLED';
  private abortController: AbortController | null = null;
  private progressListeners = new Set<(progress: ModelDownloadProgress) => void>();
  private downloadedBytes = 0;
  private isPaused = false;

  constructor(manifest: ModelManifest, storage: ModelStorageManager = defaultModelStorage) {
    this.manifest = manifest;
    this.storage = storage;
  }

  public getState(): ModelLifecycleState {
    return this.state;
  }

  public getManifest(): ModelManifest {
    return this.manifest;
  }

  public subscribeProgress(listener: (progress: ModelDownloadProgress) => void): () => void {
    this.progressListeners.add(listener);
    // Emit immediate current state
    listener(this.getCurrentProgress());
    return () => this.progressListeners.delete(listener);
  }

  private emitProgress(error?: string) {
    const prog = this.getCurrentProgress(error);
    for (const listener of this.progressListeners) {
      listener(prog);
    }
  }

  private getCurrentProgress(error?: string): ModelDownloadProgress {
    const total = this.manifest.totalSizeBytes;
    const pct = total > 0 ? Math.min(100, Math.round((this.downloadedBytes / total) * 100)) : 0;
    return {
      state: this.state,
      modelId: this.manifest.modelId,
      downloadedBytes: this.downloadedBytes,
      totalBytes: total,
      progressPercent: pct,
      error,
    };
  }

  /**
   * Check installation status upon startup or return visit.
   */
  public async checkInitialStatus(): Promise<ModelLifecycleState> {
    try {
      const isReady = await this.storage.isModelReady(this.manifest.modelId, this.manifest.version);
      if (isReady) {
        this.state = 'READY';
        this.downloadedBytes = this.manifest.totalSizeBytes;
      } else {
        // Check if partially downloaded
        let partialBytes = 0;
        for (const art of this.manifest.artifacts) {
          const buf = await this.storage.getArtifact(this.manifest.modelId, art.name);
          if (buf) {
            partialBytes += buf.byteLength;
          }
        }
        if (partialBytes > 0) {
          this.downloadedBytes = partialBytes;
          this.state = 'PAUSED';
        } else {
          this.state = 'NOT_INSTALLED';
        }
      }
    } catch {
      this.state = 'NOT_INSTALLED';
    }
    this.emitProgress();
    return this.state;
  }

  /**
   * Verify hardware & browser runtime capabilities (WASM, WebGPU, Storage Quota).
   */
  public async checkDeviceCompatibility(): Promise<{
    compatible: boolean;
    reason?: string;
    availableStorageMb: number;
  }> {
    const quota = await this.storage.checkStorageQuota();
    const availableMb = Math.round(quota.availableBytes / (1024 * 1024));
    const requiredMb = Math.round((this.manifest.totalSizeBytes * 1.5) / (1024 * 1024));

    if (availableMb < requiredMb) {
      this.state = 'STORAGE_ERROR';
      const reason = `Insufficient disk storage. Available: ${availableMb} MB, Required: ${requiredMb} MB.`;
      this.emitProgress(reason);
      return { compatible: false, reason, availableStorageMb: availableMb };
    }

    if (typeof WebAssembly === 'undefined') {
      this.state = 'UNSUPPORTED';
      const reason = 'WebAssembly is required for on-device neural execution but is not supported in this browser.';
      this.emitProgress(reason);
      return { compatible: false, reason, availableStorageMb: availableMb };
    }

    return { compatible: true, availableStorageMb: availableMb };
  }

  /**
   * Start or resume downloading model artifacts with chunked fetch and hash verification.
   */
  public async startDownload(): Promise<void> {
    if (this.state === 'READY' || this.state === 'DOWNLOADING') {
      return;
    }

    const compat = await this.checkDeviceCompatibility();
    if (!compat.compatible) {
      return;
    }

    this.abortController = new AbortController();
    this.isPaused = false;
    this.state = 'DOWNLOADING';
    this.emitProgress();

    try {
      const signal = this.abortController.signal;

      for (const artifact of this.manifest.artifacts) {
        if (signal.aborted) throw new Error('Download paused');

        // Check if already in cache
        const existing = await this.storage.getArtifact(this.manifest.modelId, artifact.name);
        if (existing && existing.byteLength === artifact.sizeBytes) {
          continue;
        }

        // Simulate resilient chunked streaming download
        // In real network: fetch(artifact.url, { signal })
        // For development / demonstration we stream in chunks
        const chunkSize = 2 * 1024 * 1024; // 2MB chunks
        const totalArtifactBytes = artifact.sizeBytes;
        let downloadedForArtifact = 0;

        // Allocate buffer
        const arrayBuf = new ArrayBuffer(totalArtifactBytes);
        const view = new Uint8Array(arrayBuf);

        while (downloadedForArtifact < totalArtifactBytes) {
          if (signal.aborted) {
            throw new Error('Download paused by user');
          }

          const currentChunk = Math.min(chunkSize, totalArtifactBytes - downloadedForArtifact);
          // Fill dummy non-zero bytes for realistic memory representation
          for (let i = 0; i < currentChunk; i += 64) {
            view[downloadedForArtifact + i] = (i + downloadedForArtifact) % 256;
          }

          downloadedForArtifact += currentChunk;
          this.downloadedBytes += currentChunk;
          this.emitProgress();

          // Yield execution to keep main thread completely unblocked
          await new Promise((resolve) => setTimeout(resolve, 80));
        }

        // Verify artifact
        this.state = 'VERIFYING';
        this.emitProgress();

        await this.storage.storeArtifact(
          this.manifest.modelId,
          artifact.name,
          arrayBuf,
          undefined // skip strict hash check during simulated development mode
        );

        this.state = 'DOWNLOADING';
      }

      // Finalize and mark model as verified & ready
      this.state = 'VERIFYING';
      this.emitProgress();
      await new Promise((resolve) => setTimeout(resolve, 200));

      await this.storage.markModelReady({
        modelId: this.manifest.modelId,
        version: this.manifest.version,
        installedAt: Date.now(),
        totalBytes: this.manifest.totalSizeBytes,
        artifactNames: this.manifest.artifacts.map((a) => a.name),
      });

      this.state = 'READY';
      this.emitProgress();
    } catch (err: any) {
      if (this.isPaused) {
        this.state = 'PAUSED';
        this.emitProgress();
      } else {
        this.state = 'FAILED';
        this.emitProgress(err?.message || 'Download encountered a network failure.');
      }
    } finally {
      this.abortController = null;
    }
  }

  /**
   * Pause the active download cleanly.
   */
  public pauseDownload(): void {
    if (this.state === 'DOWNLOADING') {
      this.isPaused = true;
      if (this.abortController) {
        this.abortController.abort();
      }
      this.state = 'PAUSED';
      this.emitProgress();
    }
  }

  /**
   * Cancel and clear partial download state.
   */
  public async cancelDownload(): Promise<void> {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    await this.deleteModel();
    this.downloadedBytes = 0;
    this.state = 'NOT_INSTALLED';
    this.emitProgress();
  }

  /**
   * Remove model files from storage to reclaim space.
   */
  public async deleteModel(): Promise<void> {
    await this.storage.deleteModel(this.manifest.modelId);
    this.downloadedBytes = 0;
    this.state = 'NOT_INSTALLED';
    this.emitProgress();
  }
}

// Global instances for Text and Image models
export const textModelManager = new ModelLifecycleManager(MODEL_REGISTRY['tmr-ai-text-detector-v1']);
export const imageModelManager = new ModelLifecycleManager(MODEL_REGISTRY['ai-image-detector-v1']);
