import React, { useEffect, useRef } from 'react';
import {
  X,
  Sparkles,
  FileSearch,
  BookOpen,
  ShieldCheck,
  Cpu,
  Eye,
  Lock,
  Sun,
  Moon,
  ChevronRight,
  Shield,
} from 'lucide-react';
import type { ActiveTab } from './Header';
import { HumanizeLogo } from './HumanizeLogo';

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  resolvedTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isDark: boolean;
  toggleTheme: () => void;
}

interface NavSection {
  title: string;
  items: Array<{
    id: ActiveTab;
    label: string;
    href: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
  }>;
}

const SECTIONS: NavSection[] = [
  {
    title: 'Writing Studio',
    items: [
      {
        id: 'humanizer',
        label: 'Free AI Humanizer',
        href: '/',
        description: 'Rewrite AI text with natural human cadence & variance',
        icon: Sparkles,
      },
      {
        id: 'paraphrase',
        label: 'Paraphrasing Tool',
        href: '/paraphrase',
        description: 'Rephrase sentences while preserving scholarly citations',
        icon: Sparkles,
      },
      {
        id: 'how-to-humanize',
        label: 'Writing Guide',
        href: '/how-to-humanize',
        description: 'Practical handbook on sentence burstiness & authentic voice',
        icon: BookOpen,
      },
    ],
  },
  {
    title: 'Detection & Forensics',
    items: [
      {
        id: 'ai-detector',
        label: 'AI Detector',
        href: '/ai-detector',
        description: 'Scan text & images for ChatGPT and synthetic patterns',
        icon: Cpu,
      },
      {
        id: 'plagiarism-checker',
        label: 'Plagiarism Checker',
        href: '/plagiarism-checker',
        description: 'Zero-upload document comparison via cryptographic Winnowing',
        icon: FileSearch,
      },
      {
        id: 'metadata-inspector',
        label: 'Metadata & Signatures',
        href: '/metadata-inspector',
        description: 'Inspect and sanitize image EXIF, GPS, and camera chunks',
        icon: Eye,
      },
    ],
  },
  {
    title: 'Privacy & Architecture',
    items: [
      {
        id: 'vault',
        label: 'Security Vault & Writing Assistant',
        href: '/vault',
        description: 'Zero-knowledge AES-256-GCM storage with on-device writing assistant',
        icon: Lock,
      },
      {
        id: 'privacy-lab',
        label: 'Interactive Privacy Lab',
        href: '/privacy-lab',
        description: 'Verify SHA-256 fingerprints & probe live network egress',
        icon: ShieldCheck,
      },
      {
        id: 'docs',
        label: 'Threat Model & Docs',
        href: '/docs',
        description: 'Formal security architecture, ADRs & cryptographic proofs',
        icon: BookOpen,
      },
    ],
  },
];

export const MobileNavDrawer: React.FC<MobileNavDrawerProps> = ({
  isOpen,
  onClose,
  resolvedTab,
  setActiveTab,
  isDark,
  toggleTheme,
}) => {
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Lock body scroll while open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Focus close button on open
      setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 50);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Navigation Menu"
      className="fixed inset-0 z-50 flex justify-end"
    >
      {/* Backdrop with blur */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-200 motion-reduce:transition-none"
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div
        ref={drawerRef}
        className="relative z-10 flex h-full w-full max-w-sm flex-col bg-[var(--bg-surface)] border-l border-[var(--border-subtle)] shadow-2xl transition-transform duration-200 motion-reduce:transition-none overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('humanizer');
              onClose();
            }}
            className="flex items-center"
            aria-label="HumanizeText Home"
          >
            <HumanizeLogo variant="horizontal" size="sm" showTagline={false} />
          </a>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close navigation menu"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 px-4 py-4 space-y-6">
          {SECTIONS.map((section) => (
            <div key={section.title} className="space-y-2">
              <h3 className="px-2 text-[10px] font-bold tracking-wider text-[var(--text-muted)] uppercase">
                {section.title}
              </h3>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = resolvedTab === item.id;

                  return (
                    <a
                      key={item.id}
                      href={item.href}
                      aria-current={isActive ? 'page' : undefined}
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveTab(item.id);
                        onClose();
                      }}
                      className={`group flex items-center justify-between rounded-xl px-3 py-2.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
                        isActive
                          ? 'bg-[var(--accent-light)] text-[var(--accent-deep)] dark:text-[#34D399] font-semibold'
                          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                            isActive
                              ? 'border-[var(--accent-border)] bg-[var(--bg-surface)] text-[var(--accent)]'
                              : 'border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-[var(--text-muted)] group-hover:text-[var(--text-primary)]'
                          }`}
                        >
                          <Icon className="h-4 w-4" aria-hidden="true" />
                        </div>
                        <div className="min-w-0 text-left">
                          <div className="text-xs font-semibold text-[var(--text-primary)] truncate">
                            {item.label}
                          </div>
                          <div className="text-[11px] text-[var(--text-muted)] truncate max-w-[210px]">
                            {item.description}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 pl-2">
                        {isActive ? (
                          <span className="rounded-full bg-[var(--accent)]/15 px-2 py-0.5 text-[10px] font-bold text-[var(--accent)]">
                            Active
                          </span>
                        ) : (
                          <ChevronRight
                            className="h-4 w-4 text-[var(--text-muted)] opacity-50 group-hover:opacity-100 transition-opacity"
                            aria-hidden="true"
                          />
                        )}
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer controls */}
        <div className="border-t border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-4 space-y-3">
          {/* Privacy status banner */}
          <a
            href="/privacy-lab"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('privacy-lab');
              onClose();
            }}
            className="flex items-center justify-between rounded-lg border border-[var(--accent-border)] bg-[var(--accent-light)] p-2.5 text-xs text-[var(--accent-deep)] dark:text-[#34D399] transition-opacity hover:opacity-90"
          >
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-[var(--accent)]" />
              <span className="font-semibold">Zero-Log Client Architecture</span>
            </div>
            <span className="text-[11px] underline">Inspect →</span>
          </a>

          {/* Theme toggle & close */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-[var(--text-muted)]">Interface Theme</span>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="flex items-center space-x-2 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            >
              {isDark ? (
                <>
                  <Sun className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="h-3.5 w-3.5 text-slate-600" aria-hidden="true" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
