import { bufferToHex } from './digest';

export interface ComparisonSessionKey {
  key: CryptoKey;
  keyFingerprint: string;
  createdAt: number;
}

/**
 * Generates an ephemeral HMAC-SHA-256 key scoped strictly to a single document comparison session.
 * The key is stored purely in memory and never persisted or transmitted.
 */
export async function generateComparisonSessionKey(): Promise<ComparisonSessionKey> {
  const key = await crypto.subtle.generateKey(
    {
      name: 'HMAC',
      hash: { name: 'SHA-256' },
      length: 256,
    },
    true, // temporarily extractable to compute public key fingerprint for UI verification
    ['sign', 'verify']
  );

  // Compute a public fingerprint of the key bytes to confirm session consistency
  // without revealing the actual key material to the user or logs
  const rawKeyBytes = await crypto.subtle.exportKey('raw', key);
  const keyDigestBuffer = await crypto.subtle.digest('SHA-256', rawKeyBytes);
  const keyFingerprint = bufferToHex(keyDigestBuffer);

  return {
    key,
    keyFingerprint,
    createdAt: Date.now(),
  };
}

/**
 * Computes an HMAC-SHA-256 digest of normalized shingle text using the session key.
 * This ensures that identical shingles produce identical hashes within the session,
 * while preventing dictionary/rainbow table attacks because the ephemeral key is unknown to attackers.
 */
export async function computeHmac(key: CryptoKey, text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const signature = await crypto.subtle.sign('HMAC', key, data);
  return bufferToHex(signature);
}

/**
 * Computes unkeyed SHA-256 digest of the same text for cryptographic comparison in Privacy Lab.
 */
export async function computeUnkeyedDigest(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return bufferToHex(hash);
}
