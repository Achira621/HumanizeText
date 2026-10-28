import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import {
  computeStandardizedMetric,
  generatePhase11_3Data,
  generatePhase11_3Markdown,
} from '../../scripts/generate_phase11_3_final_metric_consistency';

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
  { path: resolve(ARTIFACTS_DIR, 'phase11_2_final_readiness_audit.json'), expectedHash: '1c57be1523059f78a42ec7bb0bd764c74535208fa1a3aa099535aea4d53ce9b6' },
  { path: resolve(ARTIFACTS_DIR, 'phase11_2_final_readiness_audit.md'), expectedHash: 'ec04ee18c0089b9e6a5941d1c4e960cec288cb01345127f6277e55d1f4cbd2bd' },
];

const FROZEN_RUNTIME_VALIDATOR_FILES = [
  { path: resolve(__dirname, '../../src/lib/pipeline/invariants.ts'), expectedHash: 'bdf75533e8e77b374089fcbd1c5354838f2173ef7b082323253866a42ff059a9' },
  { path: resolve(__dirname, '../../workers/api/src/pipeline/invariants.ts'), expectedHash: 'bdf75533e8e77b374089fcbd1c5354838f2173ef7b082323253866a42ff059a9' },
];

const PHASE11_3_FILES = {
  json: resolve(ARTIFACTS_DIR, 'phase11_3_final_metric_consistency.json'),
  md: resolve(ARTIFACTS_DIR, 'phase11_3_final_metric_consistency.md'),
};

describe('Phase 11.3: Final Metric Consistency & Audit Closure', () => {
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

  describe('Standardized Percentage & Exact Delta Calculations (Task 1 & Task 2)', () => {
    it('verifies metrics are computed from raw confusion counts (TN=40, FP=3, TP=66, FN=11)', () => {
      const raw = readFileSync(PHASE11_3_FILES.json, 'utf-8');
      const data = JSON.parse(raw);
      const cm = data.confusionMatrixReconciled;

      expect(cm.trueNegatives).toBe(40);
      expect(cm.falsePositives).toBe(3);
      expect(cm.truePositives).toBe(66);
      expect(cm.falseNegatives).toBe(11);
      expect(cm.totalBinary).toBe(120);
    });

    it('verifies delta sign convention is delta = corrected exact - previously reported exact', () => {
      const raw = readFileSync(PHASE11_3_FILES.json, 'utf-8');
      const data = JSON.parse(raw);
      expect(data.metadata.deltaSignConvention).toBe('delta = corrected exact metric - previously reported exact metric');

      const byName: Record<string, any> = {};
      data.standardizedMetricsTable.forEach((m: any) => {
        byName[m.metricName] = m;
      });

      // Accuracy: 106/120 - 105/120 = +1/120 = +0.8333 pp -> +0.83 percentage points
      const acc = byName['Accuracy'];
      expect(acc.correctedBenchmark.fraction).toBe('106 / 120');
      expect(acc.correctedBenchmark.displayPercentage).toBe('88.33%');
      expect(acc.historicalReported.fraction).toBe('105 / 120');
      expect(acc.historicalReported.displayPercentage).toBe('87.50%');
      expect(acc.reconciledDelta.displayDelta).toBe('+0.83 percentage points');
      expect(acc.reconciledDelta.exactDeltaUnrounded).toBeCloseTo(0.8333, 3);

      // Precision: 66/69 - 66/67 = -2.8553 pp -> -2.86 percentage points
      const prec = byName['Precision'];
      expect(prec.correctedBenchmark.fraction).toBe('66 / 69');
      expect(prec.correctedBenchmark.displayPercentage).toBe('95.65%');
      expect(prec.historicalReported.fraction).toBe('66 / 67');
      expect(prec.historicalReported.displayPercentage).toBe('98.51%');
      expect(prec.reconciledDelta.displayDelta).toBe('-2.86 percentage points');
      expect(prec.reconciledDelta.exactDeltaUnrounded).toBeCloseTo(-2.8553, 3);

      // Recall: 66/77 - 66/77 = 0.0000 pp -> 0.00 percentage points (zero exact delta verified)
      const rec = byName['Recall'];
      expect(rec.correctedBenchmark.fraction).toBe('66 / 77');
      expect(rec.correctedBenchmark.displayPercentage).toBe('85.71%');
      expect(rec.historicalReported.fraction).toBe('66 / 77');
      expect(rec.historicalReported.displayPercentage).toBe('85.71%');
      expect(rec.reconciledDelta.displayDelta).toBe('0.00 percentage points');
      expect(rec.reconciledDelta.exactDeltaUnrounded).toBe(0.0);

      // Specificity: 40/43 - 42/43 = -2/43 = -4.6512 pp -> -4.65 percentage points
      const spec = byName['Specificity'];
      expect(spec.correctedBenchmark.fraction).toBe('40 / 43');
      expect(spec.correctedBenchmark.displayPercentage).toBe('93.02%');
      expect(spec.historicalReported.fraction).toBe('42 / 43');
      expect(spec.historicalReported.displayPercentage).toBe('97.67%');
      expect(spec.reconciledDelta.displayDelta).toBe('-4.65 percentage points');
      expect(spec.reconciledDelta.exactDeltaUnrounded).toBeCloseTo(-4.6512, 3);

      // FPR: 3/43 - 1/43 = +2/43 = +4.6512 pp -> +4.65 percentage points
      const fpr = byName['False-Positive Rate (FPR)'];
      expect(fpr.correctedBenchmark.fraction).toBe('3 / 43');
      expect(fpr.correctedBenchmark.displayPercentage).toBe('6.98%');
      expect(fpr.historicalReported.fraction).toBe('1 / 43');
      expect(fpr.historicalReported.displayPercentage).toBe('2.33%');
      expect(fpr.reconciledDelta.displayDelta).toBe('+4.65 percentage points');
      expect(fpr.reconciledDelta.exactDeltaUnrounded).toBeCloseTo(4.6512, 3);

      // FNR: Missing historical value yields N/A
      const fnr = byName['False-Negative Rate (FNR)'];
      expect(fnr.historicalReported.fraction).toBe('N/A (Omitted)');
      expect(fnr.historicalReported.displayPercentage).toBe('N/A');
      expect(fnr.reconciledDelta.displayDelta).toBe('N/A');
      expect(fnr.reconciledDelta.exactDeltaUnrounded).toBeNull();
      expect(fnr.reconciledDelta.unit).toBe('N/A');

      // F1 Score: 132/146 - 0.917 = -0.01289... -> -0.0129
      const f1 = byName['F1 Score'];
      expect(f1.correctedBenchmark.fraction).toBe('132 / 146');
      expect(f1.correctedBenchmark.displayPercentage).toBe('0.9041');
      expect(f1.historicalReported.displayPercentage).toBe('0.917');
      expect(f1.reconciledDelta.displayDelta).toBe('-0.0129');
      expect(f1.reconciledDelta.exactDeltaUnrounded).toBeCloseTo(-0.01289, 4);
    });

    it('verifies FPR and Specificity use consistent display rounding (2.33% and 97.67%)', () => {
      const raw = readFileSync(PHASE11_3_FILES.json, 'utf-8');
      const data = JSON.parse(raw);

      const byName: Record<string, any> = {};
      data.standardizedMetricsTable.forEach((m: any) => {
        byName[m.metricName] = m;
      });

      // 1/43 = 2.32558...% -> 2.33%
      expect(byName['False-Positive Rate (FPR)'].historicalReported.displayPercentage).toBe('2.33%');

      // 42/43 = 97.6744...% -> 97.67%
      expect(byName['Specificity'].historicalReported.displayPercentage).toBe('97.67%');

      // Sum of 1/43 and 42/43 display percentages equals exactly 100.00%
      const fprDisp = parseFloat(byName['False-Positive Rate (FPR)'].historicalReported.displayPercentage);
      const specDisp = parseFloat(byName['Specificity'].historicalReported.displayPercentage);
      expect(fprDisp + specDisp).toBe(100.00);
    });

    it('verifies that Markdown and JSON representation are completely synchronized', () => {
      const rawJson = readFileSync(PHASE11_3_FILES.json, 'utf-8');
      const md = readFileSync(PHASE11_3_FILES.md, 'utf-8');
      const data = JSON.parse(rawJson);

      for (const m of data.standardizedMetricsTable) {
        expect(md).toContain(`**${m.metricName}**`);
        expect(md).toContain(m.historicalReported.displayPercentage);
        expect(md).toContain(m.correctedBenchmark.displayPercentage);
        expect(md).toContain(m.reconciledDelta.displayDelta);
      }
    });
  });

  describe('Programmatic Metric Standardization Unit Tests (Task 1 & Task 4)', () => {
    it('throws error when denominator is zero', () => {
      expect(() => {
        computeStandardizedMetric('Faulty', '0/0', 0, 0, null, 10, 0, false, '', '');
      }).toThrow('Corrected denominator for Faulty cannot be zero.');
    });

    it('handles missing historical metrics cleanly with N/A', () => {
      const result = computeStandardizedMetric(
        'MissingMetric',
        'N/A',
        null,
        null,
        null,
        15,
        100,
        false,
        'Omitted',
        'Testing omitted'
      );
      expect(result.historicalReported.displayPercentage).toBe('N/A');
      expect(result.reconciledDelta.displayDelta).toBe('N/A');
      expect(result.reconciledDelta.unit).toBe('N/A');
      expect(result.reconciledDelta.exactDeltaUnrounded).toBeNull();
    });

    it('verifies generatePhase11_3Data matches generatePhase11_3Markdown', () => {
      const data = generatePhase11_3Data();
      const md = generatePhase11_3Markdown(data);

      expect(md).toContain('Phase 11.3: Final Metric Consistency & Audit Closure');
      expect(md).toContain('+0.83 percentage points');
      expect(md).toContain('-2.86 percentage points');
      expect(md).toContain('0.00 percentage points');
      expect(md).toContain('-4.65 percentage points');
      expect(md).toContain('+4.65 percentage points');
      expect(md).toContain('-0.0129');
    });
  });

  describe('Readiness & Evaluation Status Integrity (Task 3)', () => {
    it('verifies human-review status remains PENDING and unadulterated', () => {
      const raw = readFileSync(PHASE11_3_FILES.json, 'utf-8');
      const data = JSON.parse(raw);

      expect(data.humanReviewCompletionStatus.status).toBe('PENDING');
      expect(data.humanReviewCompletionStatus.completedReviewsCount).toBe(0);
      expect(data.humanReviewCompletionStatus.distinctReviewersCount).toBe(0);
      expect(data.humanReviewCompletionStatus.missingScoresCount).toBe(36);
      expect(data.humanReviewCompletionStatus.zeroFabricationConfirmed).toBe(true);
    });

    it('verifies ambiguous cohort (5) remains quarantined outside binary metrics', () => {
      const raw = readFileSync(PHASE11_3_FILES.json, 'utf-8');
      const data = JSON.parse(raw);

      expect(data.ambiguousCohortDisposition.totalAmbiguous).toBe(5);
      expect(data.ambiguousCohortDisposition.correctlyRoutedToManualReview).toBe(0);
      expect(data.ambiguousCohortDisposition.inappropriatelyAcceptedAsValid).toBe(4);
      expect(data.ambiguousCohortDisposition.inappropriatelyRejectedAsDrift).toBe(1);
      expect(data.ambiguousCohortDisposition.independentlyAdjudicatedByHumans).toBe(0);
      expect(data.ambiguousCohortDisposition.humanReviewStatus).toBe('PENDING');
    });

    it('verifies the final readiness verdict remains CONDITIONAL_NOT_PRODUCTION_READY', () => {
      const raw = readFileSync(PHASE11_3_FILES.json, 'utf-8');
      const data = JSON.parse(raw);

      expect(data.finalAuditClosureVerdict.verdict).toBe('CONDITIONAL_NOT_PRODUCTION_READY');
      expect(data.finalAuditClosureVerdict.reasons.length).toBe(3);
    });
  });
});
