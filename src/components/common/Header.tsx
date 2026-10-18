import React from 'react';
import { ShieldCheck, Moon, Sun, Lock, Sparkles, FileSearch, BookOpen } from 'lucide-react';

export type ActiveTab =
  | 'humanizer'
  | 'plagiarism-checker'
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

  const navItems = [
    { id: 'humanizer' as ActiveTab, label: 'Free AI Humanizer', icon: Sparkles },
    { id: 'plagiarism-checker' as ActiveTab, label: 'Plagiarism Checker', icon: FileSearch },
    { id: 'paraphrase' as ActiveTab, label: 'Paraphrasing Tool', icon: Sparkles },
    { id: 'how-to-humanize' as ActiveTab, label: 'Writing Guide', icon: BookOpen },
    { id: 'privacy-lab' as ActiveTab, label: 'Privacy Lab', icon: ShieldCheck },
    { id: 'vault' as ActiveTab, label: 'Vault', icon: Lock },
    { id: 'docs' as ActiveTab, label: 'Docs', icon: BookOpen },
  ];

  return (
    <header className="sticky top-0 z-30 w-full border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/90 backdrop-blur-md transition-colors">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6">
        {/* Brand Wordmark */}
        <div
          onClick={() => setActiveTab('humanizer')}
          className="flex cursor-pointer items-center space-x-2.5 transition-opacity hover:opacity-90"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--accent)] text-[var(--accent-contrast)] shadow-xs">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold tracking-tight text-[var(--text-primary)]">
                HumanizeText
              </span>
              <span className="hidden rounded bg-[var(--accent-light)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--accent)] sm:inline-block">
                Privacy-First
              </span>
            </div>
            <p className="hidden text-[10px] text-[var(--text-muted)] md:block">
              100% On-Device AI Humanizer &amp; Plagiarism Detection
            </p>
          </div>
        </div>

        {/* Navigation tabs */}
        <nav className="hidden items-center space-x-1 xl:flex">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = resolvedTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-[var(--accent-light)] text-[var(--accent)] font-semibold shadow-2xs'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right side controls: Security badge + Dark mode toggle */}
        <div className="flex items-center space-x-3">
          <div className="hidden items-center space-x-1.5 rounded-full border border-[var(--accent-border)] bg-[var(--accent-light)] px-2.5 py-1 text-[11px] font-medium text-[var(--accent)] md:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
            <span>0 Data Uploads</span>
          </div>

          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Responsive horizontal navigation bar for all screens under xl */}
      <div className="flex overflow-x-auto border-t border-[var(--border-subtle)] px-2 py-1.5 xl:hidden scrollbar-none">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = resolvedTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex shrink-0 items-center space-x-1 rounded-md px-2.5 py-1 text-xs font-medium ${
                isActive
                  ? 'bg-[var(--accent-light)] text-[var(--accent)] font-semibold'
                  : 'text-[var(--text-secondary)]'
              }`}
            >
              <Icon className="h-3 w-3" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
