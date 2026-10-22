# Phase 10.1: Confusion-Matrix Reconciliation & Artifact Integrity Audit Report

**Status:** COMPLETE (Evaluation-Integrity Correction & Baseline Reconciliation)  
**Evaluator Scope:** Deterministic Invariant Validator (Phase 8 Baseline vs. Frozen Phase 9)  
**Dataset Scale:** n = 125 held-out source-rewrite pairs  
**Dataset Checksum:** `2c609e4903e14706875ca16983b327c3c81d1d845993c2a4b22f14893403ada1`  
**Dataset Provenance:** `independently_generated_synthetic_evaluation` (Independently generated synthetic evaluation)  
**Integrity Audit:** Strictly preserves all baseline Phase 7, 8, 9, and 10 artifacts without modification.

---

## 1. Executive Summary & Core Reconciled Metrics

### Reconciled Binary Confusion Matrix (Clean Protocol: Binary-Eligible Cohort, n = 120)

Ambiguous cases ($n = 5$) are strictly quarantined from binary metrics and accounted for in a dedicated review table.

| Performance Dimension | Phase 8 Baseline | Frozen Phase 9 Hardened | Reconciled Delta / Impact |
| :--- | :---: | :---: | :---: |
| **Eligible Binary Samples** | **120** | **120** | 43 Valid + 77 Semantic Drift |
| **True Negatives (`TN`)** *(Correct Acceptance)* | 40 / 43 (93.02%) | **40 / 43 (93.02%)** | Baseline acceptance preserved |
| **True Positives (`TP`)** *(Drift Detected)* | 44 / 77 (57.14%) | **66 / 77 (85.71%)** | **+22 subtle corruptions caught** |
| **False Positives (`FP`)** *(False Alarms)* | 3 / 43 (6.98%) | **3 / 43 (6.98%)** | Zero increase in false alarms |
| **False Negatives (`FN`)** *(Missed Drift)* | 33 / 77 (42.86%) | **11 / 77 (14.29%)** | **Missed drift dropped by 66.7%** |
| **False Positive Rate (`FPR`)** | **6.98%** (3 / 43) | **6.98%** (3 / 43) | 95% CI: `0.024, 0.186` |
| **False Negative Rate (`FNR`)** | **42.86%** (33 / 77) | **14.29%** (11 / 77) | 95% CI: `0.082, 0.238` (**-28.57 pp**) |
| **Drift Detection Precision** | 93.62% (44 / 47) | **95.65% (66 / 69)** | High certainty when flagging |
| **Drift Detection Recall** | 57.14% (44 / 77) | **85.71% (66 / 77)** | **+28.57 percentage points** |
| **Drift Detection F1-Score** | 0.710 | **0.904** | **Significant generalization gain** |
| **Binary Classification Accuracy** | 70.00% (84 / 120) | **88.33% (106 / 120)** | **+18.33 percentage points** |

---

## 2. Ambiguous & Manual-Review Cohort Accounting (n = 5)

| Ambiguous Outcome Category | Sample Count | % of Ambiguous Cohort | Evaluator Disposition |
| :--- | :---: | :---: | :--- |
| **Correctly Routed to Manual Review** | **0 / 5** | 0.0% | Regex pattern did not match broad rhetorical forms |
| **Inappropriately Accepted as Valid** | **4 / 5** | 80.0% | Defaulted to valid because no token invariant failed |
| **Inappropriately Rejected as Drift** | **1 / 5** | 20.0% | Triggered negation warning (`p10_creat_16`) |

### Individual Ambiguous Sample Audit
1. `p10_acad_16_ambiguous_epistemic_rhetorical` (Academic): Inappropriate acceptance (`isValid: true`, rhetorical query flattened to declarative).
2. `p10_tech_17_ambiguous_configuration_syntax` (Technical): Inappropriate acceptance (`isValid: true`, promotional query flattened).
3. `p10_prof_16_ambiguous_corporate_rhetoric` (Professional): Inappropriate acceptance (`isValid: true`, corporate rhetorical Q&A flattened).
4. `p10_conv_16_ambiguous_idiomatic_expression` (Conversational): Inappropriate acceptance (`isValid: true`, rhetorical gym question flattened).
5. `p10_creat_16_ambiguous_metaphorical_riddle` (Creative): Inappropriate rejection (`isValid: false`, triggered negation warning).

---

## 3. Scoring Bug & Denominator Discrepancy Analysis

### Discrepancy 1: Denominators of 43 and 82 vs. Stated 49 and 72
- **Origin:** The dataset actually contains **43 PASS, 77 FAIL, and 5 MANUAL_REVIEW** (total = 125).
- **Explanation:** In the Phase 10 audit script, lines 334–335 dumped the 4 valid ambiguous cases into `FN` and the 1 rejected ambiguous case into `TP`.
  - Stated FAIL count: 77 + 5 ambiguous = **82** (`TP + FN = 67 + 15 = 82`).
  - Stated PASS count: 43 (`FP + TN = 3 + 40 = 43`).
- **Markdown Text Inconsistency:** The narrative text in Phase 10 referenced draft targets ("49 valid rewrites and 72 drift cases"), but the programmatic rate rows computed from JSON used the real denominators `43` and `82`.

### Discrepancy 2: Why was TN=40, FP=3, TP=67, FN=15 reported?
- Under the clean protocol:
  - Valid: 40 TN + 3 FP = 43.
  - Drift: 66 TP + 11 FN = 77.
- Under the contaminated Phase 10 script protocol:
  - 1 ambiguous case added to TP: $66 + 1 = 67$.
  - 4 ambiguous cases added to FN: $11 + 4 = 15$.
  - This explains the exact count mismatch.

---

## 4. Reconciled Genre Breakdown

| Genre | Total | Valid (PASS) | Drift (FAIL) | Ambiguous | P8 Correct / Total (%) | P9 Correct / Total (%) | P9 Missed (FN) | P9 False Alarm (FP) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Academic** | 25 | 8 | 16 | 1 | 17 / 24 (70.83%) | **22 / 24 (91.67%)** | 2 | 0 |
| **Technical** | 25 | 8 | 16 | 1 | 17 / 24 (70.83%) | **22 / 24 (91.67%)** | 2 | 0 |
| **Professional** | 25 | 9 | 15 | 1 | 17 / 24 (70.83%) | **23 / 24 (95.83%)** | 1 | 0 |
| **Conversational** | 25 | 9 | 15 | 1 | 16 / 24 (66.67%) | **18 / 24 (75.00%)** | 4 | 2 |
| **Creative** | 25 | 9 | 15 | 1 | 17 / 24 (70.83%) | **21 / 24 (87.50%)** | 2 | 1 |
| **Total** | **125** | **43** | **77** | **5** | **84 / 120 (70.00%)** | **106 / 120 (88.33%)** | **11** | **3** |

---

## 5. Reconciled Category Breakdown

| Category | Expected Status | Sample Count | Phase 8 TP/TN | Phase 8 FN/FP | Phase 9 TP/TN | Phase 9 FN/FP | Status |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| `valid_paraphrase` | PASS | 23 | 21 TN | 2 FP | **21 TN** | 2 FP | Stable |
| `valid_negation_movement` | PASS | 5 | 5 TN | 0 FP | **5 TN** | 0 FP | Perfect |
| `natural_structural_rewrite` | PASS | 10 | 9 TN | 1 FP | **9 TN** | 1 FP | Stable |
| `high_quality_unnecessary_edit` | PASS | 5 | 5 TN | 0 FP | **5 TN** | 0 FP | Perfect |
| `cardinal_ordinal_swap` | FAIL | 5 | 0 TP | 5 FN | **5 TP** | 0 FN | **Eradicated (100% caught)** |
| `boundary_trap` | FAIL | 8 | 8 TP | 0 FN | **8 TP** | 0 FN | **Eradicated (100% caught)** |
| `numeric_mutation` | FAIL | 13 | 13 TP | 0 FN | **13 TP** | 0 FN | **Eradicated (100% caught)** |
| `age_demographic_boundary` | FAIL | 4 | 4 TP | 0 FN | **4 TP** | 0 FN | **Eradicated (100% caught)** |
| `citation_mutation` | FAIL | 2 | 2 TP | 0 FN | **2 TP** | 0 FN | **Eradicated (100% caught)** |
| `lost_epistemic_hedging` | FAIL | 13 | 4 TP | 9 FN | **12 TP** | 1 FN | **Recovered +8 corruptions** |
| `negation_scope_shift` | FAIL | 6 | 2 TP | 4 FN | **5 TP** | 1 FN | **Recovered +3 corruptions** |
| `negation_target_shift` | FAIL | 4 | 0 TP | 4 FN | **3 TP** | 1 FN | **Recovered +3 corruptions** |
| `unsupported_addition` | FAIL | 9 | 4 TP | 5 FN | **7 TP** | 2 FN | **Recovered +3 corruptions** |
| `unit_scale_mutation` | FAIL | 7 | 5 TP | 2 FN | **5 TP** | 2 FN | Stable |
| `reversed_causality` | FAIL | 6 | 2 TP | 4 FN | **2 TP** | 4 FN | Transitive verb limit |
| `ambiguous_rhetorical` | MANUAL | 5 | 0 Manual | 4 acc / 1 rej | **0 Manual** | 4 acc / 1 rej | Quarantined cohort |

---

## 6. Dataset Integrity & Provenance Audit

- **Total Sample Count:** 125 records.
- **Duplicate Verification:** Exactly 0 duplicate IDs; 0 duplicate source-rewrite text pairs.
- **Corpus Breadth:** 123 distinct domain corpora documented in provenance metadata.
- **Provenance Classification:** **Independently generated synthetic evaluation**.
  - All cases were generated algorithmically via TypeScript structures based on domain style-guides.
  - Zero private user data, zero external scraped data.
  - No human ratings have been fabricated; all results strictly represent programmatic validator outputs.

---

## 7. Artifact Integrity Verification (SHA-256 Checksums)

Every immutable baseline artifact has been verified byte-for-byte:

| Artifact Path | SHA-256 Checksum | Preservation Status |
| :--- | :--- | :---: |
| `tests/eval/fixtures/phase10_independent_semantic.json` | `2c609e4903e14706875ca16983b327c3c81d1d845993c2a4b22f14893403ada1` | **UNMODIFIED** |
| `tests/eval/artifacts/phase10_evaluation_report.json` | `20e0617e7463e515491dedd1b9124634c9d7978bcd76ffe139af75f161783dbd` | **UNMODIFIED** |
| `tests/eval/artifacts/phase10_blind_review_sheet.md` | `f613631a204d3b7fcde14b04b5316035e5a11ba05511fca4b011892bf6217496` | **UNMODIFIED** |
| `tests/eval/artifacts/phase10_blind_review_key.json` | `f97862ba6d63f9457218cbf2b2f44f9ff5840af66f59658fda83dde6120890c3` | **UNMODIFIED** |
| `tests/eval/fixtures/phase9_heldout_semantic.json` | `daebf06f4ca77ecaa154ff52603283ba6cda3b57c7987228c5c624af24188e73` | **UNMODIFIED** |
| `tests/eval/artifacts/phase9_audit_report.json` | `5bde1ed12f963e624982543750c7307a4bfa069301fd3390ff14059f5e02af41` | **UNMODIFIED** |
| `tests/eval/artifacts/phase8_reevaluation_report.json` | `4ebdbfefaa3be64c4a04dac8377a45121194c753d6a58bb7191fc98c75935a83` | **UNMODIFIED** |
| `tests/eval/artifacts/phase7_live_results.json` | `776181a1584c043aac971261f511e64afe4c1ca8df00dde1ca785b104069be76` | **UNMODIFIED** |
