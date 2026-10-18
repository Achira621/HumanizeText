import { describe, it, expect } from 'vitest';
import { computeDocumentDigests, normalizeTextForDigest } from '../../src/lib/crypto/digest';
import { generateComparisonSessionKey, computeHmac, computeUnkeyedDigest } from '../../src/lib/crypto/hmac';
import {
  encryptVaultRecord,
  decryptVaultRecord,
  VaultCryptoError,
} from '../../src/lib/crypto/vault';
import { VaultRecord } from '../../src/types';

describe('Cryptographic Primitives — Document Integrity & Digest', () => {
  it('computes identical normalized SHA-256 digests despite varied whitespace and casing', async () => {
    const textA = 'Machine learning and Cryptographic Privacy.';
    const textB = '  machine  learning   and cryptographic privacy.  \n\n';

    const digestA = await computeDocumentDigests(textA);
    const digestB = await computeDocumentDigests(textB);

    // Raw digests must differ due to differing bytes
    expect(digestA.rawSha256).not.toBe(digestB.rawSha256);

    // Normalized digests must match exactly
    expect(digestA.normalizedSha256).toBe(digestB.normalizedSha256);
  });

  it('normalizes Unicode characters into NFC form', () => {
    // Decomposed e + acute accent vs composed é
    const decomposed = 'e\u0301cole';
    const composed = '\u00e9cole';

    expect(normalizeTextForDigest(decomposed)).toBe(normalizeTextForDigest(composed));
  });
});

describe('Cryptographic Primitives — Ephemeral HMAC-SHA-256 Fingerprinting', () => {
  it('generates consistent HMAC hashes for identical text within the same session', async () => {
    const session = await generateComparisonSessionKey();
    const text = 'empirical findings demonstrate significant correlation';

    const hash1 = await computeHmac(session.key, text);
    const hash2 = await computeHmac(session.key, text);

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64); // 256 bits = 64 hex characters
  });

  it('generates different HMAC hashes for the same text across different sessions', async () => {
    const sessionA = await generateComparisonSessionKey();
    const sessionB = await generateComparisonSessionKey();
    const text = 'empirical findings demonstrate significant correlation';

    const hashA = await computeHmac(sessionA.key, text);
    const hashB = await computeHmac(sessionB.key, text);

    expect(hashA).not.toBe(hashB);
  });

  it('differentiates keyed HMAC from unkeyed SHA-256', async () => {
    const session = await generateComparisonSessionKey();
    const text = 'standard predictable academic phrase';

    const unkeyed = await computeUnkeyedDigest(text);
    const keyed = await computeHmac(session.key, text);

    expect(unkeyed).not.toBe(keyed);
  });
});

describe('Cryptographic Primitives — AES-256-GCM Vault & PBKDF2', () => {
  const sampleRecord: VaultRecord = {
    id: 'test-record-1',
    title: 'Confidential Research Manuscript',
    content: 'Sensitive methodology and preliminary unreleased empirical data.',
    updatedAt: 1729000000000,
  };

  it('successfully encrypts and decrypts a record using the correct passphrase', async () => {
    const passphrase = 'SuperSecurePassphrase!2026';
    const iterations = 10_000; // calibrated for fast unit test execution

    const encrypted = await encryptVaultRecord(passphrase, sampleRecord, iterations);

    expect(encrypted.version).toBe(1);
    expect(encrypted.kdf).toBe('PBKDF2-SHA-256');
    expect(encrypted.saltHex).toHaveLength(32); // 16 bytes = 32 hex chars
    expect(encrypted.ivHex).toHaveLength(24); // 12 bytes = 24 hex chars
    expect(encrypted.cipherHex.length).toBeGreaterThan(0);

    const decrypted = await decryptVaultRecord(passphrase, encrypted);
    expect(decrypted.id).toBe(sampleRecord.id);
    expect(decrypted.title).toBe(sampleRecord.title);
    expect(decrypted.content).toBe(sampleRecord.content);
  });

  it('rejects decryption when an incorrect passphrase is provided', async () => {
    const passphrase = 'CorrectPassphrase123';
    const wrongPassphrase = 'WrongPassphrase999';
    const iterations = 10_000;

    const encrypted = await encryptVaultRecord(passphrase, sampleRecord, iterations);

    await expect(decryptVaultRecord(wrongPassphrase, encrypted)).rejects.toThrowError(
      VaultCryptoError
    );
  });

  it('rejects decryption when ciphertext has been tampered with (1-bit alteration)', async () => {
    const passphrase = 'CorrectPassphrase123';
    const iterations = 10_000;

    const encrypted = await encryptVaultRecord(passphrase, sampleRecord, iterations);

    // Tamper with the ciphertext by flipping a byte
    const originalCipher = encrypted.cipherHex;
    const flippedChar = originalCipher[0] === 'a' ? 'b' : 'a';
    const tamperedPayload = {
      ...encrypted,
      cipherHex: flippedChar + originalCipher.substring(1),
    };

    await expect(decryptVaultRecord(passphrase, tamperedPayload)).rejects.toThrowError(
      VaultCryptoError
    );
  });

  it('generates unique salts and IVs for consecutive encryptions of the same record', async () => {
    const passphrase = 'ConstantPassphrase';
    const iterations = 10_000;

    const enc1 = await encryptVaultRecord(passphrase, sampleRecord, iterations);
    const enc2 = await encryptVaultRecord(passphrase, sampleRecord, iterations);

    expect(enc1.saltHex).not.toBe(enc2.saltHex);
    expect(enc1.ivHex).not.toBe(enc2.ivHex);
    expect(enc1.cipherHex).not.toBe(enc2.cipherHex);
  });
});
