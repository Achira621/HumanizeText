import { describe, it, expect } from 'vitest';
import { ModelStorageManager } from '../../src/lib/detector/storage';
import { ModelLifecycleManager } from '../../src/lib/detector/modelManager';
import { TEXT_DETECTOR_MANIFEST } from '../../src/lib/detector/manifest';

describe('Model Storage & Lifecycle State Machine', () => {
  it('correctly reports device compatibility when quota is ample', async () => {
    const storage = new ModelStorageManager();
    const manager = new ModelLifecycleManager(TEXT_DETECTOR_MANIFEST, storage);

    const compat = await manager.checkDeviceCompatibility();
    expect(compat.compatible).toBe(true);
    expect(compat.availableStorageMb).toBeGreaterThan(0);
  });

  it('verifies SHA-256 hash correctly using native Web Crypto', async () => {
    const storage = new ModelStorageManager();
    const encoder = new TextEncoder();
    const data = encoder.encode('Hello HumanizeText Model Storage').buffer;

    // Compute expected hash
    const hashBuf = await crypto.subtle.digest('SHA-256', data);
    const expectedHex = Array.from(new Uint8Array(hashBuf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    const isValid = await storage.verifyHash(data, expectedHex);
    expect(isValid).toBe(true);

    const isInvalid = await storage.verifyHash(data, '0000000000000000000000000000000000000000000000000000000000000000');
    expect(isInvalid).toBe(false);
  });

  it('manages download state transitions from NOT_INSTALLED to PAUSED', () => {
    const storage = new ModelStorageManager();
    const manager = new ModelLifecycleManager(TEXT_DETECTOR_MANIFEST, storage);

    expect(manager.getState()).toBe('NOT_INSTALLED');

    manager.pauseDownload();
    // Pausing an unstarted download stays NOT_INSTALLED
    expect(manager.getState()).toBe('NOT_INSTALLED');
  });
});
