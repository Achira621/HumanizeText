import React, { useState, useMemo } from 'react';
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
} from 'lucide-react';
import type { VaultRecord, WritingSuggestion, WritingIssueCategory, HumanizerMode, VocabularyIntensity } from '../../types';
import { analyzeWriting, applySingleSuggestion, applyAllApplicableSuggestions } from '../../lib/assistant/writingAssistant';
import { humanizeWithRules } from '../../lib/humanizer/ruleEngine';

interface VaultWritingAssistantProps {
  initialRecord: VaultRecord;
  passphrase?: string;
  onSaveRecord: (updatedRecord: VaultRecord) => Promise<void>;
  onClose: () => void;
  onLoadIntoEditor?: (text: string, title: string) => void;
  onLoadIntoHumanizer?: (text: string) => void;
  onLoadIntoPlagiarismChecker?: (text: string, title: string) => void;
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

  // Assistant UI state
  const [activeTab, setActiveTab] = useState<'suggestions' | 'paraphraser' | 'aiRadar' | 'metrics'>('suggestions');
  const [categoryFilter, setCategoryFilter] = useState<WritingIssueCategory | 'all'>('all');

  // Paraphraser panel state
  const [paraMode, setParaMode] = useState<HumanizerMode>('natural');
  const [paraIntensity, setParaIntensity] = useState<VocabularyIntensity>('balanced');
  const [paraInputSelection, setParaInputSelection] = useState<string>('');
  const [paraResult, setParaResult] = useState<string | null>(null);
  const [isParaphrasing, setIsParaphrasing] = useState(false);
  const [copied, setCopied] = useState(false);

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

  // Accept single suggestion
  const handleAcceptSuggestion = (suggestion: WritingSuggestion) => {
    const updated = applySingleSuggestion(content, suggestion);
    setContent(updated);
    setDismissedSuggestionIds((prev) => new Set(prev).add(suggestion.id));
  };

  // Dismiss suggestion
  const handleDismissSuggestion = (id: string) => {
    setDismissedSuggestionIds((prev) => new Set(prev).add(id));
  };

  // Apply all suggestions
  const handleApplyAll = () => {
    const updated = applyAllApplicableSuggestions(content, activeSuggestions);
    setContent(updated);
    const newDismissed = new Set(dismissedSuggestionIds);
    activeSuggestions.forEach((s) => newDismissed.add(s.id));
    setDismissedSuggestionIds(newDismissed);
  };

  // Run in-vault Paraphraser / Humanizer
  const handleRunParaphraser = () => {
    const targetText = paraInputSelection.trim() || content;
    if (!targetText) return;

    setIsParaphrasing(true);
    try {
      const res = humanizeWithRules(targetText, {
        mode: paraMode,
        vocabularyIntensity: paraIntensity,
      });
      setParaResult(res.improvedText);
    } finally {
      setIsParaphrasing(false);
    }
  };

  // Replace text from paraphraser
  const handleApplyParaphraseResult = () => {
    if (!paraResult) return;
    if (paraInputSelection.trim() && content.includes(paraInputSelection.trim())) {
      setContent(content.replace(paraInputSelection.trim(), paraResult));
    } else {
      setContent(paraResult);
    }
    setParaResult(null);
    setParaInputSelection('');
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
                <span>100% In-Memory Decrypted (Zero Plaintext Transmission)</span>
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

      {/* Main Studio Grid: Editor (Left/Center) + Assistant Panel (Right) */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Document Editor Area (7 Cols) */}
        <div className="flex flex-col lg:col-span-7">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2 text-xs font-bold text-[var(--text-secondary)]">
            <span>Decrypted Document Editor</span>
            <div className="flex items-center space-x-2 text-[11px] font-normal text-[var(--text-muted)]">
              <span>Flesch Score:</span>
              <span className="font-bold text-[var(--text-primary)] font-mono">{analysis.readability.fleschKincaidScore} / 100</span>
              <span>•</span>
              <span className="font-semibold text-purple-600 dark:text-purple-400">{analysis.readability.tone} Tone</span>
            </div>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onSelect={(e) => {
              const target = e.target as HTMLTextAreaElement;
              const sel = target.value.substring(target.selectionStart, target.selectionEnd);
              if (sel && sel.length > 5) {
                setParaInputSelection(sel);
              }
            }}
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

        {/* Right: QuillBot-Style Writing Assistant Panel (5 Cols) */}
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
                <span className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] ${
                  activeTab === 'suggestions' ? 'bg-white/20 text-white' : 'bg-red-500/10 text-red-600'
                }`}>
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
              <span>Paraphrase</span>
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
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          sug.category === 'grammar'
                            ? 'bg-red-500/10 text-red-600 border border-red-500/20'
                            : sug.category === 'wordiness'
                            ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                            : sug.category === 'split_sentence'
                            ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                            : sug.category === 'ai_cliche'
                            ? 'bg-purple-500/10 text-purple-600 border border-purple-500/20'
                            : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                        }`}>
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

          {/* TAB 2: IN-VAULT PARAPHRASER & HUMANIZER */}
          {activeTab === 'paraphraser' && (
            <div className="mt-3 flex flex-1 flex-col space-y-3">
              <div>
                <label className="text-[11px] font-bold text-[var(--text-secondary)]">Target Text</label>
                <div className="mt-1 flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                  <span>
                    {paraInputSelection ? 'Selected passage in editor' : 'Entire document'}
                  </span>
                  {paraInputSelection && (
                    <button
                      onClick={() => setParaInputSelection('')}
                      className="text-[var(--accent)] hover:underline"
                    >
                      Clear selection (Use all)
                    </button>
                  )}
                </div>
              </div>

              {/* Modes */}
              <div>
                <label className="text-[11px] font-bold text-[var(--text-secondary)]">Mode</label>
                <div className="mt-1 grid grid-cols-3 gap-1">
                  {(['natural', 'conversational', 'formal', 'concise', 'flow'] as HumanizerMode[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => setParaMode(m)}
                      className={`rounded-lg py-1 text-[11px] font-bold capitalize transition-all ${
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

              {/* Intensity */}
              <div>
                <div className="flex items-center justify-between text-[11px] font-bold text-[var(--text-secondary)]">
                  <span>Synonym Intensity</span>
                  <span className="font-mono text-[var(--accent)] capitalize">{paraIntensity}</span>
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

              <button
                onClick={handleRunParaphraser}
                disabled={isParaphrasing}
                className="flex items-center justify-center space-x-1.5 rounded-xl bg-[var(--accent)] py-2 text-xs font-bold text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)] shadow-xs disabled:opacity-50"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>{isParaphrasing ? 'Rewriting with Local Engine...' : 'Paraphrase & Humanize'}</span>
              </button>

              {/* Paraphrase Result */}
              {paraResult && (
                <div className="mt-2 rounded-xl border border-[var(--accent-border)] bg-[var(--accent-light)]/30 p-3 text-xs">
                  <div className="flex items-center justify-between pb-1.5 border-b border-[var(--border-subtle)]">
                    <span className="font-bold text-[var(--text-primary)]">Rewritten Result</span>
                    <button
                      onClick={handleApplyParaphraseResult}
                      className="flex items-center space-x-1 rounded-md bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-700"
                    >
                      <Check className="h-3 w-3" />
                      <span>Replace in Document</span>
                    </button>
                  </div>
                  <p className="mt-2 text-[11px] text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap font-sans">
                    {paraResult}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: AI RADAR & CLICHES */}
          {activeTab === 'aiRadar' && (
            <div className="mt-3 flex flex-1 flex-col space-y-4">
              {/* Gauge Banner */}
              <div className={`rounded-xl border p-4 ${
                analysis.aiProbability < 0.30
                  ? 'border-emerald-300 bg-emerald-50/70 text-emerald-950 dark:border-emerald-800/60 dark:bg-emerald-950/20 dark:text-emerald-300'
                  : analysis.aiProbability > 0.60
                  ? 'border-red-300 bg-red-50/70 text-red-950 dark:border-red-800/60 dark:bg-red-950/20 dark:text-red-300'
                  : 'border-amber-300 bg-amber-50/70 text-amber-950 dark:border-amber-800/60 dark:bg-amber-950/20 dark:text-amber-300'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">Document AI Likelihood</span>
                  <span className="font-mono text-base font-black">
                    {Math.round(analysis.aiProbability * 100)}%
                  </span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      analysis.aiProbability < 0.30 ? 'bg-emerald-500' : analysis.aiProbability > 0.60 ? 'bg-red-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${Math.round(analysis.aiProbability * 100)}%` }}
                  />
                </div>
                <p className="mt-2 text-[11px] opacity-90 leading-relaxed">
                  {analysis.aiProbability < 0.30
                    ? 'Prose looks authentic and natural. Varied sentence lengths and zero heavy LLM markers.'
                    : analysis.aiProbability > 0.60
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
