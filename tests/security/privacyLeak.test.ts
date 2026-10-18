import { describe, it, expect, vi } from 'vitest';
import { SimilarityEngine } from '../../src/lib/similarity/engine';
import { RuleBasedHumanizerEngine } from '../../src/lib/humanizer/ruleEngine';
import { encryptVaultRecord, decryptVaultRecord } from '../../src/lib/crypto/vault';

describe('Security & Privacy — Zero Network Leak Verification', () => {
  it('performs full document humanization without invoking fetch or network APIs', async () => {
    const sensitiveManuscript =
      'CONFIDENTIAL_PATENT_APPLICATION_TEXT_DO_NOT_LEAK: At this point in time, in order to test quantum coherence...';

    // Spy on global fetch
    const fetchSpy = vi.fn();
    global.fetch = fetchSpy;

    const engine = new RuleBasedHumanizerEngine();
    const result = await engine.process(sensitiveManuscript, { mode: 'concise' });

    // Assert fetch was never called
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result.improvedText).not.toBe('');
  });

  it('performs similarity comparison and winnowed HMAC fingerprinting with zero outbound requests', async () => {
    const sensitiveDoc =
      'CLASSIFIED_THESIS_CHAPTER_7: Due to the fact that empirical observations confirmed the hypothesis...';
    const referenceDoc =
      'PRIOR_WORK: Due to the fact that empirical observations confirmed the hypothesis in standard models...';

    const outboundCalls: string[] = [];
    global.fetch = vi.fn(async (url: any, _init?: any) => {
      outboundCalls.push(typeof url === 'string' ? url : url.toString());
      return new Response('{}');
    });

    const report = await SimilarityEngine.compareDocuments(
      sensitiveDoc,
      'ClassifiedManuscript.txt',
      [{ id: 'ref-1', name: 'PriorWork.txt', text: referenceDoc }]
    );

    // Assert zero outbound calls occurred during similarity pipeline
    expect(outboundCalls).toHaveLength(0);
    expect(report.matchedPassagesCount).toBeGreaterThanOrEqual(1);

    // Verify neither plaintext nor ephemeral key material leaked into URL or parameters
    for (const call of outboundCalls) {
      expect(call).not.toContain(sensitiveDoc);
      expect(call).not.toContain(report.ephemeralKeyFingerprintSha256);
    }
  });

  it('performs vault encryption and decryption with zero network leakage', async () => {
    const fetchSpy = vi.fn();
    global.fetch = fetchSpy;

    const secretRecord = {
      id: 'private-vault-item',
      title: 'Top Secret Research',
      content: 'CONFIDENTIAL_VAULT_RECORD_CONTENT_123456',
      updatedAt: Date.now(),
    };

    const passphrase = 'UltraSecretPassphrase!2026';
    const encrypted = await encryptVaultRecord(passphrase, secretRecord, 5_000);
    const decrypted = await decryptVaultRecord(passphrase, encrypted);

    expect(decrypted.content).toBe(secretRecord.content);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
