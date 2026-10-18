import React, { useState } from 'react';
import {
  Sparkles,
  ShieldCheck,
  Lock,
  ArrowRight,
  Copy,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  Layers,
  FileSearch,
  BookOpen,
} from 'lucide-react';
import type { HumanizerMode, HumanizerResult, HumanizerChange } from '../../types';
import { defaultHumanizerManager } from '../../lib/humanizer/manager';
import { FileDropzone } from '../common/FileDropzone';
import { HumanizeLogo } from '../common/HumanizeLogo';
import type { ActiveTab } from '../common/Header';

interface FreeAiHumanizerPageProps {
  currentText: string;
  setCurrentText: (text: string) => void;
  setActiveTab: (tab: ActiveTab) => void;
}

export const FreeAiHumanizerPage: React.FC<FreeAiHumanizerPageProps> = ({
  currentText,
  setCurrentText,
  setActiveTab,
}) => {
  const [improvedText, setImprovedText] = useState('');
  const [selectedMode, setSelectedMode] = useState<HumanizerMode>('natural');
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultData, setResultData] = useState<HumanizerResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Statistics
  const words = currentText.trim().split(/\s+/).filter(Boolean);
  const wordCount = currentText.trim().length === 0 ? 0 : words.length;
  const sentenceList = currentText
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const sentenceCount = sentenceList.length;
  const avgSentenceLength =
    sentenceCount > 0 ? Math.round(wordCount / sentenceCount) : 0;

  // Calculate burstiness approximation (standard deviation of sentence lengths)
  const burstinessScore = React.useMemo(() => {
    if (sentenceCount < 2) return 'N/A';
    const lengths = sentenceList.map(
      (s) => s.split(/\s+/).filter(Boolean).length
    );
    const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance =
      lengths.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / lengths.length;
    const stdDev = Math.sqrt(variance);
    if (stdDev < 4) return 'Low (Monotonous AI pattern)';
    if (stdDev < 9) return 'Moderate (Balanced)';
    return 'High (Natural human rhythm)';
  }, [sentenceList, sentenceCount]);

  const modes: { id: HumanizerMode; label: string; desc: string }[] = [
    {
      id: 'natural',
      label: 'More Natural',
      desc: 'Eliminates robotic phrasing, removes artificial transitions, and restores natural idioms.',
    },
    {
      id: 'concise',
      label: 'Clearer & Concise',
      desc: 'Cuts bloated prepositions, bureaucratic jargon, and passive clutter by up to 25%.',
    },
    {
      id: 'conversational',
      label: 'Conversational',
      desc: 'Adds direct address, natural contractions, and engaging cadence for blogs and emails.',
    },
    {
      id: 'formal',
      label: 'Formal & Academic',
      desc: 'Refines casual vocabulary to rigorous scholarly register while preserving exact citations.',
    },
    {
      id: 'flow',
      label: 'Sentence Flow',
      desc: 'Alternates sentence structures, balances rhythmic cadence, and smoothes awkward transitions.',
    },
  ];

  const handleRunHumanizer = async () => {
    if (!currentText.trim()) return;
    setIsProcessing(true);

    try {
      const res = await defaultHumanizerManager.humanize(currentText, {
        mode: selectedMode,
      });
      setResultData(res);
      setImprovedText(res.improvedText);
    } catch (err: any) {
      alert(`Humanization error: ${err?.message || 'Processing failed'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = () => {
    const textToCopy = improvedText || currentText;
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const text = improvedText || currentText;
    if (!text) return;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `humanized-document-${selectedMode}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSample = (type: 'chatgpt' | 'academic') => {
    if (type === 'chatgpt') {
      setCurrentText(
        `In today's fast-paced digital world, it is crucial to delve into the multifaceted tapestry of modern technology. Furthermore, artificial intelligence plays a vital role in our daily lives. Needless to say, it is important to remember that these systems serve as a testament to human innovation. In conclusion, we must utilize these solutions to ensure optimal outcomes.`
      );
    } else {
      setCurrentText(
        `In order to conduct an investigation into the aforementioned hypotheses, it should be noted that prior literature demonstrates a significant variance. Due to the fact that empirical observations were collected over a long duration of time, we have the ability to conclude that computational methodology serves as a beacon of modern inquiry.`
      );
    }
  };

  const faqs = [
    {
      q: 'How does an AI Humanizer work without sending my text to an external server?',
      a: 'Unlike commercial tools that upload your text to OpenAI or remote cloud servers, HumanizeText runs entirely client-side in your web browser. It uses a sophisticated deterministic linguistic engine with syntactic rules and optional WebGPU local AI. Your words, sensitive drafts, and intellectual property never leave your machine.',
    },
    {
      q: 'What makes AI-generated text sound artificial to human readers and detectors?',
      a: 'AI models generate text by predicting the mathematically most likely next token, resulting in low "perplexity" (overly predictable vocabulary like "delve", "tapestry", "testament") and low "burstiness" (sentences that all hover at the same uniform 18-word length). HumanizeText breaks this mechanical uniformity by restructuring sentence cadence, introducing human phrasing variations, and cutting synthetic filler.',
    },
    {
      q: 'Will humanizing my text alter my factual arguments or academic citations?',
      a: 'No. HumanizeText is built around a factual integrity constraint. It targets syntactic transitions, redundant boilerplate, and unnatural vocabulary while preserving numeric claims, core assertions, proper nouns, and in-text citation keys like [1] or (Author, 2024).',
    },
    {
      q: 'Can I check my humanized text for plagiarism right away?',
      a: 'Yes! With a single click, you can send your humanized draft directly to our built-in Cryptographic Plagiarism Checker. It compares your text against reference documents locally using the Winnowing algorithm and ephemeral HMAC-SHA-256 session keys—without uploading anything to third-party databases.',
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      {/* Hero Header matching Brand Specification */}
      <div className="mb-10 text-center">
        {/* Brand Symbol Exploration / Stacked Emblem */}
        <div className="mb-4 inline-flex items-center justify-center">
          <HumanizeLogo variant="stacked" size="xl" showTagline={true} />
        </div>

        <div className="mx-auto mb-3 inline-flex items-center space-x-2 rounded-full border border-[var(--accent-border)] bg-[var(--accent-light)] px-3.5 py-1 text-xs font-bold text-[var(--text-primary)] dark:text-[#34D399]">
          <ShieldCheck className="h-4 w-4 text-[#34D399]" />
          <span>100% On-Device • Zero Server Transmissions • Private by Design</span>
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-4xl md:text-5xl">
          Make Your Text Sound <span className="text-[#34D399]">More Human</span>
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-base text-[var(--text-secondary)]">
          Transform AI-generated content into natural, authentic and engaging writing.
          Improve sentence flow, vary cadence, and eliminate AI clichés with complete cryptographic privacy.
        </p>
      </div>

      {/* Main Workspace Card */}
      <div className="overflow-hidden rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] shadow-md">
        {/* Mode Selector Tabs */}
        <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Writing Mode:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {modes.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMode(m.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                    selectedMode === m.id
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
              {modes.find((m) => m.id === selectedMode)?.label}:
            </strong>{' '}
            {modes.find((m) => m.id === selectedMode)?.desc}
          </p>
        </div>

        {/* Text Area & Input / Output Split */}
        <div className="grid grid-cols-1 divide-y border-b border-[var(--border-subtle)] lg:grid-cols-2 lg:divide-x lg:divide-y-0">
          {/* Input Column */}
          <div className="flex flex-col p-4">
            <div className="mb-2 flex items-center justify-between text-xs text-[var(--text-muted)]">
              <span className="font-semibold text-[var(--text-primary)]">Input Text</span>
              <div className="flex items-center space-x-2">
                <span>{wordCount} words</span>
                <span>•</span>
                <span>{avgSentenceLength} words/sentence</span>
              </div>
            </div>

            <textarea
              id="humanizer-input-text"
              value={currentText}
              onChange={(e) => setCurrentText(e.target.value)}
              placeholder="Paste AI-generated text, ChatGPT response, or essay draft here..."
              rows={12}
              className="w-full resize-none rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3.5 text-sm leading-relaxed text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-hidden"
            />

            {/* Quick sample buttons & Dropzone */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-1.5 text-[11px] text-[var(--text-muted)]">
                <span>Try sample:</span>
                <button
                  onClick={() => handleSample('chatgpt')}
                  className="rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 py-0.5 text-[11px] text-[var(--text-primary)] hover:border-[var(--accent)]"
                >
                  AI Cliche Draft
                </button>
                <button
                  onClick={() => handleSample('academic')}
                  className="rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 py-0.5 text-[11px] text-[var(--text-primary)] hover:border-[var(--accent)]"
                >
                  Bloated Academic
                </button>
              </div>

              {currentText && (
                <button
                  onClick={() => setCurrentText('')}
                  className="text-[11px] text-[var(--text-muted)] hover:text-[var(--error-text)]"
                >
                  Clear text
                </button>
              )}
            </div>
          </div>

          {/* Output Column */}
          <div className="flex flex-col bg-[var(--bg-subtle)]/30 p-4">
            <div className="mb-2 flex items-center justify-between text-xs text-[var(--text-muted)]">
              <div className="flex items-center space-x-1.5">
                <span className="font-semibold text-[var(--text-primary)]">Humanized Output</span>
                {resultData && (
                  <span className="rounded bg-[var(--accent-light)] px-1.5 py-0.2 text-[10px] font-semibold text-[var(--accent)]">
                    {resultData.changes.length} refinements
                  </span>
                )}
              </div>

              {improvedText && (
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
                  <button
                    onClick={handleDownload}
                    className="flex items-center space-x-1 rounded px-2 py-1 text-[11px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]"
                  >
                    <Download className="h-3 w-3" />
                    <span>Save</span>
                  </button>
                </div>
              )}
            </div>

            <div className="relative flex-1">
              {improvedText ? (
                <div className="h-full min-h-[280px] rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3.5 text-sm leading-relaxed text-[var(--text-primary)]">
                  {improvedText}
                </div>
              ) : (
                <div className="flex h-full min-h-[280px] flex-col items-center justify-center rounded-lg border border-dashed border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-6 text-center text-xs text-[var(--text-muted)]">
                  <Sparkles className="mb-2 h-8 w-8 text-[var(--accent)] opacity-50" />
                  <p className="font-medium text-[var(--text-secondary)]">Ready to Humanize</p>
                  <p className="mt-1 max-w-xs text-[11px]">
                    Paste your text on the left and click &ldquo;Humanize Text&rdquo;. Your
                    refinements are generated instantly on your device.
                  </p>
                </div>
              )}
            </div>

            {/* Quick check similarity CTA if output exists */}
            {improvedText && (
              <div className="mt-3 flex items-center justify-between rounded-lg border border-[var(--accent-border)] bg-[var(--accent-light)]/40 p-2.5 text-xs">
                <span className="text-[var(--text-secondary)]">Verify against original:</span>
                <button
                  onClick={() => setActiveTab('plagiarism-checker')}
                  className="flex items-center space-x-1 text-xs font-semibold text-[var(--accent)] hover:underline"
                >
                  <FileSearch className="h-3.5 w-3.5" />
                  <span>Check Similarity →</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Dropzone bar */}
        <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3">
          <FileDropzone
            onDocumentLoaded={(doc) => setCurrentText(doc.text)}
            compact={true}
            label="Or drop a document to load text (PDF, DOCX, TXT, Markdown)"
          />
        </div>

        {/* Action Controls & Engine Switcher */}
        <div className="flex flex-col items-center justify-between gap-4 bg-[var(--bg-subtle)] px-5 py-4 sm:flex-row">
          {/* Left: Engine & Security indicator */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-muted)]">
            <div className="flex items-center space-x-1.5 font-medium text-[var(--accent)]">
              <ShieldCheck className="h-4 w-4" />
              <span>Web Crypto &amp; Local Engine</span>
            </div>
            <span>•</span>
            <div className="flex items-center space-x-1.5">
              <span>Burstiness:</span>
              <span className="font-semibold text-[var(--text-primary)]">{burstinessScore}</span>
            </div>
          </div>

          {/* Right: Primary action button */}
          <div className="flex items-center space-x-3">
            {resultData && resultData.changes.length > 0 && (
              <button
                onClick={() => setShowDiff(!showDiff)}
                className="rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-subtle)]"
              >
                {showDiff ? 'Hide Changes' : `View ${resultData.changes.length} Changes`}
              </button>
            )}

            <button
              id="humanize-submit-btn"
              onClick={handleRunHumanizer}
              disabled={isProcessing || !currentText.trim()}
              className="btn-brand-pill inline-flex items-center space-x-2 px-7 py-2.5 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />
              <span>{isProcessing ? 'Humanizing on Device...' : 'Humanize Text'}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Changes inspection drawer */}
        {showDiff && resultData && (
          <div className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 text-xs">
            <h4 className="font-bold text-[var(--text-primary)]">
              Refinements Applied ({resultData.changes.length}):
            </h4>
            <div className="mt-2 max-h-48 space-y-2 overflow-y-auto">
              {resultData.changes.map((c: HumanizerChange, idx: number) => (
                <div
                  key={idx}
                  className="rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-2.5"
                >
                  <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                    <span className="font-semibold uppercase text-[var(--accent)]">{c.category}</span>
                    <span>{c.reason}</span>
                  </div>
                  <div className="mt-1.5 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded bg-red-500/10 p-1.5 text-red-700 dark:text-red-300">
                      <span className="font-bold">Original:</span> &ldquo;{c.original}&rdquo;
                    </div>
                    <div className="rounded bg-emerald-500/10 p-1.5 text-emerald-700 dark:text-emerald-300">
                      <span className="font-bold">Humanized:</span> &ldquo;{c.replacement}&rdquo;
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Educational & SEO Sections: E-E-A-T Content */}
      <section className="mt-12 space-y-8">
        {/* Section 1: How AI Detectors Work */}
        <article className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-8">
          <div className="flex items-center space-x-2 text-[var(--accent)]">
            <Layers className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Linguistic Analysis</span>
          </div>
          <h2 className="mt-2 text-xl font-bold text-[var(--text-primary)] sm:text-2xl">
            How AI Detectors Work: Perplexity &amp; Burstiness Explained
          </h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-[var(--text-secondary)]">
            <p>
              AI text detection algorithms (such as GPTZero, Turnitin AI, and Copyleaks) do not
              understand the meaning of an article. Instead, they rely on statistical patterns in
              token distributions:
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong className="text-[var(--text-primary)]">Perplexity:</strong> A measure of how
                unlikely or surprising word choices are. AI models choose the statistically most
                probable words, creating an unnatural smoothness and repetitive transitional
                phrases like <em>&ldquo;delve into&rdquo;</em>, <em>&ldquo;testament to&rdquo;</em>,
                or <em>&ldquo;vital role&rdquo;</em>.
              </li>
              <li>
                <strong className="text-[var(--text-primary)]">Burstiness:</strong> Variation in
                sentence length and structure. Human authors write with rhythm: a short 4-word
                declarative sentence followed by a complex, 25-word explanatory sentence. AI models,
                by contrast, generate monotonously consistent sentences that typically cluster
                between 16 and 22 words.
              </li>
            </ul>
            <p>
              HumanizeText applies structural variation, cleans mechanical transitional markers,
              and restores natural rhythm without altering your core factual claims.
            </p>
          </div>
        </article>

        {/* Section 2: Privacy Comparison Table */}
        <article className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-8">
          <div className="flex items-center space-x-2 text-[var(--accent)]">
            <Lock className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Cybersecurity &amp; Privacy</span>
          </div>
          <h2 className="mt-2 text-xl font-bold text-[var(--text-primary)] sm:text-2xl">
            Why Privacy Matters in AI Humanizers
          </h2>
          <p className="mt-3 text-sm text-[var(--text-secondary)]">
            Commercial AI humanizers operate on cloud servers, meaning every paragraph you paste is
            transmitted over the internet, logged into corporate databases, and potentially used to
            train commercial AI models.
          </p>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[var(--border-strong)] bg-[var(--bg-subtle)] text-[var(--text-primary)]">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Security Feature</th>
                  <th className="py-2.5 px-3 font-semibold text-[var(--accent)]">HumanizeText (This Tool)</th>
                  <th className="py-2.5 px-3 font-semibold text-[var(--text-muted)]">Commercial Cloud Humanizers</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--text-secondary)]">
                <tr>
                  <td className="py-2.5 px-3 font-medium text-[var(--text-primary)]">Text Transmission</td>
                  <td className="py-2.5 px-3 font-semibold text-[var(--accent)]">0 Bytes sent to servers</td>
                  <td className="py-2.5 px-3 text-red-600 dark:text-red-400">100% uploaded to cloud API</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-medium text-[var(--text-primary)]">Manuscript Storage</td>
                  <td className="py-2.5 px-3 font-semibold text-[var(--accent)]">None / Encrypted in IndexedDB</td>
                  <td className="py-2.5 px-3 text-red-600 dark:text-red-400">Stored in server databases</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-medium text-[var(--text-primary)]">Account Requirement</td>
                  <td className="py-2.5 px-3 font-semibold text-[var(--accent)]">No login / No email needed</td>
                  <td className="py-2.5 px-3">Requires email signup &amp; billing</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-medium text-[var(--text-primary)]">Data Harvesting</td>
                  <td className="py-2.5 px-3 font-semibold text-[var(--accent)]">Zero telemetry or AI retraining</td>
                  <td className="py-2.5 px-3 text-red-600 dark:text-red-400">Data used for model training</td>
                </tr>
              </tbody>
            </table>
          </div>
        </article>

        {/* Section 3: FAQ Accordion */}
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

        {/* Quick Nav Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <button
            onClick={() => setActiveTab('plagiarism-checker')}
            className="flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 text-left transition-all hover:border-[var(--accent)] hover:shadow-xs"
          >
            <div>
              <div className="flex items-center space-x-2 font-bold text-[var(--text-primary)]">
                <FileSearch className="h-4 w-4 text-[var(--accent)]" />
                <span>Free Plagiarism Checker</span>
              </div>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                Compare documents privately using cryptographic Winnowing with zero server uploads.
              </p>
            </div>
            <ArrowRight className="h-5 w-5 shrink-0 text-[var(--accent)]" />
          </button>

          <button
            onClick={() => setActiveTab('how-to-humanize')}
            className="flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 text-left transition-all hover:border-[var(--accent)] hover:shadow-xs"
          >
            <div>
              <div className="flex items-center space-x-2 font-bold text-[var(--text-primary)]">
                <BookOpen className="h-4 w-4 text-[var(--accent)]" />
                <span>How to Humanize AI Writing</span>
              </div>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                Read our in-depth editorial guide on sentence rhythm, burstiness, and personal voice.
              </p>
            </div>
            <ArrowRight className="h-5 w-5 shrink-0 text-[var(--accent)]" />
          </button>
        </div>
      </section>
    </div>
  );
};
