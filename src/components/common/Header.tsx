import React from 'react';
import { Moon, Sun, Lock, Sparkles, FileSearch, BookOpen, ShieldCheck, Cpu, Eye } from 'lucide-react';
import { HumanizeLogo } from './HumanizeLogo';

export type ActiveTab =
  | 'humanizer'
  | 'plagiarism-checker'
  | 'ai-detector'
  | 'metadata-inspector'
  | 'paraphrase'
  | 'how-to-humanize'
  | 'privacy-lab'
  | 'vault'
  | 'docs'
  | 'editor'
  | 'similarity';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isDark: boolean;
  toggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isDark,
  toggleTheme,
}) => {
  // Normalize aliases
  const resolvedTab =
    activeTab === 'editor'
      ? 'humanizer'
      : activeTab === 'similarity'
        ? 'plagiarism-checker'
        : activeTab;

  const navItems: Array<{ id: ActiveTab; label: string; href: string; icon: any }> = [
    { id: 'humanizer', label: 'Free AI Humanizer', href: '/', icon: Sparkles },
    { id: 'ai-detector', label: 'AI Detector', href: '/ai-detector', icon: Cpu },
    { id: 'plagiarism-checker', label: 'Plagiarism Checker', href: '/plagiarism-checker', icon: FileSearch },
    { id: 'metadata-inspector', label: 'Metadata & Signatures', href: '/metadata-inspector', icon: Eye },
    { id: 'paraphrase', label: 'Paraphrasing Tool', href: '/paraphrase', icon: Sparkles },
    { id: 'how-to-humanize', label: 'Writing Guide', href: '/how-to-humanize', icon: BookOpen },
    { id: 'privacy-lab', label: 'Privacy Lab', href: '/privacy-lab', icon: ShieldCheck },
    { id: 'vault', label: 'Vault', href: '/vault', icon: Lock },
    { id: 'docs', label: 'Docs', href: '/docs', icon: BookOpen },
  ];

  return (
    <header className="sticky top-0 z-30 w-full border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/90 backdrop-blur-md transition-colors">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6">
        {/* Brand Logo & Wordmark as crawlable link */}
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('humanizer');
          }}
          className="flex cursor-pointer items-center transition-opacity hover:opacity-90"
          aria-label="HumanizeText Homepage"
        >
          <HumanizeLogo variant="horizontal" size="md" showTagline={false} />
        </a>

        {/* Navigation tabs as crawlable links */}
        <nav className="hidden items-center space-x-1 xl:flex" aria-label="Main Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = resolvedTab === item.id;
            return (
              <a
                key={item.id}
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab(item.id);
                }}
                className={`flex items-center space-x-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-[var(--accent-light)] text-[var(--accent-deep)] dark:text-[#34D399] shadow-xs'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{item.label}</span>
              </a>
            );
          })}
        </nav>

        {/* Right side controls: Try for Free Pill + Security badge + Dark mode toggle */}
        <div className="flex items-center space-x-2.5 sm:space-x-3">
          <div className="hidden items-center space-x-1.5 rounded-full border border-[var(--accent-border)] bg-[var(--accent-light)] px-2.5 py-1 text-[11px] font-semibold text-[var(--accent-deep)] dark:text-[#34D399] lg:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
            <span>0 Data Uploads</span>
          </div>

          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('humanizer');
            }}
            className="btn-brand-pill hidden px-4 py-1.5 text-xs font-bold sm:inline-flex items-center space-x-1"
          >
            <span>Try for Free</span>
            <span>→</span>
          </a>

          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Responsive horizontal navigation bar for all screens under xl */}
      <nav className="flex overflow-x-auto border-t border-[var(--border-subtle)] px-2 py-1.5 xl:hidden scrollbar-none" aria-label="Mobile Navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = resolvedTab === item.id;
          return (
            <a
              key={item.id}
              href={item.href}
              onClick={(e) => {
                e.preventDefault();
                setActiveTab(item.id);
              }}
              className={`flex shrink-0 items-center space-x-1 rounded-md px-2.5 py-1 text-xs font-medium ${
                isActive
                  ? 'bg-[var(--accent-light)] text-[var(--accent)] font-semibold'
                  : 'text-[var(--text-secondary)]'
              }`}
            >
              <Icon className="h-3 w-3" />
              <span>{item.label}</span>
            </a>
          );
        })}
      </nav>
    </header>
  );
};
