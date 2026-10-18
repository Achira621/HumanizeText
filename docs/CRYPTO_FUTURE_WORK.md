# HumanizeText — Future Cryptography & Protocol Roadmap

This document outlines cryptographic protocols evaluated for future releases of HumanizeText. None of these advanced multi-party or zero-knowledge protocols are claimed as implemented in MVP v1.0, which relies on on-device Web Crypto primitives.

---

## 1. Private Set Intersection (PSI) for Remote Reference Repositories

### Proposed Design
When querying a large institutional reference corpus (e.g. university dissertations) hosted on an external server:
- The client hashes its winnowed shingles into a set $X = \{x_1, \dots, x_n\}$.
- The server holds corpus shingles $Y = \{y_1, \dots, y_m\}$.
- Using **ECDH-PSI** or **Vector-OPRF PSI (VOLE-PSI)**:
  1. The client blinds its elements: $H(x_i)^{k_c}$.
  2. The server blinds with key $k_s$: $H(x_i)^{k_c \cdot k_s}$ and sends its blinded set $\{H(y_j)^{k_s \cdot k_c}\}$.
  3. The client computes the intersection $|X \cap Y|$ without revealing any non-matching shingles to the server, and without downloading the entire institutional database.

### Communication & Computation Costs
- **Communication:** $O(n + m)$ or $O(n \log m)$ using polynomial hashing. For $n = 5,000$ shingles, payload size is $\approx 160\text{ KB}$.
- **Latency:** $\approx 350\text{ ms}$ over typical consumer broadband.

---

## 2. Fuzzy Private Set Intersection (Fuzzy PSI)

### Proposed Design
Standard PSI only identifies identical shingles. To handle minor typos, inflections, or small phrasing edits:
- Map shingles into MinHash or SimHash sketches.
- Apply locality-sensitive bucketing such that shingles within Hamming distance $d \le 2$ fall into colliding buckets.
- Execute PSI within colliding buckets.

### Trade-offs & Leakage
- **False Positives:** Higher false-positive rates for common sentence prefixes.
- **Leakage:** Bucket occupancy reveals approximate document distribution to the server.

---

## 3. Homomorphic Encrypted String Comparison (FHE)

### Protocol Mechanics
Using leveled BFV (Brakerski-Fan-Vercauteren) or CKKS:
- Client encrypts vector embeddings or token matrices: $\text{Enc}_{pk}(T_{\text{client}})$.
- Server homomorphically computes inner products: $\text{Enc}_{pk}(\langle T_{\text{client}}, T_{\text{corpus}} \rangle)$.
- Client decrypts score: $\text{Dec}_{sk}(\dots)$.

### Practical Roadblocks
- Ciphertext expansion ($\approx 100\text{ MB}$ for modest documents).
- Browser WebAssembly FHE runtimes (e.g., Microsoft SEAL compiled to WASM) require $> 1.5\text{ GB}$ heap memory and several seconds per comparison, which is unacceptable for standard client devices.

---

## 4. Semantic Vector Embeddings & Inversion Leakage Risks

### Security Warning
Many commercial AI tools propose "private search" by converting documents into 768-dimensional or 1536-dimensional neural vector embeddings (e.g., OpenAI `text-embedding-3`, BGE) and uploading embeddings to a vector database.

**HumanizeText explicitly rejects uploading raw embeddings to remote servers.**
- **Embedding Inversion Attacks:** Research (Morris et al., 2023; Song et al., 2024) proves that high-dimensional vector embeddings can be inverted using decoder networks to reconstruct up to 80–90% of the verbatim original text.
- Treating embeddings as "anonymized" or "private" is a dangerous fallacy.

---

## 5. Zero-Knowledge Proofs of Originality (zk-SNARKs)

### Concrete Claims Provable via ZK
A user could generate a client-side zk-SNARK (using Halo2 or Noir in WebAssembly) proving:
$$\exists \text{ document } D \text{ such that } \text{SHA256}(D) = h \land \text{Overlap}(D, \text{MerkleRoot}_{\text{Corpus}}) < \tau$$
- **What this proves:** The author generated a document with less than $\tau\%$ overlap against a certified reference corpus without disclosing any text from $D$.
- **Limitations:** Prover generation in WASM currently requires 10–30 seconds and substantial memory.
