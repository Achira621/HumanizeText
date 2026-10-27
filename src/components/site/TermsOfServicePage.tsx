import React from 'react';
import { ShieldAlert, Scale } from 'lucide-react';
import type { ActiveTab } from '../common/Header';

interface TermsOfServicePageProps {
  setActiveTab: (tab: ActiveTab) => void;
}

export const TermsOfServicePage: React.FC<TermsOfServicePageProps> = ({ setActiveTab }) => {
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
        <span className="font-medium text-[var(--text-primary)]" aria-current="page">Terms of Service</span>
      </nav>

      {/* Header */}
      <header className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--accent-border)] bg-[var(--accent-light)] px-3 py-1 text-xs font-semibold text-[var(--accent-deep)] dark:text-[#34D399] mb-3">
          <Scale className="h-3.5 w-3.5" />
          <span>Last Updated: October 2026</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-4xl">
          Terms of Service &amp; Fair Use
        </h1>
        <p className="mt-3 text-sm text-[var(--text-secondary)] leading-relaxed">
          Please review the following terms and fair use guidelines governing your use of HumanizeText.
          By accessing or using our software, you agree to these terms.
        </p>
      </header>

      {/* Content */}
      <div className="space-y-8 text-xs sm:text-sm leading-relaxed text-[var(--text-secondary)]">
        <article className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-8 space-y-4">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">1. Purpose of the Service</h2>
          <p>
            HumanizeText is a software suite designed to assist writers with sentence structure analysis, clarity editing,
            document formatting, metadata sanitization, and cryptographic text similarity comparison.
            The tools are provided free of charge for lawful, ethical, personal, and professional drafting purposes.
          </p>
        </article>

        <article className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-8 space-y-4">
          <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-amber-500" />
            2. Academic Integrity &amp; Ethical AI Usage
          </h2>
          <p>
            HumanizeText supports genuine prose improvement, stylistic refinement, and authorial learning.
            We strongly condemn academic dishonesty, contract cheating, and the deceptive submission of work in violation
            of institutional honor codes:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Institutional Compliance:</strong> You are solely responsible for ensuring that your use of automated writing assistance
              complies with the specific policies, guidelines, and honor codes of your educational institution, publisher, or employer.
            </li>
            <li>
              <strong>No Evasion Guarantee:</strong> HumanizeText does <em>not</em> market or guarantee evasion of institutional AI policies.
              Using automated tools to disguise non-permitted AI generation may violate academic guidelines.
            </li>
            <li>
              <strong>Attribution:</strong> Paraphrasing a source does not relieve you of the obligation to provide proper academic citation.
              Always attribute original ideas, data, and conceptual models to their primary authors.
            </li>
          </ul>
        </article>

        <article className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-8 space-y-4">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">3. AI Classifier Disclaimer &amp; Limitations</h2>
          <p>
            Statistical AI detection tools and stylometric classifiers are probabilistic instruments.
            Their assessments reflect mathematical pattern matches (such as perplexity and burstiness distributions), not definitive proof of authorship.
            HumanizeText makes no warranty regarding the accuracy, completeness, or reliability of any detector score.
            Scores should be interpreted solely as stylistic diagnostic signals.
          </p>
        </article>

        <article className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-8 space-y-4">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">4. Disclaimers of Warranties &amp; Limitation of Liability</h2>
          <p>
            HumanizeText is provided on an &ldquo;AS IS&rdquo; and &ldquo;AS AVAILABLE&rdquo; basis without warranties of any kind, whether express,
            implied, or statutory, including without limitation warranties of merchantability, fitness for a particular purpose, or non-infringement.
          </p>
          <p>
            In no event shall the authors, maintainers, or contributors of HumanizeText be liable for any direct, indirect, incidental, special,
            or consequential damages (including loss of data, academic penalties, or business interruption) arising out of the use or inability to use the software.
          </p>
        </article>

        <article className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-8 space-y-4">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">5. Open Source Licensing</h2>
          <p>
            HumanizeText is open-source software licensed under the <strong>Apache License, Version 2.0</strong>.
            You may inspect, fork, modify, and distribute the software subject to the terms of the Apache 2.0 license.
          </p>
        </article>
      </div>
    </div>
  );
};
