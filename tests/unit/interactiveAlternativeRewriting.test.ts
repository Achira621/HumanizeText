import { describe, it, expect, vi } from 'vitest';
import { filterValidAlternatives } from '../../src/lib/pipeline/qualityValidator';
import { RuleBasedHumanizerEngine, computeDiffTokens } from '../../src/lib/humanizer/ruleEngine';
import { humanizeWithApi } from '../../src/lib/humanizer/apiEngine';
import { applyScopedAlternative, computeTextFingerprint } from '../../src/lib/pipeline/scopedReplacement';
import type { AlternativesMetadata, DiffToken } from '../../src/types';

describe('Interactive Alternative Rewriting System (Phase 7)', () => {
  describe('1. Candidate Filtering & Invariant Integrity', () => {
    const sourceText = 'In 2024, Dr. Smith et al. (Smith et al., 2024) reported a 35% increase in efficiency across 12 trials.';

    it('accepts valid, distinct candidates that preserve numbers, citations, and units', () => {
      const candidates = [
        'In 2024, Dr. Smith and colleagues (Smith et al., 2024) observed a 35% boost in efficiency over 12 trials.',
        'During 2024, research by Dr. Smith et al. (Smith et al., 2024) demonstrated a 35% efficiency gain across 12 trials.',
      ];

      const valid = filterValidAlternatives(sourceText, candidates);
      expect(valid.length).toBe(2);
      expect(valid).toEqual(candidates);
    });

    it('filters out empty or whitespace-only candidates', () => {
      const candidates = [
        '',
        '   ',
        'In 2024, Dr. Smith et al. (Smith et al., 2024) noted a 35% efficiency rise in 12 trials.',
        '\n\t',
      ];

      const valid = filterValidAlternatives(sourceText, candidates);
      expect(valid.length).toBe(1);
      expect(valid[0]).toContain('efficiency rise');
    });

    it('deduplicates identical candidates and unchanged replicas of the source', () => {
      const candidates = [
        sourceText, // verbatim source replica
        'In 2024, Dr. Smith et al. (Smith et al., 2024) noted a 35% efficiency rise in 12 trials.',
        'In 2024, Dr. Smith et al. (Smith et al., 2024) noted a 35% efficiency rise in 12 trials.', // duplicate
      ];

      const valid = filterValidAlternatives(sourceText, candidates);
      expect(valid.length).toBe(1);
    });

    it('rejects candidate with dropped critical numbers, units, or citations', () => {
      const candidates = [
        'Dr. Smith reported efficiency gains in several trials.', // dropped 2024, 35%, 12, and citation
        'In 2024, Dr. Smith et al. reported a 35% rise in efficiency across 12 trials.', // dropped (Smith et al., 2024)
      ];

      const valid = filterValidAlternatives(sourceText, candidates);
      expect(valid.length).toBe(0);
    });

    it('rejects candidates containing un-restored placeholder leaks', () => {
      const candidates = [
        'In 2024, __HT_PROTECTED_0__ reported a 35% increase across 12 trials (Smith et al., 2024).',
      ];

      const valid = filterValidAlternatives(sourceText, candidates);
      expect(valid.length).toBe(0);
    });
  });

  describe('2. Scope and Engine Capability Contract', () => {
    it('local deterministic engine returns scope "phrase" and does not present words as passage alternatives', () => {
      const engine = new RuleBasedHumanizerEngine();
      const text = 'Furthermore, in order to utilize this tool, users must register.';
      const res = engine.processSync(text, {
        mode: 'natural',
        rewriteStrength: 'balanced',
        multiCandidate: true,
      });

      expect(res.alternativesMetadata).toBeDefined();
      expect(res.alternativesMetadata?.scope).toBe('phrase');
      // Every candidate item is explicitly marked with scope 'phrase'
      expect(res.alternativesMetadata?.candidates.every((c) => c.scope === 'phrase')).toBe(true);
    });

    it('apiEngine returns scope "none" and eliminates static dummy string fabrications', async () => {
      // Mock fetch response for apiEngine
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: 'Revised text without clichés.' }] } }],
        }),
      });
      globalThis.fetch = mockFetch as any;

      const res = await humanizeWithApi('Test input draft text.', 'natural', {
        provider: 'gemini',
        apiKey: 'test-key',
      });

      expect(res.alternatives).toBeUndefined();
      expect(res.alternativesMetadata).toBeDefined();
      expect(res.alternativesMetadata?.scope).toBe('none');
      expect(res.alternativesMetadata?.candidates.length).toBe(0);
    });
  });

  describe('3. Candidate Selection, Diff Recomputation, and Undo/Redo Workflow', () => {
    const originalText = 'The team must utilize advanced tools to accelerate the timeline.';
    const primaryRewrite = 'The team should use modern tools to speed up the schedule.';
    const alternativeRewrite = 'The crew needs modern tools to fast-track the project deadline.';

    const metadata: AlternativesMetadata = {
      scope: 'passage',
      selectedIndex: 0,
      originalTargetText: originalText,
      candidates: [
        {
          id: 'cand-0',
          text: primaryRewrite,
          scope: 'passage',
          label: 'Version 1 (Primary)',
          isValid: true,
        },
        {
          id: 'cand-1',
          text: alternativeRewrite,
          scope: 'passage',
          label: 'Version 2',
          isValid: true,
        },
      ],
    };

    it('safely switches candidate and recomputes diff tokens and word counts without secondary rewrite', () => {
      let currentImprovedText = primaryRewrite;
      let currentMetadata = { ...metadata };
      const undoStack: Array<{ text: string; selectedIndex: number }> = [];

      // Step 1: User chooses Alternative 2
      const candidateIndex = 1;
      const targetCandidate = currentMetadata.candidates[candidateIndex];

      // Record undo
      undoStack.push({ text: currentImprovedText, selectedIndex: currentMetadata.selectedIndex });

      // Apply
      currentImprovedText = targetCandidate.text;
      currentMetadata.selectedIndex = candidateIndex;

      // Recompute stats
      const origWords = originalText.trim().split(/\s+/).filter(Boolean).length;
      const impWords = currentImprovedText.trim().split(/\s+/).filter(Boolean).length;
      const diffTokens: DiffToken[] = computeDiffTokens(originalText, currentImprovedText, []);

      expect(currentImprovedText).toBe(alternativeRewrite);
      expect(currentMetadata.selectedIndex).toBe(1);
      expect(impWords).toBe(10);
      expect(origWords).toBe(10);
      expect(diffTokens.length).toBeGreaterThan(0);
      expect(undoStack.length).toBe(1);
      expect(undoStack[0].text).toBe(primaryRewrite);

      // Step 2: Undo reverts cleanly to primary rewrite
      const previousState = undoStack.pop()!;
      currentImprovedText = previousState.text;
      currentMetadata.selectedIndex = previousState.selectedIndex;

      expect(currentImprovedText).toBe(primaryRewrite);
      expect(currentMetadata.selectedIndex).toBe(0);
      expect(undoStack.length).toBe(0);
    });

    it('detects staleness when original source draft text has been modified', () => {
      const activeOriginalText = originalText;
      const modifiedOriginalText = 'The team must utilize completely new tools immediately.';

      const isStaleBefore = metadata.originalTargetText?.trim() !== activeOriginalText.trim();
      expect(isStaleBefore).toBe(false);

      const isStaleAfter = metadata.originalTargetText?.trim() !== modifiedOriginalText.trim();
      expect(isStaleAfter).toBe(true);
    });

    it('supports full Redo workflow after Undo', () => {
      let currentImprovedText = primaryRewrite;
      let currentMetadata = { ...metadata };
      const undoStack: Array<{ text: string; selectedIndex: number }> = [];
      const redoStack: Array<{ text: string; selectedIndex: number }> = [];

      // User selects Alternative 2
      undoStack.push({ text: currentImprovedText, selectedIndex: currentMetadata.selectedIndex });
      currentImprovedText = alternativeRewrite;
      currentMetadata.selectedIndex = 1;

      // User undoes
      const prev = undoStack.pop()!;
      redoStack.push({ text: currentImprovedText, selectedIndex: currentMetadata.selectedIndex });
      currentImprovedText = prev.text;
      currentMetadata.selectedIndex = prev.selectedIndex;

      expect(currentImprovedText).toBe(primaryRewrite);
      expect(currentMetadata.selectedIndex).toBe(0);

      // User redoes
      const next = redoStack.pop()!;
      undoStack.push({ text: currentImprovedText, selectedIndex: currentMetadata.selectedIndex });
      currentImprovedText = next.text;
      currentMetadata.selectedIndex = next.selectedIndex;

      expect(currentImprovedText).toBe(alternativeRewrite);
      expect(currentMetadata.selectedIndex).toBe(1);
    });

    it('preserves unrelated document paragraphs when scoped candidate is applied', () => {
      const p1 = 'First paragraph discusses relativistic principles (Einstein, 1905).';
      const p2 = 'The team should use modern tools to speed up the schedule.';
      const p3 = 'Third paragraph concludes with 99.9% uptime reliability.';
      const fullDoc = `${p1}\n\n${p2}\n\n${p3}`;

      const candidateAlternative = 'The crew needs modern tools to fast-track the project deadline.';
      const targetCandidateSpan = p2;

      // Scoped replacement check
      expect(fullDoc).toContain(targetCandidateSpan);
      const updatedDoc = fullDoc.replace(targetCandidateSpan, candidateAlternative);

      expect(updatedDoc).toContain(p1);
      expect(updatedDoc).toContain(p3);
      expect(updatedDoc).toContain(candidateAlternative);
      expect(updatedDoc).not.toContain(p2);
    });

    it('handles empty candidates or malformed delimiter safely without corrupting primary rewrite', () => {
      const rawModelWithDelimiters = 'Primary rewrite text.\n---ALTERNATIVE---\n   \n---ALTERNATIVE---\nPrimary rewrite text.';
      const parts = rawModelWithDelimiters.split('---ALTERNATIVE---');
      const primary = parts[0].trim();
      const rawAlts = parts.slice(1).map((p) => p.trim()).filter((p) => p.length > 0 && p !== primary);

      // All remaining parts were either whitespace or duplicates
      expect(rawAlts.length).toBe(0);
      expect(primary).toBe('Primary rewrite text.');
    });
  });

  describe('4. Scoped Replacement Contract and Multi-Paragraph Byte-for-Byte Document Integrity', () => {
    // Rich document with >= 3 paragraphs containing:
    // - Repeated sentences across paragraphs
    // - Citations and quotations
    // - Numbers, dates, and units
    // - Technical identifiers
    // - Markdown lists and headings
    const paragraph1 =
      '# 1. Experimental Methodology\n\n' +
      'On 2024-10-28, research by Dr. Vaswani et al. (Vaswani et al., 2017) explored "attention is all you need". ' +
      'The primary benchmark demonstrated high convergence rates. ' +
      'The system operated within a 12.5 ms window with 99.9% reliability.';

    const paragraph2 =
      '## 2. Transformer Architecture\n\n' +
      'The TransformerEncoder requires 64 GB of memory and processes tokens in parallel. ' +
      'The engineering team must utilize advanced tools to accelerate the timeline. ' +
      'All tensor pipelines respect the MAX_SEQUENCE_LENGTH invariant.';

    const paragraph3 =
      '### 3. Verification Protocol\n\n' +
      'The primary benchmark demonstrated high convergence rates. ' + // Repeated sentence identical to paragraph 1!
      'Observed test results include:\n' +
      '- Item A: baseline throughput exceeding 450 req/sec\n' +
      '- Item B: zero memory leak in RuleBasedHumanizerEngine\n' +
      'Consequently, WorkerApiClient verified stability.';

    const fullDocument = `${paragraph1}\n\n${paragraph2}\n\n${paragraph3}`;

    const targetSentence = 'The engineering team must utilize advanced tools to accelerate the timeline.';
    const candidateShorter = 'The team should use modern tools to speed up delivery.';
    const candidateLonger =
      'The entire software engineering organization needs to adopt modern development utilities immediately in order to substantially accelerate the delivery schedule.';

    it('applies a sentence-level alternative in the middle of a 3-paragraph document with byte-for-byte preservation outside target', () => {
      const targetStart = fullDocument.indexOf(targetSentence);
      const targetEnd = targetStart + targetSentence.length;
      expect(targetStart).toBeGreaterThan(0);

      const metadata: AlternativesMetadata = {
        scope: 'sentence',
        selectedIndex: 0,
        originalTargetText: targetSentence,
        sourceFingerprint: computeTextFingerprint(fullDocument),
        targetSpan: {
          startIndex: targetStart,
          endIndex: targetEnd,
          text: targetSentence,
        },
        candidates: [
          { id: 'c0', text: targetSentence, scope: 'sentence', isValid: true },
          { id: 'c1', text: candidateShorter, scope: 'sentence', isValid: true },
        ],
      };

      const result = applyScopedAlternative({
        currentText: fullDocument,
        originalDraftText: fullDocument,
        candidate: metadata.candidates[1],
        candidateIndex: 1,
        metadata,
      });

      expect(result.success).toBe(true);
      expect(result.newText).toBeDefined();

      const newDoc = result.newText!;

      // 1. Verify byte-for-byte preservation of prefix before target
      const expectedPrefix = fullDocument.slice(0, targetStart);
      expect(newDoc.slice(0, targetStart)).toBe(expectedPrefix);

      // 2. Verify byte-for-byte preservation of suffix after target
      const expectedSuffix = fullDocument.slice(targetEnd);
      const newSuffixStart = targetStart + candidateShorter.length;
      expect(newDoc.slice(newSuffixStart)).toBe(expectedSuffix);

      // 3. Verify paragraph 1 (citations, numbers, dates, quotations) remains byte-for-byte untouched
      expect(newDoc).toContain(paragraph1);

      // 4. Verify paragraph 3 (markdown list, technical identifiers, duplicate sentence) remains byte-for-byte untouched
      expect(newDoc).toContain(paragraph3);

      // 5. Verify the target span was replaced
      expect(newDoc).toContain(candidateShorter);
      expect(newDoc).not.toContain(targetSentence);

      // 6. Verify targetSpan is accurately updated with new boundaries
      expect(result.updatedMetadata?.targetSpan).toEqual({
        startIndex: targetStart,
        endIndex: targetStart + candidateShorter.length,
        text: candidateShorter,
        sentenceIndex: undefined,
        blockId: undefined,
      });
    });

    it('handles candidate longer than target without off-by-one shifts or document corruption', () => {
      const targetStart = fullDocument.indexOf(targetSentence);
      const targetEnd = targetStart + targetSentence.length;

      const metadata: AlternativesMetadata = {
        scope: 'sentence',
        selectedIndex: 0,
        originalTargetText: targetSentence,
        sourceFingerprint: computeTextFingerprint(fullDocument),
        targetSpan: {
          startIndex: targetStart,
          endIndex: targetEnd,
          text: targetSentence,
        },
        candidates: [
          { id: 'c0', text: targetSentence, scope: 'sentence', isValid: true },
          { id: 'c1', text: candidateLonger, scope: 'sentence', isValid: true },
        ],
      };

      const result = applyScopedAlternative({
        currentText: fullDocument,
        originalDraftText: fullDocument,
        candidate: metadata.candidates[1],
        candidateIndex: 1,
        metadata,
      });

      expect(result.success).toBe(true);
      const newDoc = result.newText!;

      // Prefix before target must be byte-for-byte identical
      expect(newDoc.slice(0, targetStart)).toBe(fullDocument.slice(0, targetStart));

      // Suffix after candidate must be byte-for-byte identical
      const newSuffixStart = targetStart + candidateLonger.length;
      expect(newDoc.slice(newSuffixStart)).toBe(fullDocument.slice(targetEnd));

      // Paragraph 1 and 3 are intact
      expect(newDoc).toContain(paragraph1);
      expect(newDoc).toContain(paragraph3);
    });

    it('unambiguously targets repeated identical sentences when explicit targetSpan is provided', () => {
      const duplicateSentence = 'The primary benchmark demonstrated high convergence rates.';

      // Sentence appears twice: once in paragraph 1, once in paragraph 3
      const firstIndex = fullDocument.indexOf(duplicateSentence);
      const secondIndex = fullDocument.indexOf(duplicateSentence, firstIndex + duplicateSentence.length);
      expect(firstIndex).toBeGreaterThan(0);
      expect(secondIndex).toBeGreaterThan(firstIndex);

      const alternativeReplacement = 'Rigorous benchmark audits confirmed rapid convergence metrics.';

      // Target the SECOND instance (in Paragraph 3)
      const metadata: AlternativesMetadata = {
        scope: 'sentence',
        selectedIndex: 0,
        originalTargetText: duplicateSentence,
        sourceFingerprint: computeTextFingerprint(fullDocument),
        targetSpan: {
          startIndex: secondIndex,
          endIndex: secondIndex + duplicateSentence.length,
          text: duplicateSentence,
        },
        candidates: [
          { id: 'c0', text: duplicateSentence, scope: 'sentence', isValid: true },
          { id: 'c1', text: alternativeReplacement, scope: 'sentence', isValid: true },
        ],
      };

      const result = applyScopedAlternative({
        currentText: fullDocument,
        originalDraftText: fullDocument,
        candidate: metadata.candidates[1],
        candidateIndex: 1,
        metadata,
      });

      expect(result.success).toBe(true);
      const newDoc = result.newText!;

      // Paragraph 1 must STILL have the original duplicate sentence!
      expect(newDoc.slice(0, paragraph1.length)).toContain(duplicateSentence);

      // Paragraph 3 must have the alternative replacement!
      expect(newDoc).toContain(alternativeReplacement);

      // The second occurrence in Paragraph 3 was replaced, NOT the first in Paragraph 1!
      const occurrencesOfOriginal = (newDoc.match(new RegExp(duplicateSentence.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
      expect(occurrencesOfOriginal).toBe(1); // exactly the first instance remains
    });
  });

  describe('5. Target Ambiguity, Duplicate Sentences, Stale Revision Gating, and Scope Contracts', () => {
    const docWithDuplicate =
      'Introduction sentence.\n\n' +
      'The model was tested thoroughly. Results were recorded.\n\n' +
      'The model was tested thoroughly. Conclusion followed.';

    const duplicateSentence = 'The model was tested thoroughly.';

    it('refuses to apply candidate when duplicate sentences exist without targetSpan (ambiguous target)', () => {
      const metadata: AlternativesMetadata = {
        scope: 'sentence',
        selectedIndex: 0,
        originalTargetText: duplicateSentence,
        // No targetSpan provided!
        candidates: [
          { id: 'c0', text: duplicateSentence, scope: 'sentence', isValid: true },
          { id: 'c1', text: 'The model underwent comprehensive testing.', scope: 'sentence', isValid: true },
        ],
      };

      const result = applyScopedAlternative({
        currentText: docWithDuplicate,
        originalDraftText: docWithDuplicate,
        candidate: metadata.candidates[1],
        candidateIndex: 1,
        metadata,
      });

      expect(result.success).toBe(false);
      expect(result.refusalReason).toBe('ambiguous_target');
      expect(result.error).toContain('identical instances');
      expect(result.newText).toBeUndefined();
    });

    it('refuses to apply candidate when target is missing from document and NEVER replaces whole document', () => {
      const metadata: AlternativesMetadata = {
        scope: 'sentence',
        selectedIndex: 0,
        originalTargetText: 'Non-existent sentence that does not exist in the document.',
        candidates: [
          { id: 'c0', text: 'Non-existent sentence that does not exist in the document.', scope: 'sentence', isValid: true },
          { id: 'c1', text: 'A completely different phrasing.', scope: 'sentence', isValid: true },
        ],
      };

      const result = applyScopedAlternative({
        currentText: docWithDuplicate,
        originalDraftText: docWithDuplicate,
        candidate: metadata.candidates[1],
        candidateIndex: 1,
        metadata,
      });

      expect(result.success).toBe(false);
      expect(result.refusalReason).toBe('missing_target');
      expect(result.error).toContain('Target text was not found');
      // NEVER silently wiped the document!
      expect(result.newText).toBeUndefined();
    });

    it('refuses to apply candidate when targetSpan boundaries are corrupted or out of range', () => {
      const metadata: AlternativesMetadata = {
        scope: 'sentence',
        selectedIndex: 0,
        originalTargetText: duplicateSentence,
        targetSpan: {
          startIndex: 99999, // Out of range!
          endIndex: 100050,
          text: duplicateSentence,
        },
        candidates: [
          { id: 'c0', text: duplicateSentence, scope: 'sentence', isValid: true },
          { id: 'c1', text: 'Rephrased text.', scope: 'sentence', isValid: true },
        ],
      };

      const result = applyScopedAlternative({
        currentText: docWithDuplicate,
        originalDraftText: docWithDuplicate,
        candidate: metadata.candidates[1],
        candidateIndex: 1,
        metadata,
      });

      // Target span out of range -> falls back to match check -> multiple duplicates -> refuses ambiguous target
      expect(result.success).toBe(false);
      expect(result.refusalReason).toBe('ambiguous_target');
    });

    it('refuses to apply document-scope candidate when document is stale (user typed in editor)', () => {
      const originalDoc = 'Paragraph 1 initial draft.\n\nParagraph 2 initial draft.';
      const editedDoc = 'Paragraph 1 initial draft with manual additions.\n\nParagraph 2 initial draft.';

      const metadata: AlternativesMetadata = {
        scope: 'document',
        selectedIndex: 0,
        originalTargetText: originalDoc,
        sourceFingerprint: computeTextFingerprint(originalDoc), // Fingerprint from BEFORE manual edit
        candidates: [
          { id: 'c0', text: 'Paragraph 1 rewritten.\n\nParagraph 2 rewritten.', scope: 'document', isValid: true },
          { id: 'c1', text: 'Paragraph 1 alt rewrite.\n\nParagraph 2 alt rewrite.', scope: 'document', isValid: true },
        ],
      };

      const result = applyScopedAlternative({
        currentText: editedDoc, // Current text in editor has user edits
        originalDraftText: originalDoc,
        candidate: metadata.candidates[1],
        candidateIndex: 1,
        metadata,
      });

      expect(result.success).toBe(false);
      expect(result.refusalReason).toBe('stale_document');
      expect(result.error).toContain('The document was edited since alternatives were generated');
      expect(result.newText).toBeUndefined();
    });

    it('refuses to apply phrase-level candidate to passage or document scope', () => {
      const metadata: AlternativesMetadata = {
        scope: 'phrase',
        selectedIndex: 0,
        candidates: [
          { id: 'p0', text: 'in order to', scope: 'phrase', isValid: true },
          { id: 'p1', text: 'to', scope: 'phrase', isValid: true },
        ],
      };

      const result = applyScopedAlternative({
        currentText: 'He studied in order to pass the exam.',
        candidate: metadata.candidates[1],
        candidateIndex: 1,
        metadata,
      });

      expect(result.success).toBe(false);
      expect(result.refusalReason).toBe('scope_mismatch');
      expect(result.error).toContain('Phrase-level suggestions cannot replace');
    });

    it('refuses to apply candidate that failed invariant verification (isValid === false)', () => {
      const metadata: AlternativesMetadata = {
        scope: 'sentence',
        selectedIndex: 0,
        candidates: [
          { id: 'c0', text: 'Original text with $500 fee.', scope: 'sentence', isValid: true },
          {
            id: 'c1',
            text: 'Dropped the fee completely.',
            scope: 'sentence',
            isValid: false,
            validationWarnings: ['Factual invariant violation: dropped number $500'],
          },
        ],
      };

      const result = applyScopedAlternative({
        currentText: 'Original text with $500 fee.',
        candidate: metadata.candidates[1],
        candidateIndex: 1,
        metadata,
      });

      expect(result.success).toBe(false);
      expect(result.refusalReason).toBe('invalid_candidate');
      expect(result.error).toContain('dropped number $500');
    });

    it('verifies failed applications do not modify document, metrics, or history', () => {
      const initialDoc = 'Original stable document text with zero modifications.';
      const initialStats = { originalWords: 8, improvedWords: 8, reductionPercentage: 0, readingTimeSeconds: 2 };
      const undoStack: any[] = [];
      const redoStack: any[] = [];

      const invalidMetadata: AlternativesMetadata = {
        scope: 'sentence',
        selectedIndex: 0,
        candidates: [
          { id: 'c0', text: initialDoc, scope: 'sentence', isValid: true },
          { id: 'c1', text: 'Corrupted text', scope: 'sentence', isValid: false, validationWarnings: ['Bad token'] },
        ],
      };

      const result = applyScopedAlternative({
        currentText: initialDoc,
        candidate: invalidMetadata.candidates[1],
        candidateIndex: 1,
        metadata: invalidMetadata,
      });

      expect(result.success).toBe(false);

      // In the application logic, when result.success === false, nothing is pushed or updated:
      let docInEditor = initialDoc;
      let statsInEditor = initialStats;
      if (result.success) {
        docInEditor = result.newText!;
        statsInEditor = result.stats!;
        undoStack.push({ text: initialDoc });
      }

      expect(docInEditor).toBe(initialDoc);
      expect(statsInEditor).toEqual(initialStats);
      expect(undoStack.length).toBe(0);
      expect(redoStack.length).toBe(0);
    });
  });
});

