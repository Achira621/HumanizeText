import type { ShingleItem } from './shingles';

export interface FingerprintedShingle {
  hash: string;
  shingle: ShingleItem;
}

export interface WinnowedFingerprint {
  hash: string;
  shingleIndex: number;
  shingle: ShingleItem;
}

/**
 * Standard Winnowing algorithm (Schleimer, Wilkerson, Aiken 2003).
 * Given a list of fingerprinted shingles and a window size W:
 * In every window of size W, selects the minimum hash value (breaking ties by rightmost occurrence).
 * Returns the reduced subset of representative fingerprints.
 */
export function winnowFingerprints(
  fingerprints: FingerprintedShingle[],
  windowSize: number = 4
): WinnowedFingerprint[] {
  if (fingerprints.length <= windowSize) {
    return fingerprints.map((fp) => ({
      hash: fp.hash,
      shingleIndex: fp.shingle.shingleIndex,
      shingle: fp.shingle,
    }));
  }

  const selectedFingerprints: WinnowedFingerprint[] = [];
  let minIndex = -1;

  for (let i = 0; i <= fingerprints.length - windowSize; i++) {
    // If the previous minimum is still inside this window, compare it with the new incoming element
    if (minIndex >= i && minIndex < i + windowSize) {
      const newEntryIndex = i + windowSize - 1;
      // If the new entry is strictly smaller or equal (rightmost preference), it becomes the minimum
      if (fingerprints[newEntryIndex].hash <= fingerprints[minIndex].hash) {
        minIndex = newEntryIndex;
        selectedFingerprints.push({
          hash: fingerprints[minIndex].hash,
          shingleIndex: fingerprints[minIndex].shingle.shingleIndex,
          shingle: fingerprints[minIndex].shingle,
        });
      }
    } else {
      // Find the minimum hash in the current window (rightmost on tie)
      let currentMinIdx = i;
      for (let j = 1; j < windowSize; j++) {
        const candidateIdx = i + j;
        if (fingerprints[candidateIdx].hash <= fingerprints[currentMinIdx].hash) {
          currentMinIdx = candidateIdx;
        }
      }

      minIndex = currentMinIdx;
      // Add if it wasn't just added
      const lastAdded = selectedFingerprints[selectedFingerprints.length - 1];
      if (!lastAdded || lastAdded.shingleIndex !== fingerprints[minIndex].shingle.shingleIndex) {
        selectedFingerprints.push({
          hash: fingerprints[minIndex].hash,
          shingleIndex: fingerprints[minIndex].shingle.shingleIndex,
          shingle: fingerprints[minIndex].shingle,
        });
      }
    }
  }

  // Deduplicate consecutive identical selections
  const deduplicated: WinnowedFingerprint[] = [];
  const seenIndices = new Set<number>();

  for (const fp of selectedFingerprints) {
    if (!seenIndices.has(fp.shingleIndex)) {
      seenIndices.add(fp.shingleIndex);
      deduplicated.push(fp);
    }
  }

  return deduplicated;
}
