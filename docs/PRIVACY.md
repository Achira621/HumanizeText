# HumanizeText — Privacy Policy & Cryptographic Data Handling

## 1. Fundamental Privacy Principle
HumanizeText was engineered from day one to guarantee that **your private text never leaves your browser**. We do not use third-party AI APIs, cloud processing backends, or telemetry collection systems.

## 2. Technical Data Practices Summary

| Category | Policy / Practice | Technical Verification |
| :--- | :--- | :--- |
| **Document Content** | Never transmitted. Processed 100% locally in browser memory. | Verified via network interception tests & Privacy Lab auditor. |
| **Cryptographic Keys** | Ephemeral comparison keys reside in RAM; vault keys derived dynamically. | W3C Web Crypto non-extractable CryptoKey primitives. |
| **Third-Party Trackers** | None. Zero analytics scripts, tracking pixels, or advertising SDKs. | Strict Content Security Policy without external domains. |
| **Persistent Storage** | Optional AES-GCM encrypted vault in IndexedDB. Plaintext never saved. | Inspected via browser DevTools Storage tab. |
| **Remote Inference** | No remote AI endpoints. Deterministic local rules by default. | Explicit user prompt before downloading optional on-device model. |

## 3. How Document Extraction Works
When you upload a TXT, Markdown, PDF, or DOCX document:
1. The browser's native `FileReader` API reads the file bytes directly into an in-memory `ArrayBuffer`.
2. For Word files, `Mammoth.js` decodes XML parts inside your browser.
3. For PDF files, `PDF.js` extracts text streams inside your browser tab without communicating with external services.
4. The extracted string is immediately passed to our local tokenizer.

## 4. How the Encrypted Vault Works
- If you choose to save a draft to the local vault, your passphrase derives an AES-GCM 256-bit key via PBKDF2-SHA-256 (600,000 iterations).
- A fresh 16-byte random salt and 12-byte random IV are generated for each record.
- Only the resulting ciphertext, salt, IV, and 128-bit authentication tag are stored in the browser's IndexedDB.
- Your passphrase and derived cryptographic key are **never persisted**.

## 5. How to Clear All Local Data
You can permanently erase all stored encrypted documents and metadata at any time:
1. Navigate to the **Encrypted Vault** tab in HumanizeText.
2. Click **Wipe Entire Vault**.
3. Alternatively, clearing your browser cookies and site data for the domain completely purges IndexedDB.
