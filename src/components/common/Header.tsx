import React, { useState } from 'react';
import {
  Moon,
  Sun,
  Lock,
  Sparkles,
  FileSearch,
  BookOpen,
  ShieldCheck,
  Cpu,
  Eye,
  Menu,
  Shield,
  PenTool,
} from 'lucide-react';
import { HumanizeLogo } from './HumanizeLogo';
import { NavDropdown, type DropdownItem } from './NavDropdown';
import { MobileNavDrawer } from './MobileNavDrawer';

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
  const [openDropdown, setOpenDropdown] = useState<'writing' | 'security' | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Normalize aliases
  const resolvedTab: ActiveTab =
    activeTab === 'editor'
      ? 'humanizer'
      : activeTab === 'similarity'
        ? 'plagiarism-checker'
        : activeTab;

  // Navigation handler that closes any open menus
  const handleSelectTab = (tab: ActiveTab) => {
    setOpenDropdown(null);
    setIsMobileMenuOpen(false);
    setActiveTab(tab);
  };

  // Primary direct items
  const primaryNavItems: Array<{
    id: ActiveTab;
    label: string;
    shortLabel?: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { id: 'humanizer', label: 'AI Humanizer', href: '/', icon: Sparkles },
    { id: 'ai-detector', label: 'AI Detector', href: '/ai-detector', icon: Cpu },
    {
      id: 'vault',
      label: 'Security Vault & Writing Assistant',
      shortLabel: 'Security Vault',
      href: '/vault',
      icon: Lock,
    },
  ];

  // Secondary "Writing & Tools" dropdown items
  const writingToolItems: DropdownItem[] = [
    {
      id: 'paraphrase',
      label: 'Paraphrasing Tool',
      href: '/paraphrase',
      description: 'Restructure sentences while safeguarding citations & academic integrity',
      icon: Sparkles,
    },
    {
      id: 'metadata-inspector',
      label: 'Metadata Inspector',
      href: '/metadata-inspector',
      description: 'Client-side EXIF, GPS location, and camera hardware scrubber',
      icon: Eye,
    },
    {
      id: 'how-to-humanize',
      label: 'Writing Guide',
      href: '/how-to-humanize',
      description: 'Practical editorial handbook on burstiness, perplexity & human voice',
      icon: BookOpen,
    },
  ];

  // Secondary "Security & Privacy" dropdown items
  const securityItems: DropdownItem[] = [
    {
      id: 'plagiarism-checker',
      label: 'Plagiarism Checker',
      href: '/plagiarism-checker',
      description: 'Zero-upload document comparison via cryptographic Winnowing',
      icon: FileSearch,
    },
    {
      id: 'privacy-lab',
      label: 'Interactive Privacy Lab',
      href: '/privacy-lab',
      description: 'Interactive SHA-256 proofs, tamper tests & live egress auditor',
      icon: ShieldCheck,
    },
    {
      id: 'docs',
      label: 'Threat Model & Docs',
      href: '/docs',
      description: 'Technical security specifications, RFC citations & research papers',
      icon: BookOpen,
    },
  ];

  return (
    <header className="sticky top-0 z-30 w-full border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/95 backdrop-blur-md transition-colors">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6">
        {/* Brand Logo & Wordmark as crawlable link */}
        <div className="flex items-center space-x-6">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              handleSelectTab('humanizer');
            }}
            className="flex cursor-pointer items-center transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded-lg p-0.5"
            aria-label="HumanizeText Homepage"
          >
            <HumanizeLogo variant="horizontal" size="md" showTagline={false} />
          </a>

          {/* Desktop Navigation: 3 direct links + 2 task-organized dropdowns */}
          <nav
            className="hidden items-center space-x-1 lg:flex"
            aria-label="Main Navigation"
          >
            {primaryNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = resolvedTab === item.id;
              return (
                <a
                  key={item.id}
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={(e) => {
                    e.preventDefault();
                    handleSelectTab(item.id);
                  }}
                  className={`flex items-center space-x-1.5 rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-[color,background-color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
                    isActive
                      ? 'bg-[var(--accent-light)] text-[var(--accent-deep)] dark:text-[#34D399] shadow-xs'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  {item.shortLabel ? (
                    <>
                      <span className="hidden xl:inline">{item.label}</span>
                      <span className="xl:hidden">{item.shortLabel}</span>
                    </>
                  ) : (
                    <span>{item.label}</span>
                  )}
                </a>
              );
            })}

            {/* Dropdown 1: Writing & Tools */}
            <NavDropdown
              id="writing-tools"
              label="More Tools"
              icon={PenTool}
              items={writingToolItems}
              resolvedTab={resolvedTab}
              setActiveTab={handleSelectTab}
              isOpen={openDropdown === 'writing'}
              onToggle={() =>
                setOpenDropdown((prev) => (prev === 'writing' ? null : 'writing'))
              }
              onClose={() => setOpenDropdown(null)}
            />

            {/* Dropdown 2: Security & Privacy */}
            <NavDropdown
              id="security-privacy"
              label="Security & Privacy"
              icon={Shield}
              items={securityItems}
              resolvedTab={resolvedTab}
              setActiveTab={handleSelectTab}
              isOpen={openDropdown === 'security'}
              onToggle={() =>
                setOpenDropdown((prev) => (prev === 'security' ? null : 'security'))
              }
              onClose={() => setOpenDropdown(null)}
            />
          </nav>
        </div>

        {/* Right side controls: Security badge + Theme toggle + Mobile Menu trigger */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Privacy Guarantee Pill (clickable to Privacy Lab) */}
          <a
            href="/privacy-lab"
            onClick={(e) => {
              e.preventDefault();
              handleSelectTab('privacy-lab');
            }}
            title="Inspect zero-log client cryptographic architecture"
            className="hidden items-center space-x-1.5 rounded-full border border-[var(--accent-border)] bg-[var(--accent-light)] px-2.5 py-1 text-[11px] font-semibold text-[var(--accent-deep)] dark:text-[#34D399] transition-opacity hover:opacity-85 sm:flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] animate-pulse" aria-hidden="true" />
            <span>0 Data Uploads</span>
          </a>

          {/* Theme toggle button */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            {isDark ? (
              <Sun className="h-4 w-4 text-amber-400" aria-hidden="true" />
            ) : (
              <Moon className="h-4 w-4 text-slate-600" aria-hidden="true" />
            )}
          </button>

          {/* Mobile hamburger menu toggle */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={isMobileMenuOpen}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] lg:hidden"
          >
            <Menu className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Slide-over Mobile Navigation Drawer */}
      <MobileNavDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        resolvedTab={resolvedTab}
        setActiveTab={handleSelectTab}
        isDark={isDark}
        toggleTheme={toggleTheme}
      />
    </header>
  );
};
