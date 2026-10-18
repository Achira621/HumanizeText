# HumanizeText — Cryptographic & Linguistic Research Review

This document reviews key academic literature across encrypted string comparison, fuzzy private set intersection, generative plagiarism benchmarks, and on-device WebGPU inference.

---

### 1. Extending Homomorphic Algorithms for Encrypted Text Comparison
- **Citation:** *Scientific Reports*, 2026.
- **Link:** [https://doi.org/10.1038/s41598-026-48255-2](https://doi.org/10.1038/s41598-026-48255-2)
- **Proposed Application:** Computing Levenshtein distance or cosine similarity directly over ciphertexts encrypted under Fully Homomorphic Encryption (FHE schemes such as BFV or CKKS).
- **Assumptions & Strengths:** Allows an untrusted cloud server to compute overlap without learning document plaintext or the comparison result (which only the client keyholder decrypts).
- **Practical Limitations in Web Browsers:**
  - Ciphertext expansion is typically $100\times$ to $1000\times$ compared to plaintext.
  - Polynomial multiplication bootstrapping introduces tens of seconds of latency even on desktop GPUs, making client-side FHE impractical for real-time interactive browser use.
  - Verdict for MVP: Not integrated into active path; retained as research lead for asynchronous server-assisted comparisons.

---

### 2. Efficient Fuzzy Private Set Intersection from Secret-Shared OPRF
- **Citation:** *arXiv:2604.14909*, 2026.
- **Link:** [https://arxiv.org/abs/2604.14909](https://arxiv.org/abs/2604.14909)
- **Proposed Application:** Multi-party private comparison where client $C$ holds document shingles $S_C$ and reference library $L$ holds corpus shingles $S_L$. Both compute $|S_C \cap S_L|$ or the matching set without revealing non-matching shingles.
- **Assumptions & Strengths:** Uses Oblivious Pseudorandom Functions (OPRF) based on elliptic curves (e.g., Ristretto255). Sublinear communication overhead.
- **Practical Limitations in Web Browsers:**
  - Requires interactive round-trips with a cooperating OPRF server.
  - Since HumanizeText v1 operates entirely on-device without a backend server, PSI is slated for v2 remote corpus queries.

---

### 3. Towards Scalable Fuzzy PSI via Efficient Fuzzy Matching
- **Citation:** *arXiv:2608.11526*, 2026.
- **Link:** [https://arxiv.org/abs/2608.11526](https://arxiv.org/abs/2608.11526)
- **Proposed Application:** Detecting similar shingles that differ by 1–2 typos, minor inflectional suffixes, or synonym replacements.
- **Assumptions & Strengths:** Uses locality-sensitive hashing (LSH) and min-wise independent permutations to project shingles into buckets before executing exact PSI.
- **Practical Limitations:** LSH false positive rate increases quickly for short shingles ($n < 6$ words), requiring larger window parameters.

---

### 4. PlagBench: Exploring the Duality of Large Language Models in Plagiarism Generation and Detection
- **Citation:** *Proceedings of the 2025 Conference of the North American Chapter of the Association for Computational Linguistics (NAACL 2025)*, pp. 384–401.
- **Link:** [https://aclanthology.org/2025.naacl-long.384/](https://aclanthology.org/2025.naacl-long.384/)
- **Core Findings:**
  - Evaluates how state-of-the-art LLMs can both generate disguised plagiarism (paraphrasing, restructuring) and detect it.
  - Highlights the profound weakness of black-box "AI detectors" that rely on perplexity or burstiness heuristics: they produce high false-positive rates on non-native English writing and technical prose.
  - Confirms that deterministic winnowed fingerprinting remains the gold standard for providing undeniable cryptographic evidence of verbatim overlap.

---

### 5. PAN 2026 Generative Plagiarism Detection Benchmark
- **Citation:** *CLEF 2026 Working Notes (Pan Evaluation Lab)*.
- **Link:** [https://pan.webis.de/clef26/pan26-web/generated-plagiarism-detection](https://pan.webis.de/clef26/pan26-web/generated-plagiarism-detection)
- **Core Findings:**
  - Focuses on detecting machine-assisted obfuscation where students prompt LLMs to rewrite stolen paragraphs.
  - Demonstrates that hybrid methods combining syntactic passage reconstruction with structural outline matching achieve superior precision over statistical word scoring.

---

### 6. Llamas on the Web: Memory-Efficient, Performance-Portable, and Multi-Precision LLM Inference with WebGPU
- **Citation:** *arXiv:2605.20706*, 2026.
- **Link:** [https://arxiv.org/abs/2605.20706](https://arxiv.org/abs/2605.20706)
- **Core Findings:**
  - Details multi-precision mixed 3-bit / 4-bit quantization kernels compiled directly to WebGPU WGSL compute shaders.
  - Achieves 18–35 tokens/second on consumer-grade integrated GPUs (Apple Silicon, Intel Iris Xe) for 1B–2B parameter models.
  - Establishes the technical foundation for HumanizeText's optional `OptionalBrowserAIEngine`, proving that local on-device neural transformation is viable without cloud APIs.
