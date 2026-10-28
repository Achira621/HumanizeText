import { describe, it, expect } from 'vitest';
import { RuleBasedHumanizerEngine, postProcessCleanup } from '../../src/lib/humanizer/ruleEngine';
import { validateInvariants } from '../../src/lib/pipeline/invariants';

describe('Punctuation Cleanup, Naturalness, and Strength Divergence Regressions', () => {
  const engine = new RuleBasedHumanizerEngine();

  describe('1. Punctuation Cleanup & Duplicate Comma Elimination', () => {
    it('eliminates duplicate comma defect from reported passage in minimal mode', () => {
      const input = "In today's fast-paced world, clear communication matters.";
      const res = engine.processSync(input, { mode: 'natural', rewriteStrength: 'minimal' });

      expect(res.improvedText).not.toContain(',,');
      expect(res.improvedText).not.toContain(', ,');
      expect(res.improvedText).toContain('These days, clear communication matters.');
    });

    it('cleans duplicate punctuation across all 5 rewrite strengths', () => {
      const input = "In today's fast-paced world, clear communication matters.";
      const strengths = ['minimal', 'light', 'balanced', 'strong', 'extensive'] as const;

      for (const strength of strengths) {
        const res = engine.processSync(input, { mode: 'natural', rewriteStrength: strength });
        expect(res.improvedText).not.toMatch(/,{2,}/);
        expect(res.improvedText).not.toMatch(/,[^\S\r\n]+,/);
        expect(res.improvedText).toMatch(/(?:These days|Today), clear communication matters\./);
      }
    });

    it('preserves decimal numbers and thousands separators without corruption', () => {
      const text = 'The speed of light is 299,792,458 meters per second, with pi approx 3.14159.';
      const cleaned = postProcessCleanup(text);
      expect(cleaned).toBe(text);

      const res = engine.processSync(text, { mode: 'formal', rewriteStrength: 'strong' });
      expect(res.improvedText).toContain('299,792,458');
      expect(res.improvedText).toContain('3.14159');
    });

    it('preserves ellipses and intentional multiple punctuation', () => {
      const input = 'Wait... what happened?? She paused.... Then continued! Really?!';
      const cleaned = postProcessCleanup(input);
      expect(cleaned).toBe('Wait... what happened?? She paused.... Then continued! Really?!');
    });

    it('preserves abbreviations such as e.g., i.e., Dr., etc.', () => {
      const input = 'For example (e.g., fast algorithms, i.e., quicksort), consult Dr. Smith, etc.';
      const cleaned = postProcessCleanup(input);
      expect(cleaned).toContain('e.g.,');
      expect(cleaned).toContain('i.e.,');
      expect(cleaned).toContain('Dr. Smith');
      expect(cleaned).toContain('etc.');
    });

    it('preserves URLs, queries, and escaped technical strings', () => {
      const input = 'Visit https://example.com/api?v=1,2&lang=en,es for documentation.';
      const cleaned = postProcessCleanup(input);
      expect(cleaned).toBe(input);
    });

    it('preserves quotes and code spans with punctuation boundaries', () => {
      const input = 'He said, "Yes, absolutely." Run `const list = [1, 2, 3];` in the terminal.';
      const cleaned = postProcessCleanup(input);
      expect(cleaned).toBe(input);
    });

    it('safely handles synthetically corrupted double commas and spacing', () => {
      const dirty = 'First,, second, , third , , , fourth.';
      const cleaned = postProcessCleanup(dirty);
      expect(cleaned).toBe('First, second, third, fourth.');
    });
  });

  describe('2. Concrete Naturalness and Phrasing Corrections', () => {
    it('avoids teleological shift on PASSAGE_06 ("is central to", not "is essential to")', () => {
      const p6 = 'Genetic drift plays a pivotal role in shaping allele frequencies within endangered cheetah populations, resulting in an exceptionally low heterozygosity rate of less than 0.02 across examined mitochondrial loci.';
      const res = engine.processSync(p6, { mode: 'formal', rewriteStrength: 'balanced' });

      // Teleological error check: "plays a pivotal role" should not be replaced with "is essential to"
      // since evolutionary drift is a stochastic process, not an intentional or essential purpose
      expect(res.improvedText).not.toContain('is essential to');
      expect(res.improvedText).toMatch(/is central to|has a major effect on|plays a key part in/);
      expect(res.improvedText).toContain('0.02');
    });

    it('avoids bureaucratic metaphor on PASSAGE_25 ("an emblem of", not "a model of")', () => {
      const p25 = 'The coastal harbor stood as a beacon of quiet resilience against the gathering squall, its amber wharf lanterns weaving a rich tapestry of shimmering reflections across the black incoming tide.';
      const res = engine.processSync(p25, { mode: 'flow', rewriteStrength: 'balanced' });

      // Corporate bureaucratic phrase check: "a beacon of" should not become "a model of"
      expect(res.improvedText).not.toContain('a model of quiet resilience');
      expect(res.improvedText).toMatch(/an emblem of|a standard for|an example of/);
    });

    it('simplifies wordy phrases in formal mode without breaking technical registers', () => {
      const formalText = 'The protocol utilizes ephemeral keys in order to achieve perfect forward secrecy.';
      const res = engine.processSync(formalText, { mode: 'formal', rewriteStrength: 'balanced' });

      expect(res.improvedText).toContain('uses ephemeral keys');
      expect(res.improvedText).toContain('to achieve perfect forward secrecy');
    });
  });

  describe('3. Strength Differentiation & Invariant Safety', () => {
    it('relocates introductory adverbs in strong mode while leaving balanced mode unchanged', () => {
      const text = 'At this point in time, the development team is sunsetting legacy XML web services in order to standardize all internal inter-service communication on gRPC protocols.';
      const bal = engine.processSync(text, { mode: 'natural', rewriteStrength: 'balanced' });
      const str = engine.processSync(text, { mode: 'natural', rewriteStrength: 'strong' });

      expect(bal.improvedText).toContain('Now, the development team is sunsetting');
      expect(str.improvedText).toContain('The development team is now sunsetting');
      expect(bal.improvedText).not.toBe(str.improvedText);
    });

    it('restructures unambiguous passive voice in extensive mode with invariant preservation', () => {
      const passiveText = 'In the domain of distributed systems, the Raft consensus algorithm is frequently deployed by infrastructure teams in order to maintain a replicated state machine across independent cluster nodes.';
      const bal = engine.processSync(passiveText, { mode: 'formal', rewriteStrength: 'balanced' });
      const ext = engine.processSync(passiveText, { mode: 'formal', rewriteStrength: 'extensive' });

      // Balanced retains passive
      expect(bal.improvedText).toContain('the Raft consensus algorithm is frequently deployed by infrastructure teams');
      // Extensive restructures active voice
      expect(ext.improvedText).toContain('infrastructure teams frequently deploy the Raft consensus algorithm');
      expect(bal.improvedText).not.toBe(ext.improvedText);

      // Verify invariants preserved
      const invBal = validateInvariants(passiveText, bal.improvedText);
      const invExt = validateInvariants(passiveText, ext.improvedText);
      expect(invBal.criticalViolation).toBe(false);
      expect(invExt.criticalViolation).toBe(false);
    });

    it('never misinterprets temporal phrases ("by 8:00 PM") as passive agents', () => {
      const temporalText = 'The system update will be completed by 8:00 PM tonight.';
      const res = engine.processSync(temporalText, { mode: 'formal', rewriteStrength: 'extensive' });

      // Must NOT turn into "8:00 PM will complete the system update"
      expect(res.improvedText).not.toContain('8:00 PM will');
      expect(res.improvedText).toContain('by 8:00 PM');
    });

    it('never misinterprets percentage / delta phrases ("by 15%") as passive agents', () => {
      const metricText = 'Latency was reduced by 15% across all regions.';
      const res = engine.processSync(metricText, { mode: 'formal', rewriteStrength: 'extensive' });

      // Must NOT turn into "15% reduced latency"
      expect(res.improvedText).not.toContain('15% reduced');
      expect(res.improvedText).toContain('by 15%');
    });

    it('preserves clean prose 100% across all 5 rewrite strengths', () => {
      const cleanSamples = [
        'The morning sun rose slowly over the ridge, casting long shadows across the dormant valley.',
        'Mitochondrial DNA is inherited maternally and does not undergo meiotic recombination in human lineages.',
        'To configure the redis cache, set the maxmemory policy to volatile-lru in the server configuration file.',
      ];

      for (const sample of cleanSamples) {
        for (const strength of ['minimal', 'light', 'balanced', 'strong', 'extensive'] as const) {
          const res = engine.processSync(sample, {
            mode: 'natural',
            rewriteStrength: strength,
            plan: { issuesToFix: [] },
          });
          expect(res.improvedText.trim()).toBe(sample.trim());
        }
      }
    });

    it('strictly preserves negation and causality invariants across all rewrite strengths', () => {
      const negationText = 'The team could not deploy the service because the consensus quorum failed.';
      for (const strength of ['minimal', 'light', 'balanced', 'strong', 'extensive'] as const) {
        const res = engine.processSync(negationText, { mode: 'natural', rewriteStrength: strength });
        const inv = validateInvariants(negationText, res.improvedText);
        expect(inv.criticalViolation).toBe(false);
        expect(inv.negationsPreserved).toBe(true);
        expect(inv.causalityPreserved).toBe(true);
      }
    });
  });
});
