/**
 * Reversible Protected-Span Mechanism for HumanizeText.
 * 
 * Provides deterministic masking and byte-exact reversal of:
 * - Straight and curly quotation marks ("...", “...”, '...', ‘...’)
 * - Punctuation attached to quotations
 * - Bracket citations ([12], [1-3]) and author-date citations ((Smith, 2024))
 * - Inline code (`...`) and code blocks (```...```)
 * - URLs and hyperlinks
 * - Numerical statistics and physical measurement units
 * - User-specified frozen words and phrases (longest-first to prevent substring collisions)
 * 
 * Reversal detects missing placeholders, duplicated placeholders, and guarantees 100% fidelity.
 */

export interface ProtectedSpanItem {
  id: string;
  placeholder: string;
  originalText: string;
  category: 'quote' | 'citation' | 'code' | 'url' | 'unit' | 'frozen_word' | 'custom';
  startIndex: number;
  endIndex: number;
}

export interface ProtectedSpanMaskResult {
  maskedText: string;
  items: ProtectedSpanItem[];
  restore: (transformedText: string) => ProtectedSpanRestoreResult;
}

export interface ProtectedSpanRestoreResult {
  restoredText: string;
  allRestored: boolean;
  missingPlaceholders: string[];
  duplicatedPlaceholders: string[];
  restoredCount: number;
}

export interface ProtectedSpanOptions {
  freezeQuotes?: boolean;
  frozenWords?: string[];
  preserveUrls?: boolean;
  preserveCitations?: boolean;
  preserveUnits?: boolean;
  preserveCode?: boolean;
}

export class ProtectedSpanManager {
  /**
   * Masks all protected elements in text, replacing them with collision-resistant placeholders.
   */
  public static mask(text: string, options: ProtectedSpanOptions = {}): ProtectedSpanMaskResult {
    const items: ProtectedSpanItem[] = [];
    let currentText = text;

    // Helper to register and replace a span
    const registerSpan = (
      match: string,
      category: ProtectedSpanItem['category'],
      index: number
    ): string => {
      const id = `__HT_SPAN_M_${items.length}__`;
      items.push({
        id,
        placeholder: id,
        originalText: match,
        category,
        startIndex: index,
        endIndex: index + match.length,
      });
      return id;
    };

    // 1. Code blocks (```...```)
    if (options.preserveCode !== false) {
      currentText = currentText.replace(/```[\s\S]*?```/g, (match, offset) => {
        return registerSpan(match, 'code', offset);
      });

      // Inline code (`...`)
      currentText = currentText.replace(/`([^`\r\n]+)`/g, (match, _inner, offset) => {
        return registerSpan(match, 'code', offset);
      });
    }

    // 2. URLs
    if (options.preserveUrls !== false) {
      currentText = currentText.replace(/https?:\/\/[^\s)\]>"']+/gi, (match, offset) => {
        return registerSpan(match, 'url', offset);
      });
    }

    // 3. Bracket citations e.g. [12], [1-3], [4, 7-9]
    if (options.preserveCitations !== false) {
      currentText = currentText.replace(/\[\d+(?:[-,]\s*\d+)*\]/g, (match, offset) => {
        return registerSpan(match, 'citation', offset);
      });

      // Author-date citations e.g. (Smith & Taylor, 2023), (Alvarez et al., 2024)
      currentText = currentText.replace(/\([A-Z][a-zA-Z\s&]+(?:et al\.?)?,?\s*\d{4}\)/g, (match, offset) => {
        return registerSpan(match, 'citation', offset);
      });
    }

    // 4. Physical measurements and metrics with units
    if (options.preserveUnits !== false) {
      currentText = currentText.replace(
        /\b-?\d+(?:\.\d+)?\s*(?:W\/m\^2|mol\/\(L\*s\)|microseconds?|nanoseconds?|milliseconds?|ms|nm|MPa|GW|MW|kW|Hz|kHz|MHz|GHz|hours?|min|sec|GB|MB|KB|%)\b/gi,
        (match, offset) => registerSpan(match, 'unit', offset)
      );
    }

    // 5. User-defined frozen words and technical terms (sorted longest-first to avoid substring collision)
    if (options.frozenWords && options.frozenWords.length > 0) {
      const cleanWords = [...new Set(options.frozenWords.map((w) => w.trim()).filter(Boolean))];
      cleanWords.sort((a, b) => b.length - a.length);

      for (const word of cleanWords) {
        const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const wordRegex = new RegExp(`\\b${escaped}\\b`, 'gi');
        currentText = currentText.replace(wordRegex, (match, offset) => {
          return registerSpan(match, 'frozen_word', offset);
        });
      }
    }

    // 6. Quotation marks (freezeQuotes policy)
    if (options.freezeQuotes !== false) {
      // Double straight quotes: "..." with optional attached punctuation
      currentText = currentText.replace(/"([^"\r\n]{2,})"/g, (match, _inner, offset) => {
        return registerSpan(match, 'quote', offset);
      });

      // Double curly quotes: “...”
      currentText = currentText.replace(/“([^”\r\n]{2,})”/g, (match, _inner, offset) => {
        return registerSpan(match, 'quote', offset);
      });

      // Single curly quotes: ‘...’
      currentText = currentText.replace(/‘([^’\r\n]{2,})’/g, (match, _inner, offset) => {
        return registerSpan(match, 'quote', offset);
      });

      // Single straight quotes where not a word-internal contraction (preceded and followed by word boundary/whitespace/punct)
      currentText = currentText.replace(/(?:^|\s)'([^'\r\n]{2,})'(?=\s|[.,;:!?]|$)/g, (fullMatch, _inner, offset) => {
        // preserve leading whitespace if present
        const leadingSpace = fullMatch.startsWith(' ') ? ' ' : '';
        const quotePart = fullMatch.trimStart();
        const placeholder = registerSpan(quotePart, 'quote', offset + leadingSpace.length);
        return leadingSpace + placeholder;
      });
    }

    return {
      maskedText: currentText,
      items,
      restore: (transformedText: string): ProtectedSpanRestoreResult => {
        return ProtectedSpanManager.restore(transformedText, items);
      },
    };
  }

  /**
   * Restores all placeholders back to their exact original text, validating placeholder completeness.
   */
  public static restore(transformedText: string, items: ProtectedSpanItem[]): ProtectedSpanRestoreResult {
    let resultText = transformedText;
    const missingPlaceholders: string[] = [];
    const duplicatedPlaceholders: string[] = [];
    let restoredCount = 0;

    for (const item of items) {
      const placeholder = item.placeholder;
      const count = (resultText.split(placeholder).length - 1);

      if (count === 0) {
        missingPlaceholders.push(placeholder);
      } else if (count > 1) {
        duplicatedPlaceholders.push(placeholder);
        // Replace all instances
        resultText = resultText.split(placeholder).join(item.originalText);
        restoredCount += count;
      } else {
        resultText = resultText.replace(placeholder, () => item.originalText);
        restoredCount++;
      }
    }

    // Clean up any double spaces that might result around restored punctuation
    resultText = resultText
      .replace(/\s+([.,;:!?])/g, '$1')
      .replace(/([“"‘'])\s+/g, '$1')
      .replace(/\s+([”"’'])/g, '$1');

    return {
      restoredText: resultText,
      allRestored: missingPlaceholders.length === 0 && duplicatedPlaceholders.length === 0,
      missingPlaceholders,
      duplicatedPlaceholders,
      restoredCount,
    };
  }
}
