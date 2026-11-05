# HumanizeText Vault: Cloud Writing Assistance Integration Audit

## 1. Executive Summary

This engineering audit documents the integration of the main Cloudflare Worker humanization service into the HumanizeText Security Vault's Writing Assistance feature.

The Security Vault utilizes zero-knowledge client-side encryption (AES-256-GCM with PBKDF2-SHA-256 key derivation at 600,000 iterations). Documents reside encrypted in browser IndexedDB and are decrypted strictly in-memory.

This integration provides users with a choice between:
1. **Local Assistance (Default):** 100% on-device deterministic rule engine with zero network egress.
2. **Cloud Humanization (Opt-In):** Main Cloudflare Workers AI edge model (`@cf/qwen/qwen3-30b-a3b-fp8`) for rich neural rewriting and cadence enhancements.

The integration enforces strict cryptographic zero-knowledge boundaries:
- Full documents cannot be sent to the Cloudflare Worker blindly; cloud processing strictly requires an explicit passage selection.
- Only the explicitly highlighted passage is transmitted over TLS to `/api/humanize`.
- Document encryption keys, passphrases, salts, IVs, document titles, and unselected text never leave the browser.
- Cloud processing requires explicit opt-in confirmation for each action.
- Suggestions enter a mandatory **Review-Before-Apply** staging panel with comparison views, word count deltas, and stale-selection range safety checks before replacing any document text.

---

## 2. Architecture & Request Flow

```
+-----------------------------------------------------------------------------------------+
|                               Browser Memory (Client-Side)                              |
|                                                                                         |
|   +-----------------------+           PBKDF2-SHA-256 Key Derivation (600,000 iter)      |
|   | Encrypted IndexedDB   |  =======================================================>   |
|   | AES-256-GCM Payload   |                                                             |
|   +-----------------------+                                                             |
|              |                                                                          |
|              v                                                                          |
|   +-----------------------+                                                             |
|   | Decrypted Document    |                                                             |
|   | In-Memory Only        |                                                             |
|   +-----------------------+                                                             |
|              |                                                                          |
|              v                                                                          |
|   +-----------------------+                                                             |
|   | Text Selection Range  |  ==> Highlighted passage [startOffset, endOffset]           |
|   +-----------------------+                                                             |
|              |                                                                          |
|     +--------+--------+                                                                 |
|     |                 |                                                                 |
|     v                 v                                                                 |
|  [Local Mode]   [Cloud Mode]                                                            |
|  (Default)      (Opt-in with Consent)                                                   |
|     |                 |                                                                 |
|     |                 | HTTPS POST /api/humanize                                        |
|     |                 | Payload: { text: selectedPassage, mode, vocabularyIntensity }   |
|     |                 v                                                                 |
|     |           +---------------------------------------+                               |
|     |           | Cloudflare Workers AI Edge Service    |                               |
|     |           | @cf/qwen/qwen3-30b-a3b-fp8 (Free Tier)|                               |
|     |           | In-Memory Inference (No Logs/Storage) |                               |
|     |           +---------------------------------------+                               |
|     |                 |                                                                 |
|     |                 | JSON Response { rewrittenText, invariants, timing }             |
|     |                 v                                                                 |
|     +--------+--------+                                                                 |
|              |                                                                          |
|              v                                                                          |
|   +-------------------------------------------------------------------+                 |
|   | Review-Before-Apply Panel                                         |                 |
|   | - Original vs. Suggestion Comparison                              |                 |
|   | - Range Match Verification: content.substring(start, end) == text |                 |
|   | - Stale Selection Shift Detection & Conflict Guard                |                 |
|   +-------------------------------------------------------------------+                 |
|              |                                                                          |
|         +----+----+                                                                     |
|         |         |                                                                     |
|     [Discard]  [Apply]                                                                  |
|         |         |                                                                     |
|         v         v                                                                     |
|    (No Op)    Replace Range [start..end]                                                |
|               Push to Undo/Redo Stack                                                   |
|               AES-GCM Re-encrypt & Save to IndexedDB                                    |
+-----------------------------------------------------------------------------------------+
```

---

## 3. Privacy & Zero-Knowledge Guarantees

| Invariant | Implementation Mechanism | Verification Test |
| :--- | :--- | :--- |
| **Zero Passphrase Transmission** | Passphrase is held strictly in component state and used solely for `deriveKeyFromPassphrase` | Verified in Test 3 & Test 10 |
| **Zero Encryption Key Leakage** | CryptoKey objects are initialized as `extractable: false` and never serialized | Verified in `privacyLeak.test.ts` |
| **Selected-Only Transmission** | Only `selectedRange.text.trim()` is passed to `WorkerApiClient.humanize` | Verified in Test 3 |
| **Unselected Content Isolation** | Unselected document text, headers, and document titles are excluded from request payloads | Verified in Test 3 |
| **No Silent Cloud Fallback** | `disallowLocalFallback: true` ensures network/quota errors are surfaced to user; local engine is never silently used pretending cloud succeeded | Verified in Test 5 & 5b |
| **Per-Action Explicit Consent** | UI disables cloud submission until user checks authorization disclosure for the current passage | Verified in Test 4 |
| **Stale Selection Protection** | Document range integrity check verifies offsets and original text before applying changes; modified selections are blocked | Verified in Test 8 |
| **Zero Cloud Document Opening** | Decryption occurs 100% in browser memory with Web Crypto API | Verified in Test 10 |

---

## 4. Canonical Endpoint & Request Contract

- **Canonical Production Endpoint:** `https://humanizetext-api.humanizetext.workers.dev` (defined in `CANONICAL_WORKER_API_URL` and `.env.local` / `VITE_WORKER_API_URL`).
- **Endpoint Route:** `POST /api/humanize`
- **Request Schema:**
  ```json
  {
    "text": "<Selected passage string>",
    "mode": "natural" | "conversational" | "formal" | "concise" | "flow",
    "vocabularyIntensity": "conservative" | "balanced" | "dynamic" | "maximum",
    "rewriteStrength": "balanced",
    "freezeQuotes": true,
    "smartContractions": true
  }
  ```
- **Response Schema:**
  ```json
  {
    "success": true,
    "originalText": "<Original selection>",
    "rewrittenText": "<Humanized selection>",
    "modelUsed": "@cf/qwen/qwen3-30b-a3b-fp8",
    "diffTokens": [...],
    "invariants": { ... },
    "preservationWarnings": [],
    "latencyMs": 340
  }
  ```

---

## 5. Changed Files Inventory

1. `src/types/index.ts`:
   - Added `signal?: AbortSignal` to `HumanizerOptions` for caller cancellation support.
   - Added `disallowLocalFallback?: boolean` to enforce explicit cloud failure reporting.
2. `src/lib/workerApi/client.ts`:
   - Added `CANONICAL_WORKER_API_URL` export (`https://humanizetext-api.humanizetext.workers.dev`).
   - Upgraded `WorkerApiClient` constructor to default fallback to `CANONICAL_WORKER_API_URL` when `VITE_WORKER_API_URL` is unset.
   - Added `signal?: AbortSignal` listener to `AbortController` in `humanize()`.
   - Added `disallowLocalFallback` check to prevent silent local emulation fallback when remote cloud processing is explicitly requested.
3. `src/components/vault/VaultWritingAssistant.tsx`:
   - Added processing engine selector: Local Assistance (default) vs Cloud Humanization.
   - Added precise `selectedRange` tracking (`{ start, end, text }`) on the decrypted editor `<textarea>`.
   - Added zero-knowledge security precondition guards requiring text selection and explicit authorization before Cloud dispatch.
   - Added Cloud Privacy Disclosure card with explicit confirmation.
   - Added in-flight processing status with user cancellation (`AbortController`).
   - Added Review-Before-Apply staging panel with side-by-side / stacked comparison, word count deltas, and invariant check indicators.
   - Added stale selection detection: verifies `content.substring(start, end) === text` and handles unique offset shifts, while blocking corrupted overwrites.
   - Added Discard button (leaving document bit-for-bit untouched) and Copy button.
   - Added accessible ARIA regions, alerts, and roles.
4. `tests/unit/vault/vaultCloudWritingAssistance.test.ts`:
   - Comprehensive 11-test validation suite covering all functional and security requirements.

---

## 6. Test Suite & Verification Results

```
 RUN  v5.0.5 D:/humanizeText

 ✓ tests/unit/crypto.test.ts (9 tests) 42ms
 ✓ tests/unit/workerPipeline.test.ts (12 tests) 75ms
 ✓ tests/security/privacyLeak.test.ts (3 tests) 37ms
 ✓ tests/unit/vault/vaultCloudWritingAssistance.test.ts (11 tests) 383ms
   ✓ 1. Local mode processes text deterministically with zero network egress
   ✓ 2. Cloud mode calls the existing Worker client endpoint at /api/humanize
   ✓ 3. Sends strictly the explicitly selected text, never title, keys, or unselected content
   ✓ 4. Rejects empty selection or missing consent before dispatching cloud requests
   ✓ 5. Ensures cloud failures raise explicit errors without silent local substitution
   ✓ 5b. Throws when cloud worker URL is missing and disallowLocalFallback is true
   ✓ 6. Apply replaces strictly the selected range and preserves the surrounding document
   ✓ 7. Discard dismisses pending suggestion and leaves document content bit-for-bit unchanged
   ✓ 8. Detects stale modified selections and blocks dangerous blind overwrite
   ✓ 9. Cancellation with AbortSignal immediately aborts fetch without unhandled rejection
   ✓ 10. Encrypts updated document with AES-256-GCM and decrypts back faithfully

 Test Files  4 passed (4)
      Tests  35 passed (35)
```

- **Typecheck (`npx tsc -b`):** 0 errors.
- **Production Build (`npm run build`):** 0 errors, prerender completed for all 16 routes.
