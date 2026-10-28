import { describe, it, expect } from 'vitest';
import { computeDiffTokens } from '../../src/lib/humanizer/ruleEngine';
import {
  applyInlinePhraseReplacement,
  computeTextFingerprint,
} from '../../src/lib/pipeline/scopedReplacement';
import { validatePhraseContext, startsWithVowelSound } from '../../src/lib/pipeline/phraseGrammarValidator';
import type { DiffToken, HumanizerChange } from '../../src/types';

describe('Interactive Inline Phrase Suggestions (Phase 8)', () => {
  describe('1. DiffToken Offset Generation & Multi-Word Phrase Recognition', () => {
    it('computes exact, byte-accurate startIndex and endIndex for every token in improvedText', () => {
      const originalText = 'The team must utilize advanced tools to accelerate the timeline.';
      const improvedText = 'The team must use advanced tools to speed up the schedule.';

      const changes: HumanizerChange[] = [
        {
          original: 'utilize',
          replacement: 'use',
          reason: 'Simpler word choice',
          category: 'phrasing',
          index: 0,
          alternatives: ['employ', 'apply', 'adopt'],
        },
        {
          original: 'accelerate',
          replacement: 'speed up',
          reason: 'Conversational phrasing',
          category: 'phrasing',
          index: 1,
          alternatives: ['fast-track', 'quicken', 'expedite'],
        },
      ];

      const tokens = computeDiffTokens(originalText, improvedText, changes);

      // 1. Full reconstruction test: concatenating all token texts must match improvedText byte-for-byte
      const reconstructed = tokens.map((t) => t.text).join('');
      expect(reconstructed).toBe(improvedText);

      // 2. Offsets check for every token
      for (const tok of tokens) {
        expect(tok.startIndex).toBeDefined();
        expect(tok.endIndex).toBeDefined();
        expect(tok.endIndex! - tok.startIndex!).toBe(tok.text.length);
        expect(improvedText.slice(tok.startIndex!, tok.endIndex!)).toBe(tok.text);
      }

      // 3. Multi-word phrase token check: "speed up" should be a single token with scope 'phrase'
      const speedUpToken = tokens.find((t) => t.text.toLowerCase() === 'speed up');
      expect(speedUpToken).toBeDefined();
      expect(speedUpToken?.type).toBe('changed');
      expect(speedUpToken?.scope).toBe('phrase');
      expect(speedUpToken?.alternatives).toEqual(['fast-track', 'quicken', 'expedite']);
      expect(speedUpToken?.original).toBe('accelerate');

      // 4. Single-word token check: "use" should be 'changed' with its alternatives
      const useToken = tokens.find((t) => t.text.toLowerCase() === 'use');
      expect(useToken).toBeDefined();
      expect(useToken?.type).toBe('changed');
      expect(useToken?.alternatives).toEqual(['employ', 'apply', 'adopt']);
    });

    it('assigns unique ids and separate offsets to repeated identical words across sentences', () => {
      const originalText = 'We use this method because we use modern tools.';
      const improvedText = 'We use this method because we use modern tools.';

      const changes: HumanizerChange[] = [
        {
          original: 'use',
          replacement: 'use',
          reason: 'Test change',
          category: 'phrasing',
          index: 0,
          alternatives: ['employ', 'apply'],
        },
      ];

      const tokens = computeDiffTokens(originalText, improvedText, changes);
      const useTokens = tokens.filter((t) => t.text.toLowerCase() === 'use');

      expect(useTokens.length).toBe(2);
      expect(useTokens[0].id).not.toBe(useTokens[1].id);
      expect(useTokens[0].startIndex).not.toBe(useTokens[1].startIndex);
      expect(useTokens[0].startIndex).toBe(3);
      expect(useTokens[1].startIndex).toBe(30);
    });
  });

  describe('2. Safe Inline Phrase Application & Offset Verification', () => {
    it('replaces target phrase accurately with byte-for-byte preservation outside target span', () => {
      const fullText = 'The software engineering organization must speed up the project schedule.';
      const token: DiffToken = {
        id: 'tok_speed_up',
        text: 'speed up',
        type: 'changed',
        startIndex: 43,
        endIndex: 51,
        alternatives: ['fast-track', 'quicken'],
      };

      // Verify bounds
      expect(fullText.slice(token.startIndex!, token.endIndex!)).toBe('speed up');

      const result = applyInlinePhraseReplacement({
        currentText: fullText,
        originalDraftText: fullText,
        token,
        replacementText: 'fast-track',
      });

      expect(result.success).toBe(true);
      expect(result.newText).toBe(
        'The software engineering organization must fast-track the project schedule.'
      );

      // Prefix check
      expect(result.newText!.slice(0, 43)).toBe(fullText.slice(0, 43));
      // Suffix check
      expect(result.newText!.slice(43 + 'fast-track'.length)).toBe(fullText.slice(51));
      // New diff tokens should be computed and offsets refreshed
      expect(result.newDiffTokens).toBeDefined();
      expect(result.newDiffTokens?.length).toBeGreaterThan(0);
      expect(result.newDiffTokens?.map((t) => t.text).join('')).toBe(result.newText);
    });

    it('unambiguously targets the second identical phrase without corrupting the first instance', () => {
      const doc = 'First we use local cache. Later we use cloud cache.';
      const firstUseIndex = doc.indexOf('use');
      const secondUseIndex = doc.lastIndexOf('use');

      const tokenSecondUse: DiffToken = {
        id: 'tok_second_use',
        text: 'use',
        type: 'changed',
        startIndex: secondUseIndex,
        endIndex: secondUseIndex + 3,
        alternatives: ['employ', 'leverage'],
      };

      const result = applyInlinePhraseReplacement({
        currentText: doc,
        originalDraftText: doc,
        token: tokenSecondUse,
        replacementText: 'leverage',
      });

      expect(result.success).toBe(true);
      expect(result.newText).toBe('First we use local cache. Later we leverage cloud cache.');

      // The FIRST "use" remains 100% untouched!
      expect(result.newText!.indexOf('use')).toBe(firstUseIndex);
    });

    it('preserves trailing punctuation attached to the original token', () => {
      const doc = 'Furthermore, the analysis demonstrates high accuracy.';
      const token: DiffToken = {
        id: 'tok_furthermore',
        text: 'Furthermore,',
        type: 'changed',
        startIndex: 0,
        endIndex: 12,
        alternatives: ['Moreover', 'In addition'],
      };

      const result = applyInlinePhraseReplacement({
        currentText: doc,
        originalDraftText: doc,
        token,
        replacementText: 'Moreover',
      });

      expect(result.success).toBe(true);
      // The trailing comma must be preserved: "Moreover,"
      expect(result.newText).toBe('Moreover, the analysis demonstrates high accuracy.');
    });

    it('preserves initial capitalization when token starts a sentence', () => {
      const doc = 'Utilize this tool for optimal results.';
      const token: DiffToken = {
        id: 'tok_utilize',
        text: 'Utilize',
        type: 'changed',
        startIndex: 0,
        endIndex: 7,
        alternatives: ['use', 'employ'],
      };

      const result = applyInlinePhraseReplacement({
        currentText: doc,
        originalDraftText: doc,
        token,
        replacementText: 'use',
      });

      expect(result.success).toBe(true);
      // Capitalization adapted to "Use"
      expect(result.newText).toBe('Use this tool for optimal results.');
    });
  });

  describe('3. Grammatical Context & Article Adjustment (a vs an)', () => {
    it('correctly detects vowel sounds versus consonant sounds in English', () => {
      expect(startsWithVowelSound('apple')).toBe(true);
      expect(startsWithVowelSound('efficient')).toBe(true);
      expect(startsWithVowelSound('hour')).toBe(true); // silent h
      expect(startsWithVowelSound('honest')).toBe(true); // silent h

      expect(startsWithVowelSound('tool')).toBe(false);
      expect(startsWithVowelSound('user')).toBe(false); // /juːzər/
      expect(startsWithVowelSound('unique')).toBe(false); // /juːniːk/
      expect(startsWithVowelSound('one')).toBe(false); // /wʌn/
      expect(startsWithVowelSound('european')).toBe(false);
    });

    it('automatically adjusts preceding "a" to "an" when replacement starts with vowel sound', () => {
      const prefix = 'The team developed a ';
      const suffix = ' for security auditing.';
      const originalText = 'tool';
      const replacementText = 'efficient framework';

      const validation = validatePhraseContext({
        prefix,
        suffix,
        originalText,
        replacementText,
      });

      expect(validation.isValid).toBe(true);
      // "a " is automatically adapted to "an "!
      expect(validation.adaptedPrefix).toBe('The team developed an ');
      expect(validation.adaptedReplacement).toBe('efficient framework');

      const fullAdapted = validation.adaptedPrefix + validation.adaptedReplacement + validation.adaptedSuffix;
      expect(fullAdapted).toBe('The team developed an efficient framework for security auditing.');
    });

    it('automatically adjusts preceding "an" to "a" when replacement starts with consonant sound', () => {
      const prefix = 'She published an ';
      const suffix = ' in the journal.';
      const originalText = 'article';
      const replacementText = 'paper';

      const validation = validatePhraseContext({
        prefix,
        suffix,
        originalText,
        replacementText,
      });

      expect(validation.isValid).toBe(true);
      // "an " is automatically adapted to "a "!
      expect(validation.adaptedPrefix).toBe('She published a ');
      expect(validation.adaptedReplacement).toBe('paper');

      const fullAdapted = validation.adaptedPrefix + validation.adaptedReplacement + validation.adaptedSuffix;
      expect(fullAdapted).toBe('She published a paper in the journal.');
    });

    it('rejects replacement that creates unbalanced quotation marks or brackets', () => {
      const validationQuote = validatePhraseContext({
        prefix: 'He stated, "the report is ',
        suffix: ' and complete."',
        originalText: 'accurate',
        replacementText: 'sound" and verified', // Extra quote!
      });

      expect(validationQuote.isValid).toBe(false);
      expect(validationQuote.error).toContain('unbalanced quotation marks');

      const validationParen = validatePhraseContext({
        prefix: 'According to studies (Smith, ',
        suffix: '2024), efficiency rose.',
        originalText: '2024',
        replacementText: '2024))', // Extra paren!
      });

      expect(validationParen.isValid).toBe(false);
      expect(validationParen.error).toContain('unbalanced parentheses');
    });

    it('rejects replacement that reverses logical polarity (negation flipping)', () => {
      const validation = validatePhraseContext({
        prefix: 'The algorithm will ',
        suffix: ' fail under peak load.',
        originalText: 'never',
        replacementText: 'always', // Reverses negation!
      });

      expect(validation.isValid).toBe(false);
      expect(validation.error).toContain('logical polarity');
    });

    it('rejects replacement when target is a protected frozen term', () => {
      const validation = validatePhraseContext({
        prefix: 'Deploying with ',
        suffix: ' on edge nodes.',
        originalText: 'Cloudflare',
        replacementText: 'Akamai',
        frozenWords: ['Cloudflare'],
      });

      expect(validation.isValid).toBe(false);
      expect(validation.error).toContain('protected frozen term');
    });
  });

  describe('4. Stale Suggestions, Overlap & Conflict Protection', () => {
    it('refuses to apply suggestion when document text has been manually edited at target boundary', () => {
      const originalDoc = 'The team must speed up the release cycle.';
      const token: DiffToken = {
        id: 'tok_speed_up',
        text: 'speed up',
        startIndex: 14,
        endIndex: 22,
        alternatives: ['fast-track'],
      };

      // User manually edited the word "speed" to "slow" in the editor
      const editedDoc = 'The team must slow down the release cycle.';

      const result = applyInlinePhraseReplacement({
        currentText: editedDoc,
        originalDraftText: originalDoc,
        token,
        replacementText: 'fast-track',
      });

      expect(result.success).toBe(false);
      expect(result.refusalReason).toBe('stale_document');
      expect(result.error).toContain('Target boundaries no longer match');
      expect(result.newText).toBeUndefined();
    });

    it('refuses to apply replacement when target token is missing from document', () => {
      const doc = 'Completely different sentence with no overlap.';
      const token: DiffToken = {
        id: 'tok_missing',
        text: 'non_existent_token',
        alternatives: ['replacement'],
      };

      const result = applyInlinePhraseReplacement({
        currentText: doc,
        originalDraftText: doc,
        token,
        replacementText: 'replacement',
      });

      expect(result.success).toBe(false);
      expect(result.refusalReason).toBe('missing_target');
      expect(result.newText).toBeUndefined();
    });

    it('rejects empty replacement phrase', () => {
      const doc = 'The team must speed up the release cycle.';
      const token: DiffToken = {
        id: 'tok_speed_up',
        text: 'speed up',
        startIndex: 14,
        endIndex: 22,
        alternatives: ['fast-track'],
      };

      const result = applyInlinePhraseReplacement({
        currentText: doc,
        originalDraftText: doc,
        token,
        replacementText: '   ',
      });

      expect(result.success).toBe(false);
      expect(result.refusalReason).toBe('invalid_candidate');
    });
  });

  describe('5. Successive Phrase Edits and Undo / Redo Lifecycle', () => {
    it('supports multiple sequential phrase edits and restores exact text on undo', () => {
      const initialText = 'Furthermore, the team should utilize modern tools to accelerate delivery.';
      let currentText = initialText;

      const historyStack: Array<{ text: string; fingerprint: string }> = [];

      // Edit 1: "Furthermore," -> "Moreover,"
      const token1: DiffToken = {
        id: 'tok_1',
        text: 'Furthermore,',
        startIndex: 0,
        endIndex: 12,
        alternatives: ['Moreover,', 'In addition,'],
      };

      historyStack.push({
        text: currentText,
        fingerprint: computeTextFingerprint(currentText),
      });

      const res1 = applyInlinePhraseReplacement({
        currentText,
        originalDraftText: initialText,
        token: token1,
        replacementText: 'Moreover,',
      });

      expect(res1.success).toBe(true);
      currentText = res1.newText!;
      expect(currentText).toBe('Moreover, the team should utilize modern tools to accelerate delivery.');

      // Refresh tokens for next edit
      const tokensAfterEdit1 = res1.newDiffTokens!;
      const utilizeToken = tokensAfterEdit1.find((t) => t.text.toLowerCase() === 'utilize')!;
      expect(utilizeToken).toBeDefined();

      // Edit 2: "utilize" -> "use"
      historyStack.push({
        text: currentText,
        fingerprint: computeTextFingerprint(currentText),
      });

      const res2 = applyInlinePhraseReplacement({
        currentText,
        originalDraftText: initialText,
        token: utilizeToken,
        replacementText: 'use',
      });

      expect(res2.success).toBe(true);
      currentText = res2.newText!;
      expect(currentText).toBe('Moreover, the team should use modern tools to accelerate delivery.');

      // Refresh tokens for Edit 3
      const tokensAfterEdit2 = res2.newDiffTokens!;
      const accelerateToken = tokensAfterEdit2.find((t) => t.text.toLowerCase() === 'accelerate')!;
      expect(accelerateToken).toBeDefined();

      // Edit 3: "accelerate" -> "speed up"
      historyStack.push({
        text: currentText,
        fingerprint: computeTextFingerprint(currentText),
      });

      const res3 = applyInlinePhraseReplacement({
        currentText,
        originalDraftText: initialText,
        token: accelerateToken,
        replacementText: 'speed up',
      });

      expect(res3.success).toBe(true);
      currentText = res3.newText!;
      expect(currentText).toBe('Moreover, the team should use modern tools to speed up delivery.');

      // --- Undo Cycle ---
      // Undo Edit 3
      const prev3 = historyStack.pop()!;
      currentText = prev3.text;
      expect(currentText).toBe('Moreover, the team should use modern tools to accelerate delivery.');

      // Undo Edit 2
      const prev2 = historyStack.pop()!;
      currentText = prev2.text;
      expect(currentText).toBe('Moreover, the team should utilize modern tools to accelerate delivery.');

      // Undo Edit 1
      const prev1 = historyStack.pop()!;
      currentText = prev1.text;
      expect(currentText).toBe(initialText);
      expect(historyStack.length).toBe(0);
    });
  });
});
