import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Copy,
  ArrowRight,
  BookOpen,
  FileCheck,
  ChevronDown,
  ChevronUp,
  Lock,
} from 'lucide-react';
import type { HumanizerMode } from '../../types';
import { defaultHumanizerManager } from '../../lib/humanizer/manager';
import { SimilarityEngine } from '../../lib/similarity/engine';
import type { ActiveTab } from '../common/Header';

interface FreeParaphrasingToolPageProps {
  initialText?: string;
  setActiveTab: (tab: ActiveTab) => void;
}

export const FreeParaphrasingToolPage: React.FC<FreeParaphrasingToolPageProps> = ({
  initialText = '',
  setActiveTab,
}) => {
  const [inputText, setInputText] = useState(initialText);
  const [outputText, setOutputText] = useState('');
  const [paraphraseMode, setParaphraseMode] = useState<
    'academic' | 'natural' | 'concise' | 'conversational'
  >('academic');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isVerifyingSimilarity, setIsVerifyingSimilarity] = useState(false);
  const [overlapResult, setOverlapResult] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Scan input for academic citations (e.g., (Smith, 2024), [1], [2-4])
  const detectedCitations = useMemo(() => {
    if (!inputText) return [];
    const citationRegex = /(\([A-Z][a-zA-Z\s&.,]+,\s*\d{4}[a-z]?(?:,\s*p\.\s*\d+)?\)|\b\[\d+(?:[-–]\d+)?\])/g;
    const matches = inputText.match(citationRegex) || [];
    return Array.from(new Set(matches));
  }, [inputText]);

  const modes = [
    {
      id: 'academic' as const,
      label: 'Academic & Scholarly',
      desc: 'Elevates register, adds scholarly hedge words, and preserves rigorous formal tone.',
      internalMode: 'formal' as HumanizerMode,
    },
    {
      id: 'natural' as const,
      label: 'Standard & Natural',
      desc: 'Restructures sentences cleanly for everyday clarity without altering meaning.',
      internalMode: 'natural' as HumanizerMode,
    },
    {
      id: 'concise' as const,
      label: 'Concise & Direct',
      desc: 'Eliminates wordiness, trims fluff, and reduces word count while keeping core points.',
      internalMode: 'concise' as HumanizerMode,
    },
    {
      id: 'conversational' as const,
      label: 'Conversational',
      desc: 'Adapts text for newsletters, blogs, and presentations with engaging cadence.',
      internalMode: 'conversational' as HumanizerMode,
    },
  ];

  const handleParaphrase = async () => {
    if (!inputText.trim()) return;
    setIsProcessing(true);
    setOverlapResult(null);

    try {
      const modeConfig = modes.find((m) => m.id === paraphraseMode);
      const res = await defaultHumanizerManager.humanize(inputText, {
        mode: modeConfig?.internalMode || 'natural',
      });
      setOutputText(res.improvedText);
    } catch (err: any) {
      alert(`Paraphrasing error: ${err?.message || 'Processing failed'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVerifySimilarity = async () => {
    if (!inputText.trim() || !outputText.trim()) return;
    setIsVerifyingSimilarity(true);

    try {
      const report = await SimilarityEngine.compareDocuments(
        outputText,
        'Paraphrased_Draft.txt',
        [{ id: 'orig', name: 'Original_Source.txt', text: inputText }]
      );
      setOverlapResult(report.estimatedOverlapPercentage);
    } catch (err: any) {
      alert(`Verification error: ${err?.message || 'Verification failed'}`);
    } finally {
      setIsVerifyingSimilarity(false);
    }
  };

  const handleCopy = () => {
    if (!outputText) return;
    navigator.clipboard.writeText(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSample = () => {
    setInputText(
      `According to prior research (Miller et al., 2023), in order to understand how deep learning models process natural language, it is important to remember that computational linguistic systems utilize probabilistic word embeddings. Due to the fact that standard training corpora exhibit systemic biases, scientists must delve into the multifaceted challenges of algorithmic fairness [4].`
    );
  };

  const faqs = [
    {
      q: 'What is the difference between ethical paraphrasing and mosaic plagiarism?',
      a: 'Mosaic plagiarism (or patchwriting) occurs when someone merely replaces a few words with synonyms from a thesaurus while keeping the author’s original sentence structure and omitting proper credit. Ethical paraphrasing, by contrast, requires digesting the source concept, reconstructing the explanation from scratch in your own voice, and providing clear in-text citations.',
    },
    {
      q: 'How does HumanizeText protect my in-text citations?',
      a: 'Our local paraphrasing engine recognizes APA, MLA, Chicago, and numeric bracketed citations (such as [1] or (Author, 2024)). It treats citation anchors as immutable tokens, ensuring they are not mangled or removed during text restructuring.',
    },
    {
      q: 'Why is a client-side paraphrasing tool safer than cloud alternatives?',
      a: 'When you paste research, unreleased corporate documents, or academic essays into commercial cloud tools (like QuillBot or Wordtune), your proprietary drafts are sent across the internet, logged into corporate servers, and often retained for machine learning training. HumanizeText executes 100% in your browser memory via the Web Crypto API, guaranteeing total data sovereignty.',
    },
    {
      q: 'How does the "Verify Paraphrase Similarity" button work?',
      a: 'It immediately runs our client-side Winnowing similarity algorithm to compare your paraphrased version directly against the original source. If the overlap is under 15-20%, you have successfully restructured the passage while avoiding verbatim patchwriting.',
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      {/* Hero Header with SEO H1 */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 inline-flex items-center space-x-2 rounded-full border border-[var(--accent-border)] bg-[var(--accent-light)] px-3 py-1 text-xs font-semibold text-[var(--accent)]">
          <BookOpen className="h-4 w-4" />
          <span>Citation Protection • Meaning Preservation • 100% Private</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-4xl md:text-5xl">
          Free Paraphrasing Tool
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-base text-[var(--text-secondary)]">
          Rephrase complex sentences, clarify academic arguments, and avoid mosaic plagiarism.
          Preserves in-text citations and runs entirely client-side.
        </p>
      </div>

      {/* Main Paraphrase Card */}
      <div className="overflow-hidden rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] shadow-md">
        {/* Mode Selector */}
        <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Paraphrase Objective:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {modes.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setParaphraseMode(m.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                    paraphraseMode === m.id
                      ? 'bg-[var(--accent)] text-[var(--accent-contrast)] shadow-xs'
                      : 'border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--text-primary)]'
                  }`}
                  title={m.desc}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          <p className="mt-2 text-left text-[11px] text-[var(--text-muted)]">
            <strong className="text-[var(--text-secondary)]">
              {modes.find((m) => m.id === paraphraseMode)?.label}:
            </strong>{' '}
            {modes.find((m) => m.id === paraphraseMode)?.desc}
          </p>
        </div>

        {/* 2-Column Split: Input & Output */}
        <div className="grid grid-cols-1 divide-y border-b border-[var(--border-subtle)] lg:grid-cols-2 lg:divide-x lg:divide-y-0">
          {/* Input Column */}
          <div className="flex flex-col p-4">
            <div className="mb-2 flex items-center justify-between text-xs text-[var(--text-muted)]">
              <span className="font-semibold text-[var(--text-primary)]">Source Text to Rephrase</span>
              <span>{inputText.trim().split(/\s+/).filter(Boolean).length} words</span>
            </div>

            <textarea
              id="paraphrase-input-text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste the passage or paragraph you want to paraphrase..."
              rows={12}
              className="w-full resize-none rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3.5 text-sm leading-relaxed text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-hidden"
            />

            {/* Detected Citations Indicator */}
            {detectedCitations.length > 0 && (
              <div className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2.5 text-xs">
                <div className="flex items-center space-x-1.5 font-semibold text-emerald-700 dark:text-emerald-300">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Attribution Guard: {detectedCitations.length} citation(s) locked</span>
                </div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {detectedCitations.map((c, idx) => (
                    <span
                      key={idx}
                      className="rounded bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[10px] text-emerald-800 dark:text-emerald-200"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-3 flex items-center justify-between text-[11px] text-[var(--text-muted)]">
              <button
                onClick={handleSample}
                className="rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 py-0.5 text-[11px] text-[var(--text-primary)] hover:border-[var(--accent)]"
              >
                Load Sample with Citations
              </button>

              {inputText && (
                <button
                  onClick={() => {
                    setInputText('');
                    setOutputText('');
                    setOverlapResult(null);
                  }}
                  className="hover:text-[var(--error-text)]"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Output Column */}
          <div className="flex flex-col bg-[var(--bg-subtle)]/20 p-4">
            <div className="mb-2 flex items-center justify-between text-xs text-[var(--text-muted)]">
              <span className="font-semibold text-[var(--text-primary)]">Paraphrased Output</span>

              {outputText && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center space-x-1 rounded px-2 py-1 text-[11px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]"
                  >
                    {copied ? (
                      <CheckCircle2 className="h-3 w-3 text-[var(--accent)]" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              )}
            </div>

            <div className="relative flex-1">
              {outputText ? (
                <div className="h-full min-h-[280px] rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3.5 text-sm leading-relaxed text-[var(--text-primary)]">
                  {outputText}
                </div>
              ) : (
                <div className="flex h-full min-h-[280px] flex-col items-center justify-center rounded-lg border border-dashed border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-6 text-center text-xs text-[var(--text-muted)]">
                  <BookOpen className="mb-2 h-8 w-8 text-[var(--accent)] opacity-50" />
                  <p className="font-medium text-[var(--text-secondary)]">Ready to Rephrase</p>
                  <p className="mt-1 max-w-xs text-[11px]">
                    Paste your text on the left and click &ldquo;Paraphrase Text&rdquo;. Citations
                    will be preserved and phrasing restructured cleanly.
                  </p>
                </div>
              )}
            </div>

            {/* Overlap & Similarity Verification Box */}
            {outputText && (
              <div className="mt-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-xs text-[var(--text-secondary)]">
                    <FileCheck className="h-4 w-4 text-[var(--accent)]" />
                    <span className="font-semibold">Plagiarism Pre-Check:</span>
                  </div>

                  <button
                    onClick={handleVerifySimilarity}
                    disabled={isVerifyingSimilarity}
                    className="rounded bg-[var(--accent-light)] px-2.5 py-1 text-xs font-semibold text-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--accent-contrast)] transition-colors"
                  >
                    {isVerifyingSimilarity ? 'Verifying...' : 'Verify Overlap with Original'}
                  </button>
                </div>

                {overlapResult !== null && (
                  <div className="mt-2 flex items-center space-x-2 text-xs">
                    <span
                      className={`font-bold ${
                        overlapResult < 15
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {overlapResult.toFixed(1)}% Verbatim Match
                    </span>
                    <span className="text-[var(--text-muted)]">•</span>
                    <span className="text-[var(--text-muted)]">
                      {overlapResult < 15
                        ? 'Safe paraphrase: Structure and phrasing restructured significantly.'
                        : 'Caution: Consider revising overlapping phrases to avoid mosaic plagiarism.'}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Toolbar & Action Button */}
        <div className="flex flex-col items-center justify-between gap-4 bg-[var(--bg-subtle)] px-5 py-4 sm:flex-row">
          <div className="flex items-center space-x-2 text-xs text-[var(--text-muted)]">
            <Lock className="h-4 w-4 text-[var(--accent)]" />
            <span>Client-side Web Crypto • Zero text transmitted to third parties</span>
          </div>

          <button
            id="paraphrase-submit-btn"
            onClick={handleParaphrase}
            disabled={isProcessing || !inputText.trim()}
            className="flex items-center space-x-2 rounded-lg bg-[var(--accent)] px-6 py-2.5 text-xs font-semibold text-[var(--accent-contrast)] shadow-md transition-all hover:bg-[var(--accent-hover)] disabled:opacity-40"
          >
            <Sparkles className="h-4 w-4" />
            <span>{isProcessing ? 'Rephrasing...' : 'Paraphrase Text'}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* SEO & Educational Guidance Section */}
      <section className="mt-12 space-y-8">
        <article className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-8">
          <div className="flex items-center space-x-2 text-[var(--accent)]">
            <BookOpen className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Academic Integrity</span>
          </div>
          <h2 className="mt-2 text-xl font-bold text-[var(--text-primary)] sm:text-2xl">
            Ethical Paraphrasing vs. Mosaic Plagiarism
          </h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-[var(--text-secondary)]">
            <p>
              In academic and professional writing, paraphrasing is not merely a technical trick to
              avoid detection—it is a demonstration that you understand the source material deeply
              enough to explain it in your own words.
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-4 text-xs">
              <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
                <span className="font-bold text-red-600 dark:text-red-400">
                  Mosaic Plagiarism (Patchwriting)
                </span>
                <p className="mt-2 text-[var(--text-secondary)]">
                  Swapping a few words with synonyms while keeping the original author&apos;s sentence
                  structure intact. Even with a citation, patchwriting is considered academic
                  misconduct because the syntax was copied.
                </p>
              </div>

              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  Ethical Paraphrasing
                </span>
                <p className="mt-2 text-[var(--text-secondary)]">
                  Restructuring the explanation from the ground up: changing the order of ideas,
                  combining concepts, maintaining accurate authorial attribution, and integrating the
                  insight seamlessly into your own argument.
                </p>
              </div>
            </div>
          </div>
        </article>

        {/* FAQs */}
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
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="flex w-full items-center justify-between p-4 text-left text-sm font-semibold text-[var(--text-primary)]"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4 shrink-0 text-[var(--accent)]" />
                    ) : (
                      <ChevronDown className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="border-t border-[var(--border-subtle)] px-4 pb-4 pt-2 text-xs leading-relaxed text-[var(--text-secondary)]">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </article>

        {/* Navigation CTAs */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <button
            onClick={() => setActiveTab('plagiarism-checker')}
            className="flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 text-left transition-all hover:border-[var(--accent)] hover:shadow-xs"
          >
            <div>
              <div className="flex items-center space-x-2 font-bold text-[var(--text-primary)]">
                <FileCheck className="h-4 w-4 text-[var(--accent)]" />
                <span>Deep Plagiarism Check</span>
              </div>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                Verify multi-page PDF or DOCX files against source literature without uploading.
              </p>
            </div>
            <ArrowRight className="h-5 w-5 shrink-0 text-[var(--accent)]" />
          </button>

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
                Restore natural sentence rhythm, burstiness, and tone variation to machine drafts.
              </p>
            </div>
            <ArrowRight className="h-5 w-5 shrink-0 text-[var(--accent)]" />
          </button>
        </div>
      </section>
    </div>
  );
};
