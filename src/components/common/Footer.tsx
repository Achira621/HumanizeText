import React from 'react';
import type { ActiveTab } from './Header';
import { HumanizeLogo } from './HumanizeLogo';

interface FooterProps {
  setActiveTab: (tab: ActiveTab) => void;
}

export const Footer: React.FC<FooterProps> = ({ setActiveTab }) => {
  return (
    <footer className="mt-auto border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] py-8 text-xs text-[var(--text-secondary)] transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-5">
          {/* Col 1: Brand & Philosophy */}
          <div className="md:col-span-1">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab('humanizer');
              }}
              className="cursor-pointer transition-opacity hover:opacity-90 inline-block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded"
              aria-label="HumanizeText Home"
            >
              <HumanizeLogo variant="horizontal" size="sm" showTagline={true} />
            </a>
            <p className="mt-2.5 text-[11px] leading-relaxed text-[var(--text-muted)]">
              Privacy-first writing clarity, factual invariant preservation, AI pattern diagnostics, and cryptographic document similarity. Open source under Apache 2.0.
            </p>
          </div>

          {/* Col 2: Writing & Paraphrasing Tools */}
          <div>
            <span className="font-semibold text-[var(--text-primary)]">Writing Studio</span>
            <ul className="mt-2.5 space-y-2 text-[11px]">
              <li>
                <a
                  href="/"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab('humanizer');
                  }}
                  className="hover:text-[var(--accent)] hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)] rounded"
                >
                  AI Humanizer
                </a>
              </li>
              <li>
                <a
                  href="/paraphrase"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab('paraphrase');
                  }}
                  className="hover:text-[var(--accent)] hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)] rounded"
                >
                  Paraphrasing Tool
                </a>
              </li>
              <li>
                <a
                  href="/how-to-humanize"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab('how-to-humanize');
                  }}
                  className="hover:text-[var(--accent)] hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)] rounded"
                >
                  Writing Quality Guide
                </a>
              </li>
              <li>
                <a
                  href="/vault"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab('vault');
                  }}
                  className="hover:text-[var(--accent)] hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)] rounded"
                >
                  Security Vault &amp; Assistant
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Detection & Forensics */}
          <div>
            <span className="font-semibold text-[var(--text-primary)]">Detection &amp; Forensics</span>
            <ul className="mt-2.5 space-y-2 text-[11px]">
              <li>
                <a
                  href="/ai-detector"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab('ai-detector');
                  }}
                  className="hover:text-[var(--accent)] hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)] rounded"
                >
                  AI Content Detector
                </a>
              </li>
              <li>
                <a
                  href="/plagiarism-checker"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab('plagiarism-checker');
                  }}
                  className="hover:text-[var(--accent)] hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)] rounded"
                >
                  Plagiarism Checker
                </a>
              </li>
              <li>
                <a
                  href="/metadata-inspector"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab('metadata-inspector');
                  }}
                  className="hover:text-[var(--accent)] hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)] rounded"
                >
                  Metadata Inspector
                </a>
              </li>
              <li>
                <a
                  href="/detector-limitations"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab('detector-limitations');
                  }}
                  className="hover:text-[var(--accent)] hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)] rounded"
                >
                  Detector Limitations
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Research & Methodology */}
          <div>
            <span className="font-semibold text-[var(--text-primary)]">Research &amp; Guides</span>
            <ul className="mt-2.5 space-y-2 text-[11px]">
              <li>
                <a
                  href="/resources"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab('resources');
                  }}
                  className="hover:text-[var(--accent)] hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)] rounded"
                >
                  Writing &amp; Research Hub
                </a>
              </li>
              <li>
                <a
                  href="/methodology"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab('methodology');
                  }}
                  className="hover:text-[var(--accent)] hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)] rounded"
                >
                  Testing Methodology
                </a>
              </li>
              <li>
                <a
                  href="/privacy-lab"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab('privacy-lab');
                  }}
                  className="hover:text-[var(--accent)] hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)] rounded"
                >
                  Interactive Privacy Lab
                </a>
              </li>
              <li>
                <a
                  href="/docs"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab('docs');
                  }}
                  className="hover:text-[var(--accent)] hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)] rounded"
                >
                  Security Documentation
                </a>
              </li>
            </ul>
          </div>

          {/* Col 5: Trust & Organization */}
          <div>
            <span className="font-semibold text-[var(--text-primary)]">Trust &amp; Organization</span>
            <ul className="mt-2.5 space-y-2 text-[11px]">
              <li>
                <a
                  href="/about"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab('about');
                  }}
                  className="hover:text-[var(--accent)] hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)] rounded"
                >
                  About HumanizeText
                </a>
              </li>
              <li>
                <a
                  href="/contact"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab('contact');
                  }}
                  className="hover:text-[var(--accent)] hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)] rounded"
                >
                  Contact &amp; Support
                </a>
              </li>
              <li>
                <a
                  href="/privacy-policy"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab('privacy-policy');
                  }}
                  className="hover:text-[var(--accent)] hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)] rounded"
                >
                  Privacy Policy &amp; Cookies
                </a>
              </li>
              <li>
                <a
                  href="/terms"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab('terms');
                  }}
                  className="hover:text-[var(--accent)] hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)] rounded"
                >
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between border-t border-[var(--border-subtle)] pt-4 text-[11px] text-[var(--text-muted)] sm:flex-row">
          <div>© 2026 HumanizeText. Maintained by Achira621 under Apache 2.0.</div>
          <div className="mt-2 flex items-center space-x-4 sm:mt-0">
            <a
              href="/privacy-policy"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab('privacy-policy');
              }}
              className="hover:text-[var(--text-primary)] hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)] rounded"
            >
              Privacy &amp; Cookie Disclosure
            </a>
            <a
              href="/terms"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab('terms');
              }}
              className="hover:text-[var(--text-primary)] hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)] rounded"
            >
              Terms of Service
            </a>
            <a
              href="/contact"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab('contact');
              }}
              className="hover:text-[var(--text-primary)] hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)] rounded"
            >
              Contact Maintainer
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
