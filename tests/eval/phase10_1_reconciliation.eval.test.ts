import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const FIXTURE_P10_FILE = resolve(__dirname, 'fixtures/phase10_independent_semantic.json');
const REPORT_P10_JSON_FILE = resolve(__dirname, 'artifacts/phase10_evaluation_report.json');
const REPORT_P10_1_JSON_FILE = resolve(__dirname, 'artifacts/phase10_1_metric_audit.json');
const REPORT_P10_1_MD_FILE = resolve(__dirname, 'artifacts/phase10_1_metric_audit.md');

const BASELINE_FILES = [
  { path: resolve(__dirname, 'fixtures/phase10_independent_semantic.json'), expectedHash: '2c609e4903e14706875ca16983b327c3c81d1d845993c2a4b22f14893403ada1' },
  { path: resolve(__dirname, 'artifacts/phase10_evaluation_report.json'), expectedHash: '20e0617e7463e515491dedd1b9124634c9d7978bcd76ffe139af75f161783dbd' },
  { path: resolve(__dirname, 'artifacts/phase10_blind_review_sheet.md'), expectedHash: 'f613631a204d3b7fcde14b04b5316035e5a11ba05511fca4b011892bf6217496' },
  { path: resolve(__dirname, 'artifacts/phase10_blind_review_key.json'), expectedHash: 'f97862ba6d63f9457218cbf2b2f44f9ff5840af66f59658fda83dde6120890c3' },
  { path: resolve(__dirname, 'fixtures/phase9_heldout_semantic.json'), expectedHash: 'daebf06f4ca77ecaa154ff52603283ba6cda3b57c7987228c5c624af24188e73' },
  { path: resolve(__dirname, 'artifacts/phase9_audit_report.json'), expectedHash: '5bde1ed12f963e624982543750c7307a4bfa069301fd3390ff14059f5e02af41' },
  { path: resolve(__dirname, 'artifacts/phase8_reevaluation_report.json'), expectedHash: '4ebdbfefaa3be64c4a04dac8377a45121194c753d6a58bb7191fc98c75935a83' },
  { path: resolve(__dirname, 'artifacts/phase7_live_results.json'), expectedHash: '776181a1584c043aac971261f511e64afe4c1ca8df00dde1ca785b104069be76' },
];

describe('Phase 10.1: Confusion-Matrix Reconciliation & Artifact Integrity Audit', () => {
  describe('Immutable Baseline Artifact Preservation (Hard Constraint)', () => {
    it('verifies byte-level SHA-256 hashes of all prior baseline artifacts', () => {
      for (const item of BASELINE_FILES) {
        expect(existsSync(item.path), `Missing artifact: ${item.path}`).toBe(true);
        const content = readFileSync(item.path);
        const hash = createHash('sha256').update(content).digest('hex');
        expect(hash, `Hash mismatch on: ${item.path}`).toBe(item.expectedHash);
      }
    });
  });

  describe('Dataset Integrity & True Ground-Truth Distribution (Task 4)', () => {
    it('verifies exact sample counts, absence of duplicates, and true label distribution', () => {
      const raw = readFileSync(FIXTURE_P10_FILE, 'utf-8');
      const fixtures = JSON.parse(raw);

      expect(fixtures.length).toBe(125);

      const ids = new Set<string>();
      const pairs = new Set<string>();
      const statusCounts = { PASS: 0, FAIL: 0, MANUAL_REVIEW: 0 };
      const genreCounts: Record<string, number> = {};

      for (const item of fixtures) {
        expect(ids.has(item.id)).toBe(false);
        ids.add(item.id);

        const pair = `${item.sourceText} ---> ${item.rewrittenText}`;
        expect(pairs.has(pair)).toBe(false);
        pairs.add(pair);

        statusCounts[item.groundTruth.expectedStatus]++;
        genreCounts[item.genre] = (genreCounts[item.genre] || 0) + 1;
      }

      // Exact verified label counts in immutable fixture
      expect(statusCounts.PASS).toBe(43);
      expect(statusCounts.FAIL).toBe(77);
      expect(statusCounts.MANUAL_REVIEW).toBe(5);

      // Balanced genre distribution (25 each)
      expect(genreCounts['academic']).toBe(25);
      expect(genreCounts['technical']).toBe(25);
      expect(genreCounts['professional']).toBe(25);
      expect(genreCounts['conversational']).toBe(25);
      expect(genreCounts['creative']).toBe(25);
    });
  });

  describe('Confusion Matrix Reconciliation & Metric Verification (Tasks 2 & 3)', () => {
    it('recomputes clean binary confusion matrix directly from recorded results', () => {
      const report = JSON.parse(readFileSync(REPORT_P10_JSON_FILE, 'utf-8'));
      const detailed = report.detailedResults;

      expect(detailed.length).toBe(125);

      let p9_tn = 0, p9_fp = 0, p9_tp = 0, p9_fn = 0;
      let p9_amb_manual = 0, p9_amb_accept = 0, p9_amb_reject = 0;

      let p8_tn = 0, p8_fp = 0, p8_tp = 0, p8_fn = 0;

      for (const r of detailed) {
        const expected = r.groundTruth.expectedStatus;

        // Phase 9
        const p9Valid = r.phase9.result.isValid;
        const p9Manual = !!r.phase9.result.manualReviewRequired;

        if (expected === 'PASS') {
          if (p9Valid) p9_tn++;
          else p9_fp++;
        } else if (expected === 'FAIL') {
          if (!p9Valid) p9_tp++;
          else p9_fn++;
        } else if (expected === 'MANUAL_REVIEW') {
          if (p9Manual) p9_amb_manual++;
          else if (p9Valid) p9_amb_accept++;
          else p9_amb_reject++;
        }

        // Phase 8
        const p8Valid = r.phase8.result.isValid;
        if (expected === 'PASS') {
          if (p8Valid) p8_tn++;
          else p8_fp++;
        } else if (expected === 'FAIL') {
          if (!p8Valid) p8_tp++;
          else p8_fn++;
        }
      }

      // Reconciled Phase 9 Clean Binary Matrix
      expect(p9_tn).toBe(40);
      expect(p9_fp).toBe(3);
      expect(p9_tp).toBe(66);
      expect(p9_fn).toBe(11);

      // Ambiguous breakdown
      expect(p9_amb_manual).toBe(0);
      expect(p9_amb_accept).toBe(4);
      expect(p9_amb_reject).toBe(1);

      // Reconciled Phase 8 Clean Binary Matrix
      expect(p8_tn).toBe(40);
      expect(p8_fp).toBe(3);
      expect(p8_tp).toBe(44);
      expect(p8_fn).toBe(33);

      // Binary rate checks
      const p9_fpr = p9_fp / (p9_fp + p9_tn); // 3 / 43
      const p9_fnr = p9_fn / (p9_fn + p9_tp); // 11 / 77
      const p8_fnr = p8_fn / (p8_fn + p8_tp); // 33 / 77

      expect(p9_fpr).toBeCloseTo(3 / 43, 4);
      expect(p9_fnr).toBeCloseTo(11 / 77, 4);
      expect(p8_fnr).toBeCloseTo(33 / 77, 4);

      // Improvement: 22 corruptions recovered (33 -> 11)
      expect(p8_fn - p9_fn).toBe(22);
      expect(p8_fnr - p9_fnr).toBeGreaterThan(0.28); // > 28 percentage points reduction in FNR
    });

    it('verifies Phase 10.1 corrected audit report artifacts exist and are accurate', () => {
      expect(existsSync(REPORT_P10_1_JSON_FILE)).toBe(true);
      expect(existsSync(REPORT_P10_1_MD_FILE)).toBe(true);

      const jsonReport = JSON.parse(readFileSync(REPORT_P10_1_JSON_FILE, 'utf-8'));
      expect(jsonReport.metadata.phase).toContain('Phase 10.1');
      expect(jsonReport.metadata.totalRecords).toBe(125);
      expect(jsonReport.metricReconciliationTable.cleanBinaryProtocol.eligibleSamples).toBe(120);
      expect(jsonReport.metricReconciliationTable.cleanBinaryProtocol.phase9.fn).toBe(11);
      expect(jsonReport.metricReconciliationTable.cleanBinaryProtocol.phase9.tp).toBe(66);
      expect(jsonReport.metricReconciliationTable.cleanBinaryProtocol.phase9.tn).toBe(40);
      expect(jsonReport.metricReconciliationTable.cleanBinaryProtocol.phase9.fp).toBe(3);

      const mdReport = readFileSync(REPORT_P10_1_MD_FILE, 'utf-8');
      expect(mdReport).toContain('# Phase 10.1: Confusion-Matrix Reconciliation & Artifact Integrity Audit Report');
      expect(mdReport).toContain('Executive Summary & Core Reconciled Metrics');
      expect(mdReport).toContain('Scoring Bug & Denominator Discrepancy Analysis');
    });
  });
});
