import React from 'react';
import { Terminal } from 'lucide-react';
import type { ActiveTab } from './Header';
import { HumanizeLogo } from './HumanizeLogo';

interface FooterProps {
  setActiveTab: (tab: ActiveTab) => void;
}

export const Footer: React.FC<FooterProps> = ({ setActiveTab }) => {
  return (
    <footer className="mt-auto border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] py-8 text-xs text-[var(--text-secondary)] transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4">
          {/* Col 1 */}
          <div>
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab('humanizer');
              }}
              className="cursor-pointer transition-opacity hover:opacity-90 inline-block"
              aria-label="HumanizeText Home"
            >
              <HumanizeLogo variant="horizontal" size="sm" showTagline={true} />
            </a>
            <p className="mt-2 text-[11px] leading-relaxed text-[var(--text-muted)]">
              Privacy-first writing humanization, AI content detection, and cryptographic similarity scanning. Offers 100% on-device offline tools alongside ephemeral, zero-retention Cloudflare edge AI.
            </p>
          </div>

          {/* Col 2: Free Dedicated Tools */}
          <div>
            <span className="font-semibold text-[var(--text-primary)]">Free Writing Tools</span>
            <ul className="mt-2 space-y-1.5 text-[11px]">
              <li>
                <a
                  href="/"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab('humanizer');
                  }}
                  className="hover:text-[var(--accent)] hover:underline"
                >
                  Free AI Humanizer
                </a>
              </li>
              <li>
                <a
                  href="/ai-detector"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab('ai-detector');
                  }}
                  className="hover:text-[var(--accent)] hover:underline"
                >
                  AI Text &amp; Image Detector
                </a>
              </li>
              <li>
                <a
                  href="/plagiarism-checker"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab('plagiarism-checker');
                  }}
                  className="hover:text-[var(--accent)] hover:underline"
                >
                  Free Online Plagiarism Checker
                </a>
              </li>
              <li>
                <a
                  href="/metadata-inspector"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab('metadata-inspector');
                  }}
                  className="hover:text-[var(--accent)] hover:underline"
                >
                  Metadata &amp; Signature Inspector
                </a>
              </li>
              <li>
                <a
                  href="/paraphrase"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab('paraphrase');
                  }}
                  className="hover:text-[var(--accent)] hover:underline"
                >
                  Free Paraphrasing Tool
                </a>
              </li>
              <li>
                <a
                  href="/how-to-humanize"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab('how-to-humanize');
                  }}
                  className="hover:text-[var(--accent)] hover:underline"
                >
                  How to Humanize AI Writing
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Privacy & Cryptography */}
          <div>
            <span className="font-semibold text-[var(--text-primary)]">Privacy &amp; Cryptography</span>
            <ul className="mt-2 space-y-1.5 text-[11px]">
              <li>
                <a
                  href="/privacy-lab"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab('privacy-lab');
                  }}
                  className="hover:text-[var(--accent)] hover:underline"
                >
                  Interactive Privacy Lab
                </a>
              </li>
              <li>
                <a
                  href="/vault"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab('vault');
                  }}
                  className="hover:text-[var(--accent)] hover:underline"
                >
                  AES-256-GCM Local Vault
                </a>
              </li>
              <li>
                <a
                  href="/docs"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab('docs');
                  }}
                  className="hover:text-[var(--accent)] hover:underline"
                >
                  Threat Model &amp; Cryptography
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4 */}
          <div>
            <span className="font-semibold text-[var(--text-primary)]">Architecture Guarantee</span>
            <div className="mt-2 rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-2.5 text-[11px] leading-relaxed">
              <div className="flex items-center space-x-1 font-mono text-[10px] text-[var(--accent)]">
                <Terminal className="h-3 w-3" />
                <span>HYBRID_PRIVACY_GUARANTEE</span>
              </div>
              <p className="mt-1 text-[var(--text-muted)]">
                Choose 100% offline in-browser execution or ephemeral, zero-log Cloudflare Workers AI edge inference. Never stored on disk or used for training.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between border-t border-[var(--border-subtle)] pt-4 text-[11px] text-[var(--text-muted)] sm:flex-row">
          <div>© 2026 HumanizeText. Open source under Apache 2.0 license.</div>
          <div className="mt-2 flex items-center space-x-4 sm:mt-0">
            <a
              href="/docs"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab('docs');
              }}
              className="hover:text-[var(--text-primary)]"
            >
              Privacy Documentation
            </a>
            <a
              href="/docs"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab('docs');
              }}
              className="hover:text-[var(--text-primary)]"
            >
              Research Roadmap
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
