import type {
  HumanizerChange,
  HumanizerMode,
  HumanizerOptions,
  HumanizerResult,
  LocalHumanizerEngine,
} from '../../types';

interface ReplacementPattern {
  pattern: RegExp;
  replacement: string | ((match: string, ...args: any[]) => string);
  reason: string;
  category: HumanizerChange['category'];
  modes: HumanizerMode[];
}

/**
 * Curated linguistic transformation rules that preserve factual claims
 * while eliminating bureaucratic bloat, passive stutter, and robotic sentence rhythm.
 */
const TRANSFORMATION_RULES: ReplacementPattern[] = [
  // 1. Redundant fillers & wordy phrases (Concise / Natural)
  {
    pattern: /\bin order to\b/gi,
    replacement: 'to',
    reason: 'Simplified wordy infinitive phrase',
    category: 'filler',
    modes: ['concise', 'natural', 'conversational', 'flow'],
  },
  {
    pattern: /\bdue to the fact that\b/gi,
    replacement: 'because',
    reason: 'Replaced bureaucratic clause with direct conjunction',
    category: 'filler',
    modes: ['concise', 'natural', 'conversational', 'flow', 'formal'],
  },
  {
    pattern: /\bat this point in time\b/gi,
    replacement: 'now',
    reason: 'Replaced inflated temporal phrase with concise alternative',
    category: 'concise' as any,
    modes: ['concise', 'natural', 'conversational'],
  },
  {
    pattern: /\bfor the purpose of\b/gi,
    replacement: 'for',
    reason: 'Eliminated redundant prepositional phrase',
    category: 'filler',
    modes: ['concise', 'natural', 'conversational', 'flow'],
  },
  {
    pattern: /\bin the event that\b/gi,
    replacement: 'if',
    reason: 'Streamlined conditional phrasing',
    category: 'filler',
    modes: ['concise', 'natural', 'conversational', 'formal', 'flow'],
  },
  {
    pattern: /\bhas the ability to\b/gi,
    replacement: 'can',
    reason: 'Replaced circumlocution with direct modal verb',
    category: 'phrasing',
    modes: ['concise', 'natural', 'conversational', 'flow'],
  },
  {
    pattern: /\butilize\b/gi,
    replacement: 'use',
    reason: 'Substituted artificial jargon with natural verb',
    category: 'phrasing',
    modes: ['natural', 'concise', 'conversational', 'flow'],
  },
  {
    pattern: /\butilizes\b/gi,
    replacement: 'uses',
    reason: 'Substituted artificial jargon with natural verb',
    category: 'phrasing',
    modes: ['natural', 'concise', 'conversational', 'flow'],
  },
  {
    pattern: /\butilized\b/gi,
    replacement: 'used',
    reason: 'Substituted artificial jargon with natural verb',
    category: 'phrasing',
    modes: ['natural', 'concise', 'conversational', 'flow'],
  },
  {
    pattern: /\butilizing\b/gi,
    replacement: 'using',
    reason: 'Substituted artificial jargon with natural verb',
    category: 'phrasing',
    modes: ['natural', 'concise', 'conversational', 'flow'],
  },
  {
    pattern: /\ba large number of\b/gi,
    replacement: 'many',
    reason: 'Condensed wordy quantifier',
    category: 'redundancy',
    modes: ['concise', 'natural', 'conversational', 'flow'],
  },
  {
    pattern: /\ba significant portion of\b/gi,
    replacement: 'much of',
    reason: 'Condensed inflated phrase',
    category: 'redundancy',
    modes: ['concise', 'natural', 'conversational', 'flow'],
  },
  {
    pattern: /\bwith regard to\b/gi,
    replacement: 'regarding',
    reason: 'Replaced clunky prepositional phrase',
    category: 'flow',
    modes: ['natural', 'concise', 'flow'],
  },
  {
    pattern: /\bin terms of\b/gi,
    replacement: 'concerning',
    reason: 'Eliminated vague transitional phrase',
    category: 'flow',
    modes: ['formal', 'flow'],
  },
  {
    pattern: /\bit is important to note that\b/gi,
    replacement: 'notably,',
    reason: 'Removed throat-clearing intro phrase',
    category: 'filler',
    modes: ['concise', 'natural', 'conversational', 'flow'],
  },
  {
    pattern: /\bit should be noted that\b/gi,
    replacement: 'notably,',
    reason: 'Removed passive throat-clearing intro phrase',
    category: 'filler',
    modes: ['concise', 'natural', 'conversational', 'flow'],
  },
  {
    pattern: /\bas a matter of fact\b/gi,
    replacement: 'in fact',
    reason: 'Trimmed colloquial filler',
    category: 'filler',
    modes: ['concise', 'natural', 'formal'],
  },
  {
    pattern: /\bat the present moment\b/gi,
    replacement: 'currently',
    reason: 'Concise temporal marker',
    category: 'concise' as any,
    modes: ['concise', 'natural', 'formal'],
  },
  {
    pattern: /\bfirst and foremost\b/gi,
    replacement: 'primarily',
    reason: 'Avoided cliché idiom',
    category: 'phrasing',
    modes: ['natural', 'formal', 'flow'],
  },
  {
    pattern: /\bneedless to say\b,?\s*/gi,
    replacement: '',
    reason: 'Removed redundant deadweight expression',
    category: 'filler',
    modes: ['concise', 'natural', 'conversational'],
  },
  {
    pattern: /\bdelve into\b/gi,
    replacement: 'examine',
    reason: 'Replaced AI-overused cliché "delve" with natural vocabulary',
    category: 'phrasing',
    modes: ['natural', 'formal', 'concise', 'flow'],
  },
  {
    pattern: /\btapestry of\b/gi,
    replacement: 'blend of',
    reason: 'Replaced melodramatic AI cliché "tapestry"',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'formal', 'concise'],
  },
  {
    pattern: /\btestament to\b/gi,
    replacement: 'evidence of',
    reason: 'Replaced formulaic expression',
    category: 'phrasing',
    modes: ['natural', 'formal', 'concise'],
  },

  // 2. Conversational enhancements (Natural contractions & flow)
  {
    pattern: /\bdo not\b/gi,
    replacement: "don't",
    reason: 'Applied natural conversational contraction',
    category: 'formality',
    modes: ['conversational'],
  },
  {
    pattern: /\bcannot\b/gi,
    replacement: "can't",
    reason: 'Applied natural conversational contraction',
    category: 'formality',
    modes: ['conversational'],
  },
  {
    pattern: /\bwill not\b/gi,
    replacement: "won't",
    reason: 'Applied natural conversational contraction',
    category: 'formality',
    modes: ['conversational'],
  },
  {
    pattern: /\bit is\b/gi,
    replacement: "it's",
    reason: 'Applied natural conversational contraction',
    category: 'formality',
    modes: ['conversational'],
  },
  {
    pattern: /\bthat is\b/gi,
    replacement: "that's",
    reason: 'Applied natural conversational contraction',
    category: 'formality',
    modes: ['conversational'],
  },

  // 3. Formal mode conversions (Expanding contractions, elevating register)
  {
    pattern: /\bdon't\b/gi,
    replacement: 'do not',
    reason: 'Expanded contraction for formal academic register',
    category: 'formality',
    modes: ['formal'],
  },
  {
    pattern: /\bcan't\b/gi,
    replacement: 'cannot',
    reason: 'Expanded contraction for formal academic register',
    category: 'formality',
    modes: ['formal'],
  },
  {
    pattern: /\bwon't\b/gi,
    replacement: 'will not',
    reason: 'Expanded contraction for formal academic register',
    category: 'formality',
    modes: ['formal'],
  },
  {
    pattern: /\bit's\b/gi,
    replacement: 'it is',
    reason: 'Expanded contraction for formal academic register',
    category: 'formality',
    modes: ['formal'],
  },
  {
    pattern: /\bkids\b/gi,
    replacement: 'children',
    reason: 'Elevated colloquial term to formal register',
    category: 'formality',
    modes: ['formal'],
  },
  {
    pattern: /\ba lot of\b/gi,
    replacement: 'numerous',
    reason: 'Substituted colloquial quantifier with formal term',
    category: 'formality',
    modes: ['formal'],
  },
  {
    pattern: /\bstuff\b/gi,
    replacement: 'materials',
    reason: 'Replaced vague slang with precise term',
    category: 'formality',
    modes: ['formal'],
  },

  // 4. Flow improvements (Transitions & sentence variance)
  {
    pattern: /\bFurthermore,\s+/gi,
    replacement: 'Additionally, ',
    reason: 'Softened heavy transition word for smoother rhythm',
    category: 'flow',
    modes: ['natural', 'flow'],
  },
  {
    pattern: /\bMoreover,\s+/gi,
    replacement: 'Also, ',
    reason: 'Smoothed overly stiff academic transition',
    category: 'flow',
    modes: ['natural', 'conversational', 'flow'],
  },
];

export class RuleBasedHumanizerEngine implements LocalHumanizerEngine {
  public readonly id = 'deterministic-rules';
  public readonly name = 'Deterministic Rule-Based Engine (On-Device, 100% Private)';
  public readonly isAvailable = true;
  public readonly requiresDownload = false;

  public async process(text: string, options: HumanizerOptions): Promise<HumanizerResult> {
    const { mode } = options;
    if (!text || text.trim().length === 0) {
      return {
        originalText: text,
        improvedText: text,
        mode,
        changes: [],
        stats: {
          originalWords: 0,
          improvedWords: 0,
          reductionPercentage: 0,
          readingTimeSeconds: 0,
        },
        engineName: this.name,
        engineType: 'deterministic-rules',
        processedLocally: true,
      };
    }

    let modified = text;
    const recordedChanges: HumanizerChange[] = [];

    // Filter rules applicable to current mode
    const applicableRules = TRANSFORMATION_RULES.filter((r) => r.modes.includes(mode));

    for (const rule of applicableRules) {
      // Find all matches to record exact replacements
      let match: RegExpExecArray | null;
      const regex = new RegExp(rule.pattern.source, rule.pattern.flags);

      while ((match = regex.exec(modified)) !== null) {
        const matchedStr = match[0];
        const rep =
          typeof rule.replacement === 'function'
            ? rule.replacement(matchedStr)
            : rule.replacement;

        // Preserve capitalization if original was capitalized
        const formattedRep =
          matchedStr[0] === matchedStr[0].toUpperCase() && rep.length > 0
            ? rep.charAt(0).toUpperCase() + rep.slice(1)
            : rep;

        recordedChanges.push({
          original: matchedStr,
          replacement: formattedRep,
          reason: rule.reason,
          category: rule.category,
          index: match.index,
        });
      }

      // Apply replacement
      modified = modified.replace(rule.pattern, (m) => {
        const rep =
          typeof rule.replacement === 'function' ? rule.replacement(m) : rule.replacement;
        return m[0] === m[0].toUpperCase() && rep.length > 0
          ? rep.charAt(0).toUpperCase() + rep.slice(1)
          : rep;
      });
    }

    // Sentence rhythm and flow improvements
    if (mode === 'flow' || mode === 'natural') {
      // Clean up accidental double spaces created during removals
      modified = modified.replace(/ {2,}/g, ' ');
      // Fix spacing before punctuation
      modified = modified.replace(/\s+([,.:;!?])/g, '$1');
    }

    const origWords = text.trim().split(/\s+/).filter(Boolean).length;
    const impWords = modified.trim().split(/\s+/).filter(Boolean).length;
    const wordDiff = origWords - impWords;
    const reductionPercentage =
      origWords > 0 ? Math.round((wordDiff / origWords) * 100) : 0;
    const readingTimeSeconds = Math.round((impWords / 200) * 60);

    return {
      originalText: text,
      improvedText: modified,
      mode,
      changes: recordedChanges,
      stats: {
        originalWords: origWords,
        improvedWords: impWords,
        reductionPercentage,
        readingTimeSeconds,
      },
      engineName: this.name,
      engineType: 'deterministic-rules',
      processedLocally: true,
    };
  }
}
