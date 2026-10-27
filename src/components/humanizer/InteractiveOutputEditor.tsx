import React, { useState, useRef, useEffect } from 'react';
import {
  RotateCcw,
  Sparkles,
  Snowflake,
  Edit3,
  ChevronRight,
} from 'lucide-react';
import type { DiffToken } from '../../types';

interface InteractiveOutputEditorProps {
  improvedText: string;
  diffTokens?: DiffToken[];
  onChangeText: (newText: string) => void;
  onFreezeWord: (word: string) => void;
  onTokenSwap?: (oldWord: string, newWord: string) => void;
  isProcessing: boolean;
}

export const InteractiveOutputEditor: React.FC<InteractiveOutputEditorProps> = ({
  improvedText,
  diffTokens,
  onChangeText,
  onFreezeWord,
  onTokenSwap,
  isProcessing,
}) => {
  const [isPlainEditMode, setIsPlainEditMode] = useState(false);
  const [activeToken, setActiveToken] = useState<DiffToken | null>(null);
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        !(e.target as HTMLElement).closest('.interactive-token-btn')
      ) {
        setActiveToken(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTokenClick = (e: React.MouseEvent<HTMLSpanElement>, token: DiffToken) => {
    if (token.type === 'unchanged' && !token.original) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();

    if (containerRect) {
      setPopoverPos({
        top: rect.bottom - containerRect.top + 8,
        left: Math.max(10, Math.min(rect.left - containerRect.left, containerRect.width - 260)),
      });
    }
    setActiveToken(token);
  };

  const handleSelectAlternative = (newWord: string) => {
    if (!activeToken) return;
    const oldWord = activeToken.text;

    // Replace the specific instance in the improved text
    const updated = improvedText.replace(oldWord, newWord);
    onChangeText(updated);
    if (onTokenSwap) {
      onTokenSwap(oldWord, newWord);
    }
    setActiveToken(null);
  };

  const handleRevert = () => {
    if (!activeToken || !activeToken.original) return;
    const oldWord = activeToken.text;
    const updated = improvedText.replace(oldWord, activeToken.original);
    onChangeText(updated);
    if (onTokenSwap) {
      onTokenSwap(oldWord, activeToken.original);
    }
    setActiveToken(null);
  };

  const handleFreezeCurrent = () => {
    if (!activeToken) return;
    const wordToFreeze = activeToken.original || activeToken.text;
    onFreezeWord(wordToFreeze.trim());
    setActiveToken(null);
  };

  if (!improvedText) return null;

  return (
    <div className="relative flex flex-col h-full" ref={containerRef}>
      {/* Top mini-bar: View mode switcher & Legend summary */}
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-2 text-[11px]">
        {/* Legend */}
        <div className="flex items-center space-x-3 text-[11px] text-[var(--text-muted)]">
          <span className="flex items-center space-x-1">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <span>Synonym Swapped</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="h-2 w-2 rounded-full bg-sky-500" />
            <span>Structural Cadence</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="h-2 w-2 rounded-full bg-purple-500" />
            <span>Frozen</span>
          </span>
        </div>

        {/* View mode toggle */}
        <div className="inline-flex rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-0.5 shadow-2xs">
          <button
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
            {(() => {
              const hasWhitespaceTokens = diffTokens.some((t) => /^\s+$/.test(t.text));
              return diffTokens.map((token, index) => {
                let tokenElement = null;

                if (token.type === 'frozen') {
                  tokenElement = (
                    <span
                      key={token.id}
                      title="Frozen Term (Verbatim)"
                      className="inline-block rounded-xs bg-purple-500/15 px-1 py-0.5 font-medium text-purple-700 dark:text-purple-300 border border-purple-500/30"
                    >
                      {token.text}
                    </span>
                  );
                } else if (token.type === 'changed') {
                  const isActive = activeToken?.id === token.id;
                  tokenElement = (
                    <span
                      key={token.id}
                      onClick={(e) => handleTokenClick(e, token)}
                      title={token.reason || 'Click to view synonym alternatives'}
                      className={`interactive-token-btn inline-block cursor-pointer rounded-xs px-1 py-0.5 font-medium text-amber-900 dark:text-amber-200 transition-all ${
                        isActive
                          ? 'bg-amber-500/30 ring-2 ring-amber-500'
                          : 'bg-amber-500/15 underline decoration-amber-400 decoration-1 underline-offset-3 hover:bg-amber-500/25'
                      }`}
                    >
                      {token.text}
                    </span>
                  );
                } else if (token.type === 'structural') {
                  const isActive = activeToken?.id === token.id;
                  tokenElement = (
                    <span
                      key={token.id}
                      onClick={(e) => handleTokenClick(e, token)}
                      title={token.reason || 'Cadence / Structural transform'}
                      className={`interactive-token-btn inline-block cursor-pointer rounded-xs px-1 py-0.5 text-sky-900 dark:text-sky-200 transition-all ${
                        isActive
                          ? 'bg-sky-500/30 ring-2 ring-sky-500'
                          : 'bg-sky-500/10 underline decoration-sky-400 decoration-1 underline-offset-3 hover:bg-sky-500/20'
                      }`}
                    >
                      {token.text}
                    </span>
                  );
                } else {
                  tokenElement = <span key={token.id}>{token.text}</span>;
                }

                if (!hasWhitespaceTokens && index < diffTokens.length - 1) {
                  return (
                    <React.Fragment key={token.id}>
                      {tokenElement}
                      {' '}
                    </React.Fragment>
                  );
                }
                return tokenElement;
              });
            })()}
          </div>
        ) : (
          <div className="whitespace-pre-wrap leading-relaxed">{improvedText}</div>
        )}

        {/* Floating QuillBot-style Synonyms Popover */}
        {activeToken && popoverPos && (
          <div
            ref={popoverRef}
            style={{ top: `${popoverPos.top}px`, left: `${popoverPos.left}px` }}
            className="absolute z-40 w-64 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] p-3 shadow-xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Popover Header */}
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2 text-[11px]">
              <span className="font-bold text-[var(--text-primary)]">
                {activeToken.type === 'changed' ? 'Synonym Alternatives' : 'Cadence Transform'}
              </span>
              <span
                className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                  activeToken.type === 'changed'
                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                    : 'bg-sky-500/15 text-sky-700 dark:text-sky-300'
                }`}
              >
                {activeToken.category || 'Rephrase'}
              </span>
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
                  activeToken.alternatives.map((alt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectAlternative(alt)}
                      className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--accent-light)] hover:text-[var(--accent)]"
                    >
                      <span>{alt}</span>
                      <ChevronRight className="h-3 w-3 opacity-40" />
                    </button>
                  ))
                ) : (
                  <div className="py-2 text-center text-[11px] text-[var(--text-muted)]">
                    No additional alternatives for this specific word.
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-3 flex items-center justify-between border-t border-[var(--border-subtle)] pt-2 text-[11px]">
              {activeToken.original && (
                <button
                  onClick={handleRevert}
                  className="flex items-center space-x-1 font-medium text-[var(--text-muted)] hover:text-[var(--accent)]"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Revert</span>
                </button>
              )}
              <button
                onClick={handleFreezeCurrent}
                className="flex items-center space-x-1 font-medium text-purple-600 dark:text-purple-400 hover:underline ml-auto"
              >
                <Snowflake className="h-3 w-3" />
                <span>Freeze word</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
