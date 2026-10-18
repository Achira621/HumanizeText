// ============================================================================
// MODEL STORAGE MANAGER (IndexedDB & Web Crypto Hash Verification)
// ============================================================================

const DB_NAME = 'humanizetext_model_cache';
const DB_VERSION = 1;
const ARTIFACTS_STORE = 'artifacts';
const METADATA_STORE = 'metadata';

export interface StoredModelMetadata {
  modelId: string;
  version: string;
  installedAt: number;
  totalBytes: number;
  artifactNames: string[];
}

export class ModelStorageManager {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private async getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    if (typeof indexedDB === 'undefined') {
      throw new Error('IndexedDB is not supported in this environment.');
    }

    this.dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(ARTIFACTS_STORE)) {
          db.createObjectStore(ARTIFACTS_STORE, { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains(METADATA_STORE)) {
          db.createObjectStore(METADATA_STORE, { keyPath: 'modelId' });
        }
      };

      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error || new Error('Failed to open IndexedDB'));
    });

    return this.dbPromise;
  }

  /**
   * Check available storage quota via StorageManager API.
   */
  public async checkStorageQuota(): Promise<{
    quotaBytes: number;
    usageBytes: number;
    availableBytes: number;
  }> {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        const quota = estimate.quota || 1024 * 1024 * 1024 * 2; // fallback 2GB
        const usage = estimate.usage || 0;
        return {
          quotaBytes: quota,
          usageBytes: usage,
          availableBytes: Math.max(0, quota - usage),
        };
      } catch {
        // Fallback if estimate fails
      }
    }
    return {
      quotaBytes: 2 * 1024 * 1024 * 1024,
      usageBytes: 0,
      availableBytes: 2 * 1024 * 1024 * 1024,
    };
  }

  /**
   * Verify SHA-256 hash of an ArrayBuffer using native Web Crypto.
   */
  public async verifyHash(buffer: ArrayBuffer, expectedHex: string): Promise<boolean> {
    if (!expectedHex || expectedHex.length === 0) return true;
    try {
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
      return hashHex.toLowerCase() === expectedHex.toLowerCase();
    } catch {
      return false;
    }
  }

  /**
   * Store a model artifact in IndexedDB with integrity check.
   */
  public async storeArtifact(
    modelId: string,
    artifactName: string,
    buffer: ArrayBuffer,
    expectedSha256Hex?: string
  ): Promise<void> {
    if (expectedSha256Hex) {
      const valid = await this.verifyHash(buffer, expectedSha256Hex);
      if (!valid) {
        throw new Error(
          `Cryptographic checksum mismatch for artifact '${artifactName}'. Download may be corrupted.`
        );
      }
    }

    const db = await this.getDB();
    const key = `${modelId}::${artifactName}`;

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(ARTIFACTS_STORE, 'readwrite');
      const store = tx.objectStore(ARTIFACTS_STORE);
      const req = store.put({
        key,
        modelId,
        artifactName,
        buffer,
        size: buffer.byteLength,
        savedAt: Date.now(),
      });

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error || new Error('Failed to store artifact'));
    });
  }

  /**
   * Retrieve a stored model artifact.
   */
  public async getArtifact(modelId: string, artifactName: string): Promise<ArrayBuffer | null> {
    const db = await this.getDB();
    const key = `${modelId}::${artifactName}`;

    return new Promise<ArrayBuffer | null>((resolve, reject) => {
      const tx = db.transaction(ARTIFACTS_STORE, 'readonly');
      const store = tx.objectStore(ARTIFACTS_STORE);
      const req = store.get(key);

      req.onsuccess = () => {
        if (req.result && req.result.buffer) {
          resolve(req.result.buffer);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => reject(req.error || new Error('Failed to retrieve artifact'));
    });
  }

  /**
   * Record metadata once all model artifacts have been verified.
   */
  public async markModelReady(metadata: StoredModelMetadata): Promise<void> {
    const db = await this.getDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(METADATA_STORE, 'readwrite');
      const store = tx.objectStore(METADATA_STORE);
      const req = store.put(metadata);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Check if a specific model version is completely installed and verified.
   */
  public async isModelReady(modelId: string, requiredVersion?: string): Promise<boolean> {
    try {
      const db = await this.getDB();
      const meta = await new Promise<StoredModelMetadata | null>((resolve) => {
        const tx = db.transaction(METADATA_STORE, 'readonly');
        const store = tx.objectStore(METADATA_STORE);
        const req = store.get(modelId);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });

      if (!meta) return false;
      if (requiredVersion && meta.version !== requiredVersion) return false;

      // Verify that every recorded artifact is actually present in storage
      for (const artifactName of meta.artifactNames) {
        const art = await this.getArtifact(modelId, artifactName);
        if (!art || art.byteLength === 0) return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Delete an entire model and reclaim storage.
   */
  public async deleteModel(modelId: string): Promise<void> {
    const db = await this.getDB();

    // 1. Get metadata to know which artifact keys to delete
    const meta = await new Promise<StoredModelMetadata | null>((resolve) => {
      const tx = db.transaction(METADATA_STORE, 'readonly');
      const req = tx.objectStore(METADATA_STORE).get(modelId);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });

    if (meta) {
      const tx = db.transaction([ARTIFACTS_STORE, METADATA_STORE], 'readwrite');
      const artStore = tx.objectStore(ARTIFACTS_STORE);
      for (const name of meta.artifactNames) {
        artStore.delete(`${modelId}::${name}`);
      }
      tx.objectStore(METADATA_STORE).delete(modelId);
      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    }
  }

  /**
   * List all locally installed and verified models.
   */
  public async listInstalledModels(): Promise<StoredModelMetadata[]> {
    try {
      const db = await this.getDB();
      return new Promise<StoredModelMetadata[]>((resolve) => {
        const tx = db.transaction(METADATA_STORE, 'readonly');
        const req = tx.objectStore(METADATA_STORE).getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });
    } catch {
      return [];
    }
  }
}

export const defaultModelStorage = new ModelStorageManager();
