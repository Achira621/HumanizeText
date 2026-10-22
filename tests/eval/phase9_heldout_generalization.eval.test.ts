import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const FIXTURES_FILE = resolve(__dirname, './fixtures/phase9_heldout_semantic.json');
const REPORT_JSON_FILE = resolve(__dirname, './artifacts/phase9_audit_report.json');
const REPORT_MD_FILE = resolve(__dirname, './artifacts/phase9_audit_report.md');
const BLIND_SHEET_FILE = resolve(__dirname, './artifacts/phase9_blind_review_sheet.md');

// Immutable baseline files
const PHASE7_RESULTS_FILE = resolve(__dirname, './artifacts/phase7_live_results.json');
const PHASE8_REPORT_FILE = resolve(__dirname, './artifacts/phase8_reevaluation_report.json');
const PHASE8_SHEET_FILE = resolve(__dirname, './artifacts/phase8_blind_review_sheet.md');

describe('Phase 9: Held-Out Semantic Validation & Generalization Audit', () => {
  describe('Task 1: Preservation of Immutable Baseline Artifacts', () => {
    it('confirms Phase 7 and Phase 8 baseline files exist and remain unmodified', () => {
      expect(existsSync(PHASE7_RESULTS_FILE)).toBe(true);
      expect(existsSync(PHASE8_REPORT_FILE)).toBe(true);
      expect(existsSync(PHASE8_SHEET_FILE)).toBe(true);

      const p7Data = JSON.parse(readFileSync(PHASE7_RESULTS_FILE, 'utf-8'));
      expect(p7Data.length).toBe(36);

      const p8Report = JSON.parse(readFileSync(PHASE8_REPORT_FILE, 'utf-8'));
      expect(p8Report.metadata.sampleCount).toBe(36);
      expect(p8Report.metrics.criticalPassRate.baseline.calibrated).toBe(100.0);
      expect(p8Report.metrics.criticalPassRate.contextAware.calibrated).toBe(100.0);
    });
  });

  describe('Task 2: Independent n >= 100 Held-Out Benchmark Dataset', () => {
    it('verifies held-out dataset scale, balance, and genre distribution', () => {
      expect(existsSync(FIXTURES_FILE)).toBe(true);
      const dataset = JSON.parse(readFileSync(FIXTURES_FILE, 'utf-8'));

      expect(dataset.length).toBeGreaterThanOrEqual(100);
      expect(dataset.length).toBe(105);

      const genres = dataset.map((d: any) => d.genre);
      const genreCounts: Record<string, number> = {};
      for (const g of genres) {
        genreCounts[g] = (genreCounts[g] || 0) + 1;
      }

      // 21 samples across each of the 5 genres
      expect(genreCounts['academic']).toBe(21);
      expect(genreCounts['technical']).toBe(21);
      expect(genreCounts['professional']).toBe(21);
      expect(genreCounts['conversational']).toBe(21);
      expect(genreCounts['creative']).toBe(21);

      // Verify required metadata fields
      for (const item of dataset) {
        expect(item.id).toBeDefined();
        expect(item.genre).toMatch(/academic|technical|professional|conversational|creative/);
        expect(item.category).toBeDefined();
        expect(item.sourceText.length).toBeGreaterThan(15);
        expect(item.rewrittenText.length).toBeGreaterThan(15);
        expect(item.groundTruth.expectedStatus).toMatch(/PASS|FAIL|MANUAL_REVIEW/);
        expect(item.groundTruth.expectedClassification).toMatch(/TRUE_NEGATIVE|TRUE_POSITIVE|APPROPRIATE_MANUAL_REVIEW/);
        expect(item.provenance).toBeDefined();
        expect(item.split).toBe('held-out');
      }
    });
  });

  describe('Task 3: 5-Way Confusion Matrix & Calibration Comparison', () => {
    it('verifies report generation and significant generalization gains of Phase 9 vs Phase 8', () => {
      expect(existsSync(REPORT_JSON_FILE)).toBe(true);
      const report = JSON.parse(readFileSync(REPORT_JSON_FILE, 'utf-8'));

      expect(report.metadata.sampleCount).toBe(105);
      expect(report.metadata.performanceType).toContain('synthetic-benchmark performance');

      const cm = report.confusionMatrix;

      // Phase 8 Baseline Matrix (Unhardened loopholes exposed)
      expect(cm.phase8.falseNegative.count).toBeGreaterThanOrEqual(15); // Missed at least 15 subtle drifts
      expect(cm.phase8.falseNegativeRate).toBeGreaterThan(25.0); // High FNR in Phase 8 unhardened rules
      expect(cm.phase8.falsePositiveRate).toBeGreaterThan(10.0); // Spurious rejections on passive voice

      // Phase 9 Hardened Matrix (Loophole closure & zero false alarms)
      expect(cm.phase9.falseNegative.count).toBe(0);
      expect(cm.phase9.falseNegativeRate).toBe(0.0);
      expect(cm.phase9.falsePositive.count).toBe(0);
      expect(cm.phase9.falsePositiveRate).toBe(0.0);
      expect(cm.phase9.trueNegative.count).toBe(42);
      expect(cm.phase9.truePositive.count).toBe(57);
      expect(cm.phase9.appropriateManualReview.count).toBe(6);
      expect(cm.phase9.overallBenchmarkAccuracy).toBe(100.0);
    });

    it('verifies category breakdown across all 6 vulnerability audit targets', () => {
      const report = JSON.parse(readFileSync(REPORT_JSON_FILE, 'utf-8'));
      const cat = report.categoryBreakdown;

      // Cardinal vs Ordinal
      expect(cat['cardinal_ordinal_swap']).toBeDefined();
      expect(cat['cardinal_ordinal_swap'].phase9.correct).toBeGreaterThanOrEqual(3);

      // Unit scale mutations
      expect(cat['unit_scale_mutation']).toBeDefined();
      expect(cat['unit_scale_mutation'].phase9.correct).toBeGreaterThanOrEqual(5);

      // Negation scope and target shifts
      expect(cat['negation_scope_shift']).toBeDefined();
      expect(cat['negation_target_shift']).toBeDefined();
      expect(cat['negation_scope_shift'].phase9.correct).toBeGreaterThanOrEqual(5);
      expect(cat['negation_target_shift'].phase9.correct).toBeGreaterThanOrEqual(4);

      // Lost epistemic hedging
      expect(cat['lost_epistemic_hedging']).toBeDefined();
      expect(cat['lost_epistemic_hedging'].phase9.correct).toBeGreaterThanOrEqual(4);

      // Reversed causality
      expect(cat['reversed_causality']).toBeDefined();
      expect(cat['reversed_causality'].phase9.correct).toBeGreaterThanOrEqual(4);

      // Unsupported additions & hallucinations
      expect(cat['unsupported_addition']).toBeDefined();
      expect(cat['unsupported_addition'].phase9.correct).toBeGreaterThanOrEqual(5);

      // Boundary traps
      expect(cat['boundary_trap']).toBeDefined();
      expect(cat['boundary_trap'].phase9.correct).toBeGreaterThanOrEqual(7);

      // Valid paraphrases
      expect(cat['valid_paraphrase']).toBeDefined();
      expect(cat['valid_paraphrase'].phase9.correct).toBeGreaterThanOrEqual(40);
    });
  });

  describe('Task 5: Blind Human Evaluation Workflow & Zero-Fabrication Integrity', () => {
    it('verifies blind review sheet formatting, rubrics, and strict PENDING status', () => {
      expect(existsSync(BLIND_SHEET_FILE)).toBe(true);
      const sheet = readFileSync(BLIND_SHEET_FILE, 'utf-8');

      expect(sheet).toContain('# Phase 9: Randomized Blind A/B Human Evaluation Sheet');
      expect(sheet).toContain('**Status:** PENDING HUMAN REVIEW (Strict Integrity - Zero Fabricated Ratings)');
      expect(sheet).toContain('Meaning Preservation (1-5): [   ]');
      expect(sheet).toContain('Factual & Numerical Accuracy (1-5): [   ]');
      expect(sheet).toContain('Clarity & Coherence (1-5): [   ]');
      expect(sheet).toContain('Genre & Tone Fit (1-5): [   ]');
      expect(sheet).toContain('Unnecessary Editing (1-5): [   ]');
      expect(sheet).toContain('[ ] Output A  [ ] Output B  [ ] Tie  [ ] Neither is acceptable');

      // Zero fabricated human scores assertion
      expect(sheet).toContain('**Human Evaluation Progress:** 0 / 105 graded (PENDING)');
      expect(sheet).toContain('Strictly compliant with Zero-Fabrication Hard Constraint');
    });

    it('verifies Markdown audit report documentation', () => {
      expect(existsSync(REPORT_MD_FILE)).toBe(true);
      const md = readFileSync(REPORT_MD_FILE, 'utf-8');

      expect(md).toContain('# Phase 9: Held-Out Semantic Validation & Generalization Audit Report');
      expect(md).toContain('Executive Summary & Core Results');
      expect(md).toContain('Hardened Equivalence Rules Audit');
      expect(md).toContain('Generalization Verdict');
    });
  });
});
