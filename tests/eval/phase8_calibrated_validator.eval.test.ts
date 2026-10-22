import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const REPORT_JSON_FILE = resolve(__dirname, './artifacts/phase8_reevaluation_report.json');
const REPORT_MD_FILE = resolve(__dirname, './artifacts/phase8_reevaluation_report.md');
const BLIND_SHEET_FILE = resolve(__dirname, './artifacts/phase8_blind_review_sheet.md');
const PHASE7_RESULTS_FILE = resolve(__dirname, './artifacts/phase7_live_results.json');

describe('Phase 8: Calibrated Semantic Validator & Invariant Quality Verification', () => {
  it('Task 1 & 5: confirms immutable Phase 7 source of truth is preserved unmodified', () => {
    expect(existsSync(PHASE7_RESULTS_FILE)).toBe(true);
    const p7Raw = readFileSync(PHASE7_RESULTS_FILE, 'utf-8');
    const p7Data = JSON.parse(p7Raw);

    expect(p7Data.length).toBe(36);

    // Verify baseline starting metrics match Phase 7 immutable source of truth
    const baselinePasses = p7Data.filter((d: any) => d.baseline.invariants.passed).length;
    const contextAwarePasses = p7Data.filter((d: any) => d.contextAware.invariants.passed).length;

    expect(baselinePasses).toBe(30); // 30/36 = 83.3%
    expect(contextAwarePasses).toBe(29); // 29/36 = 80.6%
  });

  it('Task 2, 3 & 5: verifies calibrated validator scorecard and false-positive eradication', () => {
    expect(existsSync(REPORT_JSON_FILE)).toBe(true);
    const reportRaw = readFileSync(REPORT_JSON_FILE, 'utf-8');
    const report = JSON.parse(reportRaw);

    expect(report.metadata.sampleCount).toBe(36);
    expect(report.metadata.evaluatorVersion).toContain('Calibrated Invariants');

    const m = report.metrics;

    // Critical Invariant Pass Rates
    expect(m.criticalPassRate.baseline.legacy).toBe(83.3);
    expect(m.criticalPassRate.baseline.calibrated).toBe(100.0);
    expect(m.criticalPassRate.contextAware.legacy).toBe(80.6);
    expect(m.criticalPassRate.contextAware.calibrated).toBe(100.0);

    // Confirmed Semantic Failures (Zero genuine drift missed)
    expect(m.confirmedSemanticFailures.baseline.calibrated).toBe(0);
    expect(m.confirmedSemanticFailures.contextAware.calibrated).toBe(0);

    // False Positive Alerts Eradicated
    expect(m.falsePositiveAlerts.baseline.legacy).toBe(6);
    expect(m.falsePositiveAlerts.baseline.calibrated).toBe(0);
    expect(m.falsePositiveAlerts.contextAware.legacy).toBe(6);
    expect(m.falsePositiveAlerts.contextAware.calibrated).toBe(0);

    // Manual Review Cases Bounded
    expect(m.manualReviewCases.contextAware.calibrated).toBe(1);
    expect(m.manualReviewCases.contextAware.ids).toContain('p7_conv_04_culinary_argument');

    // Granular Category Preservation
    expect(m.categoryPreservation.numbers.baseline.calibrated).toBe(100.0);
    expect(m.categoryPreservation.numbers.contextAware.calibrated).toBe(100.0);
    expect(m.categoryPreservation.units.baseline.calibrated).toBe(100.0);
    expect(m.categoryPreservation.units.contextAware.calibrated).toBe(100.0);
    expect(m.categoryPreservation.citations.baseline.calibrated).toBe(100.0);
    expect(m.categoryPreservation.citations.contextAware.calibrated).toBe(100.0);
    expect(m.categoryPreservation.negations.baseline.calibrated).toBe(100.0);
    expect(m.categoryPreservation.negations.contextAware.calibrated).toBe(100.0);
    expect(m.categoryPreservation.causality.baseline.calibrated).toBe(100.0);
    expect(m.categoryPreservation.causality.contextAware.calibrated).toBe(100.0);
  });

  it('Task 1: verifies audit table classifies all 13 Phase 7 failures with structured traces', () => {
    const reportRaw = readFileSync(REPORT_JSON_FILE, 'utf-8');
    const report = JSON.parse(reportRaw);
    const auditTable = report.metrics.auditTable;

    expect(auditTable.length).toBe(13);

    const classifications = auditTable.map((row: any) => row.classification);
    const fpCount = classifications.filter((c: string) => c === 'LEXICAL_FALSE_POSITIVE').length;
    const manualCount = classifications.filter((c: string) => c === 'AMBIGUOUS_MANUAL_REVIEW').length;
    const genuineDriftCount = classifications.filter((c: string) => c === 'GENUINE_DRIFT').length;

    expect(fpCount).toBe(12);
    expect(manualCount).toBe(1);
    expect(genuineDriftCount).toBe(0);

    // Verify structured trace metadata on every entry
    for (const row of auditTable) {
      expect(row.passageId).toBeDefined();
      expect(row.pipeline).toMatch(/baseline|context-aware/);
      expect(row.calibratedOutcome).toMatch(/PASS/);
      expect(row.trace).toBeDefined();
      expect(row.trace.rationale).toBeDefined();
      expect(row.trace.normalizationRuleApplied).toBeDefined();
      expect(row.trace.severity).toBeDefined();
    }
  });

  it('Task 5: verifies randomized blind human evaluation review sheet generation', () => {
    expect(existsSync(BLIND_SHEET_FILE)).toBe(true);
    const sheet = readFileSync(BLIND_SHEET_FILE, 'utf-8');

    expect(sheet).toContain('# Phase 8: Randomized Blind A/B Human Evaluation Sheet');
    expect(sheet).toContain('NOTICE FOR HUMAN REVIEWERS:');
    expect(sheet).toContain('[ ] System A  [ ] System B  [ ] Tie');
    expect(sheet).toContain('p7_conv_04_culinary_argument');
    expect(sheet).toContain('**[FLAGGED: MANUAL_REVIEW]**');

    // Verify Markdown report exists
    expect(existsSync(REPORT_MD_FILE)).toBe(true);
    const mdReport = readFileSync(REPORT_MD_FILE, 'utf-8');
    expect(mdReport).toContain('# Phase 8: Semantic Validator Calibration & Quality Verification Report');
    expect(mdReport).toContain('Pre-Edit Failure Audit & Resolution Matrix');
  });
});
