import React from 'react';
import { Shield, Lock, Server, Cookie, CheckCircle2 } from 'lucide-react';
import type { ActiveTab } from '../common/Header';

interface PrivacyPolicyPageProps {
  setActiveTab: (tab: ActiveTab) => void;
}

export const PrivacyPolicyPage: React.FC<PrivacyPolicyPageProps> = ({ setActiveTab }) => {
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
        <span className="font-medium text-[var(--text-primary)]" aria-current="page">Privacy Policy</span>
      </nav>

      {/* Header */}
      <header className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--accent-border)] bg-[var(--accent-light)] px-3 py-1 text-xs font-semibold text-[var(--accent-deep)] dark:text-[#34D399] mb-3">
          <Shield className="h-3.5 w-3.5" />
          <span>Last Updated: October 2026</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-4xl">
          Privacy Policy &amp; Data Disclosures
        </h1>
        <p className="mt-3 text-sm text-[var(--text-secondary)] leading-relaxed">
          HumanizeText is designed from the ground up around data minimization and user sovereignty.
          This document provides a complete, transparent disclosure of how text is handled across our local
          and cloud modes, how browser storage functions, and our use of third-party advertising services.
        </p>
      </header>

      {/* Content */}
      <div className="space-y-8 text-xs sm:text-sm leading-relaxed text-[var(--text-secondary)]">
        {/* Section 1: Dual Execution Model */}
        <article className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-8 space-y-4">
          <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Lock className="h-4 w-4 text-[var(--accent)]" />
            1. Dual Architecture: Local Processing vs. Cloud Inference
          </h2>
          <p>
            HumanizeText provides two distinct execution pathways. You can inspect or toggle between them in the application toolbar before submitting text:
          </p>

          <div className="space-y-4 pt-2">
            <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-4 space-y-2">
              <h3 className="font-bold text-xs sm:text-sm text-[var(--text-primary)]">
                A. On-Device Local Processing (Default for Detection, Similarity &amp; Rules)
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                When you use the Local Rule-Based Humanizer, Cryptographic Plagiarism Checker, Metadata Inspector, or Encrypted Vault:
              </p>
              <ul className="list-disc pl-5 text-xs text-[var(--text-muted)] space-y-1">
                <li><strong>Network Egress:</strong> Zero bytes of document text leave your computer. Processing occurs strictly within browser memory using JavaScript and the W3C Web Crypto API.</li>
                <li><strong>Persistence:</strong> Plaintext text is never written to disk or browser storage without your explicit command.</li>
                <li><strong>Verification:</strong> You can independently verify zero network traffic by opening the <em>Interactive Privacy Lab</em> in our application or your browser&rsquo;s Developer Tools Network tab.</li>
              </ul>
            </div>

            <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-4 space-y-2">
              <h3 className="font-bold text-xs sm:text-sm text-[var(--text-primary)]">
                B. Cloudflare Workers AI Edge Inference (Optional Free Cloud Mode)
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                When you choose &ldquo;Free Cloud AI&rdquo; or execute a multi-block document rewrite:
              </p>
              <ul className="list-disc pl-5 text-xs text-[var(--text-muted)] space-y-1">
                <li><strong>Transmission:</strong> Your text is transmitted over an encrypted HTTPS connection (TLS 1.3) to our Cloudflare Worker endpoint (<code>humanizetext-api.humanizetext.workers.dev</code>).</li>
                <li><strong>In-Memory Processing:</strong> Inference runs in an ephemeral serverless V8 isolate. The Worker implementation configures zero persistent storage bindings (no Cloudflare KV, D1 SQL, Vectorize, or Durable Objects).</li>
                <li><strong>Application Data Boundaries:</strong> Text is processed in volatile worker memory to generate the rewrite and is discarded immediately after returning the HTTP response. Our application configures no database bindings, does not log manuscript text, and does not retain submissions for AI training. Inferences are executed according to Cloudflare Workers AI standard data processing terms.</li>
              </ul>
            </div>
          </div>
        </article>

        {/* Section 2: Encrypted Vault Storage */}
        <article className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-8 space-y-4">
          <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Server className="h-4 w-4 text-[var(--accent)]" />
            2. Local Storage &amp; Encrypted Vault
          </h2>
          <p>
            HumanizeText does not maintain user accounts, passwords, or cloud databases. When you choose to save a document in the Security Vault:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Client-Side Encryption:</strong> Documents are encrypted in your browser using <strong>AES-256-GCM</strong> with an authentication tag.
              The cryptographic key is derived locally from your passphrase using <strong>PBKDF2-SHA-256</strong> (with 600,000 iterations and a fresh random 16-byte salt per record).
            </li>
            <li>
              <strong>Storage Location:</strong> Only ciphertext is stored in your browser&rsquo;s local <strong>IndexedDB</strong> storage. Neither your passphrase nor your plaintext is ever stored or transmitted.
            </li>
            <li>
              <strong>Data Deletion:</strong> You have full control over your stored data. You can delete individual documents or click &ldquo;Wipe Entire Vault&rdquo; at any time to permanently erase all records.
            </li>
          </ul>
        </article>

        {/* Section 3: Google AdSense & Cookie Disclosures */}
        <article className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-8 space-y-4">
          <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Cookie className="h-4 w-4 text-[var(--accent)]" />
            3. Advertising Technologies &amp; Cookie Disclosure (Google AdSense)
          </h2>
          <p>
            HumanizeText is provided completely free of charge without subscriptions or paywalls. To offset serverless edge infrastructure costs,
            we display advertisements served by Google AdSense (<code>pagead2.googlesyndication.com</code>).
          </p>
          <div className="rounded-lg bg-[var(--bg-subtle)] p-4 space-y-2 border border-[var(--border-subtle)]">
            <h3 className="font-semibold text-xs sm:text-sm text-[var(--text-primary)]">Google Advertising Policies &amp; Cookies:</h3>
            <ul className="list-disc pl-5 text-xs text-[var(--text-muted)] space-y-1.5">
              <li>
                Third-party vendors, including Google, use cookies to serve ads based on a user&rsquo;s prior visits to this website or other websites on the internet.
              </li>
              <li>
                Google&rsquo;s use of advertising cookies (such as the DoubleClick cookie) enables it and its partners to serve ads to users based on their visit to our site and/or other sites on the Internet.
              </li>
              <li>
                <strong>Opt-Out Options:</strong> Users may opt out of personalized advertising by visiting{' '}
                <a
                  href="https://adssettings.google.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--accent)] underline font-medium"
                >
                  Google Ads Settings
                </a>
                . Alternatively, you can opt out of a third-party vendor&rsquo;s use of cookies for personalized advertising by visiting{' '}
                <a
                  href="https://www.aboutads.info/choices/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--accent)] underline font-medium"
                >
                  aboutads.info
                </a>
                .
              </li>
              <li>
                <strong>Ad Isolation:</strong> Third-party ad scripts execute in sandboxed frames and have zero programmatic access to your document text, text areas, or Encrypted Vault keys.
              </li>
            </ul>
          </div>
        </article>

        {/* Section 4: Data Rights & Contact */}
        <article className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-8 space-y-4">
          <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-[var(--accent)]" />
            4. User Rights &amp; Privacy Contact
          </h2>
          <p>
            Because we do not store user accounts, identities, or server-side document databases, we do not maintain personal user profiles.
            You can exercise your data erasure rights at any moment simply by clearing your browser cache and local storage.
          </p>
          <p>
            If you have questions regarding our cryptographic implementations, data boundaries, or privacy disclosures, please contact the maintainer:
          </p>
          <div className="rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] p-3 text-xs font-mono text-[var(--text-primary)]">
            Email: varaddalvi10@gmail.com | Maintainer: Achira621
          </div>
        </article>
      </div>
    </div>
  );
};
