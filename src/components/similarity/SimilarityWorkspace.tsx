import React, { useState } from 'react';
import {
  FileSearch,
  Download,
  AlertTriangle,
  FileText,
  FileCheck,
} from 'lucide-react';
import type { DocumentFile, ReconstructedPassage, SimilarityReport } from '../../types';
import { SimilarityEngine } from '../../lib/similarity/engine';
import type { ReferenceInput } from '../../lib/similarity/engine';
import { FileDropzone } from '../common/FileDropzone';
import { MatchHighlighter } from './MatchHighlighter';
import {
  downloadFile,
  exportReportToHtml,
  exportReportToJson,
  exportReportToTxt,
} from '../../lib/similarity/reporter';

interface SimilarityWorkspaceProps {
  initialSubmittedText?: string;
}

export const SimilarityWorkspace: React.FC<SimilarityWorkspaceProps> = ({
  initialSubmittedText = '',
}) => {
  const [submittedText, setSubmittedText] = useState(initialSubmittedText);
  const [submittedDocName, setSubmittedDocName] = useState('Submitted Document.txt');
  const [referenceDocs, setReferenceDocs] = useState<ReferenceInput[]>([
    {
      id: 'ref-1',
      name: 'Academic_Source_Article_2025.txt',
      text: `In order to examine the consequences of automated writing systems, it is important to note that a large number of researchers utilize computational methods. Computational linguistics investigates how syntactic structures influence human reader comprehension.`,
    },
    {
      id: 'ref-2',
      name: 'Technical_Documentation_Guide.md',
      text: `Security architectures should prioritize authenticated symmetric ciphers. Cryptographic hashing creates a one-way deterministic digest useful for data integrity checks without decrypting payloads.`,
    },
  ]);

  const [activeRefId, setActiveRefId] = useState<string>('ref-1');
  const [isComparing, setIsComparing] = useState(false);
  const [report, setReport] = useState<SimilarityReport | null>(null);
  const [selectedPassage, setSelectedPassage] = useState<ReconstructedPassage | null>(null);

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
    setSelectedPassage(null);

    try {
      // Execute local cryptographic similarity comparison via SimilarityEngine
      const rep = await SimilarityEngine.compareDocuments(
        submittedText,
        submittedDocName,
        referenceDocs
      );
      setReport(rep);
      if (rep.passages.length > 0) {
        setSelectedPassage(rep.passages[0]);
      }
    } catch (err: any) {
      alert(`Similarity comparison error: ${err?.message || 'Comparison failed'}`);
    } finally {
      setIsComparing(false);
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
        'text/plain;charset=utf-8'
      );
    } else if (format === 'html') {
      downloadFile(
        `${baseName}-similarity-report.html`,
        exportReportToHtml(report),
        'text/html;charset=utf-8'
      );
    }
  };

  const activeRefDoc = referenceDocs.find((r) => r.id === activeRefId);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Local Similarity Checker
          </h1>
          <p className="text-xs text-[var(--text-muted)]">
            Compare documents locally using Winnowed n-gram shingles and ephemeral HMAC-SHA-256 fingerprints.
          </p>
        </div>

        <button
          onClick={handleRunComparison}
          disabled={!submittedText.trim() || referenceDocs.length === 0 || isComparing}
          className="flex items-center space-x-2 rounded-lg bg-[var(--accent)] px-5 py-2.5 text-xs font-semibold text-[var(--accent-contrast)] shadow-xs transition-all hover:bg-[var(--accent-hover)] disabled:opacity-40"
        >
          <FileSearch className="h-4 w-4" />
          <span>{isComparing ? 'Comparing Locally...' : 'Run Similarity Comparison'}</span>
        </button>
      </div>

      {/* Main Grid: Submitted Doc vs Reference Corpus */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: Submitted Document */}
        <div className="flex flex-col rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] shadow-xs">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-4 py-2.5">
            <div className="flex items-center space-x-2">
              <span className="rounded bg-[var(--accent-light)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--accent)] uppercase">
                Submitted
              </span>
              <input
                type="text"
                value={submittedDocName}
                onChange={(e) => setSubmittedDocName(e.target.value)}
                className="border-none bg-transparent text-xs font-semibold text-[var(--text-primary)] focus:outline-hidden"
              />
            </div>
            <span className="text-xs font-mono text-[var(--text-muted)]">
              {submittedText.trim().split(/\s+/).filter(Boolean).length} words
            </span>
          </div>

          <div className="p-4">
            <textarea
              value={submittedText}
              onChange={(e) => {
                setSubmittedText(e.target.value);
                setReport(null);
              }}
              placeholder="Paste submitted document text here..."
              rows={12}
              className="w-full resize-y border-none bg-transparent text-sm leading-relaxed text-[var(--text-primary)] focus:outline-hidden"
            />
          </div>

          <div className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3">
            <FileDropzone
              onDocumentLoaded={handleSubmittedFileLoaded}
              compact={true}
              label="Load submitted document (PDF, DOCX, TXT, MD)"
            />
          </div>
        </div>

        {/* Right: Reference Documents Corpus */}
        <div className="flex flex-col rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] shadow-xs">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-4 py-2.5">
            <div className="flex items-center space-x-2">
              <span className="rounded bg-neutral-200 dark:bg-neutral-800 px-1.5 py-0.5 text-[10px] font-bold text-[var(--text-secondary)] uppercase">
                Reference Corpus
              </span>
              <span className="text-xs font-medium text-[var(--text-secondary)]">
                ({referenceDocs.length} documents indexed)
              </span>
            </div>
          </div>

          {/* Reference Document Tabs */}
          <div className="flex overflow-x-auto border-b border-[var(--border-subtle)] bg-[var(--bg-subtle)]/50 px-2 py-1.5">
            {referenceDocs.map((ref) => (
              <div
                key={ref.id}
                onClick={() => setActiveRefId(ref.id)}
                className={`flex cursor-pointer items-center space-x-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  activeRefId === ref.id
                    ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                <span className="max-w-[120px] truncate">{ref.name}</span>
                {referenceDocs.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveReference(ref.id);
                    }}
                    className="ml-1 text-[var(--text-muted)] hover:text-[var(--error-text)]"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Active Reference Text View/Editor */}
          <div className="p-4">
            {activeRefDoc ? (
              <textarea
                value={activeRefDoc.text}
                onChange={(e) => {
                  const updatedText = e.target.value;
                  setReferenceDocs((prev) =>
                    prev.map((r) => (r.id === activeRefId ? { ...r, text: updatedText } : r))
                  );
                  setReport(null);
                }}
                placeholder="Reference document content..."
                rows={10}
                className="w-full resize-y border-none bg-transparent text-sm leading-relaxed text-[var(--text-primary)] focus:outline-hidden"
              />
            ) : (
              <div className="py-8 text-center text-xs text-[var(--text-muted)]">
                No reference document selected. Add one below.
              </div>
            )}
          </div>

          <div className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3">
            <FileDropzone
              onDocumentLoaded={handleAddReferenceFile}
              compact={true}
              label="Add reference document to corpus (PDF, DOCX, TXT, MD)"
            />
          </div>
        </div>
      </div>

      {/* Results View when Comparison Complete */}
      {report && (
        <div className="mt-8 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] p-6 shadow-xs">
          {/* Overview Score Cards */}
          <div className="flex flex-col justify-between gap-4 border-b border-[var(--border-subtle)] pb-6 md:flex-row md:items-center">
            <div>
              <div className="flex items-center space-x-2">
                <FileCheck className="h-5 w-5 text-[var(--accent)]" />
                <h2 className="text-lg font-bold text-[var(--text-primary)]">
                  Similarity Audit Results
                </h2>
              </div>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Analysis completed in browser memory using ephemeral HMAC-SHA-256 session key.
              </p>
            </div>

            {/* Export buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleExport('html')}
                className="flex items-center space-x-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] shadow-2xs hover:border-[var(--accent)]"
              >
                <Download className="h-3.5 w-3.5" />
                <span>HTML Report</span>
              </button>
              <button
                onClick={() => handleExport('txt')}
                className="flex items-center space-x-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] shadow-2xs hover:border-[var(--accent)]"
              >
                <Download className="h-3.5 w-3.5" />
                <span>TXT Report</span>
              </button>
              <button
                onClick={() => handleExport('json')}
                className="flex items-center space-x-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] shadow-2xs hover:border-[var(--accent)]"
              >
                <Download className="h-3.5 w-3.5" />
                <span>JSON</span>
              </button>
            </div>
          </div>

          {/* Metric Badges */}
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-4">
              <div className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider">
                Estimated Overlap
              </div>
              <div
                className={`mt-1 text-2xl font-extrabold ${
                  report.estimatedOverlapPercentage > 30
                    ? 'text-[var(--error-text)]'
                    : report.estimatedOverlapPercentage > 10
                    ? 'text-[var(--warning-text)]'
                    : 'text-[var(--accent)]'
                }`}
              >
                {report.estimatedOverlapPercentage}%
              </div>
            </div>

            <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-4">
              <div className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider">
                Matched Passages
              </div>
              <div className="mt-1 text-2xl font-extrabold text-[var(--text-primary)]">
                {report.matchedPassagesCount}
              </div>
            </div>

            <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-4">
              <div className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider">
                Matched Words
              </div>
              <div className="mt-1 text-2xl font-extrabold text-[var(--text-primary)]">
                {report.matchedWordsCount} / {report.submittedWordCount}
              </div>
            </div>

            <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-4">
              <div className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider">
                Exact Shingle Hits
              </div>
              <div className="mt-1 text-2xl font-extrabold text-[var(--text-primary)]">
                {report.exactMatchesCount}
              </div>
            </div>
          </div>

          {/* Reference Breakdown */}
          {report.referenceBreakdown.length > 0 && (
            <div className="mt-6">
              <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                Reference Document Matches
              </h3>
              <div className="mt-2 divide-y divide-[var(--border-subtle)] rounded-lg border border-[var(--border-subtle)] overflow-hidden">
                {report.referenceBreakdown.map((ref) => (
                  <div
                    key={ref.referenceId}
                    className="flex items-center justify-between bg-[var(--bg-surface)] p-3 text-xs"
                  >
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-[var(--accent)]" />
                      <span className="font-semibold text-[var(--text-primary)]">
                        {ref.referenceName}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-[var(--text-muted)] font-mono">
                      <span>{ref.matchedPassageCount} passages</span>
                      <span>{ref.matchedWordCount} words</span>
                      <span className="font-semibold text-[var(--accent)]">
                        {ref.overlapPercentage}% overlap
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Interactive Highlighted Text Explorer */}
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                  Submitted Text Highlight Viewer
                </span>
                <span className="text-[11px] text-[var(--text-muted)]">
                  Click any amber highlight to inspect the source
                </span>
              </div>
              <div className="max-h-96 overflow-y-auto rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)]/50 p-4">
                <MatchHighlighter
                  text={submittedText}
                  passages={report.passages}
                  selectedPassageId={selectedPassage?.id || null}
                  onSelectPassage={(p) => setSelectedPassage(p)}
                />
              </div>
            </div>

            {/* Passage detail card */}
            <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
              <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                Selected Match Details
              </span>

              {selectedPassage ? (
                <div className="mt-3 space-y-3 text-xs">
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] uppercase">Source Reference</span>
                    <div className="font-semibold text-[var(--text-primary)]">
                      {selectedPassage.referenceDocName}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] uppercase">Character Span</span>
                    <div className="font-mono text-[var(--text-muted)]">
                      Submitted: [{selectedPassage.submittedStartChar}..{selectedPassage.submittedEndChar}]
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] uppercase">Matched Passage</span>
                    <div className="mt-1 rounded-md border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40 p-2.5 italic text-amber-950 dark:text-amber-100">
                      &ldquo;{selectedPassage.matchedText}&rdquo;
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-[var(--text-muted)]">
                  Select any highlighted passage to inspect offsets and reference source.
                </div>
              )}
            </div>
          </div>

          {/* Limitations and Ethical Usage Notice */}
          <div className="mt-6 rounded-lg border border-[var(--warning-border)] bg-[var(--warning-bg)] p-4 text-xs text-[var(--warning-text)]">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <strong>Important Limitation & Transparency Notice:</strong>
                <p className="mt-1 leading-relaxed">
                  {report.formulaExplanation}
                </p>
                <p className="mt-1 leading-relaxed">
                  {report.limitationsNotice}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
