import { describe, it, expect } from 'vitest';
import {
  validateInvariants,
  validateInvariantsLegacy,
  getNumberWordEquivalents,
  getCardinalWordEquivalents,
  getOrdinalWordEquivalents,
  isNumberInProtectedContext,
  checkNegationTargetPreservation,
  checkEpistemicStrengthening,
} from '../../src/lib/pipeline/invariants';

describe('Phase 8: Semantic Validator Calibration & Regression Suite', () => {
  describe('Rule A: Numeric Word Equivalence & Strict Guardrails', () => {
    it('normalizes digits to cardinal words (0-100) while keeping distinct numbers separate', () => {
      expect(getNumberWordEquivalents('3')).toContain('three');
      expect(getNumberWordEquivalents('3')).not.toContain('thirty');
      expect(getNumberWordEquivalents('30')).toContain('thirty');
      expect(getNumberWordEquivalents('30')).not.toContain('three');
      expect(getNumberWordEquivalents('12')).toContain('twelve');
      expect(getNumberWordEquivalents('12.4')).toHaveLength(0); // Decimal guardrail
      expect(getNumberWordEquivalents('128%')).toHaveLength(0); // Percentage guardrail
    });

    it('POSITIVE: preserves numbers spelled out as words and emits structured trace', () => {
      const orig = 'The system deployed across 3 manufacturing hubs and 4 regional data centers.';
      const rewr = 'The system deployed across three manufacturing hubs and four regional data centers.';

      const res = validateInvariants(orig, rewr);
      expect(res.isValid).toBe(true);
      expect(res.numbersPreserved).toBe(true);
      expect(res.hasConfirmedFactualError).toBe(false);
      expect(res.traces.some((t) => t.normalizationRuleApplied === 'NUMERIC_WORD_EQUIVALENCE')).toBe(true);
    });

    it('NEGATIVE: strictly detects near-miss numeric corruptions (3 vs 30, 5 vs 50)', () => {
      const orig = 'The system deployed across 3 manufacturing hubs.';
      const corrupted = 'The system deployed across 30 manufacturing hubs.';

      const res = validateInvariants(orig, corrupted);
      expect(res.isValid).toBe(false);
      expect(res.numbersPreserved).toBe(false);
      expect(res.hasConfirmedFactualError).toBe(true);
      expect(res.missingNumbers).toContain('3');
      expect(res.unsupportedAdditions).toContain('30');
    });

    it('POSITIVE: resolves ungrounded additions when digits are derived from source words (seventeenth -> 17th)', () => {
      const orig = 'Historiographical consensus regarding seventeenth-century agrarian revolts has shifted.';
      const rewr = 'Historians have analyzed 17th-century agrarian revolts with new perspectives.';

      const res = validateInvariants(orig, rewr);
      expect(res.numbersPreserved).toBe(true);
      expect(res.unsupportedAdditions).toHaveLength(0);
      expect(res.traces.some((t) => t.sourceSpan === 'seventeenth' && t.outputSpan === '17')).toBe(true);
    });

    it('NEGATIVE: rejects altered decimals or percentage values', () => {
      const orig = 'Operating yield did not exceed 12.4% across replications.';
      const altered = 'Operating yield did not exceed 14.2% across replications.';

      const res = validateInvariants(orig, altered);
      expect(res.isValid).toBe(false);
      expect(res.numbersPreserved).toBe(false);
      expect(res.hasConfirmedFactualError).toBe(true);
    });
  });

  describe('Rule B: Unit Abbreviation & Demographic Age Normalization', () => {
    it('POSITIVE: recognizes standard unit expansions (150ms -> 150 milliseconds)', () => {
      const orig = 'Client write requests wait until heartbeats resume within 150ms.';
      const rewr = 'Client write requests wait until heartbeats resume within 150 milliseconds.';

      const res = validateInvariants(orig, rewr);
      expect(res.isValid).toBe(true);
      expect(res.unitsPreserved).toBe(true);
      expect(res.hasConfirmedFactualError).toBe(false);
      expect(res.traces.some((t) => t.normalizationRuleApplied === 'UNIT_ABBREVIATION_EQUIVALENCE')).toBe(true);
    });

    it('NEGATIVE: catches mutated units across magnitude boundaries (145ms -> 145s, 50mg -> 50kg, 12mg -> 12g)', () => {
      const orig = 'Latency stabilized at 145ms with 50mg dosage and 12mg maintenance.';
      const corrupted = 'Latency stabilized at 145s with 50kg dosage and 12g maintenance.';

      const res = validateInvariants(orig, corrupted);
      expect(res.isValid).toBe(false);
      expect(res.unitsPreserved).toBe(false);
      expect(res.hasConfirmedFactualError).toBe(true);
      expect(res.mutatedUnits.length).toBeGreaterThanOrEqual(2);
    });

    it('POSITIVE: preserves demographic pediatric age phrasing (under 12 years of age -> children under 12)', () => {
      const orig = 'Cohort studies did not reproduce these findings in pediatric cohorts under 12 years of age.';
      const rewr = 'Later longitudinal studies failed to confirm these results in children under 12.';

      const res = validateInvariants(orig, rewr);
      expect(res.isValid).toBe(true);
      expect(res.unitsPreserved).toBe(true);
      expect(res.hasConfirmedFactualError).toBe(false);
      expect(res.traces.some((t) => t.normalizationRuleApplied === 'DEMOGRAPHIC_AGE_EQUIVALENCE')).toBe(true);
    });

    it('NEGATIVE: catches mutated age boundaries (under 12 -> under 21)', () => {
      const orig = 'Cohort studies tracked children under 12 years of age.';
      const corrupted = 'Cohort studies tracked children under 21 years of age.';

      const res = validateInvariants(orig, corrupted);
      expect(res.isValid).toBe(false);
      expect(res.numbersPreserved).toBe(false);
    });
  });

  describe('Rule C: Negation & Antonym Polarity Normalization', () => {
    it('POSITIVE: validates bounded antonym polarity ("did not turn positive" -> "remained negative")', () => {
      const orig = 'However, net operating cash flow did not turn positive due to capital expenditures.';
      const rewr = 'Net operating cash flow remained negative, attributable to capital expenditures.';

      const res = validateInvariants(orig, rewr);
      expect(res.negationsPreserved).toBe(true);
      expect(res.hasConfirmedFactualError).toBe(false);
      expect(res.traces.some((t) => t.normalizationRuleApplied === 'NOT_TURN_POSITIVE_REMAIN_NEGATIVE')).toBe(true);
    });

    it('NEGATIVE: catches genuine polarity flips ("did not turn positive" -> "turned positive")', () => {
      const orig = 'However, net operating cash flow did not turn positive due to capital expenditures.';
      const reversed = 'Net operating cash flow turned positive due to capital expenditures.';

      const res = validateInvariants(orig, reversed);
      expect(res.isValid).toBe(false);
      expect(res.negationsPreserved).toBe(false);
      expect(res.hasConfirmedFactualError).toBe(true);
      expect(res.violations.some((v) => v.type === 'negation_flip')).toBe(true);
    });

    it('POSITIVE: validates negative morphological prefix ("targets are not reached" -> "goals remain unmet")', () => {
      const orig = 'In the event that budget targets are not reached by October 31, hiring will pause.';
      const rewr = 'If budget goals remain unmet by October 31, hiring will pause.';

      const res = validateInvariants(orig, rewr);
      expect(res.negationsPreserved).toBe(true);
      expect(res.hasConfirmedFactualError).toBe(false);
      expect(res.traces.some((t) => t.normalizationRuleApplied === 'NOT_REACHED_REMAIN_UNMET')).toBe(true);
    });

    it('NEGATIVE: catches affirmative conversion ("not reached" -> "were reached")', () => {
      const orig = 'In the event that budget targets are not reached by October 31, hiring will pause.';
      const affirmative = 'Because budget targets were reached by October 31, hiring will pause.';

      const res = validateInvariants(orig, affirmative);
      expect(res.isValid).toBe(false);
      expect(res.negationsPreserved).toBe(false);
      expect(res.hasConfirmedFactualError).toBe(true);
    });

    it('POSITIVE: validates state antonym ("could not reveal ... hiding" -> "remained hidden")', () => {
      const orig = 'The beam could not reveal the jagged reef hiding thirty feet below the tide.';
      const rewr = 'Below the surf, a jagged reef remained hidden, thirty feet beneath the tide.';

      const res = validateInvariants(orig, rewr);
      expect(res.negationsPreserved).toBe(true);
      expect(res.hasConfirmedFactualError).toBe(false);
      expect(res.traces.some((t) => t.normalizationRuleApplied === 'COULD_NOT_REVEAL_REMAINED_HIDDEN')).toBe(true);
    });

    it('POSITIVE: validates failure verb antonym ("fail to synchronize" -> "disrupt synchronization")', () => {
      const orig = 'The pendulum would fail to synchronize with the chiming train.';
      const rewr = 'This would disrupt the pendulum’s synchronization with the chiming train.';

      const res = validateInvariants(orig, rewr);
      expect(res.negationsPreserved).toBe(true);
      expect(res.hasConfirmedFactualError).toBe(false);
      expect(res.traces.some((t) => t.normalizationRuleApplied === 'FAIL_TO_SYNCHRONIZE_DISRUPT')).toBe(true);
    });

    it('NEGATIVE: double negation trap ("not impossible" is NOT "impossible")', () => {
      const orig = 'Achieving fault tolerance under this consensus protocol was not impossible.';
      const inverted = 'Achieving fault tolerance under this consensus protocol was impossible.';

      const res = validateInvariants(orig, inverted);
      expect(res.isValid).toBe(false);
      expect(res.negationsPreserved).toBe(false);
      expect(res.hasConfirmedFactualError).toBe(true);
    });
  });

  describe('Rule D: Ambiguous Rhetorical Shifts & Manual Review Status', () => {
    it('flags ambiguous rhetorical clause shifts for manual review without false critical failure', () => {
      const orig = 'Look, you cannot put pineapple on a traditional Neapolitan pizza and expect my aunt from Naples to smile.';
      const rewr = 'Hey, trying to put pineapple on a traditional Neapolitan pizza? Don’t expect my aunt from Naples to even blink.';

      const res = validateInvariants(orig, rewr);
      expect(res.hasConfirmedFactualError).toBe(false); // Never mark as critical corruption
      expect(res.manualReviewCases.length).toBeGreaterThan(0);
      expect(res.traces.some((t) => t.severity === 'manual_review')).toBe(true);
    });
  });

  describe('Before vs. After: Legacy vs. Calibrated Side-by-Side Comparison', () => {
    it('demonstrates legacy false positive resolution on representative Phase 7 cases', () => {
      const testCases = [
        {
          id: 'case_num_words',
          orig: 'Yield did not exceed 12.4% across 5 trial replications.',
          rewr: 'The yield did not exceed 12.4% across all five trials.',
        },
        {
          id: 'case_century',
          orig: 'Regarding seventeenth-century revolts in Normandy.',
          rewr: 'Regarding 17th-century revolts in Normandy.',
        },
        {
          id: 'case_unit_ms',
          orig: 'Heartbeats resume within 150ms across nodes.',
          rewr: 'Heartbeats resume within 150 milliseconds across nodes.',
        },
        {
          id: 'case_antonym_neg',
          orig: 'Net operating cash flow did not turn positive due to capex.',
          rewr: 'Net operating cash flow remained negative, driven by capex.',
        },
      ];

      for (const tc of testCases) {
        const legacy = validateInvariantsLegacy(tc.orig, tc.rewr);
        const calibrated = validateInvariants(tc.orig, tc.rewr);

        // Legacy failed due to rigid token matching
        expect(legacy.isValid).toBe(false);
        expect(legacy.preservationWarnings.length).toBeGreaterThan(0);

        // Calibrated passes with explanatory trace metadata
        expect(calibrated.isValid).toBe(true);
        expect(calibrated.preservationWarnings).toHaveLength(0);
        expect(calibrated.hasConfirmedFactualError).toBe(false);
        expect(calibrated.traces.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Phase 9: Hardened Equivalence Rules & Vulnerability Regression Suite (Tasks 1 & 4)', () => {
    describe('Vulnerability Check 1: Cardinal vs. Ordinal Separation', () => {
      it('separates cardinal words from ordinal words in equivalence dictionaries', () => {
        expect(getCardinalWordEquivalents('17')).toContain('seventeen');
        expect(getCardinalWordEquivalents('17')).not.toContain('seventeenth');
        expect(getOrdinalWordEquivalents('17')).toContain('seventeenth');
        expect(getOrdinalWordEquivalents('17')).toContain('17th');
        expect(getOrdinalWordEquivalents('17')).not.toContain('seventeen');
        expect(typeof checkNegationTargetPreservation).toBe('function');
        expect(typeof checkEpistemicStrengthening).toBe('function');
      });

      it('POSITIVE: grounds ordinal number (17th-century) from ordinal word (seventeenth-century)', () => {
        const orig = 'In the seventeenth century, European agrarian practices were deeply disrupted.';
        const rewr = 'In the 17th century, European agrarian practices were deeply disrupted.';
        const res = validateInvariants(orig, rewr);
        expect(res.isValid).toBe(true);
        expect(res.numbersPreserved).toBe(true);
        expect(res.unsupportedAdditions).toHaveLength(0);
      });

      it('NEGATIVE: rejects cardinal quantity "17" mutated to ordinal rank "seventeenth"', () => {
        const orig = 'The search committee interviewed 17 candidates for the faculty position.';
        const rewr = 'The search committee interviewed the seventeenth candidate for the faculty position.';
        const res = validateInvariants(orig, rewr);
        expect(res.isValid).toBe(false);
        expect(res.numbersPreserved).toBe(false);
        expect(res.missingNumbers).toContain('17');
        expect(res.hasConfirmedFactualError).toBe(true);
      });

      it('NEGATIVE: rejects ungrounded cardinal quantity "17" derived from ordinal word "seventeenth"', () => {
        const orig = 'Seventeenth-century records indicate continuous unrest in the provinces.';
        const rewr = 'Historical records indicate 17 separate uprisings occurred in the provinces.';
        const res = validateInvariants(orig, rewr);
        expect(res.isValid).toBe(false);
        expect(res.unsupportedAdditions).toContain('17');
        expect(res.hasConfirmedFactualError).toBe(true);
      });
    });

    describe('Vulnerability Check 2: Epistemic Inability vs. Actual Failure & Qualifier Strengthening', () => {
      it('POSITIVE: equates modal inability with modal inability ("cannot ensure" -> "cannot guarantee")', () => {
        const orig = 'This zero-knowledge protocol cannot ensure absolute anonymity against nation-state adversaries.';
        const rewr = 'This zero-knowledge protocol cannot guarantee absolute anonymity against nation-state adversaries.';
        const res = validateInvariants(orig, rewr);
        expect(res.isValid).toBe(true);
        expect(res.hasConfirmedFactualError).toBe(false);
        expect(res.negationsPreserved).toBe(true);
      });

      it('NEGATIVE: rejects mutating modal inability ("cannot ensure") into historical failure ("failed to protect")', () => {
        const orig = 'This zero-knowledge protocol cannot ensure absolute privacy against nation-state adversaries.';
        const corrupted = 'This zero-knowledge protocol failed to protect user privacy against nation-state adversaries.';
        const res = validateInvariants(orig, corrupted);
        expect(res.isValid).toBe(false);
        expect(res.hasConfirmedFactualError).toBe(true);
        expect(res.violations.some((v) => v.type === 'negation_flip')).toBe(true);
      });

      it('POSITIVE: preserves tentative hedge across modal variants ("may reduce" -> "might potentially decrease")', () => {
        const orig = 'The experimental indexing scheme may reduce p99 query latency under high concurrency.';
        const rewr = 'The experimental indexing scheme might potentially decrease p99 query latency under high concurrency.';
        const res = validateInvariants(orig, rewr);
        expect(res.hedgingPreserved).toBe(true);
        expect(res.hasConfirmedFactualError).toBe(false);
      });

      it('NEGATIVE: rejects qualifier strengthening from tentative hedge ("may reduce") to certainty ("will definitely reduce")', () => {
        const orig = 'The experimental indexing scheme may reduce p99 query latency under high concurrency.';
        const strengthened = 'The experimental indexing scheme will definitely reduce p99 query latency under high concurrency.';
        const res = validateInvariants(orig, strengthened);
        expect(res.isValid).toBe(false);
        expect(res.hedgingPreserved).toBe(false);
        expect(res.hasConfirmedFactualError).toBe(true);
        expect(res.violations.some((v) => v.type === 'lost_hedging' && v.severity === 'critical')).toBe(true);
      });
    });

    describe('Vulnerability Check 3: Negation Target & Quantifier Scope Shifts', () => {
      it('POSITIVE: permits valid syntactic movement of negation ("did not find evidence" -> "found no evidence")', () => {
        const orig = 'The clinical safety review did not find evidence of hepatic toxicity in the trial cohort.';
        const rewr = 'The clinical safety review found no evidence of hepatic toxicity in the trial cohort.';
        const res = validateInvariants(orig, rewr);
        expect(res.isValid).toBe(true);
        expect(res.negationsPreserved).toBe(true);
        expect(res.hasConfirmedFactualError).toBe(false);
      });

      it('NEGATIVE: catches quantifier scope shift from partial negation ("not all") to absolute negation ("no")', () => {
        const orig = 'Not all microservices returned healthy health-check responses within the grace period.';
        const shifted = 'No microservices returned healthy health-check responses within the grace period.';
        const res = validateInvariants(orig, shifted);
        expect(res.isValid).toBe(false);
        expect(res.negationsPreserved).toBe(false);
        expect(res.hasConfirmedFactualError).toBe(true);
        expect(res.violations.some((v) => v.type === 'negation_flip')).toBe(true);
      });

      it('NEGATIVE: catches negation target shift with distraction negation ("did not approve" -> "approved without delay")', () => {
        const orig = 'The ethics committee did not approve the human subjects trial application.';
        const targetShifted = 'The ethics committee approved the human subjects trial application without delay.';
        const res = validateInvariants(orig, targetShifted);
        expect(res.isValid).toBe(false);
        expect(res.negationsPreserved).toBe(false);
        expect(res.hasConfirmedFactualError).toBe(true);
        expect(res.violations.some((v) => v.type === 'negation_flip')).toBe(true);
      });
    });

    describe('Vulnerability Check 4: Protected Numeric Contexts & Near-Miss Boundary Traps', () => {
      it('identifies protected numeric contexts (RFCs, citations, decimals, percentages, currency, dates)', () => {
        expect(isNumberInProtectedContext('2119', 'Complies with RFC 2119 specification.')).toBe(true);
        expect(isNumberInProtectedContext('3', 'Demonstrated efficacy in previous trials [3].')).toBe(true);
        expect(isNumberInProtectedContext('12', 'Revenue dropped by 12.4% during Q2.')).toBe(true);
        expect(isNumberInProtectedContext('50', 'The subscription fee increased to $50 per user.')).toBe(true);
        expect(isNumberInProtectedContext('3', 'The cluster maintains 3 worker nodes.')).toBe(false);
      });

      it('POSITIVE: permits written word substitution for plain quantities ("3 nodes" -> "three nodes")', () => {
        const orig = 'The cluster maintains 3 worker nodes across two separate racks.';
        const rewr = 'The cluster maintains three worker nodes across two separate racks.';
        const res = validateInvariants(orig, rewr);
        expect(res.isValid).toBe(true);
        expect(res.numbersPreserved).toBe(true);
      });

      it('NEGATIVE: rejects word substitution for protected technical identifier ("RFC 2119" -> "RFC twenty-one nineteen")', () => {
        const orig = 'The protocol parser adheres strictly to RFC 2119 keyword requirements.';
        const corrupted = 'The protocol parser adheres strictly to RFC twenty-one nineteen keyword requirements.';
        const res = validateInvariants(orig, corrupted);
        expect(res.isValid).toBe(false);
        expect(res.numbersPreserved).toBe(false);
        expect(res.missingNumbers).toContain('2119');
        expect(res.hasConfirmedFactualError).toBe(true);
      });

      it('NEGATIVE: rejects word substitution inside citations ("[3]" -> "[three]")', () => {
        const orig = 'This approach achieved state-of-the-art results on several benchmarks [3].';
        const corrupted = 'This approach achieved state-of-the-art results on several benchmarks [three].';
        const res = validateInvariants(orig, corrupted);
        expect(res.isValid).toBe(false);
        expect(res.numbersPreserved).toBe(false);
        expect(res.hasConfirmedFactualError).toBe(true);
      });

      it('NEGATIVE: strictly rejects near-miss boundary mutations (3 vs. 30 replicas)', () => {
        const orig = 'The database cluster maintains 3 replicas across separate availability zones.';
        const corrupted = 'The database cluster maintains 30 replicas across separate availability zones.';
        const res = validateInvariants(orig, corrupted);
        expect(res.isValid).toBe(false);
        expect(res.missingNumbers).toContain('3');
        expect(res.unsupportedAdditions).toContain('30');
        expect(res.hasConfirmedFactualError).toBe(true);
      });
    });

    describe('Vulnerability Check 5: Unit & Scale Boundaries', () => {
      it('POSITIVE: recognizes network bandwidth expansions ("10 Gbps" -> "10 gigabits per second")', () => {
        const orig = 'Ingress capacity was upgraded to 10 Gbps across the gateway tier.';
        const rewr = 'Ingress capacity was upgraded to 10 gigabits per second across the gateway tier.';
        const res = validateInvariants(orig, rewr);
        expect(res.isValid).toBe(true);
        expect(res.unitsPreserved).toBe(true);
        expect(res.hasConfirmedFactualError).toBe(false);
      });

      it('NEGATIVE: rejects network bandwidth scale mutation ("10 Gbps" -> "10 Mbps")', () => {
        const orig = 'Ingress capacity was upgraded to 10 Gbps across the gateway tier.';
        const corrupted = 'Ingress capacity was upgraded to 10 Mbps across the gateway tier.';
        const res = validateInvariants(orig, corrupted);
        expect(res.isValid).toBe(false);
        expect(res.unitsPreserved).toBe(false);
        expect(res.hasConfirmedFactualError).toBe(true);
        expect(res.mutatedUnits.length).toBeGreaterThan(0);
      });

      it('NEGATIVE: rejects unsafe pediatric age expansion ("under 12 years of age" -> "adults under 30")', () => {
        const orig = 'The clinical protocol only enrolled patients under 12 years of age.';
        const corrupted = 'The clinical protocol only enrolled adults under 30.';
        const res = validateInvariants(orig, corrupted);
        expect(res.isValid).toBe(false);
        expect(res.numbersPreserved).toBe(false);
        expect(res.hasConfirmedFactualError).toBe(true);
      });
    });

    describe('Vulnerability Check 6: Causality Reversal & Unsupported Claims/Hallucinations', () => {
      it('POSITIVE: preserves causal direction across passive voice conversion ("A caused B" -> "B was caused by A")', () => {
        const orig = 'Severe disk contention caused high transaction commit latency on primary nodes.';
        const rewr = 'High transaction commit latency on primary nodes was caused by severe disk contention.';
        const res = validateInvariants(orig, rewr);
        expect(res.causalityPreserved).toBe(true);
        expect(res.hasConfirmedFactualError).toBe(false);
      });

      it('NEGATIVE: rejects reversed causal direction ("A caused B" -> "B caused A")', () => {
        const orig = 'Severe disk contention caused high transaction commit latency on primary nodes.';
        const inverted = 'High transaction commit latency caused severe disk contention on primary nodes.';
        const res = validateInvariants(orig, inverted);
        expect(res.isValid).toBe(false);
        expect(res.causalityPreserved).toBe(false);
        expect(res.hasConfirmedFactualError).toBe(true);
        expect(res.violations.some((v) => v.type === 'reversed_causality')).toBe(true);
      });

      it('NEGATIVE: rejects hallucinated regulatory entity claims (e.g. ungrounded FDA or SOC2)', () => {
        const orig = 'The company stated that its patient intake portal meets industry security standards.';
        const hallucinated = 'The company stated that its patient intake portal achieved FDA and SOC2 certification.';
        const res = validateInvariants(orig, hallucinated);
        expect(res.isValid).toBe(false);
        expect(res.hasConfirmedFactualError).toBe(true);
        expect(res.violations.some((v) => v.type === 'unsupported_addition' && v.message.includes('regulatory'))).toBe(true);
      });

      it('NEGATIVE: closes [1, 2] loophole and rejects ungrounded numerical additions', () => {
        const orig = 'The production cluster suffered network packet loss during peak trading hours.';
        const ungroundedNums = 'The production cluster suffered 1 catastrophic crash and 2 total outages during peak trading hours.';
        const res = validateInvariants(orig, ungroundedNums);
        expect(res.isValid).toBe(false);
        expect(res.numbersPreserved).toBe(false);
        expect(res.unsupportedAdditions).toContain('1');
        expect(res.unsupportedAdditions).toContain('2');
        expect(res.hasConfirmedFactualError).toBe(true);
      });
    });
  });
});
