import React from 'react';
import { CheckCircle2, FlaskConical, FileCode2, Scale, Layers } from 'lucide-react';
import type { ActiveTab } from '../common/Header';

interface MethodologyPageProps {
  setActiveTab: (tab: ActiveTab) => void;
}

export const MethodologyPage: React.FC<MethodologyPageProps> = ({ setActiveTab }) => {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
        <button
          type="button"
          onClick={() => setActiveTab('humanizer')}
          className="hover:text-[var(--accent)] transition-colors focus:outline-hidden"
        >
          Home
        </button>
        <span>/</span>
        <span className="font-medium text-[var(--text-primary)]" aria-current="page">Methodology &amp; Verification</span>
      </nav>

      {/* Header */}
      <header className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--accent-border)] bg-[var(--accent-light)] px-3 py-1 text-xs font-semibold text-[var(--accent-deep)] dark:text-[#34D399] mb-3">
          <FlaskConical className="h-3.5 w-3.5" />
          <span>Empirical Evaluation Framework</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-4xl">
          Editorial &amp; Testing Methodology
        </h1>
        <p className="mt-3 text-sm text-[var(--text-secondary)] leading-relaxed">
          How HumanizeText evaluates prose transformation, verifies factual invariance, benchmarks statistical stylometrics,
          and validates cryptographic similarity algorithms across automated regression suites.
        </p>
      </header>

      {/* Content */}
      <div className="space-y-8 text-xs sm:text-sm leading-relaxed text-[var(--text-secondary)]">
        {/* Section 1: Invariant Preservation Engine */}
        <article className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-8 space-y-4">
          <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-[var(--accent)]" />
            1. The Factual Invariant Validation Pipeline
          </h2>
          <p>
            The greatest hazard in automated rewriting tools is <em>hallucinatory semantic distortion</em>: an engine replaces words blindly,
            flipping negative qualifications into positive assertions, dropping numerical quantities, or misplacing academic citations.
          </p>
          <p>
            HumanizeText enforces a deterministic post-rewrite invariant validation engine (tested in <code>pipelineInvariants.test.ts</code>)
            that verifies five critical constraints before an output draft is accepted:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3 space-y-1">
              <strong className="text-[var(--text-primary)] text-xs block">1. Numerical &amp; Unit Bounds</strong>
              <p className="text-[11px] text-[var(--text-muted)]">
                All numerical quantities, percentages (e.g. 12.4%), statistical metrics, and units (mg, mL, Gbps, USD) in the input must appear identically in the output.
              </p>
            </div>
            <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3 space-y-1">
              <strong className="text-[var(--text-primary)] text-xs block">2. Citation &amp; Bracket Integrity</strong>
              <p className="text-[11px] text-[var(--text-muted)]">
                Academic bracket citations (e.g. [1], [2-4]) and author-year markers (e.g. (Smith, 2024)) are extracted into a protected inventory and matched verbatim.
              </p>
            </div>
            <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3 space-y-1">
              <strong className="text-[var(--text-primary)] text-xs block">3. Polarity &amp; Negation Tracking</strong>
              <p className="text-[11px] text-[var(--text-muted)]">
                Negative qualifiers (never, cannot, fail, lacks, absent, prohibited) cannot be silently deleted or converted into unhedged affirmations.
              </p>
            </div>
            <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3 space-y-1">
              <strong className="text-[var(--text-primary)] text-xs block">4. Epistemic Stance Retention</strong>
              <p className="text-[11px] text-[var(--text-muted)]">
                Cautious scholarly expressions (&ldquo;tentatively suggests&rdquo;, &ldquo;may indicate&rdquo;) cannot be mutated into dogmatic proofs (&ldquo;conclusively proves&rdquo;).
              </p>
            </div>
          </div>
        </article>

        {/* Section 2: Stylometrics & Perplexity Scoring */}
        <article className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-8 space-y-4">
          <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Layers className="h-5 w-5 text-[var(--accent)]" />
            2. Stylometric Scoring &amp; Sentence Burstiness
          </h2>
          <p>
            Large Language Models typically generate text with uniform sentence lengths (clustering tightly around 16–22 words)
            and uniform vocabulary entropy. Human authors, in contrast, naturally write with high <em>burstiness</em>:
            alternating between short declarative punches (4–7 words) and rich, multi-clause compound sentences (25–35 words).
          </p>
          <p>
            Our rule engine and context analyzer (<code>contextEngine.ts</code>) evaluate sentence variance using statistical standard deviation:
          </p>
          <div className="rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] p-4 font-mono text-[11px] text-[var(--text-primary)] space-y-1">
            <div>// Burstiness calculation over sentence token lengths [L1, L2, ... Ln]</div>
            <div>meanLength = sum(L) / n</div>
            <div>variance   = sum((L_i - meanLength)^2) / n</div>
            <div>stdDev     = sqrt(variance)</div>
            <div className="text-[var(--text-muted)] pt-1">
              stdDev &lt; 4.0: Monotonous mechanical distribution (common in unedited LLM output)<br />
              stdDev 4.0–8.0: Balanced cadence<br />
              stdDev &gt; 8.0: Dynamic human rhythm with rhythmic variety
            </div>
          </div>
        </article>

        {/* Section 3: Plagiarism Benchmark & Winnowing Verification */}
        <article className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-8 space-y-4">
          <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Scale className="h-5 w-5 text-[var(--accent)]" />
            3. Cryptographic Similarity Verification (Winnowing)
          </h2>
          <p>
            Our document similarity engine implements the peer-reviewed <strong>Winnowing Algorithm</strong>
            (Schleimer, Wilkerson, &amp; Aiken, ACM SIGMOD 2003):
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Normalization:</strong> Input text is converted to Unicode NFC, punctuation is stripped, and casing is folded.
            </li>
            <li>
              <strong>Shingling:</strong> Text is partitioned into sliding word n-grams (default: $k = 5$ words).
            </li>
            <li>
              <strong>Window Filtering:</strong> Over a rolling window of size $w = 4$ hashes, the minimum hash value is selected as an anchor.
              This guarantees that any verbatim match of length $t \ge w + k - 1$ words is detected with mathematical certainty.
            </li>
            <li>
              <strong>Ephemeral Keying:</strong> To prevent rainbow-table reverse engineering, shingles are hashed using an ephemeral in-memory 256-bit HMAC key generated freshly per session.
            </li>
          </ul>
        </article>

        {/* Section 4: Automated Test Suite Coverage */}
        <article className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-8 space-y-4">
          <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
            <FileCode2 className="h-5 w-5 text-[var(--accent)]" />
            4. Automated Test Suite &amp; Regression Coverage
          </h2>
          <p>
            Every algorithmic update to HumanizeText is validated against an extensive regression suite of over <strong>320 automated unit and evaluation tests</strong>:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-[var(--text-muted)]">
            <li><code>tests/unit/pipelineInvariants.test.ts</code>: Validates that numbers, citations, and negative stance are protected across diverse test fixtures.</li>
            <li><code>tests/unit/concurrencyAndResilience.test.ts</code>: Validates bounded inference queues, retry logic, and document reconstruction integrity.</li>
            <li><code>tests/unit/crypto.test.ts</code>: Verifies PBKDF2 iteration speed, salt uniqueness, and AES-GCM authentication tag tampering detection.</li>
            <li><code>tests/unit/similarity.test.ts</code>: Validates that Winnowing detects exact, transposed, and synonym-swapped passages.</li>
            <li><code>tests/eval/detector.eval.test.ts</code>: Calibrates and reports ROC-AUC, Precision, Recall, and False Positive Rates on held-out samples.</li>
          </ul>
        </article>
      </div>
    </div>
  );
};
