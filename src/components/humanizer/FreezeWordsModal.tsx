import React, { useState } from 'react';
import { Snowflake, X, Plus, AlertCircle } from 'lucide-react';

interface FreezeWordsModalProps {
  isOpen: boolean;
  onClose: () => void;
  frozenWords: string[];
  onAddWord: (word: string) => void;
  onRemoveWord: (word: string) => void;
  onClearAll: () => void;
}

export const FreezeWordsModal: React.FC<FreezeWordsModalProps> = ({
  isOpen,
  onClose,
  frozenWords,
  onAddWord,
  onRemoveWord,
  onClearAll,
}) => {
  const [inputValue, setInputValue] = useState('');

  if (!isOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addCurrent();
    }
  };

  const addCurrent = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !frozenWords.some((w) => w.toLowerCase() === trimmed.toLowerCase())) {
      onAddWord(trimmed);
      setInputValue('');
    }
  };

  const suggestedTerms = [
    'TensorFlow',
    'PyTorch',
    'OpenAI',
    'Anthropic',
    'Dr. Richardson',
    'Stanford University',
    'Section 501(c)(3)',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-surface)] p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="rounded-lg bg-purple-500/10 p-2 text-purple-600 dark:text-purple-400">
              <Snowflake className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">Freeze Words</h3>
              <p className="text-xs text-[var(--text-muted)]">
                Protect brand names, acronyms, and technical terms from being altered
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Input Bar */}
        <div className="mt-4">
          <label className="block text-xs font-semibold text-[var(--text-secondary)]">
            Add words or phrases to freeze
          </label>
          <div className="mt-1.5 flex items-center space-x-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. OpenAI, Dr. Smith, React 19... (press Enter)"
              className="flex-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-3.5 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-purple-500 focus:outline-hidden"
            />
            <button
              onClick={addCurrent}
              disabled={!inputValue.trim()}
              className="inline-flex items-center space-x-1 rounded-xl bg-purple-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-purple-700 disabled:opacity-40"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add</span>
            </button>
          </div>
          <p className="mt-1 text-[11px] text-[var(--text-muted)]">
            Separate multiple terms with commas or press Enter.
          </p>
        </div>

        {/* Active Frozen Chips */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-secondary)]">
            <span>Currently Frozen ({frozenWords.length})</span>
            {frozenWords.length > 0 && (
              <button
                onClick={onClearAll}
                className="text-[11px] text-[var(--text-muted)] hover:text-[var(--error-text)]"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="mt-2 min-h-[90px] max-h-48 overflow-y-auto rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)]/50 p-2.5">
            {frozenWords.length === 0 ? (
              <div className="flex h-20 flex-col items-center justify-center text-center text-xs text-[var(--text-muted)]">
                <Snowflake className="mb-1 h-5 w-5 opacity-40 text-purple-400" />
                <span>No frozen words yet. Add terms above to lock them verbatim.</span>
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {frozenWords.map((word) => (
                  <span
                    key={word}
                    className="inline-flex items-center space-x-1.5 rounded-lg border border-purple-500/30 bg-purple-500/15 px-2.5 py-1 text-xs font-medium text-purple-700 dark:text-purple-300 shadow-2xs"
                  >
                    <span>{word}</span>
                    <button
                      onClick={() => onRemoveWord(word)}
                      className="rounded-full p-0.5 hover:bg-purple-500/30 text-purple-600 dark:text-purple-300"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Suggestions */}
        <div className="mt-4">
          <span className="text-[11px] font-semibold text-[var(--text-muted)]">Quick Suggestions:</span>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {suggestedTerms.map((term) => {
              const isAdded = frozenWords.some((w) => w.toLowerCase() === term.toLowerCase());
              return (
                <button
                  key={term}
                  disabled={isAdded}
                  onClick={() => onAddWord(term)}
                  className={`rounded-md border px-2 py-0.5 text-[11px] transition-all ${
                    isAdded
                      ? 'border-transparent bg-purple-500/10 text-purple-400 opacity-50 cursor-default'
                      : 'border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:border-purple-400 hover:text-purple-600 dark:hover:text-purple-300'
                  }`}
                >
                  + {term}
                </button>
              );
            })}
          </div>
        </div>

        {/* Explainer Footer */}
        <div className="mt-5 flex items-start space-x-2 rounded-xl border border-purple-500/20 bg-purple-500/10 p-3 text-[11px] text-purple-900 dark:text-purple-200">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-purple-600 dark:text-purple-400" />
          <span>
            Frozen words are never altered, synonymized, or rephrased by the Humanizer engine.
            They are preserved 100% verbatim in all rewrite passes.
          </span>
        </div>

        {/* Done Button */}
        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl bg-[var(--accent)] px-5 py-2 text-xs font-bold text-[var(--accent-contrast)] hover:opacity-95 shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
