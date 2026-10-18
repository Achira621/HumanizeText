# HumanizeText — Threat Model & Security Evaluation

## 1. Trust Assumptions & Boundary Definitions
- **Trust Boundary:** The browser application sandbox and origin (`https://humanizetext.pages.dev`).
- **Trusted Elements:** The user's local operating system, browser JS execution engine, and the W3C Web Crypto implementation.
- **Untrusted Elements:** Public networks, external third-party servers, browser extensions (unless scoped), and untrusted user-uploaded document files (PDFs, DOCX).

## 2. Security Objectives & Guarantees
1. **Confidentiality of User Documents:** Manuscripts and text entered into HumanizeText must never be transmitted over the network to any server.
2. **Key Material Secrecy:** Ephemeral HMAC keys and vault derivation keys must reside strictly in RAM and never be persisted to unencrypted storage.
3. **Integrity & Authenticity of Encrypted Vault:** Ciphertext stored in IndexedDB must be protected against tampering. Any bit flipped in ciphertext must trigger immediate authentication rejection upon decryption attempts.
4. **Resilience to Rainbow Table Attacks:** Shingles generated for similarity analysis must not be susceptible to offline dictionary recovery.

## 3. Threat Vectors & Countermeasures

### 3.1 Network Eavesdropping & Data Exfiltration
- **Threat:** An adversary monitoring network traffic attempts to intercept sensitive drafts or extracted sentences.
- **Mitigation:** HumanizeText makes zero outbound HTTP requests for document processing. All transformations and comparisons execute client-side. Content Security Policy (`connect-src 'self'`) restricts network egress.

### 3.2 Precomputation / Rainbow Table Attacks on Shingles
- **Threat:** Because word shingles are short (e.g. 5 words), an attacker with a database of precomputed SHA-256 hashes of standard English sentences could reverse unkeyed hashes.
- **Mitigation:** HumanizeText enforces **Keyed HMAC-SHA-256** using an ephemeral 256-bit secret key generated in RAM per comparison session. Without knowledge of the ephemeral session key, precomputed hash dictionaries are rendered useless.

### 3.3 Ciphertext Tampering & Bit-Flipping in Local Vault
- **Threat:** A local attacker or malicious script modifies ciphertext blocks stored in IndexedDB to alter document contents.
- **Mitigation:** HumanizeText uses **AES-256-GCM** with a 128-bit authentication tag. Web Crypto's authenticated decryption validates the integrity of the ciphertext and initialization vector before returning plaintext. Any alteration causes an `OperationError`, which our code maps to `WRONG_PASSPHRASE_OR_CORRUPT`.

### 3.4 Weak Password Brute-Force on Stored Records
- **Threat:** An adversary obtains a backup of the user's IndexedDB file and attempts GPU brute force against the encrypted vault records.
- **Mitigation:** HumanizeText employs **PBKDF2-SHA-256** with **600,000 iterations** (following modern OWASP guidelines) combined with a cryptographically random 16-byte salt generated per record via `crypto.getRandomValues`.

### 3.5 Malformed Document Payloads (PDF/DOCX Exploits)
- **Threat:** An attacker supplies a maliciously crafted PDF or Word document designed to execute script injection or buffer overflow in parsing libraries.
- **Mitigation:** Parsing is constrained to sandboxed JS parsers (`mammoth` for DOCX and `pdfjs-dist` for PDF). PDF script execution and eval are explicitly disabled (`isEvalSupported: false`). Extracted strings are rendered solely as text, eliminating HTML/XSS injection.

## 4. Residual Risks & Non-Claims
- **Compromised Host Machine:** If the user's machine contains keyloggers, screen scrapers, or spyware, browser-level cryptography cannot protect the entered plaintext.
- **Malicious Browser Extensions:** Extensions with broad `<all_urls>` content-script permissions can inspect the DOM and read textarea inputs. Users are advised to run sensitive checks in private/incognito windows with extensions disabled.
- **Internet-Wide Plagiarism Claim:** The similarity engine only checks against documents explicitly loaded into the session corpus. It cannot detect copying from documents that have not been provided to the browser.
