/**
 * Reversible Protected-Span Mechanism for HumanizeText (Cloud Worker Pipeline).
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
  public static mask(text: string, options: ProtectedSpanOptions = {}): ProtectedSpanMaskResult {
    const items: ProtectedSpanItem[] = [];
    let currentText = text;

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

    // 1. Code blocks and inline code
    if (options.preserveCode !== false) {
      currentText = currentText.replace(/```[\s\S]*?```/g, (match, offset) => {
        return registerSpan(match, 'code', offset);
      });

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

    // 3. Bracket and author-date citations
    if (options.preserveCitations !== false) {
      currentText = currentText.replace(/\[\d+(?:[-,]\s*\d+)*\]/g, (match, offset) => {
        return registerSpan(match, 'citation', offset);
      });

      currentText = currentText.replace(/\([A-Z][a-zA-Z\s&]+(?:et al\.?)?,?\s*\d{4}\)/g, (match, offset) => {
        return registerSpan(match, 'citation', offset);
      });
    }

    // 4. Physical units
    if (options.preserveUnits !== false) {
      currentText = currentText.replace(
        /\b-?\d+(?:\.\d+)?\s*(?:W\/m\^2|mol\/\(L\*s\)|microseconds?|nanoseconds?|milliseconds?|ms|nm|MPa|GW|MW|kW|Hz|kHz|MHz|GHz|hours?|min|sec|GB|MB|KB|%)\b/gi,
        (match, offset) => registerSpan(match, 'unit', offset)
      );
    }

    // 5. Frozen words (longest-first)
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

    // 6. Quotation marks
    if (options.freezeQuotes !== false) {
      currentText = currentText.replace(/"([^"\r\n]{2,})"/g, (match, _inner, offset) => {
        return registerSpan(match, 'quote', offset);
      });

      currentText = currentText.replace(/“([^”\r\n]{2,})”/g, (match, _inner, offset) => {
        return registerSpan(match, 'quote', offset);
      });

      currentText = currentText.replace(/‘([^’\r\n]{2,})’/g, (match, _inner, offset) => {
        return registerSpan(match, 'quote', offset);
      });

      currentText = currentText.replace(/(?:^|\s)'([^'\r\n]{2,})'(?=\s|[.,;:!?]|$)/g, (fullMatch, _inner, offset) => {
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
        resultText = resultText.split(placeholder).join(item.originalText);
        restoredCount += count;
      } else {
        resultText = resultText.replace(placeholder, () => item.originalText);
        restoredCount++;
      }
    }

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
