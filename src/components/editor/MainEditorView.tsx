import React, { useState } from 'react';
import {
  Sparkles,
  FileSearch,
  ShieldCheck,
  ArrowRight,
  Copy,
  Trash2,
  FileText,
  Lock,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { FileDropzone } from '../common/FileDropzone';
import type { DocumentFile } from '../../types';
import type { ActiveTab } from '../common/Header';

interface MainEditorViewProps {
  currentText: string;
  setCurrentText: (text: string) => void;
  documentTitle: string;
  setDocumentTitle: (title: string) => void;
  setActiveTab: (tab: ActiveTab) => void;
  onQuickHumanize: () => void;
  onQuickCheckSimilarity: () => void;
}

export const MainEditorView: React.FC<MainEditorViewProps> = ({
  currentText,
  setCurrentText,
  documentTitle,
  setDocumentTitle,
  setActiveTab,
  onQuickHumanize,
  onQuickCheckSimilarity,
}) => {
  const [copied, setCopied] = useState(false);

  const words = currentText.trim().split(/\s+/).filter(Boolean);
  const wordCount = currentText.trim().length === 0 ? 0 : words.length;
  const characterCount = currentText.length;
  const readingTime = Math.ceil(wordCount / 200);

  const handleDocumentLoaded = (doc: DocumentFile) => {
    setCurrentText(doc.text);
    setDocumentTitle(doc.name);
  };

  const handleCopy = () => {
    if (!currentText) return;
    navigator.clipboard.writeText(currentText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setCurrentText('');
    setDocumentTitle('Untitled Draft');
  };

  const handleSamplePasted = (type: 'academic' | 'redundant') => {
    if (type === 'academic') {
      setCurrentText(
        `In order to examine the consequences of automated writing systems, it is important to note that a large number of researchers utilize computational methods. Due to the fact that prior studies demonstrated variance, we delve into the tapestry of empirical findings with regard to natural prose flow.`
      );
      setDocumentTitle('Sample Academic Draft.txt');
    } else {
      setCurrentText(
        `At this point in time, for the purpose of clarifying the situation, it should be noted that we have the ability to utilize modernized techniques. First and foremost, a significant portion of participants stated that needless to say, the project was successful.`
      );
      setDocumentTitle('Sample Redundant Draft.txt');
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      {/* Hero header */}
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-4xl">
          Free AI Humanizer &amp; Writing Assistant
        </h1>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-[var(--text-secondary)]">
          Humanize AI text, bypass AI detectors, and verify originality locally in your browser.
          100% private, free, and zero-server document processing.
        </p>
      </div>

      {/* Main Editor Card */}
      <div className="overflow-hidden rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] shadow-xs">
        {/* Editor Toolbar */}
        <div className="flex flex-wrap items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-4 py-2.5">
          <div className="flex items-center space-x-2">
            <FileText className="h-4 w-4 text-[var(--text-muted)]" />
            <input
              type="text"
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              className="border-none bg-transparent text-xs font-semibold text-[var(--text-primary)] focus:outline-hidden"
              placeholder="Document Title"
            />
          </div>

          <div className="flex items-center space-x-3 text-xs text-[var(--text-muted)]">
            <span className="font-mono">{wordCount} words</span>
            <span>•</span>
            <span className="font-mono">{characterCount} chars</span>
            <span>•</span>
            <span>~{readingTime} min read</span>

            <div className="ml-2 flex items-center space-x-1">
              <button
                onClick={handleCopy}
                disabled={!currentText}
                title="Copy Text"
                className="rounded p-1 text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] disabled:opacity-40"
              >
                {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-[var(--accent)]" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
              <button
                onClick={handleClear}
                disabled={!currentText}
                title="Clear Editor"
                className="rounded p-1 text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--error-text)] disabled:opacity-40"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Text Area */}
        <div className="relative">
          <textarea
            value={currentText}
            onChange={(e) => setCurrentText(e.target.value)}
            placeholder="Paste your text here, or drag and drop a document below to begin..."
            rows={12}
            className="w-full resize-y border-none bg-transparent p-5 text-sm leading-relaxed text-[var(--text-primary)] focus:outline-hidden"
          />
        </div>

        {/* Dropzone & Quick Samples Footer */}
        <div className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <FileDropzone
                onDocumentLoaded={handleDocumentLoaded}
                compact={true}
                label="Drop a file to load text (PDF, DOCX, TXT, MD)"
              />
            </div>
            <div className="flex flex-col justify-center space-y-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3 text-xs">
              <span className="font-medium text-[var(--text-secondary)]">Try sample text:</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => handleSamplePasted('academic')}
                  className="rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 py-1 text-[11px] text-[var(--text-primary)] hover:border-[var(--accent)]"
                >
                  Academic Jargon
                </button>
                <button
                  onClick={() => handleSamplePasted('redundant')}
                  className="rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 py-1 text-[11px] text-[var(--text-primary)] hover:border-[var(--accent)]"
                >
                  Bloated Bureaucratic
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons Bar */}
        <div className="flex flex-col items-center justify-between border-t border-[var(--border-strong)] bg-[var(--bg-subtle)] px-5 py-4 sm:flex-row">
          <div className="mb-3 flex items-center space-x-2 text-xs text-[var(--text-muted)] sm:mb-0">
            <ShieldCheck className="h-4 w-4 text-[var(--accent)]" />
            <span>Encrypted in memory • Web Crypto API</span>
          </div>

          <div className="flex w-full items-center justify-end space-x-3 sm:w-auto">
            <button
              onClick={onQuickCheckSimilarity}
              disabled={!currentText.trim()}
              className="flex items-center space-x-2 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] px-4 py-2.5 text-xs font-semibold text-[var(--text-primary)] shadow-xs transition-all hover:border-[var(--accent)] hover:bg-[var(--bg-subtle)] disabled:opacity-40"
            >
              <FileSearch className="h-4 w-4 text-[var(--text-muted)]" />
              <span>Check Similarity</span>
            </button>

            <button
              onClick={onQuickHumanize}
              disabled={!currentText.trim()}
              className="flex items-center space-x-2 rounded-lg bg-[var(--accent)] px-5 py-2.5 text-xs font-semibold text-[var(--accent-contrast)] shadow-xs transition-all hover:bg-[var(--accent-hover)] disabled:opacity-40"
            >
              <Sparkles className="h-4 w-4" />
              <span>Humanize Text</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Clear Privacy Statement & Educational Differentiator Cards */}
      <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* Humanization vs Similarity Detection Explainer */}
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 transition-colors">
          <div className="flex items-center space-x-2 font-bold text-[var(--text-primary)]">
            <Layers className="h-4 w-4 text-[var(--accent)]" />
            <h2 className="text-sm font-semibold">Humanization vs. Similarity Detection</h2>
          </div>
          <div className="mt-3 space-y-2 text-xs leading-relaxed text-[var(--text-secondary)]">
            <p>
              <strong className="text-[var(--text-primary)]">Humanization:</strong> Refines
              sentence cadence, cuts bureaucratic clutter, and restores natural rhythm while
              preserving all factual claims. No content is uploaded to remote LLM servers.
            </p>
            <p>
              <strong className="text-[var(--text-primary)]">Similarity Detection:</strong> Uses
              the <em>Winnowing algorithm</em> and <em>ephemeral HMAC-SHA-256</em> fingerprints
              to detect exact structural overlap against local documents without internet scraping.
            </p>
          </div>
        </div>

        {/* Cryptographic Privacy Guarantee Card */}
        <div className="rounded-xl border border-[var(--accent-border)] bg-[var(--accent-light)]/40 p-5 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 font-bold text-[var(--text-primary)]">
              <Lock className="h-4 w-4 text-[var(--accent)]" />
              <h2 className="text-sm font-semibold">Privacy-First Architecture</h2>
            </div>
            <button
              onClick={() => setActiveTab('privacy-lab')}
              className="text-xs font-medium text-[var(--accent)] hover:underline"
            >
              Open Privacy Lab →
            </button>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-[var(--text-secondary)]">
            Unlike commercial AI humanizers and similarity checkers that store and harvest
            your manuscripts, HumanizeText runs entirely client-side. We have no backend databases,
            no tracking scripts, and no secret keys.
          </p>
        </div>
      </div>
    </div>
  );
};
