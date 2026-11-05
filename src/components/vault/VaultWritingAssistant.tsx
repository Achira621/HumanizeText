import React, { useState, useMemo, useRef } from 'react';
import {
  Sparkles,
  Check,
  X,
  Wand2,
  Lock,
  Copy,
  Download,
  BookOpen,
  Gauge,
  ArrowRight,
  ShieldCheck,
  Undo,
  Redo,
  Cloud,
  Cpu,
  AlertCircle,
  AlertTriangle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import type {
  VaultRecord,
  WritingSuggestion,
  WritingIssueCategory,
  HumanizerMode,
  VocabularyIntensity,
  HumanizerResult,
} from '../../types';
import {
  analyzeWriting,
  applySingleSuggestion,
  applyAllApplicableSuggestions,
} from '../../lib/assistant/writingAssistant';
import { humanizeWithRules } from '../../lib/humanizer/ruleEngine';
import { defaultWorkerApiClient } from '../../lib/workerApi/client';

interface VaultWritingAssistantProps {
  initialRecord: VaultRecord;
  passphrase?: string;
  onSaveRecord: (updatedRecord: VaultRecord) => Promise<void>;
  onClose: () => void;
  onLoadIntoEditor?: (text: string, title: string) => void;
  onLoadIntoHumanizer?: (text: string) => void;
  onLoadIntoPlagiarismChecker?: (text: string, title: string) => void;
}

export interface TextSelectionRange {
  start: number;
  end: number;
  text: string;
}

export interface PendingSuggestionReview {
  originalText: string;
  improvedText: string;
  engine: 'local' | 'cloud';
  modelUsed?: string;
  latencyMs?: number;
  invariants?: HumanizerResult['invariants'];
  selection: TextSelectionRange | null;
}

export const VaultWritingAssistant: React.FC<VaultWritingAssistantProps> = ({
  initialRecord,
  onSaveRecord,
  onClose,
  onLoadIntoEditor,
  onLoadIntoHumanizer,
  onLoadIntoPlagiarismChecker,
}) => {
  const [title, setTitle] = useState(initialRecord.title);
  const [content, setContent] = useState(initialRecord.content);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [dismissedSuggestionIds, setDismissedSuggestionIds] = useState<Set<string>>(new Set());

  // Assistant Studio UI tabs
  const [activeTab, setActiveTab] = useState<'suggestions' | 'paraphraser' | 'aiRadar' | 'metrics'>('suggestions');
  const [categoryFilter, setCategoryFilter] = useState<WritingIssueCategory | 'all'>('all');

  // Paraphraser / Writing Assistance state
  const [assistanceEngine, setAssistanceEngine] = useState<'local' | 'cloud'>('local');
  const [paraMode, setParaMode] = useState<HumanizerMode>('natural');
  const [paraIntensity, setParaIntensity] = useState<VocabularyIntensity>('balanced');
  const [selectedRange, setSelectedRange] = useState<TextSelectionRange | null>(null);

  // Cloud consent state: must be explicitly authorized per action
  const [cloudConsentConfirmed, setCloudConsentConfirmed] = useState<boolean>(false);

  // Processing, Cancellation & Review state
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeAbortController, setActiveAbortController] = useState<AbortController | null>(null);
  const [pendingReview, setPendingReview] = useState<PendingSuggestionReview | null>(null);
  const [apiError, setApiError] = useState<{ message: string; isRateLimit?: boolean; isTimeout?: boolean } | null>(null);
  const [applyWarning, setApplyWarning] = useState<string | null>(null);
  const [applySuccessNotice, setApplySuccessNotice] = useState<string | null>(null);

  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<string[]>([initialRecord.content]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const updateContentWithHistory = (newText: string) => {
    setContent(newText);
    setHistory((prev) => [...prev.slice(0, historyIndex + 1), newText]);
    setHistoryIndex((prev) => prev + 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevText = history[historyIndex - 1];
      setHistoryIndex((prev) => prev - 1);
      setContent(prevText);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextText = history[historyIndex + 1];
      setHistoryIndex((prev) => prev + 1);
      setContent(nextText);
    }
  };

  // Real-time on-device writing analysis
  const analysis = useMemo(() => {
    return analyzeWriting(content);
  }, [content]);

  // Filtered suggestions
  const activeSuggestions = useMemo(() => {
    return analysis.suggestions.filter((s) => {
      if (dismissedSuggestionIds.has(s.id)) return false;
      if (categoryFilter === 'all') return true;
      return s.category === categoryFilter;
    });
  }, [analysis.suggestions, dismissedSuggestionIds, categoryFilter]);

  // Handle Save Record
  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const updated: VaultRecord = {
        ...initialRecord,
        title: title.trim() || 'Untitled Encrypted Document',
        content,
        updatedAt: Date.now(),
      };
      await onSaveRecord(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  // Text selection tracker on the decrypted document editor
  const handleCaptureSelection = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    const start = target.selectionStart;
    const end = target.selectionEnd;
    const selected = target.value.substring(start, end);

    if (selected && selected.trim().length > 0) {
      setSelectedRange({
        start,
        end,
        text: selected,
      });
      setApplyWarning(null);
    }
  };

  // Accept single grammar/style suggestion
  const handleAcceptSuggestion = (suggestion: WritingSuggestion) => {
    const updated = applySingleSuggestion(content, suggestion);
    updateContentWithHistory(updated);
    setDismissedSuggestionIds((prev) => new Set(prev).add(suggestion.id));
  };

  // Dismiss suggestion
  const handleDismissSuggestion = (id: string) => {
    setDismissedSuggestionIds((prev) => new Set(prev).add(id));
  };

  // Apply all suggestions
  const handleApplyAll = () => {
    const updated = applyAllApplicableSuggestions(content, activeSuggestions);
    updateContentWithHistory(updated);
    const newDismissed = new Set(dismissedSuggestionIds);
    activeSuggestions.forEach((s) => newDismissed.add(s.id));
    setDismissedSuggestionIds(newDismissed);
  };

  // Execute Humanization / Paraphrasing (Local or Cloud)
  const handleRunAssistance = async () => {
    const hasSelection = Boolean(selectedRange && selectedRange.text.trim());
    const targetText = hasSelection ? selectedRange!.text.trim() : content.trim();

    if (!targetText) {
      setApiError({
        message: 'Editor is empty. Please enter or select text in the document editor to begin.',
      });
      return;
    }

    // Require explicit user confirmation for cloud processing
    if (assistanceEngine === 'cloud' && !cloudConsentConfirmed) {
      setApiError({
        message: 'Authorization required: Please check the authorization box above to confirm cloud processing.',
      });
      return;
    }

    setApiError(null);
    setApplyWarning(null);
    setApplySuccessNotice(null);
    setIsProcessing(true);

    if (assistanceEngine === 'local') {
      try {
        const res = humanizeWithRules(targetText, {
          mode: paraMode,
          vocabularyIntensity: paraIntensity,
        });

        setPendingReview({
          originalText: targetText,
          improvedText: res.improvedText,
          engine: 'local',
          modelUsed: 'Local Rule Engine (Deterministic)',
          latencyMs: 5,
          selection: selectedRange && selectedRange.text.trim() ? { ...selectedRange } : null,
        });
      } catch (err: any) {
        setApiError({
          message: `Local processing failed: ${err?.message || 'Unknown error'}`,
        });
      } finally {
        setIsProcessing(false);
      }
    } else {
      // Cloud Humanization via existing Cloudflare Worker API
      const controller = new AbortController();
      setActiveAbortController(controller);
      const startMs = performance.now();

      try {
        // Strict boundary: Only selected text is transmitted over HTTPS
        // Document encryption key, password, IV, ciphertext, and title are NEVER sent
        const res = await defaultWorkerApiClient.humanize(targetText, {
          mode: paraMode,
          vocabularyIntensity: paraIntensity,
          signal: controller.signal,
          disallowLocalFallback: true,
        });

        // Verify that remote cloud was actually used (no silent local fallback)
        if (res.processedLocally && res.executionEnvironment === 'local-emulation-fallback') {
          throw new Error('Cloudflare Worker API returned a local emulation fallback. Remote cloud worker is unreachable.');
        }

        const elapsedMs = Math.round(performance.now() - startMs);

        setPendingReview({
          originalText: targetText,
          improvedText: res.improvedText,
          engine: 'cloud',
          modelUsed: res.engineName || 'Cloudflare Workers AI (@cf/qwen/qwen3-30b-a3b-fp8)',
          latencyMs: elapsedMs,
          invariants: res.invariants,
          selection: hasSelection ? { ...selectedRange! } : null,
        });

        // Reset per-action consent after execution
        setCloudConsentConfirmed(false);
      } catch (err: any) {
        if (err.name === 'AbortError' || controller.signal.aborted) {
          setApiError({ message: 'Cloud humanization was cancelled by user.' });
        } else {
          const isRate = err.message?.includes('rate limit') || err.message?.includes('429');
          const isTime = err.message?.includes('timed out');
          setApiError({
            message: err.message || 'Cloudflare Worker humanization failed.',
            isRateLimit: isRate,
            isTimeout: isTime,
          });
        }
      } finally {
        setIsProcessing(false);
        setActiveAbortController(null);
      }
    }
  };

  // Cancel in-flight cloud request
  const handleCancelProcessing = () => {
    if (activeAbortController) {
      activeAbortController.abort();
      setActiveAbortController(null);
    }
    setIsProcessing(false);
    setApiError({ message: 'Processing cancelled by user.' });
  };

  // Apply suggestion after user review
  const handleApplyReview = () => {
    if (!pendingReview) return;

    if (!pendingReview.selection) {
      // Entire document was processed in local mode
      updateContentWithHistory(pendingReview.improvedText);
      setPendingReview(null);
      setSelectedRange(null);
      setApplyWarning(null);
      setApplySuccessNotice('Document updated with suggestion.');
      setTimeout(() => setApplySuccessNotice(null), 3500);
      return;
    }

    const { start, end, text } = pendingReview.selection;

    // Strict boundary validation: Ensure content at start..end still matches original text
    if (content.substring(start, end) === text) {
      const updated = content.substring(0, start) + pendingReview.improvedText + content.substring(end);
      updateContentWithHistory(updated);
      setPendingReview(null);
      setSelectedRange(null);
      setApplyWarning(null);
      setApplySuccessNotice('Selected passage updated with suggestion.');
      setTimeout(() => setApplySuccessNotice(null), 3500);
      return;
    }

    // Offset shift detection: Check if original text still exists uniquely elsewhere in content
    const occurrences: number[] = [];
    let idx = content.indexOf(text);
    while (idx !== -1) {
      occurrences.push(idx);
      idx = content.indexOf(text, idx + 1);
    }

    if (occurrences.length === 1) {
      const shiftedStart = occurrences[0];
      const updated =
        content.substring(0, shiftedStart) +
        pendingReview.improvedText +
        content.substring(shiftedStart + text.length);
      updateContentWithHistory(updated);
      setPendingReview(null);
      setSelectedRange(null);
      setApplyWarning(null);
      setApplySuccessNotice('Selected passage updated at shifted position.');
      setTimeout(() => setApplySuccessNotice(null), 3500);
      return;
    }

    // Stale or ambiguous selection: Prevent blind overwrite to protect document integrity
    setApplyWarning(
      'Stale selection detected: The original selected passage was modified or cannot be uniquely located in the document. Auto-apply is blocked to prevent accidental data corruption. You can copy the suggestion to clipboard or re-select the text.'
    );
  };

  // Discard suggestion: Leaves document completely untouched
  const handleDiscardReview = () => {
    setPendingReview(null);
    setApplyWarning(null);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_') || 'vault_document'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const wordsCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charsCount = content.length;
  const readingTime = Math.max(1, Math.ceil(wordsCount / 200));

  return (
    <div className="mt-6 rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-surface)] p-6 shadow-xl">
      {/* Studio Top Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-[var(--border-subtle)] pb-5 md:flex-row md:items-center">
        <div className="flex flex-1 items-center space-x-3">
          <div className="rounded-xl bg-purple-500/10 p-2 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <Lock className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Document Title"
              className="w-full bg-transparent text-lg font-extrabold tracking-tight text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-hidden"
            />
            <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-[var(--text-muted)]">
              <span>{wordsCount} words</span>
              <span>•</span>
              <span>{charsCount} characters</span>
              <span>•</span>
              <span>~{readingTime} min read</span>
              <span>•</span>
              <span className="flex items-center space-x-1 font-semibold text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Zero-Knowledge Decrypted in Browser Memory</span>
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
          <button
            onClick={handleDownloadMarkdown}
            className="flex items-center space-x-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export .md</span>
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center space-x-1.5 rounded-lg bg-[var(--accent)] px-4 py-1.5 text-xs font-bold text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)] shadow-xs disabled:opacity-50"
          >
            <Lock className="h-3.5 w-3.5" />
            <span>{isSaving ? 'Encrypting...' : saveSuccess ? 'Saved & Encrypted!' : 'Save & Encrypt'}</span>
          </button>
          <button
            onClick={onClose}
            className="rounded-lg border border-[var(--border-subtle)] p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            title="Close Assistant"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Studio Grid: Editor (Left 7 Cols) + Assistant Panel (Right 5 Cols) */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Document Editor Area */}
        <div className="flex flex-col lg:col-span-7">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2 text-xs font-bold text-[var(--text-secondary)]">
            <div className="flex items-center space-x-2">
              <span>Decrypted Document Editor</span>
              {/* Undo / Redo History Controls */}
              <div className="flex items-center space-x-1 pl-2 border-l border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={handleUndo}
                  disabled={historyIndex <= 0}
                  className="rounded p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Undo last change (Ctrl+Z)"
                >
                  <Undo className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleRedo}
                  disabled={historyIndex >= history.length - 1}
                  className="rounded p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Redo change (Ctrl+Y)"
                >
                  <Redo className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-[11px] font-normal text-[var(--text-muted)]">
              <span>Flesch Score:</span>
              <span className="font-bold text-[var(--text-primary)] font-mono">
                {analysis.readability.fleschKincaidScore} / 100
              </span>
              <span>•</span>
              <span className="font-semibold text-purple-600 dark:text-purple-400">
                {analysis.readability.tone} Tone
              </span>
            </div>
          </div>

          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              if (pendingReview?.selection) {
                const { start, end, text } = pendingReview.selection;
                if (e.target.value.substring(start, end) !== text) {
                  setApplyWarning(
                    'Notice: The document content was edited while reviewing this suggestion. Safe range check will verify placement upon Apply.'
                  );
                } else {
                  setApplyWarning(null);
                }
              }
            }}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                if (e.shiftKey) {
                  e.preventDefault();
                  handleRedo();
                } else {
                  e.preventDefault();
                  handleUndo();
                }
              } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
                e.preventDefault();
                handleRedo();
              }
            }}
            onSelect={handleCaptureSelection}
            onMouseUp={handleCaptureSelection}
            onKeyUp={handleCaptureSelection}
            rows={22}
            placeholder="Type or paste your text here to begin private editing and writing assistance..."
            className="mt-3 w-full flex-1 resize-y rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-4 font-sans text-sm leading-relaxed text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-hidden"
          />

          {/* Quick Cross-Tool Navigation */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-3.5 py-2 text-xs">
            <span className="text-[var(--text-muted)]">Private Workflow Actions:</span>
            <div className="flex items-center space-x-2">
              {onLoadIntoEditor && (
                <>
                  <button
                    onClick={() => onLoadIntoEditor(content, title)}
                    className="flex items-center space-x-1 font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:underline"
                  >
                    <BookOpen className="h-3 w-3" />
                    <span>Load Into Main Editor</span>
                  </button>
                  <span className="text-[var(--text-muted)]">•</span>
                </>
              )}
              {onLoadIntoHumanizer && (
                <button
                  onClick={() => onLoadIntoHumanizer(content)}
                  className="flex items-center space-x-1 font-semibold text-[var(--accent)] hover:underline"
                >
                  <Sparkles className="h-3 w-3" />
                  <span>Open in Full Humanizer</span>
                </button>
              )}
              {onLoadIntoPlagiarismChecker && (
                <>
                  <span className="text-[var(--text-muted)]">•</span>
                  <button
                    onClick={() => onLoadIntoPlagiarismChecker(content, title)}
                    className="flex items-center space-x-1 font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <ShieldCheck className="h-3 w-3" />
                    <span>Check Plagiarism</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Writing Assistant Panel */}
        <div className="flex flex-col rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] p-4 shadow-sm lg:col-span-5">
          {/* Assistant Tabs */}
          <div className="flex items-center border-b border-[var(--border-subtle)] pb-1 sm:pb-2 gap-1 text-xs font-bold overflow-x-auto scrollbar-none flex-nowrap sm:flex-wrap w-full">
            <button
              onClick={() => setActiveTab('suggestions')}
              className={`shrink-0 flex items-center space-x-1.5 rounded-lg px-2.5 py-1.5 transition-all ${
                activeTab === 'suggestions'
                  ? 'bg-[var(--accent)] text-[var(--accent-contrast)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Wand2 className="h-3.5 w-3.5" />
              <span>Suggestions</span>
              {activeSuggestions.length > 0 && (
                <span
                  className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] ${
                    activeTab === 'suggestions' ? 'bg-white/20 text-white' : 'bg-red-500/10 text-red-600'
                  }`}
                >
                  {activeSuggestions.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('paraphraser')}
              className={`shrink-0 flex items-center space-x-1.5 rounded-lg px-2.5 py-1.5 transition-all ${
                activeTab === 'paraphraser'
                  ? 'bg-[var(--accent)] text-[var(--accent-contrast)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Writing Assistance</span>
            </button>

            <button
              onClick={() => setActiveTab('aiRadar')}
              className={`shrink-0 flex items-center space-x-1.5 rounded-lg px-2.5 py-1.5 transition-all ${
                activeTab === 'aiRadar'
                  ? 'bg-[var(--accent)] text-[var(--accent-contrast)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Gauge className="h-3.5 w-3.5" />
              <span>AI Radar</span>
            </button>

            <button
              onClick={() => setActiveTab('metrics')}
              className={`shrink-0 flex items-center space-x-1.5 rounded-lg px-2.5 py-1.5 transition-all ${
                activeTab === 'metrics'
                  ? 'bg-[var(--accent)] text-[var(--accent-contrast)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>Metrics</span>
            </button>
          </div>

          {/* TAB 1: SUGGESTIONS */}
          {activeTab === 'suggestions' && (
            <div className="mt-3 flex flex-1 flex-col">
              {/* Category Pills & Apply All */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2">
                <div className="flex flex-wrap gap-1">
                  {(['all', 'grammar', 'wordiness', 'passive_voice', 'split_sentence', 'ai_cliche'] as const).map(
                    (cat) => (
                      <button
                        key={cat}
                        onClick={() => setCategoryFilter(cat)}
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold capitalize transition-all ${
                          categoryFilter === cat
                            ? 'bg-[var(--text-primary)] text-[var(--bg-surface)]'
                            : 'bg-[var(--bg-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                        }`}
                      >
                        {cat.replace('_', ' ')}
                      </button>
                    )
                  )}
                </div>

                {activeSuggestions.length > 1 && (
                  <button
                    onClick={handleApplyAll}
                    className="flex items-center space-x-1 rounded-md bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-700 shadow-xs"
                  >
                    <Check className="h-3 w-3" />
                    <span>Apply All ({activeSuggestions.length})</span>
                  </button>
                )}
              </div>

              {/* Suggestions Cards List */}
              <div className="mt-2 flex-1 space-y-3 max-h-[460px] overflow-y-auto pr-1">
                {activeSuggestions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="rounded-full bg-emerald-500/10 p-3 text-emerald-600 dark:text-emerald-400">
                      <Check className="h-6 w-6" />
                    </div>
                    <h4 className="mt-3 text-xs font-bold text-[var(--text-primary)]">Prose is clean & concise!</h4>
                    <p className="mt-1 max-w-xs text-[11px] text-[var(--text-muted)]">
                      No redundant phrasing, grammar conflicts, or run-on sentences detected in this document.
                    </p>
                  </div>
                ) : (
                  activeSuggestions.map((sug) => (
                    <div
                      key={sug.id}
                      className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3 text-xs transition-all hover:border-[var(--accent-border)]"
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            sug.category === 'grammar'
                              ? 'bg-red-500/10 text-red-600 border border-red-500/20'
                              : sug.category === 'wordiness'
                              ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                              : sug.category === 'split_sentence'
                              ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                              : sug.category === 'ai_cliche'
                              ? 'bg-purple-500/10 text-purple-600 border border-purple-500/20'
                              : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                          }`}
                        >
                          {sug.category.replace('_', ' ')}
                        </span>
                        <button
                          onClick={() => handleDismissSuggestion(sug.id)}
                          className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                          title="Dismiss"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>

                      {/* Diff Replacement Preview */}
                      <div className="mt-2 flex items-center space-x-2 font-mono text-[11px]">
                        <span className="line-through text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded">
                          {sug.original.length > 40 ? sug.original.substring(0, 40) + '...' : sug.original}
                        </span>
                        <ArrowRight className="h-3 w-3 text-[var(--text-muted)] shrink-0" />
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                          {sug.replacement.length > 40 ? sug.replacement.substring(0, 40) + '...' : sug.replacement}
                        </span>
                      </div>

                      <p className="mt-1.5 text-[11px] text-[var(--text-secondary)] leading-relaxed">
                        {sug.explanation}
                      </p>

                      {/* Action buttons */}
                      <div className="mt-2.5 flex items-center space-x-2">
                        <button
                          onClick={() => handleAcceptSuggestion(sug)}
                          className="flex items-center space-x-1 rounded-md bg-[var(--accent)] px-2.5 py-1 text-[11px] font-bold text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)]"
                        >
                          <Check className="h-3 w-3" />
                          <span>Accept</span>
                        </button>
                        {sug.alternatives && sug.alternatives.length > 0 && (
                          <div className="flex items-center space-x-1 text-[11px] text-[var(--text-muted)]">
                            <span>or:</span>
                            {sug.alternatives.slice(0, 2).map((alt) => (
                              <button
                                key={alt}
                                onClick={() => handleAcceptSuggestion({ ...sug, replacement: alt })}
                                className="rounded bg-[var(--bg-surface)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]"
                              >
                                {alt}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 2: WRITING ASSISTANCE (LOCAL & CLOUDFLARE WORKER) */}
          {activeTab === 'paraphraser' && (
            <div className="mt-3 flex flex-1 flex-col space-y-3.5">
              {/* Engine Selector: Local vs Cloud */}
              <div>
                <label className="text-[11px] font-bold text-[var(--text-secondary)] flex items-center justify-between">
                  <span>Processing Engine</span>
                  <span className="text-[10px] font-normal text-[var(--text-muted)]">
                    {assistanceEngine === 'local' ? 'Default: 100% In-Browser' : 'Optional Cloud AI'}
                  </span>
                </label>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAssistanceEngine('local');
                      setApiError(null);
                    }}
                    className={`flex items-start space-x-2 rounded-xl border p-2.5 text-left transition-all ${
                      assistanceEngine === 'local'
                        ? 'border-[var(--accent)] bg-[var(--accent-light)]/40 shadow-xs'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-subtle)] hover:border-[var(--border-strong)]'
                    }`}
                  >
                    <div className="mt-0.5 rounded-lg bg-[var(--accent)]/10 p-1.5 text-[var(--accent)]">
                      <Cpu className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[var(--text-primary)]">Local Engine</span>
                        <span className="rounded bg-emerald-500/10 px-1.5 py-0.2 text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">
                          Private
                        </span>
                      </div>
                      <p className="mt-0.5 text-[10px] text-[var(--text-muted)] leading-tight">
                        Deterministic on-device rules. Zero network egress.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAssistanceEngine('cloud');
                      setApiError(null);
                    }}
                    className={`flex items-start space-x-2 rounded-xl border p-2.5 text-left transition-all ${
                      assistanceEngine === 'cloud'
                        ? 'border-purple-500 bg-purple-500/10 shadow-xs'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-subtle)] hover:border-[var(--border-strong)]'
                    }`}
                  >
                    <div className="mt-0.5 rounded-lg bg-purple-500/10 p-1.5 text-purple-600 dark:text-purple-400">
                      <Cloud className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[var(--text-primary)]">Cloudflare AI</span>
                        <span className="rounded bg-purple-500/10 px-1.5 py-0.2 text-[9px] font-semibold text-purple-600 dark:text-purple-400">
                          Neural
                        </span>
                      </div>
                      <p className="mt-0.5 text-[10px] text-[var(--text-muted)] leading-tight">
                        Main production edge model (@cf/qwen/qwen3-30b).
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Target Text Scope Indicator */}
              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[var(--text-secondary)] text-[11px]">Target Scope:</span>
                  {selectedRange && selectedRange.text.trim() && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRange(null);
                        setApplyWarning(null);
                      }}
                      className="text-[10px] font-semibold text-[var(--accent)] hover:underline"
                    >
                      Clear Selection
                    </button>
                  )}
                </div>

                {selectedRange && selectedRange.text.trim() ? (
                  <div className="mt-1.5 space-y-1">
                    <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-purple-600 dark:text-purple-400">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                      <span>
                        Selected passage ({selectedRange.text.split(/\s+/).filter(Boolean).length} words, chars{' '}
                        {selectedRange.start}–{selectedRange.end})
                      </span>
                    </div>
                    <p className="rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-2 font-mono text-[10px] text-[var(--text-secondary)] line-clamp-2">
                      "{selectedRange.text}"
                    </p>
                  </div>
                ) : (
                  <div className="mt-1 text-[11px] text-[var(--text-muted)] flex items-center justify-between">
                    <span>Entire document will be processed ({wordsCount} words).</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (textareaRef.current) {
                          textareaRef.current.focus();
                          textareaRef.current.select();
                          setSelectedRange({
                            start: 0,
                            end: content.length,
                            text: content,
                          });
                        }
                      }}
                      className="text-[10px] font-semibold text-[var(--accent)] hover:underline"
                    >
                      Select All in Editor
                    </button>
                  </div>
                )}
              </div>

              {/* Mode Selection */}
              <div>
                <label className="text-[11px] font-bold text-[var(--text-secondary)]">Style Mode</label>
                <div className="mt-1 grid grid-cols-5 gap-1">
                  {(['natural', 'conversational', 'formal', 'concise', 'flow'] as HumanizerMode[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => setParaMode(m)}
                      className={`rounded-lg py-1 text-[10px] font-bold capitalize transition-all ${
                        paraMode === m
                          ? 'bg-[var(--accent)] text-[var(--accent-contrast)]'
                          : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Synonym Intensity */}
              <div>
                <div className="flex items-center justify-between text-[11px] font-bold text-[var(--text-secondary)]">
                  <span>Vocabulary Intensity</span>
                  <span className="font-mono text-[var(--accent)] capitalize text-[10px]">{paraIntensity}</span>
                </div>
                <div className="mt-1 grid grid-cols-4 gap-1">
                  {(['conservative', 'balanced', 'dynamic', 'maximum'] as VocabularyIntensity[]).map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setParaIntensity(lvl)}
                      className={`rounded-md py-1 text-[10px] font-bold capitalize ${
                        paraIntensity === lvl
                          ? 'bg-[var(--text-primary)] text-[var(--bg-surface)]'
                          : 'bg-[var(--bg-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {lvl === 'conservative' ? 'Low' : lvl === 'balanced' ? 'Med' : lvl === 'dynamic' ? 'High' : 'Max'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cloud Privacy Disclosure & Explicit Opt-In */}
              {assistanceEngine === 'cloud' && (
                <div className="rounded-xl border border-purple-500/30 bg-purple-500/5 p-3 text-xs">
                  <div className="flex items-center space-x-2 text-purple-600 dark:text-purple-400 font-bold text-[11px]">
                    <ShieldCheck className="h-4 w-4 shrink-0" />
                    <span>Zero-Knowledge Cloud Security Guarantee</span>
                  </div>
                  <ul className="mt-1.5 space-y-1 text-[10px] text-[var(--text-secondary)] list-disc pl-4">
                    <li>Your document encryption key, password, IV, and title NEVER leave your browser.</li>
                    <li>
                      {selectedRange && selectedRange.text.trim()
                        ? `Only the explicitly highlighted passage (${selectedRange.text.split(/\s+/).filter(Boolean).length} words) will be transmitted over TLS to Cloudflare Workers AI.`
                        : `The document text (${wordsCount} words) will be transmitted over TLS to Cloudflare Workers AI (or highlight text in the editor to send only a specific passage).`}
                    </li>
                    <li>Zero server retention: In-memory inference only; no logs, databases, or training storage.</li>
                  </ul>

                  <label className="mt-2.5 flex items-start space-x-2 text-[11px] font-medium text-[var(--text-primary)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cloudConsentConfirmed}
                      onChange={(e) => {
                        setCloudConsentConfirmed(e.target.checked);
                        if (e.target.checked) setApiError(null);
                      }}
                      className="mt-0.5 rounded border-[var(--border-subtle)] text-[var(--accent)] focus:ring-[var(--accent)]"
                    />
                    <span>{selectedRange && selectedRange.text.trim() ? 'I authorize transmitting only this selected passage to Cloudflare Workers AI.' : 'I authorize transmitting this document content to Cloudflare Workers AI.'}</span>
                  </label>
                </div>
              )}

              {/* Error Alert Display with Recovery Options */}
              {apiError && (
                <div
                  role="alert"
                  className="rounded-xl border border-[var(--error-border)] bg-[var(--error-bg)] p-3 text-xs text-[var(--error-text)] space-y-2"
                >
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <span className="font-bold">
                        {apiError.isRateLimit
                          ? 'Rate Limit Exceeded'
                          : apiError.isTimeout
                          ? 'Request Timed Out'
                          : 'Humanization Failed'}
                      </span>
                      <p className="mt-0.5 text-[11px] leading-relaxed">{apiError.message}</p>
                    </div>
                  </div>

                  {assistanceEngine === 'cloud' && (
                    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[var(--error-border)]/40">
                      <button
                        type="button"
                        onClick={handleRunAssistance}
                        disabled={isProcessing}
                        className="rounded-md bg-[var(--error-text)]/10 hover:bg-[var(--error-text)]/20 px-2 py-1 text-[10px] font-bold text-[var(--error-text)]"
                      >
                        Retry Cloud
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAssistanceEngine('local');
                          setApiError(null);
                        }}
                        className="rounded-md bg-[var(--bg-surface)] border border-[var(--border-subtle)] px-2 py-1 text-[10px] font-bold text-[var(--text-primary)] hover:border-[var(--accent)]"
                      >
                        Switch to Local Engine
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Apply Success Notice */}
              {applySuccessNotice && (
                <div
                  role="status"
                  className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs text-emerald-600 dark:text-emerald-400 flex items-center space-x-2 font-medium"
                >
                  <Check className="h-4 w-4 shrink-0" />
                  <span>{applySuccessNotice}</span>
                </div>
              )}

              {/* Main Submit & Cancel Controls */}
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleRunAssistance}
                  disabled={isProcessing}
                  className={`flex flex-1 items-center justify-center space-x-2 rounded-xl py-2.5 text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                    assistanceEngine === 'cloud'
                      ? 'bg-purple-600 text-white hover:bg-purple-700 active:scale-[0.99]'
                      : 'bg-[var(--accent)] text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)] active:scale-[0.99]'
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>
                        {assistanceEngine === 'cloud'
                          ? 'Generating with Cloudflare Workers AI...'
                          : 'Processing on-device...'}
                      </span>
                    </>
                  ) : (
                    <>
                      {assistanceEngine === 'cloud' ? <Cloud className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                      <span>
                        {assistanceEngine === 'cloud'
                          ? selectedRange && selectedRange.text.trim()
                            ? 'Authorize & Humanize Selection'
                            : 'Authorize & Humanize Document'
                          : selectedRange && selectedRange.text.trim()
                          ? 'Paraphrase Selection'
                          : 'Paraphrase Document'}
                      </span>
                    </>
                  )}
                </button>

                {isProcessing && (
                  <button
                    type="button"
                    onClick={handleCancelProcessing}
                    className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-3 py-2.5 text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  >
                    Cancel
                  </button>
                )}
              </div>

              {/* REVIEW-BEFORE-APPLY PANEL */}
              {pendingReview && (
                <div
                  role="region"
                  aria-label="Suggestion Review Panel"
                  className="mt-3 rounded-xl border border-[var(--accent-border)] bg-[var(--accent-light)]/20 p-3.5 text-xs space-y-3"
                >
                  {/* Top metadata badge */}
                  <div className="flex flex-wrap items-center justify-between gap-1 pb-2 border-b border-[var(--border-subtle)] text-[11px]">
                    <div className="flex items-center space-x-1.5 font-bold text-[var(--text-primary)]">
                      {pendingReview.engine === 'cloud' ? (
                        <span className="inline-flex items-center space-x-1 text-purple-600 dark:text-purple-400">
                          <Cloud className="h-3.5 w-3.5" />
                          <span>Cloudflare Workers AI ({pendingReview.latencyMs}ms)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 text-emerald-600 dark:text-emerald-400">
                          <Cpu className="h-3.5 w-3.5" />
                          <span>Local Engine ({pendingReview.latencyMs}ms)</span>
                        </span>
                      )}
                    </div>
                    {pendingReview.invariants && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center space-x-1">
                        <Check className="h-3 w-3" />
                        <span>Facts & Invariants Preserved</span>
                      </span>
                    )}
                  </div>

                  {/* Original vs Suggestion Comparison */}
                  <div className="space-y-2">
                    <div>
                      <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">
                        Original Text
                      </span>
                      <p className="mt-1 rounded-lg border border-red-500/20 bg-red-500/5 p-2 font-sans text-[11px] text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
                        {pendingReview.originalText}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                        Suggested Rewrite
                      </span>
                      <p className="mt-1 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2 font-sans text-[11px] text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap font-medium">
                        {pendingReview.improvedText}
                      </p>
                    </div>
                  </div>

                  {/* Word count comparison delta */}
                  <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] font-mono">
                    <span>
                      Words: {pendingReview.originalText.split(/\s+/).filter(Boolean).length} →{' '}
                      {pendingReview.improvedText.split(/\s+/).filter(Boolean).length}
                    </span>
                    <span>
                      Chars: {pendingReview.originalText.length} → {pendingReview.improvedText.length}
                    </span>
                  </div>

                  {/* Stale Selection Safety Warning */}
                  {applyWarning && (
                    <div
                      role="alert"
                      className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-[11px] text-amber-700 dark:text-amber-300 space-y-1"
                    >
                      <div className="flex items-center space-x-1 font-bold">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                        <span>Safety Notice</span>
                      </div>
                      <p className="leading-relaxed">{applyWarning}</p>
                    </div>
                  )}

                  {/* Review Action Buttons: Apply, Discard, Copy */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--border-subtle)]">
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={handleApplyReview}
                        className="flex items-center space-x-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white shadow-xs"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>
                          {pendingReview.selection ? 'Apply to Selected Range' : 'Apply to Document'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={handleDiscardReview}
                        className="flex items-center space-x-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)]"
                      >
                        <X className="h-3.5 w-3.5" />
                        <span>Discard</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(pendingReview.improvedText);
                      }}
                      className="flex items-center space-x-1 rounded px-2 py-1 text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                      title="Copy suggestion text"
                    >
                      <Copy className="h-3 w-3" />
                      <span>Copy</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: AI RADAR & CLICHES */}
          {activeTab === 'aiRadar' && (
            <div className="mt-3 flex flex-1 flex-col space-y-4">
              {/* Gauge Banner */}
              <div
                className={`rounded-xl border p-4 ${
                  analysis.aiProbability < 0.3
                    ? 'border-emerald-300 bg-emerald-50/70 text-emerald-950 dark:border-emerald-800/60 dark:bg-emerald-950/20 dark:text-emerald-300'
                    : analysis.aiProbability > 0.6
                    ? 'border-red-300 bg-red-50/70 text-red-950 dark:border-red-800/60 dark:bg-red-950/20 dark:text-red-300'
                    : 'border-amber-300 bg-amber-50/70 text-amber-950 dark:border-amber-800/60 dark:bg-amber-950/20 dark:text-amber-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">Document AI Likelihood</span>
                  <span className="font-mono text-base font-black">
                    {Math.round(analysis.aiProbability * 100)}%
                  </span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      analysis.aiProbability < 0.3
                        ? 'bg-emerald-500'
                        : analysis.aiProbability > 0.6
                        ? 'bg-red-500'
                        : 'bg-amber-500'
                    }`}
                    style={{ width: `${Math.round(analysis.aiProbability * 100)}%` }}
                  />
                </div>
                <p className="mt-2 text-[11px] opacity-90 leading-relaxed">
                  {analysis.aiProbability < 0.3
                    ? 'Prose looks authentic and natural. Varied sentence lengths and zero heavy LLM markers.'
                    : analysis.aiProbability > 0.6
                    ? 'Substantial AI cliché signals and low sentence burstiness detected.'
                    : 'Mixed signals. Review detected clichés below.'}
                </p>
              </div>

              {/* Detected Clichés */}
              <div>
                <span className="text-xs font-bold text-[var(--text-secondary)]">Detected Synthetic Clichés</span>
                <div className="mt-2 space-y-2 max-h-60 overflow-y-auto pr-1">
                  {analysis.suggestions.filter((s) => s.category === 'ai_cliche').length === 0 ? (
                    <div className="py-6 text-center text-xs text-[var(--text-muted)]">
                      No synthetic AI clichés found.
                    </div>
                  ) : (
                    analysis.suggestions
                      .filter((s) => s.category === 'ai_cliche')
                      .map((cliche) => (
                        <div
                          key={cliche.id}
                          className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-2.5 text-xs"
                        >
                          <div>
                            <span className="font-bold text-red-500 font-mono">"{cliche.original}"</span>
                            <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{cliche.explanation}</p>
                          </div>
                          <button
                            onClick={() => handleAcceptSuggestion(cliche)}
                            className="rounded bg-[var(--accent)] px-2 py-1 text-[10px] font-bold text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)] shrink-0 ml-2"
                          >
                            Replace with "{cliche.replacement}"
                          </button>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: METRICS & READABILITY */}
          {activeTab === 'metrics' && (
            <div className="mt-3 flex flex-1 flex-col space-y-3 text-xs">
              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3">
                <span className="text-[11px] text-[var(--text-muted)]">Flesch Reading Ease:</span>
                <div className="mt-1 flex items-baseline space-x-2">
                  <span className="text-2xl font-black text-[var(--text-primary)]">
                    {analysis.readability.fleschKincaidScore}
                  </span>
                  <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                    {analysis.readability.gradeLevel}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3">
                  <span className="text-[10px] text-[var(--text-muted)]">Sentence Rhythm (Burstiness)</span>
                  <div className="mt-1 font-mono text-base font-bold text-[var(--text-primary)]">
                    {analysis.burstinessScore} / 100
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3">
                  <span className="text-[10px] text-[var(--text-muted)]">Passive Voice Clauses</span>
                  <div className="mt-1 font-mono text-base font-bold text-[var(--text-primary)]">
                    {analysis.passiveSentenceCount}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3 space-y-1 text-[11px] text-[var(--text-secondary)]">
                <div className="flex justify-between">
                  <span>Average Sentence Length:</span>
                  <span className="font-mono font-bold text-[var(--text-primary)]">
                    {analysis.readability.avgSentenceLength} words
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total Sentences:</span>
                  <span className="font-mono font-bold text-[var(--text-primary)]">
                    {analysis.readability.sentenceCount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Tone:</span>
                  <span className="font-bold text-[var(--accent)]">{analysis.readability.tone}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
