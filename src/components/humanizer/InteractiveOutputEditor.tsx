import React, { useState, useRef, useEffect } from 'react';
import {
  RotateCcw,
  RotateCw,
  Sparkles,
  Snowflake,
  Edit3,
  ChevronRight,
  Check,
  X,
  AlertCircle,
  Eye,
} from 'lucide-react';
import type { DiffToken } from '../../types';

export interface InteractiveOutputEditorProps {
  improvedText: string;
  diffTokens?: DiffToken[];
  onChangeText: (newText: string) => void;
  onFreezeWord: (word: string) => void;
  onTokenSwap?: (oldWord: string, newWord: string) => void;
  onApplyPhraseAlternative?: (token: DiffToken, replacementText: string) => boolean | Promise<boolean>;
  onRevertToken?: (token: DiffToken) => boolean | Promise<boolean>;
  canUndo?: boolean;
  onUndo?: () => void;
  canRedo?: boolean;
  onRedo?: () => void;
  isProcessing: boolean;
}

export const InteractiveOutputEditor: React.FC<InteractiveOutputEditorProps> = ({
  improvedText,
  diffTokens,
  onChangeText,
  onFreezeWord,
  onTokenSwap,
  onApplyPhraseAlternative,
  onRevertToken,
  canUndo = false,
  onUndo,
  canRedo = false,
  onRedo,
  isProcessing,
}) => {
  const [isPlainEditMode, setIsPlainEditMode] = useState(false);
  const [activeToken, setActiveToken] = useState<DiffToken | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number } | null>(null);
  const [popoverError, setPopoverError] = useState<string | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number>(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const handleCancel = () => {
    setActiveToken(null);
    setSelectedCandidate(null);
    setPopoverError(null);
  };

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        !(e.target as HTMLElement).closest('.interactive-token-btn')
      ) {
        handleCancel();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation within the popover
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!activeToken) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      } else if (e.key === 'ArrowDown') {
        if (activeToken.alternatives && activeToken.alternatives.length > 0) {
          e.preventDefault();
          setFocusedIndex((prev) => {
            const next = (prev + 1) % activeToken.alternatives!.length;
            setSelectedCandidate(activeToken.alternatives![next]);
            return next;
          });
        }
      } else if (e.key === 'ArrowUp') {
        if (activeToken.alternatives && activeToken.alternatives.length > 0) {
          e.preventDefault();
          setFocusedIndex((prev) => {
            const next = (prev - 1 + activeToken.alternatives!.length) % activeToken.alternatives!.length;
            setSelectedCandidate(activeToken.alternatives![next]);
            return next;
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeToken]);

  const handleTokenClick = (
    e: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>,
    token: DiffToken
  ) => {
    const hasAlternatives = Boolean(token.alternatives && token.alternatives.length > 0);
    const hasRevert = Boolean(token.original && token.original !== token.text);
    if (!hasAlternatives && !hasRevert) return;

    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();

    if (containerRect) {
      const popoverWidth = 280;
      let left = rect.left - containerRect.left;
      if (left + popoverWidth > containerRect.width - 16) {
        left = Math.max(16, containerRect.width - popoverWidth - 16);
      }
      setPopoverPos({
        top: rect.bottom - containerRect.top + 8,
        left: Math.max(12, left),
      });
    }

    setActiveToken(token);
    setSelectedCandidate(token.alternatives?.[0] || null);
    setPopoverError(null);
    setFocusedIndex(0);
  };

  const handleApplyAlternative = async (replacement: string) => {
    if (!activeToken) return;

    if (onApplyPhraseAlternative) {
      try {
        const ok = await onApplyPhraseAlternative(activeToken, replacement);
        if (ok) {
          handleCancel();
          return;
        } else {
          setPopoverError('Substitution could not be applied. Check target boundaries.');
          return;
        }
      } catch (err: any) {
        setPopoverError(err?.message || 'Failed to apply replacement.');
        return;
      }
    }

    // Fallback: simple token replacement if parent callback not passed
    const oldWord = activeToken.text;
    const updated = improvedText.replace(oldWord, replacement);
    onChangeText(updated);
    if (onTokenSwap) {
      onTokenSwap(oldWord, replacement);
    }
    handleCancel();
  };

  const handleRevert = async () => {
    if (!activeToken || !activeToken.original) return;

    if (onRevertToken) {
      try {
        const ok = await onRevertToken(activeToken);
        if (ok) {
          handleCancel();
          return;
        }
      } catch (err: any) {
        setPopoverError(err?.message || 'Failed to revert phrase.');
        return;
      }
    }

    // Fallback
    const oldWord = activeToken.text;
    const updated = improvedText.replace(oldWord, activeToken.original);
    onChangeText(updated);
    if (onTokenSwap) {
      onTokenSwap(oldWord, activeToken.original);
    }
    handleCancel();
  };

  const handleFreezeCurrent = () => {
    if (!activeToken) return;
    const wordToFreeze = activeToken.original || activeToken.text;
    onFreezeWord(wordToFreeze.trim());
    handleCancel();
  };

  // Computes a preview snippet of the sentence around the target token
  const getContextSnippet = (token: DiffToken, candidateText: string) => {
    const start = token.startIndex ?? improvedText.indexOf(token.text);
    const end = token.endIndex ?? (start >= 0 ? start + token.text.length : 0);

    if (start < 0 || end < start) {
      return { prefix: '', candidate: candidateText, suffix: '' };
    }

    const contextRadius = 35;
    const preStart = Math.max(0, start - contextRadius);
    const postEnd = Math.min(improvedText.length, end + contextRadius);

    let prefix = improvedText.slice(preStart, start);
    let suffix = improvedText.slice(end, postEnd);

    if (preStart > 0) prefix = '… ' + prefix;
    if (postEnd < improvedText.length) suffix = suffix + ' …';

    return { prefix, candidate: candidateText, suffix };
  };

  if (!improvedText) return null;

  return (
    <div className="relative flex flex-col h-full" ref={containerRef}>
      {/* Top mini-bar: View mode switcher & Legend summary */}
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-2 text-[11px]">
        {/* Legend */}
        <div className="flex items-center space-x-3 text-[11px] text-[var(--text-muted)]">
          <span className="flex items-center space-x-1" title="Clickable synonym with alternatives">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <span>Synonym Swapped</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="h-2 w-2 rounded-full bg-sky-500" />
            <span>Cadence</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="h-2 w-2 rounded-full bg-purple-500" />
            <span>Frozen</span>
          </span>
        </div>

        {/* Action Controls & View mode toggle */}
        <div className="flex items-center space-x-2">
          {canUndo && onUndo && (
            <button
              type="button"
              onClick={onUndo}
              className="flex items-center space-x-1 rounded px-2 py-0.5 text-[11px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)] transition-colors"
              title="Undo last edit (Ctrl+Z)"
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
              title="Redo edit"
            >
              <RotateCw className="h-3 w-3" />
              <span>Redo</span>
            </button>
          )}

          <div className="inline-flex rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => setIsPlainEditMode(false)}
              className={`flex items-center space-x-1 rounded px-2 py-0.5 text-[11px] font-medium transition-all ${
                !isPlainEditMode
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-2xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Sparkles className="h-3 w-3 text-amber-500" />
              <span>Interactive Synonyms</span>
            </button>
            <button
              type="button"
              onClick={() => setIsPlainEditMode(true)}
              className={`flex items-center space-x-1 rounded px-2 py-0.5 text-[11px] font-medium transition-all ${
                isPlainEditMode
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-2xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Edit3 className="h-3 w-3" />
              <span>Direct Text</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative flex-1 min-h-[300px] overflow-y-auto rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 text-sm leading-relaxed text-[var(--text-primary)]">
        {isPlainEditMode ? (
          <textarea
            value={improvedText}
            onChange={(e) => onChangeText(e.target.value)}
            disabled={isProcessing}
            className="h-full w-full resize-none border-none bg-transparent p-0 font-sans text-sm leading-relaxed text-[var(--text-primary)] focus:outline-hidden"
            placeholder="Humanized text..."
          />
        ) : diffTokens && diffTokens.length > 0 ? (
          <div className="whitespace-pre-wrap select-text leading-relaxed">
            {diffTokens.map((token) => {
              const hasAlts = Boolean(token.alternatives && token.alternatives.length > 0);
              const hasRevert = Boolean(token.original && token.original !== token.text);
              const isInteractive = hasAlts || hasRevert;
              const isActive = activeToken?.id === token.id;

              if (token.type === 'frozen') {
                return (
                  <span
                    key={token.id}
                    title="Frozen Term (Verbatim)"
                    className="inline-block rounded-xs bg-purple-500/15 px-1 py-0.5 font-medium text-purple-700 dark:text-purple-300 border border-purple-500/30"
                  >
                    {token.text}
                  </span>
                );
              }

              if (isInteractive) {
                return (
                  <button
                    type="button"
                    key={token.id}
                    onClick={(e) => handleTokenClick(e, token)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleTokenClick(e, token);
                      }
                    }}
                    role="button"
                    aria-haspopup="dialog"
                    aria-expanded={isActive}
                    aria-label={`Phrase suggestion for "${token.text}". ${token.alternatives?.length || 0} alternatives available.`}
                    title={
                      token.reason
                        ? `${token.reason} (Click for alternatives)`
                        : 'Click to choose alternative phrasing'
                    }
                    className={`interactive-token-btn inline-block cursor-pointer rounded-xs px-1 py-0.5 font-medium text-left transition-all focus:outline-hidden focus:ring-2 focus:ring-[var(--accent)] ${
                      token.type === 'changed'
                        ? isActive
                          ? 'bg-amber-500/35 ring-2 ring-amber-500 text-amber-950 dark:text-amber-100 shadow-xs'
                          : 'bg-amber-500/15 text-amber-900 dark:text-amber-200 underline decoration-amber-500/70 decoration-dotted decoration-1.5 underline-offset-3 hover:bg-amber-500/25 hover:decoration-solid'
                        : isActive
                        ? 'bg-sky-500/35 ring-2 ring-sky-500 text-sky-950 dark:text-sky-100 shadow-xs'
                        : 'bg-sky-500/10 text-sky-900 dark:text-sky-200 underline decoration-sky-500/70 decoration-dotted decoration-1.5 underline-offset-3 hover:bg-sky-500/20 hover:decoration-solid'
                    }`}
                  >
                    {token.text}
                  </button>
                );
              }

              if (token.type === 'structural') {
                return (
                  <span
                    key={token.id}
                    title={token.reason || 'Cadence transform'}
                    className="inline-block rounded-xs bg-sky-500/10 px-0.5 py-0.2 text-sky-900 dark:text-sky-200"
                  >
                    {token.text}
                  </span>
                );
              }

              return <span key={token.id}>{token.text}</span>;
            })}
          </div>
        ) : (
          <div className="whitespace-pre-wrap leading-relaxed">{improvedText}</div>
        )}

        {/* Floating QuillBot-style Synonyms Popover */}
        {activeToken && popoverPos && (
          <div
            ref={popoverRef}
            role="dialog"
            aria-modal="true"
            aria-label="Inline phrase alternatives"
            style={{ top: `${popoverPos.top}px`, left: `${popoverPos.left}px` }}
            className="absolute z-40 w-72 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] p-3 shadow-xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Popover Header */}
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2 text-[11px]">
              <div className="flex items-center space-x-1.5 font-bold text-[var(--text-primary)]">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                <span>
                  {activeToken.scope === 'phrase' ? 'Phrase Alternative' : 'Synonym Swap'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCancel}
                aria-label="Close popover"
                className="rounded p-0.5 text-[var(--text-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)] transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Original phrase info */}
            {activeToken.original && (
              <div className="mt-2 text-[11px] text-[var(--text-muted)]">
                <span>Original: </span>
                <span className="font-semibold text-[var(--text-primary)] line-through">
                  &ldquo;{activeToken.original}&rdquo;
                </span>
              </div>
            )}

            {/* Alternative Synonyms List */}
            <div className="mt-2.5 space-y-1">
              <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                Select Alternative:
              </span>
              <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                {activeToken.alternatives && activeToken.alternatives.length > 0 ? (
                  activeToken.alternatives.map((alt, idx) => {
                    const isSelected = selectedCandidate === alt;
                    const isFocused = focusedIndex === idx;

                    return (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => setSelectedCandidate(alt)}
                        onDoubleClick={() => handleApplyAlternative(alt)}
                        className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs font-medium transition-all ${
                          isSelected || isFocused
                            ? 'bg-[var(--accent-light)] text-[var(--accent)] font-bold ring-1 ring-[var(--accent)]'
                            : 'text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]'
                        }`}
                      >
                        <div className="flex items-center space-x-1.5 truncate">
                          {isSelected && <Check className="h-3 w-3 shrink-0 text-[var(--accent)]" />}
                          <span className="truncate">{alt}</span>
                        </div>
                        <ChevronRight className="h-3 w-3 opacity-30 shrink-0" />
                      </button>
                    );
                  })
                ) : (
                  <div className="py-2 text-center text-[11px] text-[var(--text-muted)]">
                    No additional alternatives for this specific phrase.
                  </div>
                )}
              </div>
            </div>

            {/* Live Context Preview */}
            {selectedCandidate && (
              <div className="mt-2.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-2 text-[11px]">
                <div className="flex items-center space-x-1 text-[10px] font-semibold text-[var(--text-muted)] mb-1 uppercase tracking-wider">
                  <Eye className="h-3 w-3 text-[var(--accent)]" />
                  <span>Context Preview</span>
                </div>
                {(() => {
                  const snippet = getContextSnippet(activeToken, selectedCandidate);
                  return (
                    <p className="text-[11px] leading-relaxed text-[var(--text-secondary)]">
                      <span>{snippet.prefix}</span>
                      <span className="font-bold underline text-[var(--accent)] px-0.5">
                        {snippet.candidate}
                      </span>
                      <span>{snippet.suffix}</span>
                    </p>
                  );
                })()}
              </div>
            )}

            {/* Error banner if replacement fails */}
            {popoverError && (
              <div className="mt-2 flex items-center space-x-1.5 rounded border border-rose-500/30 bg-rose-500/10 p-1.5 text-[10px] text-rose-800 dark:text-rose-200">
                <AlertCircle className="h-3 w-3 shrink-0 text-rose-600 dark:text-rose-400" />
                <span>{popoverError}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-1.5 border-t border-[var(--border-subtle)] pt-2 text-[11px]">
              {selectedCandidate ? (
                <button
                  type="button"
                  onClick={() => handleApplyAlternative(selectedCandidate)}
                  className="flex items-center space-x-1 rounded bg-[var(--accent)] px-2.5 py-1 text-xs font-bold text-[var(--accent-contrast)] hover:opacity-90 transition-opacity"
                >
                  <Check className="h-3 w-3" />
                  <span>Apply</span>
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center space-x-2">
                {activeToken.original && activeToken.original !== activeToken.text && (
                  <button
                    type="button"
                    onClick={handleRevert}
                    className="flex items-center space-x-1 font-medium text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
                    title="Revert to original phrasing"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Revert</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleFreezeCurrent}
                  className="flex items-center space-x-1 font-medium text-purple-600 dark:text-purple-400 hover:underline"
                  title="Freeze term verbatim across future passes"
                >
                  <Snowflake className="h-3 w-3" />
                  <span>Freeze</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
