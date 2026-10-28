import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import {
  computeMetricDelta,
  generatePhase11_2Data,
  generatePhase11_2Markdown,
} from '../../scripts/generate_phase11_2_final_readiness_audit';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ARTIFACTS_DIR = resolve(__dirname, 'artifacts');

const IMMUTABLE_ARTIFACTS = [
  { path: resolve(ARTIFACTS_DIR, 'phase7_live_results.json'), expectedHash: '776181a1584c043aac971261f511e64afe4c1ca8df00dde1ca785b104069be76' },
  { path: resolve(ARTIFACTS_DIR, 'phase8_reevaluation_report.json'), expectedHash: '4ebdbfefaa3be64c4a04dac8377a45121194c753d6a58bb7191fc98c75935a83' },
  { path: resolve(ARTIFACTS_DIR, 'phase8_blind_review_sheet.md'), expectedHash: '65931d82b77d371387f35bc690a39eb4f40501558972825a87e025f3b203d0d0' },
  { path: resolve(ARTIFACTS_DIR, 'phase9_audit_report.json'), expectedHash: '5bde1ed12f963e624982543750c7307a4bfa069301fd3390ff14059f5e02af41' },
  { path: resolve(ARTIFACTS_DIR, 'phase9_audit_report.md'), expectedHash: 'c3823632b4812b70ab40df27ee89ed4163fd5506b25efdbe2d69b10ea3690f4b' },
  { path: resolve(ARTIFACTS_DIR, 'phase10_evaluation_report.json'), expectedHash: '20e0617e7463e515491dedd1b9124634c9d7978bcd76ffe139af75f161783dbd' },
  { path: resolve(ARTIFACTS_DIR, 'phase10_evaluation_report.md'), expectedHash: 'c4545eb1ee132b7ac7964a8a9ea32a23ae50566786cdb03c77a5345ec1636a46' },
  { path: resolve(ARTIFACTS_DIR, 'phase10_1_metric_audit.json'), expectedHash: 'e39121919ff022cf582e3b6b4e61adf5037d64c94add3cb7f426f19f3e13e1fc' },
  { path: resolve(ARTIFACTS_DIR, 'phase10_1_metric_audit.md'), expectedHash: '9b933db5307451c1e2dd4356048882dca2edc076ef73c8128e0175250b386662' },
  { path: resolve(ARTIFACTS_DIR, 'phase10_blind_review_sheet.md'), expectedHash: 'f613631a204d3b7fcde14b04b5316035e5a11ba05511fca4b011892bf6217496' },
  { path: resolve(ARTIFACTS_DIR, 'phase10_blind_review_key.json'), expectedHash: 'f97862ba6d63f9457218cbf2b2f44f9ff5840af66f59658fda83dde6120890c3' },
  { path: resolve(ARTIFACTS_DIR, 'phase11_reviewer_sheet.md'), expectedHash: '315df015080c4ac52f4b2f9df2ad2737b116584460b774aeecd22fbf940bbee5' },
  { path: resolve(ARTIFACTS_DIR, 'phase11_review_form.csv'), expectedHash: '118c09baebaee35a62d35c73df3d6079e0b9e5a3e1db8cabd11260dd14087243' },
  { path: resolve(ARTIFACTS_DIR, 'phase11_reviewer_instructions.md'), expectedHash: '7060602f51b84c2df597534d91c1ba7681a63dd1532b797dad839397d8e997c5' },
  { path: resolve(ARTIFACTS_DIR, 'phase11_review_status.json'), expectedHash: '99b2e15926197609b1d08498bd59319af372901fb2ca0d2ad0b91f112345634a' },
  { path: resolve(ARTIFACTS_DIR, 'phase11_ambiguous_case_review.md'), expectedHash: '7774e36e8e7ad2dcfe44e88d636ab92a9aadf4788cba355a16c1ce53c8d015e3' },
  { path: resolve(ARTIFACTS_DIR, 'phase11_false_negative_review.md'), expectedHash: '98b7d285dd5e65acb4ad0c57d1d6fd753cf548a14f9824b78b057884cf1501a3' },
  { path: resolve(ARTIFACTS_DIR, 'phase11_1_readiness_metric_audit.json'), expectedHash: '238d80e31b5596455ef9a302ddc45e4ec7216b36639479d366bc2c9d0ce1e7e9' },
  { path: resolve(ARTIFACTS_DIR, 'phase11_1_readiness_metric_audit.md'), expectedHash: '992f2e59a60d6dd7b9a703c0bfe4a9ff7d3fc0d761550577739f7ba0ef4ffcb9' },
];

const FROZEN_RUNTIME_VALIDATOR_FILES = [
  { path: resolve(__dirname, '../../src/lib/pipeline/invariants.ts'), expectedHash: 'bdf75533e8e77b374089fcbd1c5354838f2173ef7b082323253866a42ff059a9' },
  { path: resolve(__dirname, '../../workers/api/src/pipeline/invariants.ts'), expectedHash: 'bdf75533e8e77b374089fcbd1c5354838f2173ef7b082323253866a42ff059a9' },
];

const PHASE11_2_FILES = {
  json: resolve(ARTIFACTS_DIR, 'phase11_2_final_readiness_audit.json'),
  md: resolve(ARTIFACTS_DIR, 'phase11_2_final_readiness_audit.md'),
};

describe('Phase 11.2: Signed Metric Delta Verification & Final Readiness Report', () => {
  describe('Immutable Baseline Artifact Preservation (Hard Constraint)', () => {
    it('verifies SHA-256 byte-for-byte hashes of all historical baseline artifacts', () => {
      for (const item of IMMUTABLE_ARTIFACTS) {
        expect(existsSync(item.path), `Missing immutable artifact: ${item.path}`).toBe(true);
        const content = readFileSync(item.path);
        const hash = createHash('sha256').update(content).digest('hex');
        expect(hash, `Hash mismatch on immutable artifact: ${item.path}`).toBe(item.expectedHash);
      }
    });

    it('verifies architectural parity and runtime integrity of invariants.ts files', () => {
      const clientPath = resolve(__dirname, '../../src/lib/pipeline/invariants.ts');
      const workerPath = resolve(__dirname, '../../workers/api/src/pipeline/invariants.ts');
      expect(existsSync(clientPath)).toBe(true);
      expect(existsSync(workerPath)).toBe(true);

      const clientHash = createHash('sha256').update(readFileSync(clientPath)).digest('hex');
      const workerHash = createHash('sha256').update(readFileSync(workerPath)).digest('hex');

      // Architectural parity: Client and Cloudflare Worker invariants must remain byte-for-byte identical
      expect(clientHash).toBe(workerHash);
    });
  });

  describe('Signed Discrepancy Delta Audit (Task 1 & Task 2)', () => {
    it('verifies that delta sign convention follows delta = corrected - previously_reported', () => {
      const raw = readFileSync(PHASE11_2_FILES.json, 'utf-8');
      const data = JSON.parse(raw);
      expect(data.metadata.deltaSignConvention).toBe('delta = corrected value - previously reported value');

      const byName: Record<string, any> = {};
      data.metricComparisonsProgrammatic.forEach((m: any) => {
        byName[m.metricName] = m;
      });

      // Accuracy: Corrected 88.33% - Reported 87.50% = +0.83 percentage points
      const acc = byName['Accuracy'];
      expect(acc.signedDelta.percentagePointsDisplay).toBe('+0.83 percentage points');
      expect(acc.signedDelta.percentagePointsUnrounded).toBeGreaterThan(0.83);
      expect(acc.signedDelta.percentagePointsUnrounded).toBeLessThan(0.84);
      expect(acc.correctedBenchmark.fraction).toBe('106 / 120');
      expect(acc.previouslyReported.fraction).toBe('105 / 120');

      // Precision: Corrected 95.65% - Reported 98.50% = -2.85 percentage points
      const prec = byName['Precision'];
      expect(prec.signedDelta.percentagePointsDisplay).toBe('-2.85 percentage points');
      expect(prec.signedDelta.percentagePointsUnrounded).toBeLessThan(-2.85);
      expect(prec.signedDelta.percentagePointsUnrounded).toBeGreaterThan(-2.86);
      expect(prec.correctedBenchmark.fraction).toBe('66 / 69');
      expect(prec.previouslyReported.fraction).toBe('66 / 67');

      // Specificity: Corrected 93.02% - Reported 97.70% = -4.68 percentage points
      const spec = byName['Specificity'];
      expect(spec.signedDelta.percentagePointsDisplay).toBe('-4.68 percentage points');
      expect(spec.signedDelta.percentagePointsUnrounded).toBeLessThan(-4.65);
      expect(spec.signedDelta.percentagePointsUnrounded).toBeGreaterThan(-4.66);
      expect(spec.correctedBenchmark.fraction).toBe('40 / 43');
      expect(spec.previouslyReported.fraction).toBe('42 / 43');

      // False-Positive Rate: Corrected 6.98% - Reported 2.30% = +4.68 percentage points
      const fpr = byName['False-Positive Rate (FPR)'];
      expect(fpr.signedDelta.percentagePointsDisplay).toBe('+4.68 percentage points');
      expect(fpr.signedDelta.percentagePointsUnrounded).toBeGreaterThan(4.65);
      expect(fpr.signedDelta.percentagePointsUnrounded).toBeLessThan(4.66);
      expect(fpr.correctedBenchmark.fraction).toBe('3 / 43');
      expect(fpr.previouslyReported.fraction).toBe('1 / 43');

      // F1 Score: Corrected 0.9041 - Reported 0.9170 = -0.0129 score points
      const f1 = byName['F1 Score'];
      expect(f1.signedDelta.percentagePointsDisplay).toBe('-0.0129');
      expect(f1.signedDelta.rawNumericDelta).toBeLessThan(-0.0128);
      expect(f1.signedDelta.rawNumericDelta).toBeGreaterThan(-0.0130);
      expect(f1.correctedBenchmark.fraction).toBe('132 / 146');
    });

    it('verifies that Markdown and JSON representation are completely synchronized', () => {
      const rawJson = readFileSync(PHASE11_2_FILES.json, 'utf-8');
      const md = readFileSync(PHASE11_2_FILES.md, 'utf-8');
      const data = JSON.parse(rawJson);

      for (const comp of data.metricComparisonsProgrammatic) {
        expect(md).toContain(`**${comp.metricName}**`);
        expect(md).toContain(comp.correctedBenchmark.fraction);
        expect(md).toContain(comp.correctedBenchmark.percentageDisplay);
        expect(md).toContain(comp.signedDelta.percentagePointsDisplay);
      }
    });
  });

  describe('Programmatic Delta Utility Unit Tests (Task 2)', () => {
    it('throws error when denominator is zero', () => {
      expect(() => {
        computeMetricDelta('FaultyMetric', '0 / 0', '0%', 0, 10, 0, false, 'test error');
      }).toThrow('Denominator for metric FaultyMetric cannot be zero.');
    });

    it('correctly handles unpopulated previous metric values without NaN', () => {
      const result = computeMetricDelta(
        'NewMetric',
        'Not reported',
        'Not reported',
        null,
        15,
        100,
        false,
        'Newly tracked metric'
      );

      expect(result.previouslyReported.numericValue).toBeNull();
      expect(result.signedDelta.unit).toBe('unpopulated');
      expect(result.signedDelta.percentagePointsDisplay).toBe('+15.00 pp (from unpopulated)');
      expect(result.signedDelta.rawNumericDelta).toBeNull();
    });

    it('correctly formats score points vs percentage points', () => {
      const scoreResult = computeMetricDelta(
        'TestScore',
        '0.850',
        '0.850',
        0.850,
        9,
        10, // 0.900
        true,
        'Score test'
      );
      expect(scoreResult.signedDelta.unit).toBe('score_points');
      expect(scoreResult.signedDelta.percentagePointsDisplay).toBe('+0.0500');

      const pctResult = computeMetricDelta(
        'TestPct',
        '85.00%',
        '85.00%',
        0.850,
        9,
        10, // 90.00%
        false,
        'Pct test'
      );
      expect(pctResult.signedDelta.unit).toBe('percentage_points');
      expect(pctResult.signedDelta.percentagePointsDisplay).toBe('+5.00 percentage points');
    });

    it('verifies generatePhase11_2Data matches generatePhase11_2Markdown', () => {
      const data = generatePhase11_2Data();
      const md = generatePhase11_2Markdown(data);

      expect(md).toContain('Phase 11.2: Signed Metric Delta Verification & Final Readiness Report');
      expect(md).toContain('+0.83 percentage points');
      expect(md).toContain('-2.85 percentage points');
      expect(md).toContain('-4.68 percentage points');
      expect(md).toContain('+4.68 percentage points');
      expect(md).toContain('-0.0129');
    });
  });

  describe('Readiness & Evaluation Status Integrity (Task 3)', () => {
    it('verifies human-review status remains PENDING and unadulterated', () => {
      const raw = readFileSync(PHASE11_2_FILES.json, 'utf-8');
      const data = JSON.parse(raw);

      expect(data.humanReviewCompletionStatus.status).toBe('PENDING');
      expect(data.humanReviewCompletionStatus.completedReviewsCount).toBe(0);
      expect(data.humanReviewCompletionStatus.distinctReviewersCount).toBe(0);
      expect(data.humanReviewCompletionStatus.missingScoresCount).toBe(36);
      expect(data.humanReviewCompletionStatus.zeroFabricationConfirmed).toBe(true);
    });

    it('verifies the final readiness verdict remains CONDITIONAL_NOT_PRODUCTION_READY', () => {
      const raw = readFileSync(PHASE11_2_FILES.json, 'utf-8');
      const data = JSON.parse(raw);

      expect(data.finalReadinessVerdict.verdict).toBe('CONDITIONAL_NOT_PRODUCTION_READY');
      expect(data.finalReadinessVerdict.reasons.length).toBe(3);
    });
  });
});
