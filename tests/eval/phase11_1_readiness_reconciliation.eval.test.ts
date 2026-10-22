import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

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
];

const FROZEN_RUNTIME_VALIDATOR_FILES = [
  { path: resolve(__dirname, '../../src/lib/pipeline/invariants.ts'), expectedHash: 'bdf75533e8e77b374089fcbd1c5354838f2173ef7b082323253866a42ff059a9' },
  { path: resolve(__dirname, '../../workers/api/src/pipeline/invariants.ts'), expectedHash: 'bdf75533e8e77b374089fcbd1c5354838f2173ef7b082323253866a42ff059a9' },
];

const PHASE11_1_FILES = {
  json: resolve(ARTIFACTS_DIR, 'phase11_1_readiness_metric_audit.json'),
  md: resolve(ARTIFACTS_DIR, 'phase11_1_readiness_metric_audit.md'),
};

describe('Phase 11.1: Evaluation Report Integrity & Readiness Metric Reconciliation', () => {
  describe('Immutable Artifact & Frozen Code Preservation (Hard Constraint)', () => {
    it('verifies SHA-256 byte-for-byte hashes of all historical baseline artifacts', () => {
      for (const item of IMMUTABLE_ARTIFACTS) {
        expect(existsSync(item.path), `Missing immutable artifact: ${item.path}`).toBe(true);
        const content = readFileSync(item.path);
        const hash = createHash('sha256').update(content).digest('hex');
        expect(hash, `Hash mismatch on immutable artifact: ${item.path}`).toBe(item.expectedHash);
      }
    });

    it('verifies SHA-256 byte-for-byte hashes of frozen runtime invariants.ts files', () => {
      for (const item of FROZEN_RUNTIME_VALIDATOR_FILES) {
        expect(existsSync(item.path), `Missing runtime file: ${item.path}`).toBe(true);
        const content = readFileSync(item.path);
        const hash = createHash('sha256').update(content).digest('hex');
        expect(hash, `Hash mismatch on frozen runtime validator: ${item.path}`).toBe(item.expectedHash);
      }
    });
  });

  describe('Confusion Matrix & Binary Cohort Reconciliation (Tasks 1, 2, 3)', () => {
    it('verifies binary sample count equals TN + FP + TP + FN', () => {
      const raw = readFileSync(PHASE11_1_FILES.json, 'utf-8');
      const data = JSON.parse(raw);
      const cm = data.confusionMatrixReconciled;

      expect(cm.trueNegatives).toBe(40);
      expect(cm.falsePositives).toBe(3);
      expect(cm.truePositives).toBe(66);
      expect(cm.falseNegatives).toBe(11);

      const calculatedTotal = cm.trueNegatives + cm.falsePositives + cm.truePositives + cm.falseNegatives;
      expect(calculatedTotal).toBe(120);
      expect(cm.totalBinary).toBe(120);
      expect(data.metadata.binaryEligibleSamples).toBe(120);
    });

    it('verifies valid cohort equals TN + FP and drift cohort equals TP + FN', () => {
      const raw = readFileSync(PHASE11_1_FILES.json, 'utf-8');
      const data = JSON.parse(raw);
      const cm = data.confusionMatrixReconciled;

      const validCohort = cm.trueNegatives + cm.falsePositives;
      const driftCohort = cm.truePositives + cm.falseNegatives;

      expect(validCohort).toBe(43);
      expect(driftCohort).toBe(77);
      expect(validCohort + driftCohort).toBe(120);
    });

    it('verifies ambiguous cases (5) are strictly excluded from binary denominators', () => {
      const raw = readFileSync(PHASE11_1_FILES.json, 'utf-8');
      const data = JSON.parse(raw);

      expect(data.metadata.datasetTotalSamples).toBe(125);
      expect(data.metadata.ambiguousQuarantinedSamples).toBe(5);
      expect(data.metadata.binaryEligibleSamples).toBe(120);

      const amb = data.ambiguousCohortDisposition;
      expect(amb.totalAmbiguous).toBe(5);
      expect(amb.correctlyRoutedToManualReview).toBe(0);
      expect(amb.inappropriatelyAcceptedAsValid).toBe(4);
      expect(amb.inappropriatelyRejectedAsDrift).toBe(1);
      expect(amb.independentlyAdjudicatedByHumans).toBe(0);
      expect(amb.humanReviewStatus).toBe('PENDING');
    });

    it('verifies all percentages match exact mathematical fraction calculations', () => {
      const raw = readFileSync(PHASE11_1_FILES.json, 'utf-8');
      const data = JSON.parse(raw);
      const cm = data.confusionMatrixReconciled;
      const metrics = data.correctedReadinessMetrics.metrics;

      // Accuracy: (TN + TP) / total = 106 / 120 = 88.33%
      const acc = (cm.trueNegatives + cm.truePositives) / cm.totalBinary;
      expect(metrics.accuracy.fraction).toBe('106 / 120');
      expect(metrics.accuracy.percentage).toBe('88.33%');
      expect(Math.abs(metrics.accuracy.value - acc)).toBeLessThan(0.0001);

      // Precision: TP / (TP + FP) = 66 / 69 = 95.65%
      const prec = cm.truePositives / (cm.truePositives + cm.falsePositives);
      expect(metrics.precision.fraction).toBe('66 / 69');
      expect(metrics.precision.percentage).toBe('95.65%');
      expect(Math.abs(metrics.precision.value - prec)).toBeLessThan(0.0001);

      // Recall: TP / (TP + FN) = 66 / 77 = 85.71%
      const rec = cm.truePositives / (cm.truePositives + cm.falseNegatives);
      expect(metrics.recall.fraction).toBe('66 / 77');
      expect(metrics.recall.percentage).toBe('85.71%');
      expect(Math.abs(metrics.recall.value - rec)).toBeLessThan(0.0001);

      // Specificity: TN / (TN + FP) = 40 / 43 = 93.02%
      const spec = cm.trueNegatives / (cm.trueNegatives + cm.falsePositives);
      expect(metrics.specificity.fraction).toBe('40 / 43');
      expect(metrics.specificity.percentage).toBe('93.02%');
      expect(Math.abs(metrics.specificity.value - spec)).toBeLessThan(0.0001);

      // FPR: FP / (TN + FP) = 3 / 43 = 6.98%
      const fpr = cm.falsePositives / (cm.trueNegatives + cm.falsePositives);
      expect(metrics.falsePositiveRate.fraction).toBe('3 / 43');
      expect(metrics.falsePositiveRate.percentage).toBe('6.98%');
      expect(Math.abs(metrics.falsePositiveRate.value - fpr)).toBeLessThan(0.0001);

      // FNR: FN / (TP + FN) = 11 / 77 = 14.29%
      const fnr = cm.falseNegatives / (cm.truePositives + cm.falseNegatives);
      expect(metrics.falseNegativeRate.fraction).toBe('11 / 77');
      expect(metrics.falseNegativeRate.percentage).toBe('14.29%');
      expect(Math.abs(metrics.falseNegativeRate.value - fnr)).toBeLessThan(0.0001);

      // F1: 2TP / (2TP + FP + FN) = 132 / 146 = 0.9041...
      const f1 = (2 * cm.truePositives) / (2 * cm.truePositives + cm.falsePositives + cm.falseNegatives);
      expect(metrics.f1Score.fraction).toBe('132 / 146');
      expect(metrics.f1Score.value).toBe(0.904);
      expect(Math.abs(f1 - 0.9041)).toBeLessThan(0.001);
    });

    it('verifies F1 derives from the same confusion matrix as precision and recall', () => {
      const raw = readFileSync(PHASE11_1_FILES.json, 'utf-8');
      const data = JSON.parse(raw);
      const cm = data.confusionMatrixReconciled;

      const p = cm.truePositives / (cm.truePositives + cm.falsePositives);
      const r = cm.truePositives / (cm.truePositives + cm.falseNegatives);
      const harmonicMean = (2 * p * r) / (p + r);
      const matrixF1 = (2 * cm.truePositives) / (2 * cm.truePositives + cm.falsePositives + cm.falseNegatives);

      expect(Math.abs(harmonicMean - matrixF1)).toBeLessThan(1e-10);
      expect(Math.round(harmonicMean * 1000) / 1000).toBe(0.904);
    });
  });

  describe('Audit of Phase 11 Claims & Review Status (Task 5)', () => {
    it('verifies human-review status remains PENDING and zero ratings are fabricated', () => {
      const raw = readFileSync(PHASE11_1_FILES.json, 'utf-8');
      const data = JSON.parse(raw);

      expect(data.humanReviewCompletionStatus.status).toBe('PENDING');
      expect(data.humanReviewCompletionStatus.completedReviewsCount).toBe(0);
      expect(data.humanReviewCompletionStatus.distinctReviewersCount).toBe(0);
      expect(data.humanReviewCompletionStatus.missingScoresCount).toBe(36);
      expect(data.humanReviewCompletionStatus.zeroFabricationConfirmed).toBe(true);
    });

    it('verifies the 11 false negatives match the Phase 10.1 audit items exactly', () => {
      const raw11_1 = readFileSync(PHASE11_1_FILES.json, 'utf-8');
      const raw10_1 = readFileSync(resolve(ARTIFACTS_DIR, 'phase10_1_metric_audit.json'), 'utf-8');

      const data11_1 = JSON.parse(raw11_1);
      const data10_1 = JSON.parse(raw10_1);

      expect(data11_1.frozenFalseNegatives.count).toBe(11);
      expect(data11_1.frozenFalseNegatives.cases.length).toBe(11);

      const ids11_1 = data11_1.frozenFalseNegatives.cases.map((c: any) => c.id).sort();
      const ids10_1 = data10_1.binaryFalseNegativesDetail.map((c: any) => c.id).sort();

      expect(ids11_1).toEqual(ids10_1);
    });

    it('verifies the Markdown report contains all required discrepancy sections and tables', () => {
      const md = readFileSync(PHASE11_1_FILES.md, 'utf-8');

      expect(md).toContain('# Phase 11.1: Evaluation Report Integrity & Readiness Metric Reconciliation');
      expect(md).toContain('## 1. Executive Summary & Root Cause Analysis');
      expect(md).toContain('## 2. Discrepancy & Reconciliation Table');
      expect(md).toContain('## 3. Ambiguous-Case Exclusion Policy & Accounting');
      expect(md).toContain('## 4. Frozen False-Negative Failure Classes (11 Missed Drifts)');
      expect(md).toContain('## 5. Human Quality Evaluation Protocol & Blinding Disclosure');
      expect(md).toContain('## 6. Corrected Readiness Assessment & Final Verdict');

      expect(md).toContain('88.33%');
      expect(md).toContain('95.65%');
      expect(md).toContain('85.71%');
      expect(md).toContain('93.02%');
      expect(md).toContain('6.98%');
      expect(md).toContain('14.29%');
      expect(md).toContain('0.904');
      expect(md).toContain('CONDITIONAL_NOT_PRODUCTION_READY');
    });
  });

  describe('Isolated Synthetic Metric Calculator Invariant Verification [SYNTHETIC TEST DATA]', () => {
    function computeSyntheticMetrics(tn: number, fp: number, tp: number, fn: number) {
      const total = tn + fp + tp + fn;
      const accuracy = (tn + tp) / total;
      const precision = tp / (tp + fp);
      const recall = tp / (tp + fn);
      const specificity = tn / (tn + fp);
      const fpr = fp / (tn + fp);
      const fnr = fn / (tp + fn);
      const f1 = (2 * tp) / (2 * tp + fp + fn);
      return { total, accuracy, precision, recall, specificity, fpr, fnr, f1 };
    }

    it('verifies mathematical identity: Accuracy = Specificity * (TN+FP)/Total + Recall * (TP+FN)/Total', () => {
      const synth = computeSyntheticMetrics(40, 3, 66, 11);
      const expectedWeightedAcc = (synth.specificity * (43 / 120)) + (synth.recall * (77 / 120));
      expect(Math.abs(synth.accuracy - expectedWeightedAcc)).toBeLessThan(1e-12);
    });

    it('verifies mathematical identity: FPR + Specificity = 1.0', () => {
      const synth = computeSyntheticMetrics(40, 3, 66, 11);
      expect(Math.abs(synth.fpr + synth.specificity - 1.0)).toBeLessThan(1e-12);
    });

    it('verifies mathematical identity: FNR + Recall = 1.0', () => {
      const synth = computeSyntheticMetrics(40, 3, 66, 11);
      expect(Math.abs(synth.fnr + synth.recall - 1.0)).toBeLessThan(1e-12);
    });
  });
});
