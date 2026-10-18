import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  Copy,
  CheckCircle2,
  RefreshCw,
  Undo2,
  Cpu,
  Info,
  ChevronDown,
  ChevronUp,
  Check,
  Download,
} from 'lucide-react';
import type { HumanizerMode, HumanizerResult } from '../../types';
import { defaultHumanizerManager } from '../../lib/humanizer/manager';
import type { ModelDownloadProgress } from '../../lib/humanizer/browserAiEngine';

interface HumanizerWorkspaceProps {
  originalText: string;
  setOriginalText: (text: string) => void;
}

export const HumanizerWorkspace: React.FC<HumanizerWorkspaceProps> = ({
  originalText,
  setOriginalText,
}) => {
  const [improvedText, setImprovedText] = useState('');
  const [selectedMode, setSelectedMode] = useState<HumanizerMode>('natural');
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultData, setResultData] = useState<HumanizerResult | null>(null);
  const [activeEngineType, setActiveEngineType] = useState<'deterministic-rules' | 'browser-ai-local'>('deterministic-rules');
  const [modelProgress, setModelProgress] = useState<ModelDownloadProgress | null>(null);
  const [copied, setCopied] = useState(false);
  const [historyOriginal, setHistoryOriginal] = useState<string | null>(null);
  const [showChangesPanel, setShowChangesPanel] = useState(false);
  const [mobileTab, setMobileTab] = useState<'original' | 'improved'>('improved');

  const modes: { id: HumanizerMode; label: string; desc: string }[] = [
    {
      id: 'natural',
      label: 'More Natural',
      desc: 'Eliminates robotic phrasing and stiff artificial vocabulary.',
    },
    {
      id: 'concise',
      label: 'Clearer & Concise',
      desc: 'Removes redundant filler phrases, bloated prepositions, and pleonasms.',
    },
    {
      id: 'conversational',
      label: 'Conversational',
      desc: 'Adds natural contractions and direct, engaging sentence rhythm.',
    },
    {
      id: 'formal',
      label: 'Formal & Academic',
      desc: 'Expands contractions and elevates casual register to professional prose.',
    },
    {
      id: 'flow',
      label: 'Sentence Flow',
      desc: 'Smoothes transitions, balances sentence lengths, and enhances cadence.',
    },
  ];

  const handleRunHumanizer = async () => {
    if (!originalText.trim()) return;
    setIsProcessing(true);

    try {
      defaultHumanizerManager.setActiveEngine(activeEngineType);
      const res = await defaultHumanizerManager.humanize(originalText, {
        mode: selectedMode,
      });
      setResultData(res);
      setImprovedText(res.improvedText);
      setMobileTab('improved');
    } catch (err: any) {
      alert(`Humanization error: ${err?.message || 'Processing failed'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyImproved = () => {
    if (!improvedText) return;
    navigator.clipboard.writeText(improvedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReplaceOriginal = () => {
    if (!improvedText) return;
    setHistoryOriginal(originalText);
    setOriginalText(improvedText);
  };

  const handleRestoreOriginal = () => {
    if (historyOriginal !== null) {
      setOriginalText(historyOriginal);
      setHistoryOriginal(null);
    }
  };

  const handleDownloadImproved = () => {
    if (!improvedText) return;
    const blob = new Blob([improvedText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `humanized-${selectedMode}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleToggleLocalAi = async () => {
    if (activeEngineType === 'deterministic-rules') {
      const browserAi = defaultHumanizerManager.getBrowserAiEngine();
      browserAi.setProgressListener((progress) => {
        setModelProgress(progress);
      });

      const comp = await browserAi.checkDeviceCompatibility();
      if (!comp.compatible) {
        alert(`Cannot enable Browser AI: ${comp.reason}`);
        return;
      }

      if (
        confirm(
          `On-Device AI requires downloading ~${browserAi.downloadSizeMb} MB model weights to your browser cache. All inference runs locally via WebGPU. Proceed?`
        )
      ) {
        try {
          await browserAi.initializeModel();
          setActiveEngineType('browser-ai-local');
        } catch (err: any) {
          alert(`Model initialization failed: ${err?.message}`);
        }
      }
    } else {
      setActiveEngineType('deterministic-rules');
      setModelProgress(null);
    }
  };

  const origWords = originalText.trim().split(/\s+/).filter(Boolean).length;
  const impWords = improvedText.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      {/* Header and Controls */}
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Humanizer Workspace
          </h1>
          <p className="text-xs text-[var(--text-muted)]">
            Refines clarity, rhythm, and vocabulary locally without sending your private text to an AI processing server.
          </p>
        </div>

        {/* Engine switcher toggle */}
        <div className="flex items-center space-x-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-1 text-xs">
          <button
            onClick={() => setActiveEngineType('deterministic-rules')}
            className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
              activeEngineType === 'deterministic-rules'
                ? 'bg-[var(--accent-light)] text-[var(--accent)] font-semibold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Deterministic Rules (Zero Download)
          </button>
          <button
            onClick={handleToggleLocalAi}
            className={`flex items-center space-x-1.5 rounded-md px-3 py-1.5 font-medium transition-colors ${
              activeEngineType === 'browser-ai-local'
                ? 'bg-[var(--accent-light)] text-[var(--accent)] font-semibold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Cpu className="h-3.5 w-3.5" />
            <span>Local WebGPU Model (145 MB)</span>
          </button>
        </div>
      </div>

      {/* Model progress notification if active */}
      {modelProgress && modelProgress.status === 'downloading' && (
        <div className="mb-4 rounded-lg border border-[var(--warning-border)] bg-[var(--warning-bg)] p-3 text-xs text-[var(--warning-text)]">
          <div className="flex items-center justify-between font-medium">
            <span>Downloading on-device weights locally: {modelProgress.progressPercent}%</span>
            <span>{(modelProgress.downloadedBytes / (1024 * 1024)).toFixed(1)} MB / 145 MB</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--warning-border)]">
            <div
              className="h-full bg-[var(--accent)] transition-all duration-300"
              style={{ width: `${modelProgress.progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Mode Selector Ribbon */}
      <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
        {modes.map((m) => {
          const isSelected = selectedMode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setSelectedMode(m.id)}
              className={`flex flex-col items-start rounded-lg border p-3 text-left transition-all ${
                isSelected
                  ? 'border-[var(--accent)] bg-[var(--accent-light)] text-[var(--text-primary)] ring-1 ring-[var(--accent)]'
                  : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]'
              }`}
            >
              <div className="flex w-full items-center justify-between">
                <span className={`text-xs font-semibold ${isSelected ? 'text-[var(--accent)]' : ''}`}>
                  {m.label}
                </span>
                {isSelected && <Check className="h-3.5 w-3.5 text-[var(--accent)]" />}
              </div>
              <p className="mt-1 line-clamp-2 text-[11px] text-[var(--text-muted)]">
                {m.desc}
              </p>
            </button>
          );
        })}
      </div>

      {/* Mobile pane selector */}
      <div className="mb-3 flex rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-1 text-xs md:hidden">
        <button
          onClick={() => setMobileTab('original')}
          className={`flex-1 rounded-md py-1.5 font-medium ${
            mobileTab === 'original'
              ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs'
              : 'text-[var(--text-muted)]'
          }`}
        >
          Original ({origWords} words)
        </button>
        <button
          onClick={() => setMobileTab('improved')}
          className={`flex-1 rounded-md py-1.5 font-medium ${
            mobileTab === 'improved'
              ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs'
              : 'text-[var(--text-muted)]'
          }`}
        >
          Improved ({impWords} words)
        </button>
      </div>

      {/* Side-by-Side Editor Panels */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* Left: Original Text */}
        <div
          className={`flex flex-col rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] shadow-xs ${
            mobileTab !== 'original' ? 'hidden md:flex' : 'flex'
          }`}
        >
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-4 py-2.5">
            <span className="text-xs font-semibold text-[var(--text-primary)]">
              Original Text
            </span>
            <div className="flex items-center space-x-2 text-xs text-[var(--text-muted)] font-mono">
              <span>{origWords} words</span>
              <span>•</span>
              <span>{originalText.length} chars</span>
            </div>
          </div>
          <textarea
            value={originalText}
            onChange={(e) => setOriginalText(e.target.value)}
            placeholder="Type or paste text to humanize..."
            rows={15}
            className="w-full resize-none border-none bg-transparent p-4 text-sm leading-relaxed text-[var(--text-primary)] focus:outline-hidden"
          />
          <div className="flex items-center justify-between border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3">
            {historyOriginal && (
              <button
                onClick={handleRestoreOriginal}
                className="flex items-center space-x-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                <Undo2 className="h-3.5 w-3.5" />
                <span>Restore original</span>
              </button>
            )}
            <div className="ml-auto">
              <button
                onClick={handleRunHumanizer}
                disabled={!originalText.trim() || isProcessing}
                className="flex items-center space-x-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-[var(--accent-contrast)] shadow-xs transition-all hover:bg-[var(--accent-hover)] disabled:opacity-40"
              >
                <Sparkles className="h-4 w-4" />
                <span>{isProcessing ? 'Processing Locally...' : 'Transform Text'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Improved Text */}
        <div
          className={`flex flex-col rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] shadow-xs ${
            mobileTab !== 'improved' ? 'hidden md:flex' : 'flex'
          }`}
        >
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-4 py-2.5">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-[var(--text-primary)]">
                Improved Text
              </span>
              {resultData && (
                <span className="rounded bg-[var(--accent-light)] px-2 py-0.5 text-[10px] font-semibold text-[var(--accent)]">
                  {resultData.stats.reductionPercentage >= 0 ? `-${resultData.stats.reductionPercentage}% words` : ''}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2 text-xs text-[var(--text-muted)] font-mono">
              <span>{impWords} words</span>
              <span>•</span>
              <span>{improvedText.length} chars</span>
            </div>
          </div>

          <textarea
            value={improvedText}
            onChange={(e) => setImprovedText(e.target.value)}
            placeholder="Humanized text will appear here with streamlined sentence structure and natural phrasing..."
            rows={15}
            className="w-full resize-none border-none bg-transparent p-4 text-sm leading-relaxed text-[var(--text-primary)] focus:outline-hidden"
          />

          <div className="flex flex-wrap items-center justify-between border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 gap-2">
            <div className="flex items-center space-x-2">
              <button
                onClick={handleCopyImproved}
                disabled={!improvedText}
                className="flex items-center space-x-1.5 rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs text-[var(--text-primary)] hover:border-[var(--accent)] disabled:opacity-40"
              >
                {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-[var(--accent)]" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                onClick={handleReplaceOriginal}
                disabled={!improvedText}
                className="flex items-center space-x-1.5 rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs text-[var(--text-primary)] hover:border-[var(--accent)] disabled:opacity-40"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Replace Original</span>
              </button>

              <button
                onClick={handleDownloadImproved}
                disabled={!improvedText}
                title="Download as TXT"
                className="flex items-center space-x-1.5 rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs text-[var(--text-primary)] hover:border-[var(--accent)] disabled:opacity-40"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download</span>
              </button>
            </div>

            {resultData && resultData.changes.length > 0 && (
              <button
                onClick={() => setShowChangesPanel(!showChangesPanel)}
                className="flex items-center space-x-1 text-xs font-medium text-[var(--accent)] hover:underline"
              >
                <span>{resultData.changes.length} Edits Made</span>
                {showChangesPanel ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Changes Inspector Panel */}
      {resultData && resultData.changes.length > 0 && showChangesPanel && (
        <div className="mt-6 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
              Transformation Audit Log ({resultData.changes.length} replacements)
            </h2>
            <span className="text-[11px] text-[var(--text-muted)]">
              Engine: {resultData.engineName}
            </span>
          </div>
          <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
            {resultData.changes.map((ch, idx) => (
              <div
                key={idx}
                className="flex items-start justify-between rounded-md border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-2.5 text-xs"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="rounded bg-[var(--error-bg)] px-1.5 py-0.5 text-[10px] font-mono text-[var(--error-text)] line-through">
                      {ch.original}
                    </span>
                    <ArrowRight className="h-3 w-3 text-[var(--text-muted)]" />
                    <span className="rounded bg-[var(--accent-light)] px-1.5 py-0.5 text-[10px] font-mono font-semibold text-[var(--accent)]">
                      {ch.replacement || '[removed]'}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-[var(--text-secondary)]">{ch.reason}</p>
                </div>
                <span className="rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 py-0.5 text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
                  {ch.category}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Authorial Integrity Disclaimer */}
      <div className="mt-6 flex items-start space-x-2.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-4 text-xs text-[var(--text-secondary)]">
        <Info className="h-4 w-4 shrink-0 text-[var(--accent)] mt-0.5" />
        <p>
          <strong className="text-[var(--text-primary)]">Factual preservation guarantee:</strong>{' '}
          Our on-device transformation algorithms focus strictly on syntax, cadence, and conciseness.
          The engine never fabricates facts, quotes, statistics, or citations.
        </p>
      </div>
    </div>
  );
};
