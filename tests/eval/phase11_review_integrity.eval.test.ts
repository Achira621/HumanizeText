import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const IMMUTABLE_ARTIFACTS = [
  { path: resolve(__dirname, 'artifacts/phase7_live_results.json'), expectedHash: '776181a1584c043aac971261f511e64afe4c1ca8df00dde1ca785b104069be76' },
  { path: resolve(__dirname, 'artifacts/phase8_reevaluation_report.json'), expectedHash: '4ebdbfefaa3be64c4a04dac8377a45121194c753d6a58bb7191fc98c75935a83' },
  { path: resolve(__dirname, 'artifacts/phase8_blind_review_sheet.md'), expectedHash: '65931d82b77d371387f35bc690a39eb4f40501558972825a87e025f3b203d0d0' },
  { path: resolve(__dirname, 'artifacts/phase9_audit_report.json'), expectedHash: '5bde1ed12f963e624982543750c7307a4bfa069301fd3390ff14059f5e02af41' },
  { path: resolve(__dirname, 'artifacts/phase9_audit_report.md'), expectedHash: 'c3823632b4812b70ab40df27ee89ed4163fd5506b25efdbe2d69b10ea3690f4b' },
  { path: resolve(__dirname, 'artifacts/phase10_evaluation_report.json'), expectedHash: '20e0617e7463e515491dedd1b9124634c9d7978bcd76ffe139af75f161783dbd' },
  { path: resolve(__dirname, 'artifacts/phase10_evaluation_report.md'), expectedHash: 'c4545eb1ee132b7ac7964a8a9ea32a23ae50566786cdb03c77a5345ec1636a46' },
  { path: resolve(__dirname, 'artifacts/phase10_1_metric_audit.json'), expectedHash: 'e39121919ff022cf582e3b6b4e61adf5037d64c94add3cb7f426f19f3e13e1fc' },
  { path: resolve(__dirname, 'artifacts/phase10_1_metric_audit.md'), expectedHash: '9b933db5307451c1e2dd4356048882dca2edc076ef73c8128e0175250b386662' },
  { path: resolve(__dirname, 'artifacts/phase10_blind_review_sheet.md'), expectedHash: 'f613631a204d3b7fcde14b04b5316035e5a11ba05511fca4b011892bf6217496' },
  { path: resolve(__dirname, 'artifacts/phase10_blind_review_key.json'), expectedHash: 'f97862ba6d63f9457218cbf2b2f44f9ff5840af66f59658fda83dde6120890c3' },
];

const FROZEN_RUNTIME_VALIDATOR_FILES = [
  { path: resolve(__dirname, '../../src/lib/pipeline/invariants.ts'), expectedHash: 'bdf75533e8e77b374089fcbd1c5354838f2173ef7b082323253866a42ff059a9' },
  { path: resolve(__dirname, '../../workers/api/src/pipeline/invariants.ts'), expectedHash: 'bdf75533e8e77b374089fcbd1c5354838f2173ef7b082323253866a42ff059a9' },
];

const PHASE11_FILES = {
  reviewerSheet: resolve(__dirname, 'artifacts/phase11_reviewer_sheet.md'),
  reviewFormCsv: resolve(__dirname, 'artifacts/phase11_review_form.csv'),
  reviewerInstructions: resolve(__dirname, 'artifacts/phase11_reviewer_instructions.md'),
  reviewStatusJson: resolve(__dirname, 'artifacts/phase11_review_status.json'),
  ambiguousCaseReview: resolve(__dirname, 'artifacts/phase11_ambiguous_case_review.md'),
  falseNegativeReview: resolve(__dirname, 'artifacts/phase11_false_negative_review.md'),
};

describe('Phase 11: Human Quality Evaluation & Validator Readiness Assessment', () => {
  describe('Immutable Baseline Artifact Preservation (Hard Constraint)', () => {
    it('verifies SHA-256 byte-for-byte hashes of all immutable baseline artifacts', () => {
      for (const item of IMMUTABLE_ARTIFACTS) {
        expect(existsSync(item.path), `Missing immutable artifact: ${item.path}`).toBe(true);
        const content = readFileSync(item.path);
        const hash = createHash('sha256').update(content).digest('hex');
        expect(hash, `Hash mismatch on immutable artifact: ${item.path}`).toBe(item.expectedHash);
      }
    });

    it('verifies SHA-256 byte-for-byte hashes of frozen runtime invariants.ts', () => {
      for (const item of FROZEN_RUNTIME_VALIDATOR_FILES) {
        expect(existsSync(item.path), `Missing runtime file: ${item.path}`).toBe(true);
        const content = readFileSync(item.path);
        const hash = createHash('sha256').update(content).digest('hex');
        expect(hash, `Hash mismatch on frozen runtime validator: ${item.path}`).toBe(item.expectedHash);
      }
    });
  });

  describe('Review Workflow Integrity & Non-Fabrication (Task 1 & Task 2)', () => {
    it('verifies all 6 Phase 11 artifacts exist and are non-empty', () => {
      for (const [key, path] of Object.entries(PHASE11_FILES)) {
        expect(existsSync(path), `Missing Phase 11 artifact: ${key} at ${path}`).toBe(true);
        const content = readFileSync(path, 'utf-8');
        expect(content.trim().length, `Empty Phase 11 artifact: ${key}`).toBeGreaterThan(0);
      }
    });

    it('verifies phase11_review_status.json has status PENDING and 0 completed reviews (no fabricated ratings)', () => {
      const raw = readFileSync(PHASE11_FILES.reviewStatusJson, 'utf-8');
      const status = JSON.parse(raw);

      expect(status.status).toBe('PENDING');
      expect(status.evaluationDesign.targetComparisonsCount).toBe(36);
      expect(status.evaluationDesign.completedReviewsCount).toBe(0);
      expect(status.evaluationDesign.distinctReviewersCount).toBe(0);
      expect(status.evaluationDesign.missingScoresCount).toBe(36);
      expect(status.evaluationDesign.zeroFabricationConfirmed).toBe(true);
    });

    it('verifies phase11_review_form.csv has 36 data rows with unpopulated human rating fields', () => {
      const raw = readFileSync(PHASE11_FILES.reviewFormCsv, 'utf-8');
      const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
      const header = lines[0];

      expect(lines.length).toBe(37); // Header + 36 comparison rows
      expect(header).toContain('comparison_id');
      expect(header).toContain('overall_preference');
      expect(header).toContain('meaning_preservation_a_1to5');

      // Check that all 36 data rows have empty human response columns (15 commas at end)
      for (let i = 1; i < lines.length; i++) {
        const row = lines[i];
        expect(row.endsWith(',,,,,,,,,,,,,,,')).toBe(true);
      }
    });

    it('verifies phase11_reviewer_sheet.md contains all 36 anonymized comparison blocks with evaluation rubrics', () => {
      const md = readFileSync(PHASE11_FILES.reviewerSheet, 'utf-8');
      for (let i = 1; i <= 36; i++) {
        const id = `P11_CASE_${String(i).padStart(2, '0')}`;
        expect(md).toContain(`### Comparison ${i}: [${id}]`);
        expect(md).toContain('**[Source Passage]:**');
        expect(md).toContain('**[Anonymized Output A]:**');
        expect(md).toContain('**[Anonymized Output B]:**');
        expect(md).toContain('Meaning Preservation (1-5): Output A [   ] | Output B [   ]');
        expect(md).toContain('- **Overall Preference:** [ ] Output A  [ ] Output B  [ ] Tie  [ ] Neither is acceptable');
      }
    });
  });

  describe('Ambiguous-Case Adjudication Preparation (Task 4)', () => {
    it('verifies phase11_ambiguous_case_review.md covers all 5 manual review cases from Phase 10', () => {
      const md = readFileSync(PHASE11_FILES.ambiguousCaseReview, 'utf-8');
      const expectedIds = [
        'p10_acad_16_ambiguous_epistemic_rhetorical',
        'p10_tech_17_ambiguous_configuration_syntax',
        'p10_prof_16_ambiguous_corporate_rhetoric',
        'p10_conv_16_ambiguous_idiomatic_expression',
        'p10_creat_16_ambiguous_metaphorical_riddle',
      ];

      for (const id of expectedIds) {
        expect(md).toContain(`[${id}]`);
        expect(md).toContain('**Documented Ground-Truth Rationale:**');
        expect(md).toContain('**Automated Validator Outcome:**');
        expect(md).toContain('**Why Automatic Acceptance/Rejection May Be Unsafe:**');
        expect(md).toContain('**Human Adjudication Question:**');
        expect(md).toContain('**Human Adjudicator Decision (To be filled by human reviewer):**');
      }

      // Check summary table mentions all 5 cases
      expect(md).toContain('**Total Ambiguous Cohort** | **5**');
      expect(md).toContain('**Status:** PENDING HUMAN ADJUDICATION');
    });
  });

  describe('False-Negative Semantic Review Preparation (Task 5)', () => {
    it('verifies phase11_false_negative_review.md covers all 11 binary false negatives from Phase 10.1', () => {
      const md = readFileSync(PHASE11_FILES.falseNegativeReview, 'utf-8');
      const expectedIds = [
        'p10_acad_07_reversed_causality',
        'p10_acad_23_causal_chain_inversion',
        'p10_prof_07_reversed_causality_corporate',
        'p10_conv_07_reversed_causality_flight',
        'p10_tech_16_memory_unit_scale_mutation',
        'p10_tech_25_hardware_frequency_mutation',
        'p10_conv_06_unsupported_addition_party',
        'p10_creat_06_unsupported_addition_magical_lore',
        'p10_conv_10_negation_target_shift_food',
        'p10_creat_15_negation_scope_stars',
        'p10_conv_25_hedging_destruction_rumor',
      ];

      for (const id of expectedIds) {
        expect(md).toContain(`### Case [${id}]`);
        expect(md).toContain('**Documented Ground-Truth Rationale:**');
        expect(md).toContain('**Frozen Validator Result:** `isValid: true` (Passed silently as valid text)');
        expect(md).toContain('**Why This Error Matters:**');
        expect(md).toContain('**Evidence Required for Human Confirmation:**');
        expect(md).toContain('**Human Adjudication:** [ ] Confirmed False Negative  [ ] Acceptable Edge Case  [ ] Reviewer Disagrees with Ground Truth');
      }

      // Verify the 5 required category sections exist
      expect(md).toContain('## 1. Reversed Causal Direction (4 cases)');
      expect(md).toContain('## 2. Unit-Scale Mutations (2 cases)');
      expect(md).toContain('## 3. Unsupported Qualitative Narrative Hallucinations (2 cases)');
      expect(md).toContain('## 4. Negation & Quantifier Scope Shifts (2 cases)');
      expect(md).toContain('## 5. Lost Epistemic Hedging / Rumor Escalation (1 case)');
    });
  });
});
