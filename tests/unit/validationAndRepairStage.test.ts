import { describe, it, expect } from 'vitest';
import {
  validateQuality,
  validateArticleAgreement,
  validateDuplicateTransitions,
  validateStructuralCompleteness,
} from '../../src/lib/pipeline/qualityValidator';
import { defaultRuleEngine } from '../../src/lib/humanizer/ruleEngine';

describe('Strengthened Validation and Repair Stage (Task 5)', () => {
  it('detects invalid indefinite articles and respects phonological exceptions', () => {
    const invalid1 = validateArticleAgreement('The system generated an preview of the document.');
    expect(invalid1.hasError).toBe(true);
    expect(invalid1.errors[0]).toContain("Invalid article 'an' before consonant sound 'preview'");

    const invalid2 = validateArticleAgreement('The user submitted a overview for review.');
    expect(invalid2.hasError).toBe(true);
    expect(invalid2.errors[0]).toContain("Invalid article 'a' before vowel sound 'overview'");

    // Phonological exceptions
    const validExceptions = validateArticleAgreement('He waited an hour at a university for a unique opportunity with an honest colleague.');
    expect(validExceptions.hasError).toBe(false);
  });

  it('detects and flags redundant duplicate transition adverbs', () => {
    const textWithDup = 'The cluster crashed. However, nevertheless, the ingress router preserved active sessions.';
    const dupCheck = validateDuplicateTransitions(textWithDup);
    expect(dupCheck.hasDuplicates).toBe(true);
    expect(dupCheck.duplicates[0]).toMatch(/However,\s*nevertheless/i);

    const cleanText = 'The cluster crashed. However, the ingress router preserved active sessions.';
    expect(validateDuplicateTransitions(cleanText).hasDuplicates).toBe(false);
  });

  it('detects accidental truncation and missing terminal punctuation', () => {
    const original = 'The laboratory confirmed that the antibodies neutralized the virus.';
    const truncated = 'The laboratory confirmed that the antibodies neutralized';
    const structCheck = validateStructuralCompleteness(original, truncated);
    expect(structCheck.isTruncated).toBe(true);
    expect(structCheck.issues[0]).toContain('Accidental truncation');
  });

  it('detects duplicated consecutive sentences', () => {
    const original = 'The database connection pool recovered. Active queries resumed without error.';
    const duplicated = 'The database connection pool recovered. The database connection pool recovered.';
    const structCheck = validateStructuralCompleteness(original, duplicated);
    expect(structCheck.hasDuplication).toBe(true);
    expect(structCheck.issues[0]).toContain('Duplicated consecutive sentence detected');
  });

  it('prevents false-positive negation flips on rhetorical idioms like "goes without saying"', () => {
    const original = 'It goes without saying that patient adherence is vital for sustained therapeutic outcomes across the 12-week intervention period.';
    const rewrite = 'Naturally, patient adherence is vital for sustained therapeutic outcomes across the 12-week intervention period.';
    const result = validateQuality(original, rewrite);
    expect(result.criticalViolation).toBe(false);
    expect(result.negationsPreserved).toBe(true);
  });

  it('automatically repairs article agreement and duplicate transitions in ruleEngine Pass 5', () => {
    const rawInput = 'It is important to note that an preview of the report was prepared. However, nevertheless, users must review it.';
    const result = defaultRuleEngine.processSync(rawInput, {
      mode: 'natural',
      rewriteStrength: 'balanced',
    });

    // Pass 5 should normalize 'an preview' to 'a preview'
    expect(result.improvedText).not.toContain('an preview');
    expect(result.improvedText).toContain('a preview');

    // Pass 5 should deduplicate 'However, nevertheless,' to 'However,'
    expect(result.improvedText).not.toMatch(/However,\s*nevertheless/i);
  });
});
