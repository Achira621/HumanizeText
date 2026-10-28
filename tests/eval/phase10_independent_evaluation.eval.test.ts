import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import {
  validateInvariants,
} from '../../src/lib/pipeline/invariants';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const FIXTURES_FILE = resolve(__dirname, 'fixtures/phase10_independent_semantic.json');
const REPORT_JSON_FILE = resolve(__dirname, 'artifacts/phase10_evaluation_report.json');
const REPORT_MD_FILE = resolve(__dirname, 'artifacts/phase10_evaluation_report.md');
const BLIND_SHEET_FILE = resolve(__dirname, 'artifacts/phase10_blind_review_sheet.md');
const BLIND_KEY_FILE = resolve(__dirname, 'artifacts/phase10_blind_review_key.json');

const CLIENT_INV_FILE = resolve(__dirname, '../../src/lib/pipeline/invariants.ts');
const WORKER_INV_FILE = resolve(__dirname, '../../workers/api/src/pipeline/invariants.ts');

describe('Phase 10: Independent Validation & Generalization Evaluation', () => {
  describe('Dataset Integrity & Architectural Parity (Tasks 1 & 2)', () => {
    it('verifies client and Cloudflare Worker invariant file byte-parity and behavioral integrity', () => {
      expect(existsSync(CLIENT_INV_FILE)).toBe(true);
      expect(existsSync(WORKER_INV_FILE)).toBe(true);

      const clientContent = readFileSync(CLIENT_INV_FILE);
      const workerContent = readFileSync(WORKER_INV_FILE);

      const clientHash = createHash('sha256').update(clientContent).digest('hex');
      const workerHash = createHash('sha256').update(workerContent).digest('hex');

      // Architectural parity: Client and Cloudflare Worker invariants must remain 100% byte-for-byte identical
      expect(clientHash).toBe(workerHash);

      // Behavioral integrity: Replaces brittle historical exact-hash with targeted invariant protection checks
      const numCheck = validateInvariants('Growth of 45%', 'Growth of 99%');
      expect(numCheck.numbersPreserved).toBe(false);
      expect(numCheck.criticalViolation).toBe(true);

      const citCheck = validateInvariants('Prior art [12]', 'Prior art [99]');
      expect(citCheck.citationsPreserved).toBe(false);
      expect(citCheck.criticalViolation).toBe(true);

      const negCheck = validateInvariants('The drug is not toxic', 'The drug is toxic');
      expect(negCheck.negationsPreserved).toBe(false);
      expect(negCheck.criticalViolation).toBe(true);
    });

    it('verifies independent Phase 10 fixture scale, checksum, and balanced genre distribution', () => {
      expect(existsSync(FIXTURES_FILE)).toBe(true);

      const raw = readFileSync(FIXTURES_FILE, 'utf-8');
      const hash = createHash('sha256').update(raw).digest('hex');
      expect(hash).toBe('2c609e4903e14706875ca16983b327c3c81d1d845993c2a4b22f14893403ada1');

      const items = JSON.parse(raw);
      expect(items.length).toBeGreaterThanOrEqual(100);
      expect(items.length).toBe(125);

      const genreCounts: Record<string, number> = {};
      for (const item of items) {
        expect(item.id).toBeDefined();
        expect(item.genre).toBeDefined();
        expect(item.category).toBeDefined();
        expect(item.sourceText).toBeDefined();
        expect(item.rewrittenText).toBeDefined();
        expect(item.groundTruth).toBeDefined();
        expect(item.groundTruth.expectedStatus).toMatch(/^(PASS|FAIL|MANUAL_REVIEW)$/);
        expect(item.groundTruth.expectedClassification).toMatch(/^(TRUE_NEGATIVE|TRUE_POSITIVE|APPROPRIATE_MANUAL_REVIEW)$/);
        expect(item.split).toBe('independent-test');

        genreCounts[item.genre] = (genreCounts[item.genre] || 0) + 1;
      }

      expect(genreCounts['academic']).toBe(25);
      expect(genreCounts['technical']).toBe(25);
      expect(genreCounts['professional']).toBe(25);
      expect(genreCounts['conversational']).toBe(25);
      expect(genreCounts['creative']).toBe(25);
    });
  });

  describe('Frozen Validator Benchmark Generalization (Task 3)', () => {
    it('executes frozen Phase 9 validator against independent dataset and verifies key metric bounds', () => {
      const items = JSON.parse(readFileSync(FIXTURES_FILE, 'utf-8'));

      let tn = 0;
      let tp = 0;
      let fp = 0;
      let fn = 0;

      for (const item of items) {
        const res = validateInvariants(item.sourceText, item.rewrittenText);

        if (item.groundTruth.expectedStatus === 'PASS') {
          if (res.isValid) tn++;
          else fp++;
        } else if (item.groundTruth.expectedStatus === 'FAIL') {
          if (!res.isValid) tp++;
          else fn++;
        }
      }

      const fpr = fp / (fp + tn);
      const fnr = fn / (fn + tp);
      const precision = tp / (tp + fp);
      const recall = tp / (tp + fn);
      const f1 = (2 * precision * recall) / (precision + recall);

      // Low false alarm rate on independent valid paraphrases (< 10%)
      expect(fpr).toBeLessThan(0.10);
      expect(fp).toBe(3);

      // Substantial reduction in missed drift compared to Phase 8's 45.1% FNR
      expect(fnr).toBeLessThan(0.20);
      expect(f1).toBeGreaterThan(0.85);

      console.log(`[Phase 10 Evaluation Verification] TN: ${tn}, TP: ${tp}, FP: ${fp}, FN: ${fn}`);
      console.log(`[Phase 10 Evaluation Verification] FPR: ${(fpr * 100).toFixed(1)}%, FNR: ${(fnr * 100).toFixed(1)}%, F1: ${f1.toFixed(3)}`);
    });

    it('verifies that Phase 8 high-severity vulnerabilities remain cleanly blocked on Phase 10', () => {
      const items = JSON.parse(readFileSync(FIXTURES_FILE, 'utf-8'));

      // Cardinal vs. ordinal swaps must all fail (zero false negatives)
      const cardinalOrdinalItems = items.filter((x: any) => x.category === 'cardinal_ordinal_swap');
      expect(cardinalOrdinalItems.length).toBe(5);
      for (const item of cardinalOrdinalItems) {
        const res = validateInvariants(item.sourceText, item.rewrittenText);
        expect(res.isValid, `Failed to reject cardinal/ordinal swap: ${item.id}`).toBe(false);
      }

      // Numeric boundary traps must all fail (zero false negatives)
      const boundaryItems = items.filter((x: any) => x.category === 'boundary_trap');
      expect(boundaryItems.length).toBe(8);
      for (const item of boundaryItems) {
        const res = validateInvariants(item.sourceText, item.rewrittenText);
        expect(res.isValid, `Failed to reject boundary trap: ${item.id}`).toBe(false);
      }

      // Valid negation movement must all pass (zero false alarms)
      const validNegMovement = items.filter((x: any) => x.category === 'valid_negation_movement');
      expect(validNegMovement.length).toBe(5);
      for (const item of validNegMovement) {
        const res = validateInvariants(item.sourceText, item.rewrittenText);
        expect(res.isValid, `False alarm on valid negation movement: ${item.id}`).toBe(true);
      }
    });
  });

  describe('Evaluation Reports & Blind Review Sheet Verification (Tasks 4 & 5)', () => {
    it('verifies structured evaluation report artifacts', () => {
      expect(existsSync(REPORT_JSON_FILE)).toBe(true);
      expect(existsSync(REPORT_MD_FILE)).toBe(true);

      const jsonReport = JSON.parse(readFileSync(REPORT_JSON_FILE, 'utf-8'));
      expect(jsonReport.metadata.phase).toContain('Phase 10');
      expect(jsonReport.metadata.datasetSampleCount).toBe(125);
      expect(jsonReport.metricsSummary.phase9.falseNegativeRate.rate).toBeLessThan(20);
      expect(jsonReport.metricsSummary.phase8.falseNegativeRate.rate).toBeGreaterThan(40);

      const mdReport = readFileSync(REPORT_MD_FILE, 'utf-8');
      expect(mdReport).toContain('# Phase 10: Independent Validation & Generalization Audit Report');
      expect(mdReport).toContain('Executive Summary & Core Results');
      expect(mdReport).toContain('Key Findings & Vulnerability Analysis');
    });

    it('verifies blind review sheet presentation and strict pending status', () => {
      expect(existsSync(BLIND_SHEET_FILE)).toBe(true);
      expect(existsSync(BLIND_KEY_FILE)).toBe(true);

      const sheet = readFileSync(BLIND_SHEET_FILE, 'utf-8');
      expect(sheet).toContain('# Phase 10: Randomized Blind A/B Human Quality Evaluation Sheet');
      expect(sheet).toContain('PENDING HUMAN REVIEW (Strict Integrity - Zero Fabricated Ratings)');
      expect(sheet).toContain('Meaning Preservation (1-5): [   ]');
      expect(sheet).toContain('Factual & Numerical Accuracy (1-5): [   ]');
      expect(sheet).toContain('Clarity & Coherence (1-5): [   ]');
      expect(sheet).toContain('Genre & Tone Fit (1-5): [   ]');
      expect(sheet).toContain('Unnecessary Editing (1-5): [   ]');
      expect(sheet).toContain('[ ] Output A  [ ] Output B  [ ] Tie  [ ] Neither is acceptable');
      expect(sheet).toContain('Reviewer Confidence:');

      // Zero fabricated human scores assertion
      expect(sheet).toContain('**Human Evaluation Progress:** 0 / 36 graded (PENDING)');
      expect(sheet).toContain('Strictly compliant with Zero-Fabrication Hard Constraint');
    });
  });
});
