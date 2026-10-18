import type { EncryptedPayload, VaultRecord } from '../../types';
import { bufferToHex } from './digest';

export const DEFAULT_PBKDF2_ITERATIONS = 600_000;
const SALT_BYTE_LENGTH = 16;
const IV_BYTE_LENGTH = 12;

export class VaultCryptoError extends Error {
  public code: 'WRONG_PASSPHRASE_OR_CORRUPT' | 'INVALID_PAYLOAD' | 'CRYPTO_FAILURE';

  constructor(message: string, code: 'WRONG_PASSPHRASE_OR_CORRUPT' | 'INVALID_PAYLOAD' | 'CRYPTO_FAILURE') {
    super(message);
    this.name = 'VaultCryptoError';
    this.code = code;
  }
}

/**
 * Converts a hex string back into a Uint8Array.
 */
export function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) {
    throw new VaultCryptoError('Invalid hexadecimal length', 'INVALID_PAYLOAD');
  }
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Derives an AES-GCM 256-bit encryption key from a user passphrase and salt using PBKDF2-SHA-256.
 */
export async function deriveKeyFromPassphrase(
  passphrase: string,
  salt: Uint8Array,
  iterations: number = DEFAULT_PBKDF2_ITERATIONS
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passphraseBytes = encoder.encode(passphrase);

  // Import raw passphrase as key material
  const baseKey = await crypto.subtle.importKey(
    'raw',
    passphraseBytes,
    'PBKDF2',
    false,
    ['deriveKey']
  );

  // Derive AES-GCM 256-bit key
  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations,
      hash: 'SHA-256',
    },
    baseKey,
    {
      name: 'AES-GCM',
      length: 256,
    },
    false, // non-extractable in memory
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts a VaultRecord using AES-GCM authenticated encryption and PBKDF2 key derivation.
 * Each encryption uses a newly generated 16-byte random salt and 12-byte random IV.
 */
export async function encryptVaultRecord(
  passphrase: string,
  record: VaultRecord,
  iterations: number = DEFAULT_PBKDF2_ITERATIONS
): Promise<EncryptedPayload> {
  if (!passphrase || passphrase.length < 4) {
    throw new VaultCryptoError('Passphrase must be at least 4 characters long', 'INVALID_PAYLOAD');
  }

  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTE_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTE_LENGTH));

  const key = await deriveKeyFromPassphrase(passphrase, salt, iterations);

  const plaintextJson = JSON.stringify(record);
  const plaintextBytes = new TextEncoder().encode(plaintextJson);

  // AES-GCM appends a 128-bit authentication tag automatically to the ciphertext
  const ciphertextBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as unknown as BufferSource,
      tagLength: 128,
    },
    key,
    plaintextBytes
  );

  return {
    version: 1,
    kdf: 'PBKDF2-SHA-256',
    iterations,
    saltHex: bufferToHex(salt),
    ivHex: bufferToHex(iv),
    cipherHex: bufferToHex(ciphertextBuffer),
    authTagIncluded: true,
    createdAt: Date.now(),
    metadata: {
      id: record.id,
      title: record.title,
      originalSize: plaintextBytes.byteLength,
      previewSummary: `${record.content.substring(0, 48)}...`,
    },
  };
}

/**
 * Decrypts an EncryptedPayload. Authenticates ciphertext integrity using AES-GCM tag.
 * Throws an authenticated decryption error if passphrase is wrong or any bit of ciphertext is tampered.
 */
export async function decryptVaultRecord(
  passphrase: string,
  payload: EncryptedPayload
): Promise<VaultRecord> {
  if (!payload || payload.version !== 1 || !payload.cipherHex) {
    throw new VaultCryptoError('Invalid encrypted payload format', 'INVALID_PAYLOAD');
  }

  const salt = hexToBytes(payload.saltHex);
  const iv = hexToBytes(payload.ivHex);
  const ciphertext = hexToBytes(payload.cipherHex);

  const key = await deriveKeyFromPassphrase(passphrase, salt, payload.iterations);

  try {
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv as unknown as BufferSource,
        tagLength: 128,
      },
      key,
      ciphertext as unknown as BufferSource
    );

    const plaintext = new TextDecoder().decode(decryptedBuffer);
    return JSON.parse(plaintext) as VaultRecord;
  } catch {
    // Web Crypto rejects with an OperationError if authentication tag fails
    throw new VaultCryptoError(
      'Authentication failed. The passphrase may be incorrect, or the ciphertext has been modified/corrupted.',
      'WRONG_PASSPHRASE_OR_CORRUPT'
    );
  }
}
