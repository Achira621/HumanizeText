import { deriveKeyFromPassphrase } from './vault';

export interface BenchmarkResult {
  iterations: number;
  durationMs: number;
  status: 'optimal' | 'acceptable' | 'slow';
}

/**
 * Benchmarks PBKDF2-SHA-256 derivation times across different iteration counts
 * on the current user's hardware.
 */
export async function benchmarkPbkdf2(): Promise<BenchmarkResult[]> {
  const testPassphrase = 'privacy-first-benchmark-passphrase-2026';
  const testSalt = crypto.getRandomValues(new Uint8Array(16));
  const iterationTiers = [100_000, 300_000, 600_000];
  const results: BenchmarkResult[] = [];

  for (const iterations of iterationTiers) {
    const start = performance.now();
    await deriveKeyFromPassphrase(testPassphrase, testSalt, iterations);
    const durationMs = Math.round(performance.now() - start);

    let status: 'optimal' | 'acceptable' | 'slow' = 'optimal';
    if (durationMs > 800) {
      status = 'slow';
    } else if (durationMs < 100) {
      status = 'acceptable';
    }

    results.push({
      iterations,
      durationMs,
      status,
    });
  }

  return results;
}
