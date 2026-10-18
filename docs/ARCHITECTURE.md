# HumanizeText — System Architecture Specification

## 1. Executive Architecture Summary
HumanizeText is a zero-server, privacy-first progressive web application combining on-device text humanization with cryptographic plagiarism and similarity detection.

The system is deployed as static assets to Cloudflare Pages. It has no backend API routes, requires no user accounts or authentication, accesses no remote inference endpoints, and interacts with no remote database servers.

```
+-------------------------------------------------------------------------+
|                              USER BROWSER                               |
|                                                                         |
|  +--------------------+     +----------------------------------------+  |
|  |     REACT UI       |     |          LOCAL HUMANIZER               |  |
|  |  - Main Editor     |<--->|  - Deterministic Rule Engine           |  |
|  |  - Workspace       |     |  - Optional Browser WebGPU Engine      |  |
|  |  - Privacy Lab     |     +----------------------------------------+  |
|  +---------+----------+                                                 |
|            |                                                            |
|  +---------v----------+     +----------------------------------------+  |
|  | DOCUMENT PARSER    |     |           SIMILARITY ENGINE            |  |
|  |  - Native FileReader----->  - Unicode Tokenizer & Normalizer      |  |
|  |  - Mammoth (DOCX)  |     |  - Word Shingling (N-grams)            |  |
|  |  - PDF.js (PDF)    |     |  - Winnowing Algorithm (W=4, N=5)      |  |
|  +--------------------+     |  - Ephemeral HMAC-SHA-256 Hashes       |  |
|                             |  - Passage Reconstruction & Metrics    |  |
|                             +-------------------+--------------------+  |
|                                                 |                       |
|  +----------------------------------------------v--------------------+  |
|  |                   W3C WEB CRYPTO API                              |  |
|  |  - SHA-256 Document Integrity Digests (Raw vs Normalized)          |  |
|  |  - HMAC-SHA-256 Ephemeral Session Fingerprints                    |  |
|  |  - AES-256-GCM Authenticated Encryption (128-bit Auth Tag)        |  |
|  |  - PBKDF2-SHA-256 Key Derivation (600,000 Iterations)             |  |
|  +----------------------------------------------+--------------------+  |
|                                                 |                       |
|  +----------------------------------------------v--------------------+  |
|  |                   INDEXEDDB LOCAL VAULT                           |  |
|  |  - Ciphertext + 16B Salt + 12B IV + Auth Tag + Public Metadata    |  |
|  |  - ZERO Plaintext Disk Storage                                    |  |
|  +-------------------------------------------------------------------+  |
+-------------------------------------------------------------------------+
```

## 2. Core Modules & Responsibilities

### 2.1 Presentation Layer (`src/components/`)
- Built with React 19, TypeScript (strict mode), and Tailwind CSS.
- Adheres to an editorial design aesthetic: warm off-white and deep charcoal backgrounds, graphite surfaces, restrained mint/lime green accents (`#2E7955`), and accessible contrast.
- Fully responsive across desktop, tablet, and mobile with keyboard accessible navigation and visible focus rings.

### 2.2 Document Processing Module (`src/lib/documents/`)
- Accepts `.txt`, `.md`, `.docx`, and `.pdf` files up to a 25 MB safety limit.
- Executes extraction completely within the browser tab:
  - Text & Markdown: Browser `FileReader` / `File.text()`.
  - Word DOCX: `mammoth.js` via raw ArrayBuffer parsing.
  - PDF: `pdfjs-dist` reading text stream items page-by-page.
- Extracted text is treated as untrusted data and rendered strictly as text nodes, never interpolated into raw HTML.

### 2.3 Cryptography Layer (`src/lib/crypto/`)
- **Document Integrity (`digest.ts`):** Calculates both Raw SHA-256 (byte-exact) and Normalized SHA-256 (NFC Unicode, collapsed whitespace). Clarifies to users that digest checksums are for tamper/integrity detection, not similarity measurement.
- **Keyed Fingerprints (`hmac.ts`):** Generates an in-memory 256-bit HMAC key via `crypto.subtle.generateKey` scoped to a single document comparison session. Generates keyed fingerprints of word shingles.
- **Local Vault Encryption (`vault.ts`):** Implements authenticated encryption using AES-256-GCM. Derives 256-bit symmetric keys from user passphrases using PBKDF2-SHA-256 at 600,000 iterations. Every record is encrypted with a fresh 16-byte random salt and 12-byte random IV.
- **Hardware Benchmarks (`benchmarks.ts`):** Measures on-device PBKDF2 derivation latency across 100k, 300k, and 600k iterations.

### 2.4 Similarity Module (`src/lib/similarity/`)
- **Tokenizer (`tokenizer.ts`):** Splits text into words using Unicode category properties (`\p{L}\p{N}`) and records character start/end coordinates for highlighting.
- **Shingler (`shingles.ts`):** Assembles overlapping n-grams (default $n=5$ words).
- **Winnowing (`winnowing.ts`):** Implements the Schleimer-Wilkerson-Aiken winnowing algorithm with window size $W=4$, selecting the rightmost minimum hash in each sliding window. Guarantees that any matching passage $\ge (W + N - 1) = 8$ words will be captured.
- **Reconstruction Engine (`engine.ts`):** Matches submitted winnowed fingerprints against the reference index, merges adjacent hits into contiguous passages, and calculates the transparent overlap ratio:
  $$\text{Overlap \%} = \frac{\text{Unique Matched Words in Submitted Document}}{\text{Total Words in Submitted Document}} \times 100$$
- **Reporter (`reporter.ts`):** Exports structured audit reports in JSON, plain TXT, or standalone safe HTML with HTML entity escaping.

### 2.5 Local Humanizer Engine (`src/lib/humanizer/`)
- **Modular Interface (`LocalHumanizerEngine`):** Allows seamless swapping between rule-based transformation and browser WebGPU models.
- **Deterministic Rule Engine (`ruleEngine.ts`):** Real, working linguistic transformation rules covering five writing modes:
  - *More Natural:* Replaces robotic clichés ("delve into", "tapestry of", "testament to") and bureaucratic jargon.
  - *Clearer & Concise:* Eliminates pleonasms ("in order to" -> "to", "due to the fact that" -> "because", "at this point in time" -> "now").
  - *Conversational:* Injects natural contractions and active rhythm.
  - *Formal & Academic:* Expands contractions and elevates casual terms.
  - *Sentence Flow:* Balances transition phrases and cleans punctuation spacing.
  - Strictly preserves authorial meaning and factual claims. Never fabricates citations or statistics.
- **Optional Browser AI (`browserAiEngine.ts`):** Explicitly indicates model size (145 MB) and WebGPU requirements. Never initiates download without user consent, and never secretly falls back to cloud APIs.
