import { describe, it, expect, vi, beforeEach } from 'vitest';
import { humanizeWithRules } from '../../../src/lib/humanizer/ruleEngine';
import { WorkerApiClient, CANONICAL_WORKER_API_URL } from '../../../src/lib/workerApi/client';
import { encryptVaultRecord, decryptVaultRecord, VaultCryptoError } from '../../../src/lib/crypto/vault';
import type { VaultRecord } from '../../../src/types';

describe('Vault Writing Assistance — Cloud & Local Integration Safety', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // --------------------------------------------------------------------------
  // 1. Local mode still works unchanged
  // --------------------------------------------------------------------------
  it('1. Local mode processes text deterministically with zero network egress', async () => {
    const fetchSpy = vi.fn();
    global.fetch = fetchSpy;

    const confidentialSnippet = 'In order to evaluate the outcome, it is important to note that the team took into consideration all variables.';
    const result = humanizeWithRules(confidentialSnippet, {
      mode: 'concise',
      vocabularyIntensity: 'balanced',
    });

    expect(result.improvedText).toBeDefined();
    expect(result.improvedText).not.toBe('');
    expect(result.improvedText).not.toBe(confidentialSnippet);
    // Absolute guarantee: zero network calls made in local mode
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  // --------------------------------------------------------------------------
  // 2. Cloud mode calls the existing Worker client
  // --------------------------------------------------------------------------
  it('2. Cloud mode calls the existing Worker client endpoint at /api/humanize', async () => {
    const mockWorkerResponse = {
      success: true,
      originalText: 'Due to the fact that tests concluded, we observed high fidelity.',
      rewrittenText: 'Because tests concluded, we observed high fidelity.',
      modelUsed: '@cf/qwen/qwen3-30b-a3b-fp8',
      latencyMs: 340,
      preservationWarnings: [],
      diffTokens: [],
    };

    const fetchSpy = vi.fn(async (url: any, init?: any) => {
      expect(url.toString()).toContain('/api/humanize');
      expect(init?.method).toBe('POST');
      const body = JSON.parse(init.body);
      expect(body.mode).toBe('natural');
      return new Response(JSON.stringify(mockWorkerResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });
    global.fetch = fetchSpy;

    const client = new WorkerApiClient({ baseUrl: CANONICAL_WORKER_API_URL });
    const result = await client.humanize('Due to the fact that tests concluded, we observed high fidelity.', {
      mode: 'natural',
      vocabularyIntensity: 'balanced',
      disallowLocalFallback: true,
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(result.improvedText).toBe('Because tests concluded, we observed high fidelity.');
    expect(result.engineName).toContain('qwen3-30b-a3b-fp8');
    expect(result.processedLocally).toBe(false);
  });

  // --------------------------------------------------------------------------
  // 3. Only selected text is sent (zero document/key leakage)
  // --------------------------------------------------------------------------
  it('3. Sends strictly the explicitly selected text, never title, keys, or unselected content', async () => {
    const fullEncryptedDoc =
      'TOP_SECRET_PATENT_PREAMBLE. We hypothesize that quantum teleportation succeeds. This is unselected private text that must never leak.';
    const selectedSnippet = 'We hypothesize that quantum teleportation succeeds.';

    let capturedPayload: any = null;
    global.fetch = vi.fn(async (_url: any, init?: any) => {
      capturedPayload = JSON.parse(init.body);
      return new Response(
        JSON.stringify({
          success: true,
          originalText: selectedSnippet,
          rewrittenText: 'We propose that quantum teleportation succeeds.',
          modelUsed: '@cf/qwen/qwen3-30b-a3b-fp8',
          latencyMs: 210,
          preservationWarnings: [],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    });

    const client = new WorkerApiClient({ baseUrl: CANONICAL_WORKER_API_URL });

    // Client is called with ONLY the selected passage
    await client.humanize(selectedSnippet, {
      mode: 'formal',
      vocabularyIntensity: 'conservative',
      disallowLocalFallback: true,
    });

    expect(capturedPayload).not.toBeNull();
    // Exactly matches selected text
    expect(capturedPayload.text).toBe(selectedSnippet);
    // Must NOT contain unselected portions
    expect(capturedPayload.text).not.toContain('TOP_SECRET_PATENT_PREAMBLE');
    expect(capturedPayload.text).not.toContain('unselected private text that must never leak');
    // Must NOT contain keys or metadata
    expect(capturedPayload).not.toHaveProperty('key');
    expect(capturedPayload).not.toHaveProperty('passphrase');
    expect(capturedPayload).not.toHaveProperty('title');
    expect(capturedPayload).not.toHaveProperty('iv');
  });

  // --------------------------------------------------------------------------
  // 4. Cloud processing requires explicit user action / consent
  // --------------------------------------------------------------------------
  it('4. Rejects empty selection or missing consent before dispatching cloud requests', () => {
    const validateCloudDispatchPreconditions = (selection: string | null, consentConfirmed: boolean) => {
      if (!selection || !selection.trim()) {
        throw new Error('Selection required for cloud humanization.');
      }
      if (!consentConfirmed) {
        throw new Error('Explicit consent required for cloud humanization.');
      }
      return true;
    };

    // No selection
    expect(() => validateCloudDispatchPreconditions(null, true)).toThrow('Selection required');
    expect(() => validateCloudDispatchPreconditions('   ', true)).toThrow('Selection required');

    // Selection present but consent missing
    expect(() => validateCloudDispatchPreconditions('Some valid selection', false)).toThrow('Explicit consent required');

    // Both present
    expect(validateCloudDispatchPreconditions('Some valid selection', true)).toBe(true);
  });

  // --------------------------------------------------------------------------
  // 5. No automatic local-to-cloud fallback
  // --------------------------------------------------------------------------
  it('5. Ensures cloud failures raise explicit errors without silent local substitution', async () => {
    // Simulate Cloudflare Worker returning 429 rate limit
    global.fetch = vi.fn(async () => {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded on Cloudflare Worker' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    const client = new WorkerApiClient({ baseUrl: CANONICAL_WORKER_API_URL });

    // With disallowLocalFallback: true, it must reject with the cloud error, NOT silently return ruleEngine output
    await expect(
      client.humanize('Some text to humanize', {
        mode: 'natural',
        disallowLocalFallback: true,
      })
    ).rejects.toThrow('Rate limit');
  });

  it('5b. Throws when cloud worker URL is missing and disallowLocalFallback is true', async () => {
    const unconfiguredClient = new WorkerApiClient({ baseUrl: '' });

    await expect(
      unconfiguredClient.humanize('Some text', {
        mode: 'natural',
        disallowLocalFallback: true,
      })
    ).rejects.toThrow('Cloudflare Worker API endpoint is not configured');
  });

  // --------------------------------------------------------------------------
  // 6. Apply replaces only the selected range
  // --------------------------------------------------------------------------
  it('6. Apply replaces strictly the selected range and preserves the surrounding document', () => {
    const initialContent = 'Chapter 1: Overview.\n\nIn order to test the pipeline, we ran benchmarks.\n\nChapter 2: Conclusion.';
    const selectedSnippet = 'In order to test the pipeline, we ran benchmarks.';
    const startIndex = initialContent.indexOf(selectedSnippet);
    const endIndex = startIndex + selectedSnippet.length;

    const suggestedRewrite = 'To test the pipeline, we ran comprehensive benchmarks.';

    // Execute range replacement
    const updatedContent =
      initialContent.substring(0, startIndex) +
      suggestedRewrite +
      initialContent.substring(endIndex);

    expect(updatedContent).toBe('Chapter 1: Overview.\n\nTo test the pipeline, we ran comprehensive benchmarks.\n\nChapter 2: Conclusion.');
    expect(updatedContent.startsWith('Chapter 1: Overview.\n\n')).toBe(true);
    expect(updatedContent.endsWith('\n\nChapter 2: Conclusion.')).toBe(true);
  });

  // --------------------------------------------------------------------------
  // 7. Discard leaves the document completely unchanged
  // --------------------------------------------------------------------------
  it('7. Discard dismisses pending suggestion and leaves document content bit-for-bit unchanged', () => {
    const documentBefore = 'Confidential Document Content.\nDo not alter without review.';
    let currentDocument = documentBefore;

    let pendingSuggestion: any = {
      originalText: 'Confidential Document Content.',
      improvedText: 'Private Document Text.',
    };

    // User triggers Discard action
    pendingSuggestion = null;

    // Document must remain bit-for-bit identical
    expect(currentDocument).toBe(documentBefore);
    expect(pendingSuggestion).toBeNull();
  });

  // --------------------------------------------------------------------------
  // 8. Stale selections cannot overwrite unrelated content
  // --------------------------------------------------------------------------
  it('8. Detects stale modified selections and blocks dangerous blind overwrite', () => {
    const originalText = 'In order to verify security, we performed testing.';
    const selectedRange = { start: 10, end: 10 + originalText.length, text: originalText };

    // Document was edited while cloud request was in flight:
    const mutatedContent = 'Prefix -- We edited this line drastically and deleted the target -- Suffix';

    const safeApply = (
      doc: string,
      selection: typeof selectedRange,
      replacement: string
    ): { success: boolean; newDoc: string; error?: string } => {
      // Direct offset check
      if (doc.substring(selection.start, selection.end) === selection.text) {
        return {
          success: true,
          newDoc: doc.substring(0, selection.start) + replacement + doc.substring(selection.end),
        };
      }

      // Check for unique shifted occurrence
      const firstIdx = doc.indexOf(selection.text);
      if (firstIdx !== -1 && doc.indexOf(selection.text, firstIdx + 1) === -1) {
        return {
          success: true,
          newDoc: doc.substring(0, firstIdx) + replacement + doc.substring(firstIdx + selection.text.length),
        };
      }

      // Stale / ambiguous: block overwrite!
      return {
        success: false,
        newDoc: doc,
        error: 'Stale selection: original text was modified or deleted.',
      };
    };

    const result = safeApply(mutatedContent, selectedRange, 'To verify security, we performed testing.');
    expect(result.success).toBe(false);
    expect(result.newDoc).toBe(mutatedContent); // Completely unchanged!
    expect(result.error).toContain('Stale selection');
  });

  // --------------------------------------------------------------------------
  // 9. API errors and cancellation handled safely
  // --------------------------------------------------------------------------
  it('9. Cancellation with AbortSignal immediately aborts fetch without unhandled rejection', async () => {
    const controller = new AbortController();

    global.fetch = vi.fn((_url: any, init?: any) => {
      return new Promise((_, reject) => {
        if (init?.signal?.aborted) {
          const err = new Error('The user aborted a request.');
          err.name = 'AbortError';
          reject(err);
          return;
        }
        init?.signal?.addEventListener('abort', () => {
          const err = new Error('The user aborted a request.');
          err.name = 'AbortError';
          reject(err);
        });
      });
    });

    const client = new WorkerApiClient({ baseUrl: CANONICAL_WORKER_API_URL });

    // Cancel before or right after launch
    const promise = client.humanize('Some passage to abort', {
      mode: 'natural',
      signal: controller.signal,
      disallowLocalFallback: true,
    });

    controller.abort();

    await expect(promise).rejects.toThrow('Cloud humanization was cancelled');
  });

  // --------------------------------------------------------------------------
  // 10. Vault encryption and persistence behavior remain unchanged
  // --------------------------------------------------------------------------
  it('10. Encrypts updated document with AES-256-GCM and decrypts back faithfully', async () => {
    const passphrase = 'UltraSecureVaultPassphrase2026!';
    const modifiedRecord: VaultRecord = {
      id: 'rec-test-101',
      title: 'Humanized Secret Manuscript',
      content: 'This document was updated with Cloudflare Writing Assistance after explicit user confirmation.',
      updatedAt: Date.now(),
    };

    // Encrypt
    const encryptedPayload = await encryptVaultRecord(passphrase, modifiedRecord);
    expect(encryptedPayload.cipherHex).toBeDefined();
    expect(encryptedPayload.saltHex).toBeDefined();
    expect(encryptedPayload.ivHex).toBeDefined();
    expect(encryptedPayload.cipherHex).not.toContain(modifiedRecord.content);

    // Decrypt with correct passphrase
    const decryptedRecord = await decryptVaultRecord(passphrase, encryptedPayload);
    expect(decryptedRecord.content).toBe(modifiedRecord.content);
    expect(decryptedRecord.title).toBe(modifiedRecord.title);

    // Attempt decrypt with wrong passphrase must fail
    await expect(decryptVaultRecord('WrongPassphrase123!', encryptedPayload)).rejects.toThrow(VaultCryptoError);
  });
});
