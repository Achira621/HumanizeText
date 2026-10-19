import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import type { AiSignalPhrase } from '../../types';

interface AiSignalsInspectorProps {
  signals: AiSignalPhrase[];
  isHumanized: boolean;
}

export const AiSignalsInspector: React.FC<AiSignalsInspectorProps> = ({ signals, isHumanized }) => {
  const [isOpen, setIsOpen] = useState(false);

  const signalCount = signals.length;

  if (isHumanized) {
    return (
      <div className="flex items-center space-x-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 shadow-2xs">
        <CheckCircle2 className="h-3.5 w-3.5" />
        <span>0 AI Signals • 100% Human Score</span>
      </div>
    );
  }

  if (signalCount === 0) {
    return (
      <div className="flex items-center space-x-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
        <CheckCircle2 className="h-3.5 w-3.5" />
        <span>No robotic AI signals found</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-1.5 rounded-full px-2.5 py-1 text-xs font-bold transition-all shadow-2xs ${
          signalCount >= 3
            ? 'border border-amber-500/40 bg-amber-500/15 text-amber-800 dark:text-amber-300 hover:bg-amber-500/25'
            : 'border border-sky-500/40 bg-sky-500/15 text-sky-800 dark:text-sky-300 hover:bg-sky-500/25'
        }`}
      >
        <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
        <span>{signalCount} AI Signal{signalCount !== 1 ? 's' : ''} Detected</span>
        {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>

      {/* Dropdown list of signals */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 z-40 w-80 rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-surface)] p-3.5 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2 text-xs">
            <span className="font-bold text-[var(--text-primary)]">Robotic AI Artifacts Detected</span>
            <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">
              {signalCount} issues
            </span>
          </div>

          <div className="mt-2.5 max-h-56 space-y-2 overflow-y-auto pr-1">
            {signals.map((sig) => (
              <div
                key={sig.id}
                className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)]/60 p-2.5 text-xs transition-colors hover:border-amber-400"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-amber-700 dark:text-amber-300">
                    &ldquo;{sig.phrase}&rdquo;
                  </span>
                  <span className="rounded bg-[var(--bg-surface)] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    {sig.category}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-[var(--text-secondary)]">
                  {sig.explainer}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center space-x-1.5 rounded-lg bg-[var(--accent-light)]/40 p-2 text-[11px] text-[var(--accent)]">
            <Sparkles className="h-3.5 w-3.5 shrink-0" />
            <span>Humanize Text will eliminate these phrases and restore authentic human cadence.</span>
          </div>
        </div>
      )}
    </div>
  );
};
