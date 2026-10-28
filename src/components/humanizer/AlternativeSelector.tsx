import React, { useState } from 'react';
import {
  Layers,
  ChevronDown,
  ChevronUp,
  Check,
  RotateCcw,
  RotateCw,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import type { AlternativesMetadata } from '../../types';

export interface AlternativeSelectorProps {
  metadata?: AlternativesMetadata;
  isStale?: boolean;
  errorMessage?: string | null;
  onSelectCandidate: (candidateIndex: number) => void;
  onUndo?: () => void;
  canUndo?: boolean;
  onRedo?: () => void;
  canRedo?: boolean;
  onRegenerateAlternatives?: () => void;
}

export const AlternativeSelector: React.FC<AlternativeSelectorProps> = ({
  metadata,
  isStale = false,
  errorMessage = null,
  onSelectCandidate,
  onUndo,
  canUndo = false,
  onRedo,
  canRedo = false,
  onRegenerateAlternatives,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // If no metadata, or fewer than 2 candidates, or phrase-level/none scope, gracefully render nothing
  if (!metadata || !metadata.candidates || metadata.candidates.length < 2 || metadata.scope === 'none' || metadata.scope === 'phrase') {
    return null;
  }

  const { candidates, selectedIndex } = metadata;

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelectCandidate(index);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      const nextIdx = (index + 1) % candidates.length;
      onSelectCandidate(nextIdx);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevIdx = (index - 1 + candidates.length) % candidates.length;
      onSelectCandidate(prevIdx);
    }
  };

  return (
    <div className="mb-2.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-2 text-xs transition-colors">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5 font-semibold text-[var(--text-primary)]">
            <Layers className="h-3.5 w-3.5 text-[var(--accent)]" />
            <span>Alternative Rewrites</span>
            <span className="rounded-full bg-[var(--accent-light)] px-1.5 py-0.2 text-[10px] font-bold text-[var(--accent)]">
              {candidates.length} versions
            </span>
          </div>

          {isStale && (
            <span
              className="flex items-center space-x-1 rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300"
              title="Input text has changed since these alternatives were generated"
            >
              <AlertCircle className="h-3 w-3" />
              <span>Stale</span>
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-1.5">
          {canUndo && onUndo && (
            <button
              type="button"
              onClick={onUndo}
              className="flex items-center space-x-1 rounded px-2 py-0.5 text-[11px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)] transition-colors"
              title="Revert to previous candidate selection"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Undo</span>
            </button>
          )}

          {canRedo && onRedo && (
            <button
              type="button"
              onClick={onRedo}
              className="flex items-center space-x-1 rounded px-2 py-0.5 text-[11px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)] transition-colors"
              title="Redo candidate selection"
            >
              <RotateCw className="h-3 w-3" />
              <span>Redo</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center space-x-1 rounded px-2 py-0.5 text-[11px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)] transition-colors"
            aria-expanded={isExpanded}
          >
            <span>{isExpanded ? 'Hide comparisons' : 'Compare all'}</span>
            {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        </div>
      </div>

      {/* Segmented Pill Selector */}
      <div
        role="tablist"
        aria-label="Alternative rewritten candidate versions"
        className="mt-2 flex flex-wrap items-center gap-1.5"
      >
        {candidates.map((cand, idx) => {
          const isSelected = idx === selectedIndex;
          const label = cand.label || `Version ${idx + 1}${idx === 0 ? ' (Primary)' : ''}`;

          return (
            <button
              key={cand.id || idx}
              role="tab"
              aria-selected={isSelected}
              tabIndex={0}
              onClick={() => onSelectCandidate(idx)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              className={`flex items-center space-x-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium transition-all ${
                isSelected
                  ? 'bg-[var(--accent)] text-[var(--accent-contrast)] font-bold shadow-xs ring-1 ring-[var(--accent)]'
                  : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] border border-transparent hover:border-[var(--border-subtle)]'
              }`}
              title={`Switch to ${label}`}
            >
              {isSelected && <Check className="h-3 w-3" />}
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* Stale Warning Banner if user altered source */}
      {isStale && (
        <div className="mt-2 flex items-center space-x-2 rounded border border-amber-500/20 bg-amber-500/10 px-2.5 py-1.5 text-[11px] text-amber-800 dark:text-amber-200">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>
            The input draft has been edited. Selecting an older alternative may overwrite your recent edits. Click &ldquo;Humanize Text&rdquo; to re-generate updated alternatives.
          </span>
        </div>
      )}

      {/* Target Application Error / Refusal Banner */}
      {errorMessage && (
        <div className="mt-2 flex items-center justify-between rounded border border-rose-500/30 bg-rose-500/10 px-2.5 py-1.5 text-[11px] text-rose-800 dark:text-rose-200">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-3.5 w-3.5 shrink-0 text-rose-600 dark:text-rose-400" />
            <span>{errorMessage}</span>
          </div>
          {onRegenerateAlternatives && (
            <button
              type="button"
              onClick={onRegenerateAlternatives}
              className="ml-2 shrink-0 rounded bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white hover:bg-rose-700 transition-colors"
            >
              Regenerate Alternatives
            </button>
          )}
        </div>
      )}

      {/* Expandable Comparison Cards */}
      {isExpanded && (
        <div className="mt-2.5 space-y-2 border-t border-[var(--border-subtle)] pt-2.5">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {candidates.map((cand, idx) => {
              const isSelected = idx === selectedIndex;
              const label = cand.label || `Version ${idx + 1}${idx === 0 ? ' (Primary)' : ''}`;
              const wordCount = cand.text.trim().split(/\s+/).filter(Boolean).length;

              return (
                <div
                  key={cand.id || idx}
                  className={`flex flex-col justify-between rounded-lg border p-2.5 text-xs transition-all ${
                    isSelected
                      ? 'border-[var(--accent)] bg-[var(--accent-light)]/20 shadow-xs'
                      : 'border-[var(--border-subtle)] bg-[var(--bg-subtle)] hover:border-[var(--border-strong)]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between pb-1.5 border-b border-[var(--border-subtle)]/60 mb-2">
                      <span className="font-bold text-[var(--text-primary)]">{label}</span>
                      <span className="text-[10px] text-[var(--text-muted)]">{wordCount} words</span>
                    </div>
                    <p className="whitespace-pre-wrap text-[11px] leading-relaxed text-[var(--text-secondary)] line-clamp-4">
                      {cand.text}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-[var(--border-subtle)]/40 flex items-center justify-between">
                    {isSelected ? (
                      <span className="flex items-center space-x-1 text-[11px] font-bold text-[var(--accent)]">
                        <Check className="h-3 w-3" />
                        <span>Currently Active</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onSelectCandidate(idx)}
                        className="flex items-center space-x-1 rounded bg-[var(--bg-surface)] px-2 py-0.5 text-[11px] font-medium text-[var(--text-primary)] hover:bg-[var(--accent)] hover:text-[var(--accent-contrast)] transition-colors border border-[var(--border-subtle)]"
                      >
                        <Sparkles className="h-3 w-3" />
                        <span>Apply this version</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
