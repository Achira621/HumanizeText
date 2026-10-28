// ============================================================================
// DOCUMENT CONSISTENCY ENGINE
// Enforces whole-document coherence, prevents technical synonym flipping,
// de-duplicates consecutive transition markers, and disperses epistemic hedges.
// ============================================================================

export interface TermMapping {
  original: string;
  chosenReplacement: string;
  count: number;
}

export const TRANSITION_FAMILIES: Record<string, string[]> = {
  adversative: ['however', 'still', 'yet', 'nevertheless', 'nonetheless', 'even so', 'that said', 'regardless'],
  additive: ['moreover', 'furthermore', 'also', 'in addition', 'beyond that', 'additionally', 'plus', 'what is more'],
  causal: ['therefore', 'consequently', 'as a result', 'because of this', 'so', 'thus', 'hence'],
  summarizing: ['in short', 'in summary', 'overall', 'at its core', 'simply put', 'ultimately'],
  illustrative: ['specifically', 'for instance', 'for example', 'in particular', 'namely'],
};

export class DocumentConsistencyTracker {
  private termMappings = new Map<string, TermMapping>();
  private lastTransitionFamily: string | null = null;
  private lastHedgeSentenceIndex = -999;
  private recentStarters: string[] = [];

  /**
   * Records a chosen synonym replacement for a technical or distinctive word.
   */
  public recordTermMapping(original: string, chosenReplacement: string): void {
    const key = original.toLowerCase().trim();
    const existing = this.termMappings.get(key);
    if (existing) {
      existing.count++;
    } else {
      this.termMappings.set(key, {
        original,
        chosenReplacement,
        count: 1,
      });
    }
  }

  /**
   * Retrieves an established synonym mapping for consistency across blocks.
   */
  public getMappedReplacement(original: string): string | undefined {
    const key = original.toLowerCase().trim();
    return this.termMappings.get(key)?.chosenReplacement;
  }

  /**
   * Identifies which transition family a sentence opener belongs to.
   */
  public getTransitionFamily(sentence: string): string | null {
    const trimmed = sentence.trim().toLowerCase();
    for (const [family, words] of Object.entries(TRANSITION_FAMILIES)) {
      for (const w of words) {
        if (new RegExp(`^${w}\\b`, 'i').test(trimmed)) {
          return family;
        }
      }
    }
    return null;
  }

  /**
   * Checks whether adding a transition adverb to the current sentence would create
   * repetitive transition clumping with the preceding sentence.
   */
  public canUseTransition(sentence: string): boolean {
    const family = this.getTransitionFamily(sentence);
    if (!family) return true;

    if (this.lastTransitionFamily && this.lastTransitionFamily === family) {
      return false;
    }
    return true;
  }

  /**
   * Records that a transition family was used in the current sentence.
   */
  public registerSentenceTransition(sentence: string): void {
    this.lastTransitionFamily = this.getTransitionFamily(sentence);
  }

  /**
   * Checks whether an epistemic hedge can be injected into sentence at index `idx`
   * without creating artificial hedge clustering (requires at least 2 intervening sentences).
   */
  public canInjectHedge(sentenceIndex: number): boolean {
    if (sentenceIndex - this.lastHedgeSentenceIndex < 3) {
      return false;
    }
    return true;
  }

  /**
   * Registers that a hedge was added at sentenceIndex.
   */
  public registerHedge(sentenceIndex: number): void {
    this.lastHedgeSentenceIndex = sentenceIndex;
  }

  /**
   * Tracks sentence starters to avoid identical consecutive openers.
   */
  public registerStarter(starter: string): void {
    this.recentStarters.push(starter.toLowerCase().trim());
    if (this.recentStarters.length > 5) {
      this.recentStarters.shift();
    }
  }

  public isConsecutiveDuplicateStarter(starter: string): boolean {
    if (this.recentStarters.length === 0) return false;
    return this.recentStarters[this.recentStarters.length - 1] === starter.toLowerCase().trim();
  }

  /**
   * Resets session state.
   */
  public reset(): void {
    this.termMappings.clear();
    this.lastTransitionFamily = null;
    this.lastHedgeSentenceIndex = -999;
    this.recentStarters = [];
  }
}
