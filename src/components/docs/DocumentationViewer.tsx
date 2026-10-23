import React, { useState } from 'react';
import { BookOpen, Shield, Cpu, Lock, FileText, Cloud } from 'lucide-react';
import type { ActiveTab } from '../common/Header';

type DocSection =
  | 'architecture'
  | 'threat-model'
  | 'privacy'
  | 'research'
  | 'crypto-future'
  | 'deployment';

interface DocumentationViewerProps {
  setActiveTab?: (tab: ActiveTab) => void;
}

export const DocumentationViewer: React.FC<DocumentationViewerProps> = ({ setActiveTab }) => {
  const [activeSection, setActiveSection] = useState<DocSection>('architecture');

  const sections: { id: DocSection; title: string; icon: any }[] = [
    { id: 'architecture', title: 'System Architecture', icon: Cpu },
    { id: 'threat-model', title: 'Threat Model & Security', icon: Shield },
    { id: 'privacy', title: 'Privacy Statement & Guarantees', icon: Lock },
    { id: 'research', title: 'Cryptographic Research Leads', icon: BookOpen },
    { id: 'crypto-future', title: 'Future Cryptography (PSI / FHE)', icon: FileText },
    { id: 'deployment', title: 'Cloudflare Pages Deployment', icon: Cloud },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      {/* Wayfinding Breadcrumbs */}
      {setActiveTab && (
        <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
          <button
            type="button"
            onClick={() => setActiveTab('humanizer')}
            className="hover:text-[var(--accent)] transition-colors focus:outline-hidden"
          >
            Home
          </button>
          <span>/</span>
          <span className="text-[var(--text-secondary)]">Security &amp; Privacy</span>
          <span>/</span>
          <span className="font-medium text-[var(--text-primary)]" aria-current="page">Documentation</span>
        </nav>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
          Security, Architecture &amp; Research Documentation
        </h1>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Rigorous technical specifications, threat modeling, and research literature reviews for HumanizeText.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Navigation Sidebar */}
        <div role="tablist" aria-label="Documentation Sections" className="space-y-1">
          {sections.map((sec) => {
            const Icon = sec.icon;
            const isSelected = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                role="tab"
                id={`tab-${sec.id}`}
                aria-selected={isSelected}
                aria-controls={`panel-${sec.id}`}
                onClick={() => setActiveSection(sec.id)}
                className={`flex w-full items-center space-x-2 rounded-lg px-3 py-2.5 text-left text-xs font-medium transition-colors ${
                  isSelected
                    ? 'bg-[var(--accent-light)] text-[var(--accent)] font-semibold'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{sec.title}</span>
              </button>
            );
          })}
        </div>

        {/* Content View */}
        <div className="lg:col-span-3 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] p-6 shadow-xs">
          {activeSection === 'architecture' && (
            <article className="prose prose-sm max-w-none text-xs text-[var(--text-secondary)] space-y-4">
              <h2 className="text-lg font-bold text-[var(--text-primary)] border-b border-[var(--border-subtle)] pb-2">
                1. System Architecture Overview
              </h2>
              <p>
                HumanizeText is architected as a pure client-side static web application designed for deployment on Cloudflare Pages.
                There is zero backend server, no database engine, no serverless inference endpoints, and no remote document logging.
              </p>
              <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-4 font-mono text-[11px] space-y-1 text-[var(--text-primary)]">
                <div>[User Device]</div>
                <div>  ├── Document Parsing (Mammoth.js, PDF.js, Native FileReader)</div>
                <div>  ├── Linguistic Normalization &amp; Shingling (N-grams)</div>
                <div>  ├── Winnowing Fingerprint Selection (Local sliding window W=4)</div>
                <div>  ├── Web Crypto API</div>
                <div>  │     ├── SHA-256 Document Integrity Digests</div>
                <div>  │     ├── HMAC-SHA-256 Ephemeral Keyed Fingerprints</div>
                <div>  │     └── AES-256-GCM + PBKDF2 (600,000 iter) Encrypted Vault</div>
                <div>  └── Storage (IndexedDB strictly for ciphertext records)</div>
              </div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Core Component Boundaries</h3>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Presentation Layer:</strong> React 19 + TypeScript + Tailwind CSS with accessibility and mobile responsiveness.</li>
                <li><strong>Cryptography Engine:</strong> Interacts strictly with the browser W3C Web Crypto standard. Keys are ephemeral in RAM or derived dynamically.</li>
                <li><strong>Similarity Engine:</strong> Standalone pure TypeScript module completely decoupled from UI components, verified by automated unit tests.</li>
                <li><strong>Document Parser:</strong> Local parsing of TXT, Markdown, PDF, and DOCX files. Never uploads file buffers.</li>
              </ul>
            </article>
          )}

          {activeSection === 'threat-model' && (
            <article className="prose prose-sm max-w-none text-xs text-[var(--text-secondary)] space-y-4">
              <h2 className="text-lg font-bold text-[var(--text-primary)] border-b border-[var(--border-subtle)] pb-2">
                2. Threat Model &amp; Security Posture
              </h2>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Assets to Protect</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Raw user manuscripts and drafts</li>
                <li>Document shingles and similarity fingerprints</li>
                <li>Encryption passphrases and derived cryptographic keys</li>
              </ul>

              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Adversary Capabilities &amp; Mitigations</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[var(--border-subtle)] text-[11px]">
                  <thead>
                    <tr className="text-left font-semibold text-[var(--text-primary)]">
                      <th className="py-2">Threat Vector</th>
                      <th className="py-2">Attacker Capability</th>
                      <th className="py-2">Architectural Mitigation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--text-secondary)]">
                    <tr>
                      <td className="py-2 font-medium">Network Sniffing / Man-in-the-Middle</td>
                      <td className="py-2">Inspects TLS traffic between client and host</td>
                      <td className="py-2">Local mode emits zero document network traffic. Cloud AI mode uses TLS 1.3 to ephemeral Cloudflare edge isolates with zero disk logging.</td>
                    </tr>
                    <tr>
                      <td className="py-2 font-medium">Precomputation / Rainbow Table Attacks</td>
                      <td className="py-2">Hashes millions of common 5-word phrases</td>
                      <td className="py-2">HMAC-SHA-256 uses a random 256-bit ephemeral key generated in RAM per session.</td>
                    </tr>
                    <tr>
                      <td className="py-2 font-medium">Ciphertext Tampering</td>
                      <td className="py-2">Alters bytes of locally stored records in IndexedDB</td>
                      <td className="py-2">AES-256-GCM includes 128-bit authentication tag. Rejects tampered records.</td>
                    </tr>
                    <tr>
                      <td className="py-2 font-medium">Password Brute Force</td>
                      <td className="py-2">Runs dictionary attacks against stored vault payloads</td>
                      <td className="py-2">PBKDF2-SHA-256 with 600,000 iterations and fresh 16-byte random salt per item.</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Out of Scope / Residual Risks</h3>
              <p>
                Physical access to an unlocked computer, malicious browser extensions with broad DOM-read permissions, and malware running on the host OS fall outside the browser's technical trust boundary.
              </p>
            </article>
          )}

          {activeSection === 'privacy' && (
            <article className="prose prose-sm max-w-none text-xs text-[var(--text-secondary)] space-y-4">
              <h2 className="text-lg font-bold text-[var(--text-primary)] border-b border-[var(--border-subtle)] pb-2">
                3. Privacy Statement &amp; Guarantees
              </h2>
              <div className="rounded-lg border border-[var(--accent-border)] bg-[var(--accent-light)] p-4 text-[var(--accent)] font-medium">
                HumanizeText enforces strict privacy boundaries: local processing by default, zero text storage, and ephemeral edge inference without disk persistence.
              </div>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>No User Accounts:</strong> Zero mandatory login, zero account tracking IDs, zero sessions.</li>
                <li><strong>Local-First Processing:</strong> PDF extraction, DOCX parsing, winnowing plagiarism scans, and local rules execute entirely in browser memory.</li>
                <li><strong>Ephemeral Cloud AI Option:</strong> Optional cloud humanization runs in Cloudflare Workers AI volatile RAM with zero database storage bindings and zero prompt retention.</li>
                <li><strong>Opt-In Encrypted Storage:</strong> Documents saved to the local vault are stored exclusively as AES-GCM ciphertext in your browser's IndexedDB. Plaintext is never persisted.</li>
              </ul>
            </article>
          )}

          {activeSection === 'research' && (
            <article className="prose prose-sm max-w-none text-xs text-[var(--text-secondary)] space-y-4">
              <h2 className="text-lg font-bold text-[var(--text-primary)] border-b border-[var(--border-subtle)] pb-2">
                4. Cryptographic &amp; Plagiarism Research Leads
              </h2>
              <p>
                Our roadmap investigates modern academic advances in fuzzy private set intersection, homomorphic comparisons, and generative plagiarism detection:
              </p>

              <div className="space-y-3">
                <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3">
                  <div className="font-semibold text-[var(--text-primary)]">
                    1. Extending Homomorphic Algorithms for Encrypted Text Comparison
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)]">Scientific Reports, 2026 • doi: 10.1038/s41598-026-48255-2</div>
                  <p className="mt-1">
                    Evaluates leveled fully homomorphic encryption (BFV/CKKS) for ciphertext-to-ciphertext string distance calculation. While mathematically sound, current polynomial multiplication overhead renders browser-side evaluation prohibitive for documents exceeding 1,000 words.
                  </p>
                </div>

                <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3">
                  <div className="font-semibold text-[var(--text-primary)]">
                    2. Efficient Fuzzy Private Set Intersection from Secret-Shared OPRF
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)]">arXiv:2604.14909, 2026</div>
                  <p className="mt-1">
                    Presents sublinear communication PSI using oblivious pseudorandom functions. Ideal for future two-party remote similarity checks where neither party reveals non-overlapping text shingles.
                  </p>
                </div>

                <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3">
                  <div className="font-semibold text-[var(--text-primary)]">
                    3. Towards Scalable Fuzzy PSI via Efficient Fuzzy Matching
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)]">arXiv:2608.11526, 2026</div>
                  <p className="mt-1">
                    Combines Locality-Sensitive Hashing (LSH) with oblivious transfers to match shingles with small edit distances without revealing exact shingles.
                  </p>
                </div>

                <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3">
                  <div className="font-semibold text-[var(--text-primary)]">
                    4. PlagBench: Exploring the Duality of LLMs in Plagiarism Generation &amp; Detection
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)]">ACL Anthology (NAACL 2025)</div>
                  <p className="mt-1">
                    Establishes standard benchmark datasets comparing syntactic n-gram winnowing against semantic embedding distance. Demonstrates that n-gram winnowing has near-zero false positive rates on technical text compared to statistical perplexity detectors.
                  </p>
                </div>

                <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3">
                  <div className="font-semibold text-[var(--text-primary)]">
                    5. PAN 2026 Generative Plagiarism Detection
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)]">CLEF 2026 Pan Workshop</div>
                  <p className="mt-1">
                    Evaluation of machine-obfuscated and humanized plagiarism benchmarks. Shows that syntactic reconstruction remains critical for evidence presentation.
                  </p>
                </div>

                <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3">
                  <div className="font-semibold text-[var(--text-primary)]">
                    6. Llamas on the Web: Memory-Efficient Performance-Portable LLM Inference with WebGPU
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)]">arXiv:2605.20706, 2026</div>
                  <p className="mt-1">
                    Demonstrates mixed-precision 3-bit and 4-bit quantizations executing in WebGPU shaders without remote servers, establishing the foundation for optional on-device browser AI.
                  </p>
                </div>
              </div>
            </article>
          )}

          {activeSection === 'crypto-future' && (
            <article className="prose prose-sm max-w-none text-xs text-[var(--text-secondary)] space-y-4">
              <h2 className="text-lg font-bold text-[var(--text-primary)] border-b border-[var(--border-subtle)] pb-2">
                5. Future Cryptography Roadmap (PSI &amp; ZK Proofs)
              </h2>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Private Set Intersection (PSI) for Remote Corpora</h3>
              <p>
                In future versions, a user may wish to check a manuscript against an institutional corpus hosted on a remote server without revealing their manuscript. PSI based on ECDH or Vector OPRF would allow finding the size and hashes of the intersection without revealing non-matching shingles to either the client or the institution.
              </p>

              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Zero-Knowledge Attestations</h3>
              <p>
                A user could generate a client-side zk-SNARK (using Halo2 or Noir in WebAssembly) proving:
                <em>&ldquo;My document has an overlap score &lt; 5% against reference index X, and was created on timestamp Y&rdquo;</em>,
                allowing proof of originality without disclosing the manuscript text to the verifier.
              </p>
            </article>
          )}

          {activeSection === 'deployment' && (
            <article className="prose prose-sm max-w-none text-xs text-[var(--text-secondary)] space-y-4">
              <h2 className="text-lg font-bold text-[var(--text-primary)] border-b border-[var(--border-subtle)] pb-2">
                6. Vercel &amp; Edge Deployment
              </h2>
              <p>
                The application builds to static assets in <code>dist/</code> and is optimized for zero-configuration deployment to <strong>Vercel</strong> via Git integration or the Vercel CLI:
              </p>
              <pre className="rounded bg-[var(--code-bg)] p-3 font-mono text-[11px] text-[var(--text-primary)]">
{`# 1. Build locally
npm run build

# 2. Deploy to Vercel via CLI (or push to GitHub for automatic CI/CD)
npx vercel --prod`}
              </pre>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Vercel SPA Rewrites &amp; Strict CSP (vercel.json)</h3>
              <p>
                Client-side routing and security headers are enforced via <code>vercel.json</code>:
              </p>
              <pre className="rounded bg-[var(--code-bg)] p-3 font-mono text-[10px] text-[var(--text-primary)] whitespace-pre-wrap">
{`{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
  "headers": [{
    "source": "/(.*)",
    "headers": [
      { "key": "X-Frame-Options", "value": "DENY" },
      { "key": "X-Content-Type-Options", "value": "nosniff" },
      { "key": "Referrer-Policy", "value": "no-referrer" },
      { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
      { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; worker-src 'self' blob:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';" }
    ]
  }]
}`}
              </pre>
            </article>
          )}
        </div>
      </div>
    </div>
  );
};
