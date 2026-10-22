# HumanizeText — Privacy Policy & Cryptographic Data Handling

## 1. Hybrid Privacy Architecture
HumanizeText offers a dual privacy model: **100% on-device local computation** for users requiring complete air-gapped isolation, alongside **ephemeral Cloudflare edge AI** for users wanting deep neural rewriting without downloading multi-gigabyte models locally.

### Processing Path Classification by Tool

| Feature / Tool | Primary Execution Path | Network Transmission | Data Persistence |
| :--- | :--- | :--- | :--- |
| **Plagiarism Checker** | 100% On-Device (Browser RAM) | **Zero bytes sent**. Uses Web Crypto & Winnowing. | None. Document shingles are discarded upon closing tab. |
| **Encrypted Vault** | 100% On-Device (IndexedDB) | **Zero bytes sent**. AES-256-GCM authenticated cipher. | Ciphertext only in browser IndexedDB; passphrase never stored. |
| **Document Parser** | 100% On-Device (`PDF.js`, `Mammoth.js`) | **Zero bytes sent**. Parsed in browser memory. | None. File buffers discarded after extraction. |
| **Local Humanizer & Paraphraser** | 100% On-Device Heuristic Engine | **Zero bytes sent**. Evaluates syntax & burstiness locally. | None. Plaintext never persisted. |
| **Free Cloud AI Humanizer** | Ephemeral Cloudflare Workers AI | Transmitted via TLS 1.3 to Worker edge. | **Zero disk persistence**. In-memory inference only; never logged to disk or databases. |
| **Semantic Meaning Check** | Ephemeral Cloudflare Workers AI | Transmitted via TLS 1.3 to Worker edge (`/api/compare-meaning`). | **Zero disk persistence**. Cosine similarity computed in RAM and returned. |
| **AI Content Detector** | Hybrid (Local Heuristics / Edge Fallback) | Local by default; optional consented edge evaluation. | Zero retention. Metrics computed in memory. |
| **Custom Key Mode** | Client-to-Provider Direct TLS | Sent directly to Google Gemini or Groq. | Key stored in client `localStorage`; requests bypass HumanizeText servers. |

---

## 2. Technical Data Practices & Substantiation

### Cloudflare Workers AI Ephemeral Processing
When you invoke **Free Cloud AI** or **Semantic Comparison**:
1. Your text payload is transmitted over an encrypted HTTPS/TLS 1.3 connection to our Cloudflare Worker (`https://humanizetext-api.humanizetext.workers.dev`).
2. The Worker executes within Cloudflare's serverless V8 isolate runtime in volatile memory.
3. **Storage Substantiation:** Our Worker implementation attaches no Cloudflare KV, D1 SQL, Vectorize, or Durable Object bindings. Submitted text cannot be stored on disk because no persistent storage bindings exist in the Worker configuration (`wrangler.jsonc`).
4. **Logging Substantiation:** The Worker does not log prompt content, document text, or raw inputs to `console.log` or Cloudflare Logpush.
5. **Model Retraining:** Cloudflare Workers AI does not use customer inference inputs or outputs to retrain foundation models under Cloudflare's standard platform privacy terms.

### On-Device Plagiarism Scanning & Winnowing
- Ephemeral HMAC-SHA-256 session keys are generated in volatile browser memory using `crypto.subtle.generateKey('HMAC', false, ['sign'])`.
- The key is marked non-extractable (`extractable: false`), preventing any browser script from exporting raw key bytes.
- Text is shingled into 5-word n-grams, winnowed with window size $w = 4$, and compared strictly against user-supplied reference files or local corpus buffers.

### Document Parsing Security Boundary
When uploading PDF, DOCX, TXT, or Markdown documents:
- `FileReader` loads binary bytes into an in-memory `ArrayBuffer`.
- `Mammoth.js` unpacks DOCX XML trees inside the browser sandbox.
- `PDF.js` extracts character glyphs locally without external network requests.

### Third-Party Advertising Disclosures
HumanizeText is free to use. To support operational hosting, Google AdSense (`pagead2.googlesyndication.com`) is loaded on public web pages:
- Google may use cookies to serve personalized or non-personalized ads according to your regional consent preferences.
- You can manage or revoke ad tracking through your browser settings or regional cookie preference tools.
- Ad scripts have zero access to your Encrypted Vault keys, document buffers, or submitted text.

---

## 3. How to Clear All Local Data
You can permanently purge all stored encrypted documents and metadata at any time:
1. Navigate to the **Encrypted Vault** tab.
2. Click **Wipe Entire Vault**.
3. Alternatively, clearing your browser site data completely purges IndexedDB and `localStorage`.
