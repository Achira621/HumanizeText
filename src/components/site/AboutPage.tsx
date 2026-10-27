import React from 'react';
import {
  Shield,
  Lock,
  Mail,
  CheckCircle2,
  Users,
  Award,
  Code2,
} from 'lucide-react';
import type { ActiveTab } from '../common/Header';

interface AboutPageProps {
  setActiveTab: (tab: ActiveTab) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ setActiveTab }) => {
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
        <span className="font-medium text-[var(--text-primary)]" aria-current="page">About HumanizeText</span>
      </nav>

      {/* Hero Header */}
      <header className="mb-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--accent-border)] bg-[var(--accent-light)] px-3 py-1 text-xs font-semibold text-[var(--accent-deep)] dark:text-[#34D399] mb-3">
          <Shield className="h-3.5 w-3.5" />
          <span>Independent Open-Source Writing Technology</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-4xl">
          About HumanizeText
        </h1>
        <p className="mt-3 text-base text-[var(--text-secondary)] leading-relaxed">
          HumanizeText is an open-source, privacy-first software project created to give writers, students, researchers,
          and professionals transparent control over their digital drafts. We build client-side writing analysis,
          linguistic humanization, and cryptographic similarity tools that run without invasive tracking or forced account creation.
        </p>
      </header>

      {/* Mission & Founding Principles */}
      <section className="space-y-8 text-sm leading-relaxed text-[var(--text-secondary)]">
        <article className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-8 space-y-4">
          <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Award className="h-5 w-5 text-[var(--accent)]" />
            Our Mission &amp; Editorial Philosophy
          </h2>
          <p>
            The rapid proliferation of large language models has fundamentally transformed drafting, summarization, and editing.
            However, this technological shift has introduced two major industry problems:
          </p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              <strong className="text-[var(--text-primary)]">Invasive Data Harvesters:</strong> Commercial writing tools routinely require
              mandatory user accounts, credit card pre-authorizations, and upload private manuscripts to remote corporate databases
              where they may be stored, cataloged, or repurposed for proprietary model training.
            </li>
            <li>
              <strong className="text-[var(--text-primary)]">Unreliable AI Detection Claims:</strong> A predatory market of commercial
              &ldquo;AI bypassers&rdquo; has emerged, marketing deceptive guarantees like &ldquo;100% bypass rate against Turnitin&rdquo;
              and &ldquo;foolproof evasion.&rdquo; In reality, probabilistic classifiers cannot reliably determine authorship from text alone,
              and attempting to evade classifiers using random synonym scramblers destroys semantic coherence, factual citations, and academic rigor.
            </li>
          </ol>
          <p>
            HumanizeText was engineered as an ethical antidote: an open-source platform that combines <strong>on-device client-side execution</strong>,
            <strong>rigorous invariant preservation</strong>, and <strong>transparent methodology</strong>. We believe technology should serve writers
            honestly—clarifying prose, repairing rhythm, and safeguarding confidential drafts without making false promises.
          </p>
        </article>

        {/* Technical Architecture & Privacy Commitments */}
        <article className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-8 space-y-4">
          <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Lock className="h-5 w-5 text-[var(--accent)]" />
            How We Protect Your Writing Privacy
          </h2>
          <p>
            Unlike conventional cloud SaaS applications, HumanizeText defaults to complete client-side execution using standard web standards:
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2">
            <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-4 space-y-2">
              <span className="font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-[var(--accent)]" />
                Local-First By Default
              </span>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Our rule-based humanizer, cryptographic plagiarism scanner (Winnowing algorithm), metadata inspector, and AES-GCM encrypted vault
                execute 100% in your browser memory via the W3C Web Crypto API. Zero plaintext bytes are transmitted over the network.
              </p>
            </div>
            <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-4 space-y-2">
              <span className="font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-[var(--accent)]" />
                Ephemeral Edge AI Option
              </span>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                When you choose Cloud AI processing, text is processed ephemerally in RAM on Cloudflare Workers AI edge isolates.
                The Worker attaches zero disk, database, or KV storage bindings, does not log document text, and discards all data immediately upon returning the response.
              </p>
            </div>
          </div>
        </article>

        {/* Project Maintainer & Open Source Attribution */}
        <article className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-8 space-y-4">
          <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Users className="h-5 w-5 text-[var(--accent)]" />
            Project Governance &amp; Authorship
          </h2>
          <p>
            HumanizeText is maintained as an independent open-source software project by <strong>Achira621</strong>.
            The complete source code—including our invariant validation engine, context analysis heuristics, and cryptographic implementations—is
            publicly audited and available under the permissive Apache 2.0 open-source license.
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <a
              href="https://github.com/Achira621/HumanizeText"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-subtle)] px-4 py-2 text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--accent)] transition-colors"
            >
              <Code2 className="h-4 w-4" />
              <span>Inspect Source on GitHub</span>
            </a>
            <button
              type="button"
              onClick={() => setActiveTab('contact')}
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--accent-border)] bg-[var(--accent-light)] px-4 py-2 text-xs font-semibold text-[var(--accent-deep)] dark:text-[#34D399] hover:opacity-90 transition-opacity"
            >
              <Mail className="h-4 w-4" />
              <span>Contact Maintainer</span>
            </button>
          </div>
        </article>

        {/* Quick Links */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 pt-4">
          <button
            type="button"
            onClick={() => setActiveTab('methodology')}
            className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 text-left hover:border-[var(--accent)] transition-all"
          >
            <span className="font-semibold text-xs text-[var(--text-primary)] block">Testing Methodology</span>
            <span className="text-[11px] text-[var(--text-muted)] mt-1 block">Review our empirical invariant checks &amp; regression suite.</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('detector-limitations')}
            className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 text-left hover:border-[var(--accent)] transition-all"
          >
            <span className="font-semibold text-xs text-[var(--text-primary)] block">AI Detector Limitations</span>
            <span className="text-[11px] text-[var(--text-muted)] mt-1 block">Learn why detector scores are estimates, not proof of authorship.</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('privacy-policy')}
            className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 text-left hover:border-[var(--accent)] transition-all"
          >
            <span className="font-semibold text-xs text-[var(--text-primary)] block">Privacy Policy</span>
            <span className="text-[11px] text-[var(--text-muted)] mt-1 block">Read full data handling, cookie, and AdSense disclosures.</span>
          </button>
        </div>
      </section>
    </div>
  );
};
