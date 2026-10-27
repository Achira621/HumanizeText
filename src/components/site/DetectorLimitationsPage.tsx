import React from 'react';
import { AlertTriangle, HelpCircle, ShieldAlert, CheckCircle2, ArrowRight } from 'lucide-react';
import type { ActiveTab } from '../common/Header';

interface DetectorLimitationsPageProps {
  setActiveTab: (tab: ActiveTab) => void;
}

export const DetectorLimitationsPage: React.FC<DetectorLimitationsPageProps> = ({ setActiveTab }) => {
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
        <span className="font-medium text-[var(--text-primary)]" aria-current="page">AI Detector Limitations</span>
      </nav>

      {/* Header */}
      <header className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300 mb-3">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
          <span>Critical Scientific Advisory</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-4xl">
          AI Detector Limitations &amp; Uncertainty
        </h1>
        <p className="mt-3 text-sm text-[var(--text-secondary)] leading-relaxed">
          Why statistical AI text detectors produce false positives, how text length and genre alter scores,
          and why detection percentages should never be used as sole proof of academic misconduct.
        </p>
      </header>

      {/* Content */}
      <div className="space-y-8 text-xs sm:text-sm leading-relaxed text-[var(--text-secondary)]">
        <article className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-8 space-y-4">
          <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-amber-500" />
            1. How AI Detectors Actually Work (and What They Cannot Do)
          </h2>
          <p>
            A common misconception among educators, students, and clients is that AI detectors &ldquo;know&rdquo; whether text was written by a human.
            <strong>They do not.</strong>
          </p>
          <p>
            An AI detector does not have access to the author&rsquo;s screen history, keystrokes, or thought process. Instead, detectors are
            <strong>statistical classifiers</strong> that inspect two primary metrics:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Perplexity:</strong> How mathematically predictable the sequence of words is. High perplexity means word choices are surprising or idiosyncratic; low perplexity means words closely follow common statistical probabilities.
            </li>
            <li>
              <strong>Burstiness:</strong> How much sentence lengths and syntactic rhythms vary. Consistent, uniform sentence lengths trigger higher synthetic probability scores.
            </li>
          </ul>
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-amber-900 dark:text-amber-200">
            <strong>Key Insight:</strong> Because detectors measure <em>predictability</em> and <em>uniformity</em>, any human writing that is naturally structured, concise, formulaic, or adheres to rigorous style guides can trigger high AI probability scores.
          </div>
        </article>

        {/* Section 2: Known Failure Traps & False Positives */}
        <article className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-8 space-y-4">
          <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-red-500" />
            2. Verified Causes of False Positive Accusations
          </h2>
          <p>
            Peer-reviewed computer science literature (e.g., Liang et al., <em>Stanford University</em>, 2023) has established reproducible categories of human writing that frequently get misclassified as AI:
          </p>

          <div className="space-y-3 pt-2">
            <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-4 space-y-1">
              <strong className="text-xs font-semibold text-[var(--text-primary)] block">A. Non-Native English Writers (ESL / EFL)</strong>
              <p className="text-xs text-[var(--text-muted)]">
                Authors writing in a second language naturally use more standardized, predictable vocabulary and conventional syntactic transitions.
                Studies have demonstrated false positive rates exceeding 60% on TOEFL essays written entirely by human students prior to the release of LLMs.
              </p>
            </div>

            <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-4 space-y-1">
              <strong className="text-xs font-semibold text-[var(--text-primary)] block">B. Technical Standards, RFCs &amp; Legal Contracts</strong>
              <p className="text-xs text-[var(--text-muted)]">
                Technical specifications (such as IETF RFCs, API documentation, or statutory provisions) require exact, repetitive terminology
                (e.g., <em>&ldquo;A TCP implementation MUST process incoming segments...&rdquo;</em>).
                Because technical precision discourages colorful synonyms, detectors often flag entirely authentic engineering documents as machine-generated.
              </p>
            </div>

            <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-4 space-y-1">
              <strong className="text-xs font-semibold text-[var(--text-primary)] block">C. Short Texts (&lt; 250 Words)</strong>
              <p className="text-xs text-[var(--text-muted)]">
                Statistical metrics like standard deviation and cross-entropy require adequate sample size to reach mathematical significance.
                Analyzing a single paragraph of 50 words produces extreme score variance, rendering scores on brief texts practically meaningless.
              </p>
            </div>
          </div>
        </article>

        {/* Section 3: Responsible Usage Guidelines */}
        <article className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-8 space-y-4">
          <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-[var(--accent)]" />
            3. Guidelines for Responsible Interpretation
          </h2>
          <p>
            HumanizeText advocates for fair, evidence-based evaluation of digital writing. We recommend the following practices:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Never Rely on a Single Score:</strong> An AI detection score should never be used as automated evidence to discipline a student, reject a job applicant, or cancel a contract.
            </li>
            <li>
              <strong>Request Revision History:</strong> The most reliable proof of human authorship is document version history (Google Docs revision logs, Word track changes, or local Git commits).
            </li>
            <li>
              <strong>Use Scores as Diagnostic Signals:</strong> Authors can use our detector to discover where their prose feels repetitive, robotic, or monotonous, guiding manual sentence restructuring.
            </li>
          </ul>
        </article>

        {/* Navigation to Editorial Guides */}
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-sm text-[var(--text-primary)]">Explore Our In-Depth Writing &amp; Research Hub</h3>
            <p className="text-xs text-[var(--text-muted)] mt-1">Read our comprehensive guide explaining classifier mathematics, entropy, and mitigation strategies.</p>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('resources')}
            className="btn-brand-pill px-4 py-2 text-xs font-semibold flex items-center gap-1.5 shrink-0"
          >
            <span>Read Research Articles</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
