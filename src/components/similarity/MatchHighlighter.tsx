import React from 'react';
import type { ReconstructedPassage } from '../../types';

interface MatchHighlighterProps {
  text: string;
  passages: ReconstructedPassage[];
  selectedPassageId: string | null;
  onSelectPassage: (passage: ReconstructedPassage) => void;
}

export const MatchHighlighter: React.FC<MatchHighlighterProps> = ({
  text,
  passages,
  selectedPassageId,
  onSelectPassage,
}) => {
  if (passages.length === 0) {
    return (
      <div className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-[var(--text-primary)]">
        {text}
      </div>
    );
  }

  // Sort passages by submittedStartChar
  const sorted = [...passages].sort((a, b) => a.submittedStartChar - b.submittedStartChar);

  const elements: React.ReactNode[] = [];
  let lastIndex = 0;

  sorted.forEach((passage, idx) => {
    // Non-matching text leading up to this passage
    if (passage.submittedStartChar > lastIndex) {
      elements.push(
        <span key={`unmatched-${idx}-${lastIndex}`}>
          {text.substring(lastIndex, passage.submittedStartChar)}
        </span>
      );
    }

    // Matching passage span
    const isSelected = selectedPassageId === passage.id;
    elements.push(
      <mark
        key={`matched-${passage.id}`}
        onClick={() => onSelectPassage(passage)}
        title={`Matched in ${passage.referenceDocName} (Chars ${passage.submittedStartChar}..${passage.submittedEndChar})`}
        className={`cursor-pointer rounded-xs px-0.5 transition-all ${
          isSelected
            ? 'bg-amber-300 text-stone-950 font-medium ring-2 ring-amber-500'
            : 'bg-amber-100 text-stone-900 hover:bg-amber-200 dark:bg-amber-950/70 dark:text-amber-100 dark:hover:bg-amber-900'
        }`}
      >
        {text.substring(passage.submittedStartChar, passage.submittedEndChar)}
      </mark>
    );

    lastIndex = Math.max(lastIndex, passage.submittedEndChar);
  });

  // Remaining non-matching text
  if (lastIndex < text.length) {
    elements.push(<span key={`tail-${lastIndex}`}>{text.substring(lastIndex)}</span>);
  }

  return (
    <div className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-[var(--text-primary)] select-text">
      {elements}
    </div>
  );
};
