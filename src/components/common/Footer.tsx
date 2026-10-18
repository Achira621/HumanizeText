import React from 'react';
import { ShieldCheck, Cpu, Terminal } from 'lucide-react';
import type { ActiveTab } from './Header';

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
            <div className="flex items-center space-x-2 font-bold text-[var(--text-primary)]">
              <ShieldCheck className="h-4 w-4 text-[var(--accent)]" />
              <span>HumanizeText</span>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-[var(--text-muted)]">
              Privacy-first writing humanization and cryptographic similarity checker. Built to run 100% on-device via Web Crypto.
            </p>
          </div>

          {/* Col 2 */}
          <div>
            <span className="font-semibold text-[var(--text-primary)]">Privacy &amp; Cryptography</span>
            <ul className="mt-2 space-y-1.5 text-[11px]">
              <li>
                <button
                  onClick={() => setActiveTab('privacy-lab')}
                  className="hover:text-[var(--accent)] hover:underline"
                >
                  Interactive Privacy Lab
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('vault')}
                  className="hover:text-[var(--accent)] hover:underline"
                >
                  AES-256-GCM Local Vault
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('docs')}
                  className="hover:text-[var(--accent)] hover:underline"
                >
                  Threat Model &amp; Limitations
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3 */}
          <div>
            <span className="font-semibold text-[var(--text-primary)]">Core Primitives</span>
            <ul className="mt-2 space-y-1 text-[11px] text-[var(--text-muted)]">
              <li className="flex items-center space-x-1.5">
                <Cpu className="h-3 w-3 text-[var(--accent)]" />
                <span>SHA-256 Document Integrity</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <Cpu className="h-3 w-3 text-[var(--accent)]" />
                <span>HMAC-SHA-256 Ephemeral Winnowing</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <Cpu className="h-3 w-3 text-[var(--accent)]" />
                <span>PBKDF2 (600,000 iterations)</span>
              </li>
            </ul>
          </div>

          {/* Col 4 */}
          <div>
            <span className="font-semibold text-[var(--text-primary)]">Architecture Guarantee</span>
            <div className="mt-2 rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-2.5 text-[11px] leading-relaxed">
              <div className="flex items-center space-x-1 font-mono text-[10px] text-[var(--accent)]">
                <Terminal className="h-3 w-3" />
                <span>ZERO_SERVER_TRANSMISSION</span>
              </div>
              <p className="mt-1 text-[var(--text-muted)]">
                Zero document text, extracted strings, or secret keys ever touch a server. Cloudflare Pages static distribution.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between border-t border-[var(--border-subtle)] pt-4 text-[11px] text-[var(--text-muted)] sm:flex-row">
          <div>© 2026 HumanizeText. Open source under Apache 2.0 license.</div>
          <div className="mt-2 flex items-center space-x-4 sm:mt-0">
            <button onClick={() => setActiveTab('docs')} className="hover:text-[var(--text-primary)]">
              Privacy Documentation
            </button>
            <button onClick={() => setActiveTab('docs')} className="hover:text-[var(--text-primary)]">
              Research Roadmap
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
