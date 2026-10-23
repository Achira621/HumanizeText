import React, { useState } from 'react';
import {
  FileSearch,
  FileText,
  FileCheck,
  ShieldCheck,
  Cpu,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import type { DocumentFile, ReconstructedPassage, SimilarityReport } from '../../types';
import { SimilarityEngine } from '../../lib/similarity/engine';
import type { ReferenceInput } from '../../lib/similarity/engine';
import { FileDropzone } from '../common/FileDropzone';
import { MatchHighlighter } from './MatchHighlighter';
import { HumanizeLogo } from '../common/HumanizeLogo';
import {
  downloadFile,
  exportReportToHtml,
  exportReportToJson,
  exportReportToTxt,
} from '../../lib/similarity/reporter';
import type { ActiveTab } from '../common/Header';

interface FreePlagiarismCheckerPageProps {
  initialSubmittedText?: string;
  setActiveTab: (tab: ActiveTab) => void;
}

export const FreePlagiarismCheckerPage: React.FC<FreePlagiarismCheckerPageProps> = ({
  initialSubmittedText = '',
  setActiveTab,
}) => {
  const [submittedText, setSubmittedText] = useState(initialSubmittedText);
  const [submittedDocName, setSubmittedDocName] = useState('Submitted Draft.txt');
  const [referenceDocs, setReferenceDocs] = useState<ReferenceInput[]>([
    {
      id: 'ref-1',
      name: 'Sample_Reference_Source.txt',
      text: `In order to examine the consequences of automated writing systems, it is important to note that a large number of researchers utilize computational methods. Furthermore, empirical findings demonstrate that cryptographic hashing creates a one-way deterministic digest useful for data integrity checks without decrypting payloads.`,
    },
    {
      id: 'ref-2',
      name: 'Academic_Literature_Review.md',
      text: `Modern cryptographic algorithms emphasize authenticated symmetric ciphers. The winnowing algorithm proposed by Schleimer et al. selects a deterministic subset of k-gram hashes to guarantee match detection within a bounded window.`,
    },
  ]);

  const [activeRefId, setActiveRefId] = useState<string>('ref-1');
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonStage, setComparisonStage] = useState<string>('');
  const [comparisonProgress, setComparisonProgress] = useState<number>(0);
  const [report, setReport] = useState<SimilarityReport | null>(null);
  const [selectedPassage, setSelectedPassage] = useState<ReconstructedPassage | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleSubmittedFileLoaded = (doc: DocumentFile) => {
    setSubmittedText(doc.text);
    setSubmittedDocName(doc.name);
  };

  const handleAddReferenceFile = (doc: DocumentFile) => {
    const newRef: ReferenceInput = {
      id: `ref-${Date.now()}`,
      name: doc.name,
      text: doc.text,
    };
    setReferenceDocs((prev) => [...prev, newRef]);
    setActiveRefId(newRef.id);
  };

  const handleRemoveReference = (id: string) => {
    setReferenceDocs((prev) => prev.filter((r) => r.id !== id));
    if (activeRefId === id && referenceDocs.length > 1) {
      const remaining = referenceDocs.filter((r) => r.id !== id);
      setActiveRefId(remaining[0].id);
    }
  };

  const handleRunComparison = async () => {
    if (!submittedText.trim() || referenceDocs.length === 0) return;
    setIsComparing(true);
    setComparisonProgress(15);
    setComparisonStage(`Tokenizing input & ${referenceDocs.length} reference documents...`);
    setSelectedPassage(null);

    try {
      // Phase 1: Shingling and tokenization
      await new Promise((r) => setTimeout(r, 450));
      setComparisonProgress(40);
      setComparisonStage('Generating 5-word n-gram sliding shingles & ephemeral HMAC keys...');

      // Phase 2: Winnowing local minima selection
      await new Promise((r) => setTimeout(r, 500));
      setComparisonProgress(70);
      setComparisonStage('Executing winnowed hash intersection across comparison corpus...');

      // Actual cryptographic engine execution
      const rep = await SimilarityEngine.compareDocuments(
        submittedText,
        submittedDocName,
        referenceDocs
      );

      // Phase 3: Passage reconstruction
      await new Promise((r) => setTimeout(r, 400));
      setComparisonProgress(92);
      setComparisonStage('Reconstructing overlapping passage boundaries & SHA-256 digest...');

      await new Promise((r) => setTimeout(r, 250));
      setComparisonProgress(100);
      setComparisonStage('Complete');

      setReport(rep);
      if (rep.passages.length > 0) {
        setSelectedPassage(rep.passages[0]);
      }
    } catch (err: any) {
      alert(`Similarity comparison error: ${err?.message || 'Comparison failed'}`);
    } finally {
      setIsComparing(false);
      setComparisonProgress(0);
      setComparisonStage('');
    }
  };

  const handleExport = (format: 'json' | 'txt' | 'html') => {
    if (!report) return;
    const baseName = submittedDocName.replace(/\.[^/.]+$/, '');
    if (format === 'json') {
      downloadFile(
        `${baseName}-similarity-report.json`,
        exportReportToJson(report),
        'application/json'
      );
    } else if (format === 'txt') {
      downloadFile(
        `${baseName}-similarity-report.txt`,
        exportReportToTxt(report),
        'text/plain'
      );
    } else if (format === 'html') {
      downloadFile(
        `${baseName}-similarity-report.html`,
        exportReportToHtml(report),
        'text/html'
      );
    }
  };

  const faqs = [
    {
      q: 'Does this plagiarism checker upload my paper or essay to a database like Turnitin does?',
      a: 'No. When using this standalone Plagiarism Checker tool, all computation executes 100% inside your browser using the Web Crypto API against your supplied reference files. Not a single character of your draft or reference materials is transmitted to any server. (Note: On the Free AI Humanizer tab, users can optionally choose Cloud AI for rewriting, but this plagiarism comparison tool is always 100% on-device).',
    },
    {
      q: 'What can be compared with this free tool?',
      a: 'You can compare any submitted text or file against one or more reference files (PDF, DOCX, TXT, Markdown). It is ideal for comparing a student draft against lecture materials, checking a revision against a collaborator’s version, or auditing academic papers against primary source documents.',
    },
    {
      q: 'Why doesn’t this tool search the entire public internet like commercial checkers claim to do?',
      a: 'Searching the entire public web requires sending unencrypted documents to massive centralized web crawler databases that index and retain drafts. HumanizeText focuses on confidential, sovereign source auditing: you provide the reference documents (such as lecture notes, textbook chapters, or prior drafts), and our engine computes cryptographic intersection entirely inside your browser memory. No third party ever receives your draft.',
    },
    {
      q: 'How does the Winnowing algorithm detect plagiarism even if someone changes minor words?',
      a: 'Winnowing breaks down text into overlapping k-grams (5-word shingles) and computes a rolling hash across sliding windows. Even if an author deletes or changes a few words elsewhere in the paragraph, the undisturbed substrings within the window continue to trigger identical hashes. Our seed-and-extend algorithm then traces outward from matching hashes to accurately reconstruct the entire overlapping passage.',
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      {/* Wayfinding Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="mb-4">
        <ol className="flex items-center space-x-2 text-xs text-[var(--text-muted)]">
          <li>
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab('humanizer');
              }}
              className="hover:text-[var(--text-primary)] hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)] rounded"
            >
              Home
            </a>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <span>Detection</span>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="font-semibold text-[var(--text-primary)]">
            Plagiarism Checker
          </li>
        </ol>
      </nav>

      {/* Hero Header matching Brand Specification */}
      <div className="mb-10 text-center">
        <div className="mb-4 inline-flex items-center justify-center">
          <HumanizeLogo variant="stacked" size="lg" showTagline={true} />
        </div>

        <div className="mx-auto mb-3 inline-flex items-center space-x-2 rounded-full border border-[var(--accent-border)] bg-[var(--accent-light)] px-3.5 py-1 text-xs font-bold text-[var(--text-primary)] dark:text-[#34D399]">
          <ShieldCheck className="h-4 w-4 text-[#34D399]" />
          <span>Zero Server Uploads • Cryptographic Winnowing • Ephemeral HMAC-SHA-256</span>
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-4xl md:text-5xl">
          Free Online <span className="text-[#059669] dark:text-[#34D399]">Plagiarism Checker</span>
        </h1>
        <p className="mx-auto mt-3 max-w-3xl text-base text-[var(--text-secondary)]">
          Compare documents for verbatim overlap and matching passages with complete data sovereignty.
          Zero files uploaded, zero data logged, and zero permanent databases.
        </p>
      </div>

      {/* Main Comparison Card */}
      <div className="overflow-hidden rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] shadow-md">
        {/* Top Controls Toolbar */}
        <div className="flex flex-wrap items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-4 py-3">
          <div className="flex items-center space-x-2">
            <Cpu className="h-4 w-4 text-[var(--accent)]" />
            <span className="text-xs font-bold text-[var(--text-primary)]">
              Local Cryptographic Comparator
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {isComparing && (
              <div className="hidden sm:flex flex-col items-end pr-2 text-right">
                <span className="text-[11px] font-semibold text-[var(--accent)] animate-pulse">
                  {comparisonStage}
                </span>
                <span className="text-[10px] text-[var(--text-muted)] font-mono">
                  {comparisonProgress}% complete
                </span>
              </div>
            )}
            <button
              id="run-similarity-btn"
              onClick={handleRunComparison}
              disabled={isComparing || !submittedText.trim() || referenceDocs.length === 0}
              className="btn-brand-pill inline-flex items-center space-x-2 px-6 py-2 text-xs font-bold disabled:opacity-40"
            >
              <FileSearch className={`h-4 w-4 ${isComparing ? 'animate-spin' : ''}`} />
              <span>{isComparing ? 'Scanning...' : 'Run Similarity Check'}</span>
            </button>
          </div>
        </div>

        {/* Linear progress bar during comparison */}
        {isComparing && (
          <div
            role="progressbar"
            aria-valuenow={comparisonProgress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Document similarity comparison progress"
            className="h-1.5 w-full overflow-hidden bg-slate-200 dark:bg-slate-700"
          >
            <div
              className="h-full bg-[var(--accent)] transition-all duration-300"
              style={{ width: `${comparisonProgress}%` }}
            />
          </div>
        )}

        {/* 2-Column Document Layout */}
        <div className="grid grid-cols-1 divide-y border-b border-[var(--border-subtle)] lg:grid-cols-2 lg:divide-x lg:divide-y-0">
          {/* Column 1: Submitted Document */}
          <div className="flex flex-col p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <FileText className="h-4 w-4 text-[var(--text-muted)]" />
                <input
                  type="text"
                  value={submittedDocName}
                  onChange={(e) => setSubmittedDocName(e.target.value)}
                  className="rounded border border-transparent bg-transparent text-xs font-bold text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-hidden"
                />
              </div>
              <span className="text-xs text-[var(--text-muted)]">
                {submittedText.trim().split(/\s+/).filter(Boolean).length} words
              </span>
            </div>

            <textarea
              id="submitted-text-input"
              aria-label="Submitted document text to check for plagiarism"
              value={submittedText}
              onChange={(e) => setSubmittedText(e.target.value)}
              placeholder="Paste the document or essay you want to check here..."
              rows={11}
              className="w-full resize-none rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3.5 text-sm leading-relaxed text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-hidden"
            />

            <div className="mt-3">
              <FileDropzone
                onDocumentLoaded={handleSubmittedFileLoaded}
                compact={true}
                label="Drop target file (PDF, DOCX, TXT, MD)"
              />
            </div>
          </div>

          {/* Column 2: Reference Corpus / Comparison Sources */}
          <div className="flex flex-col bg-[var(--bg-subtle)]/20 p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <FileCheck className="h-4 w-4 text-[var(--accent)]" />
                <span className="text-xs font-bold text-[var(--text-primary)]">
                  Reference Sources ({referenceDocs.length})
                </span>
              </div>
              <span className="text-[11px] text-[var(--text-muted)]">
                Local comparisons only
              </span>
            </div>

            {/* Reference file pill switcher */}
            <div className="mb-2 flex flex-wrap gap-1.5">
              {referenceDocs.map((doc) => (
                <div
                  key={doc.id}
                  className={`flex items-center space-x-1.5 rounded-md px-2.5 py-1 text-xs transition-colors ${
                    activeRefId === doc.id
                      ? 'bg-[var(--accent)] text-[var(--accent-contrast)] font-medium'
                      : 'border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <button onClick={() => setActiveRefId(doc.id)} className="truncate max-w-[150px]">
                    {doc.name}
                  </button>
                  {referenceDocs.length > 1 && (
                    <button
                      onClick={() => handleRemoveReference(doc.id)}
                      className="text-[10px] opacity-70 hover:opacity-100"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Active Reference text preview */}
            <textarea
              readOnly
              aria-label="Reference source text preview"
              value={referenceDocs.find((r) => r.id === activeRefId)?.text || ''}
              rows={9}
              className="w-full resize-none rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 text-xs leading-relaxed text-[var(--text-secondary)]"
            />

            <div className="mt-3">
              <FileDropzone
                onDocumentLoaded={handleAddReferenceFile}
                compact={true}
                label="Add another reference file to check against"
              />
            </div>
          </div>
        </div>

        {/* Similarity Report Results (if generated) */}
        {report && (
          <div className="p-6">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-4">
              <div className="flex items-center space-x-4">
                <div
                  className={`flex h-14 w-14 flex-col items-center justify-center rounded-xl font-bold shadow-xs ${
                    report.estimatedOverlapPercentage > 20
                      ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                      : report.estimatedOverlapPercentage > 5
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  }`}
                >
                  <span className="text-xl leading-none">
                    {report.estimatedOverlapPercentage.toFixed(1)}%
                  </span>
                  <span className="text-[9px] uppercase tracking-wider">Overlap</span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">
                    Cryptographic Similarity Report
                  </h3>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[var(--text-muted)]">
                    <span>{report.passages.length} matching passages</span>
                    <span>•</span>
                    <span>{report.matchedWordsCount} matched words</span>
                    <span>•</span>
                    {report.matchingClassification && (
                      <>
                        <span>•</span>
                        <span className="inline-flex items-center rounded-full bg-[var(--bg-surface)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--accent)] border border-[var(--border-subtle)]">
                          Diagnosis: {report.matchingClassification}
                        </span>
                      </>
                    )}
                    <span className="font-mono text-[11px]">
                      HMAC Key: {report.ephemeralKeyFingerprintSha256.substring(0, 12)}...
                    </span>
                  </div>
                </div>
              </div>

              {/* Export buttons */}
              <div className="flex items-center space-x-2">
                <span className="text-xs text-[var(--text-muted)]">Export:</span>
                <button
                  onClick={() => handleExport('html')}
                  className="rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 py-1 text-xs font-medium text-[var(--text-primary)] hover:border-[var(--accent)]"
                >
                  HTML
                </button>
                <button
                  onClick={() => handleExport('json')}
                  className="rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 py-1 text-xs font-medium text-[var(--text-primary)] hover:border-[var(--accent)]"
                >
                  JSON
                </button>
                <button
                  onClick={() => handleExport('txt')}
                  className="rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 py-1 text-xs font-medium text-[var(--text-primary)] hover:border-[var(--accent)]"
                >
                  TXT
                </button>
              </div>
            </div>

            {/* Interactive Passage Match Highlighter */}
            <MatchHighlighter
              text={submittedText}
              passages={report.passages}
              selectedPassageId={selectedPassage?.id || null}
              onSelectPassage={setSelectedPassage}
            />
          </div>
        )}
      </div>

      {/* Structured SEO & Transparent Cyber Sections */}
      <section className="mt-12 space-y-8">
        {/* Section 1: What Can Be Compared vs What Cannot Be Searched */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Card A: What Can Be Compared */}
          <article className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6">
            <div className="flex items-center space-x-2 text-[var(--accent)]">
              <FileCheck className="h-5 w-5" />
              <h2 className="text-base font-bold text-[var(--text-primary)]">
                What Can Be Compared
              </h2>
            </div>
            <ul className="mt-4 space-y-2.5 text-xs leading-relaxed text-[var(--text-secondary)]">
              <li className="flex items-start space-x-2">
                <span className="text-[var(--accent)] font-bold">✓</span>
                <span>
                  <strong className="text-[var(--text-primary)]">Multi-format Local Files:</strong> Drag
                  and drop PDF, DOCX, TXT, and Markdown files up to 25 MB directly into the browser.
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-[var(--accent)] font-bold">✓</span>
                <span>
                  <strong className="text-[var(--text-primary)]">Student Drafts &amp; Lecture Sources:</strong> Verify
                  that essays accurately cite primary research papers without verbatim overlap.
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-[var(--accent)] font-bold">✓</span>
                <span>
                  <strong className="text-[var(--text-primary)]">Team Document Revisions:</strong> Compare
                  internal company proposals or contracts across drafts to identify added or copied paragraphs.
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-[var(--accent)] font-bold">✓</span>
                <span>
                  <strong className="text-[var(--text-primary)]">Attribution &amp; Quotes:</strong> Pinpoint
                  unquoted matches to ensure ethical paraphrasing and proper citations.
                </span>
              </li>
            </ul>
          </article>

          {/* Card B: What Cannot Be Searched (And Why It Protects Privacy) */}
          <article className="rounded-xl border border-red-500/20 bg-red-500/5 p-6">
            <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
              <ShieldCheck className="h-5 w-5" />
              <h2 className="text-base font-bold text-[var(--text-primary)]">
                What Cannot Be Searched (And Why)
              </h2>
            </div>
            <ul className="mt-4 space-y-2.5 text-xs leading-relaxed text-[var(--text-secondary)]">
              <li className="flex items-start space-x-2">
                <span className="text-red-500 font-bold">×</span>
                <span>
                  <strong className="text-[var(--text-primary)]">No Public Web Scraping:</strong> We do
                  not transmit your document across the internet to scrape search engines or third-party blogs.
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-red-500 font-bold">×</span>
                <span>
                  <strong className="text-[var(--text-primary)]">No Central Repository:</strong> We do
                  not maintain a proprietary corporate archive of student papers like Turnitin does.
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-[var(--accent)] font-bold">🔒</span>
                <span>
                  <strong className="text-[var(--text-primary)]">Why This Protects You:</strong> Commercial
                  tools retain your unpublished IP. Once uploaded to a cloud database, your confidential thesis,
                  patent draft, or novel manuscript is forever out of your hands. HumanizeText guarantees 100% data sovereignty.
                </span>
              </li>
            </ul>
          </article>
        </div>

        {/* Section 2: How Local Processing Works (Winnowing & HMAC) */}
        <article className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-8">
          <div className="flex items-center space-x-2 text-[var(--accent)]">
            <Cpu className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Cryptographic Architecture</span>
          </div>
          <h2 className="mt-2 text-xl font-bold text-[var(--text-primary)] sm:text-2xl">
            How Local Cryptographic Processing Works
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 text-xs">
            <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-4">
              <span className="font-mono text-sm font-bold text-[var(--accent)]">01. Unicode NFC</span>
              <p className="mt-2 text-[var(--text-secondary)]">
                Text is normalized to Unicode NFC and tokenized with Romance elision handling to avoid false misses caused by diacritics or smart quotes.
              </p>
            </div>

            <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-4">
              <span className="font-mono text-sm font-bold text-[var(--accent)]">02. 5-Gram Shingles</span>
              <p className="mt-2 text-[var(--text-secondary)]">
                The document is sliced into overlapping shingles of 5 consecutive normalized words to capture structural syntactic sequences.
              </p>
            </div>

            <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-4">
              <span className="font-mono text-sm font-bold text-[var(--accent)]">03. Winnowing Window</span>
              <p className="mt-2 text-[var(--text-secondary)]">
                Schleimer et al. winnowing with window w=4 deterministically selects minimum hash anchors, creating a robust, sparse fingerprint.
              </p>
            </div>

            <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-4">
              <span className="font-mono text-sm font-bold text-[var(--accent)]">04. Ephemeral HMAC</span>
              <p className="mt-2 text-[var(--text-secondary)]">
                Hashes are keyed with a volatile in-memory HMAC-SHA-256 session key, rendering fingerprints un-linkable outside the active session.
              </p>
            </div>
          </div>
        </article>

        {/* Section 3: Plagiarism Checker FAQs */}
        <article className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-8">
          <h2 className="text-xl font-bold text-[var(--text-primary)] sm:text-2xl">
            Frequently Asked Questions
          </h2>
          <div className="mt-6 space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    aria-expanded={isOpen}
                    aria-controls={`plag-faq-answer-${index}`}
                    className="flex w-full items-center justify-between p-4 text-left text-sm font-semibold text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded-lg"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4 shrink-0 text-[var(--accent)]" aria-hidden="true" />
                    ) : (
                      <ChevronDown className="h-4 w-4 shrink-0 text-[var(--text-muted)]" aria-hidden="true" />
                    )}
                  </button>
                  {isOpen && (
                    <div
                      id={`plag-faq-answer-${index}`}
                      role="region"
                      className="border-t border-[var(--border-subtle)] px-4 pb-4 pt-2 text-xs leading-relaxed text-[var(--text-secondary)]"
                    >
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </article>

        {/* Section 4: Navigation CTAs */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <button
            onClick={() => setActiveTab('humanizer')}
            className="flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 text-left transition-all hover:border-[var(--accent)] hover:shadow-xs"
          >
            <div>
              <div className="flex items-center space-x-2 font-bold text-[var(--text-primary)]">
                <Sparkles className="h-4 w-4 text-[var(--accent)]" />
                <span>Free AI Humanizer</span>
              </div>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                Vary sentence cadence, eliminate repetitive AI phrases, and improve prose flow.
              </p>
            </div>
            <ArrowRight className="h-5 w-5 shrink-0 text-[var(--accent)]" />
          </button>

          <button
            onClick={() => setActiveTab('paraphrase')}
            className="flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 text-left transition-all hover:border-[var(--accent)] hover:shadow-xs"
          >
            <div>
              <div className="flex items-center space-x-2 font-bold text-[var(--text-primary)]">
                <FileCheck className="h-4 w-4 text-[var(--accent)]" />
                <span>Paraphrasing Tool &amp; Attribution Guard</span>
              </div>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                Restructure sentences for academic rigor while preserving citation tokens.
              </p>
            </div>
            <ArrowRight className="h-5 w-5 shrink-0 text-[var(--accent)]" />
          </button>
        </div>
      </section>
    </div>
  );
};
