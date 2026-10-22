# Phase 11.2: Signed Metric Delta Verification & Final Readiness Report

**Audit Date:** 2026-10-22T02:48:08.033Z  
**Status:** COMPLETE (Programmatic Signed-Delta Verification)  
**Convention:** `delta = corrected value - previously reported value`  
**Target:** Eliminate remaining delta-sign inversion errors from Phase 11.1 and establish a fully reproducible reporting layer.

---

## 1. Root Cause of Signed-Delta Inversion in Phase 11.1

In the Phase 11.1 reconciliation report, delta values were computed using the inverted formula:

$$\Delta_{\text{erroneous}} = \text{reported value} - \text{corrected value}$$

This inverted the mathematical signs of the discrepancy column:
- An improvement in Accuracy (from 87.50% to 88.33%) was erroneously listed with a minus sign (`-0.83%`).
- A reduction in Precision (from 98.50% to 95.65%) was erroneously listed with a plus sign (`+2.85%`).
- A reduction in Specificity (from 97.70% to 93.02%) was erroneously listed with a plus sign (`+4.68%`).
- An increase in False-Positive Rate (from 2.30% to 6.98%) was erroneously listed with a minus sign (`-4.68%`).
- A reduction in F1 Score (from 0.917 to 0.904) was erroneously listed with a plus sign (`+0.013`).

### Corrected Standard Convention
In Phase 11.2, all comparisons strictly enforce the standard evaluation convention:

$$\Delta = \text{corrected value} - \text{previously reported value}$$

Under this convention:
- A **positive delta (+)** indicates the corrected true value is higher than previously claimed (the metric was previously understated).
- A **negative delta (−)** indicates the corrected true value is lower than previously claimed (the metric was previously overstated).

---

## 2. Programmatically Reconciled Metric & Signed-Delta Table

All values in the table below are computed directly from the frozen confusion matrix ($TN = 40, FP = 3, TP = 66, FN = 11$, Total Binary $= 120$):

| Evaluation Metric | Phase 11 Reported (Old Draft) | Corrected Phase 10.1 (True Benchmark) | Corrected Signed Delta ($\Delta = \text{Corr} - \text{Rep}$) | Root Cause & Diagnostic Summary |
| :--- | :--- | :--- | :--- | :--- |
| **Accuracy** | 105 / 120 (87.50%) | **106 / 120** (88.33%) | **+0.83 percentage points** | Phase 11 draft subtracted the stale contaminated Phase 10 error count 15 (120 - 15 = 105) rather than summing true predictions TN + TP (40 + 66 = 106). |
| **Precision** | 66 / 67 (98.50%) | **66 / 69** (95.65%) | **-2.85 percentage points** | Phase 11 draft denominator assumed FP = 1 (66 + 1 = 67) rather than true positive predictions (66 TP + 3 FP = 69). |
| **Recall** | 66 / 77 (85.70%) | **66 / 77** (85.71%) | **+0.01 percentage points** | Numerators and denominators matched correctly (66 TP / 77 true drift); minor +0.01 pp display difference from rounding. |
| **Specificity** | 42 / 43 (97.70%) | **40 / 43** (93.02%) | **-4.68 percentage points** | Phase 11 draft assumed 42 TN (43 - 1 FP) rather than true 40 TN (43 valid - 3 FP). |
| **False-Positive Rate (FPR)** | 1 / 43 (2.30%) | **3 / 43** (6.98%) | **+4.68 percentage points** | Phase 11 draft conflated the 1 inappropriately rejected manual review case (p10_creat_16) with valid-cohort false alarms, omitting the 3 valid-cohort false alarms. |
| **False-Negative Rate (FNR)** | Not reported (Not reported) | **11 / 77** (14.29%) | **+14.29 pp (from unpopulated)** | Metric was omitted from the Phase 11 readiness scorecard; now explicitly tracked as 14.29% (11 / 77). |
| **F1 Score** | Derived from precision/recall (0.917) | **132 / 146** (0.904) | **-0.0129** | Phase 11 draft derived F1 from inflated Precision (0.98507) and Recall (0.85714), yielding 0.9167 ≈ 0.917, rather than using true confusion matrix: 132 / 146 = 0.9041. |

---

## 3. Detailed Metric Derivations & Units

### 3.1 Accuracy
- **Formula:** $(TN + TP) / \text{Total Binary} = (40 + 66) / 120 = 106 / 120$
- **Corrected Value:** $88.3333\% \approx 88.33\%$
- **Previously Reported:** $105 / 120 = 87.50\%$
- **Display Signed Delta:** $88.33\% - 87.50\% = \mathbf{+0.83\text{ percentage points}}$
- **Exact Unrounded Delta:** $(106/120 - 105/120) \times 100 = +1/120 \times 100 = \mathbf{+0.8333\text{ percentage points}}$
- **Interpretation:** Accuracy was previously understated by 0.83 percentage points because the author subtracted 15 (stale Phase 10 FN count) from 120 rather than summing actual true predictions ($40 + 66 = 106$).

### 3.2 Precision
- **Formula:** $TP / (TP + FP) = 66 / (66 + 3) = 66 / 69$
- **Corrected Value:** $95.6522\% \approx 95.65\%$
- **Previously Reported:** $66 / 67 = 98.5075\% \approx 98.50\%$
- **Display Signed Delta:** $95.65\% - 98.50\% = \mathbf{-2.85\text{ percentage points}}$
- **Exact Unrounded Delta:** $(66/69 - 66/67) \times 100 = \mathbf{-2.8553\text{ percentage points}}$
- **Interpretation:** Precision was previously overstated by 2.85 percentage points due to assuming $FP = 1$ rather than $FP = 3$.

### 3.3 Recall
- **Formula:** $TP / (TP + FN) = 66 / (66 + 11) = 66 / 77$
- **Corrected Value:** $85.7143\% \approx 85.71\%$
- **Previously Reported:** $66 / 77 \approx 85.70\%$
- **Display Signed Delta:** $85.71\% - 85.70\% = \mathbf{+0.01\text{ percentage points}}$ (display rounding difference)
- **Exact Unrounded Delta:** $(66/77 - 66/77) \times 100 = \mathbf{0.0000\text{ percentage points}}$
- **Interpretation:** True drift detection recall was previously recorded accurately.

### 3.4 Specificity
- **Formula:** $TN / (TN + FP) = 40 / (40 + 3) = 40 / 43$
- **Corrected Value:** $93.0233\% \approx 93.02\%$
- **Previously Reported:** $42 / 43 = 97.6744\% \approx 97.70\%$
- **Display Signed Delta:** $93.02\% - 97.70\% = \mathbf{-4.68\text{ percentage points}}$
- **Exact Unrounded Delta:** $(40/43 - 42/43) \times 100 = -2/43 \times 100 = \mathbf{-4.6512\text{ percentage points}}$
- **Interpretation:** Specificity was previously overstated by 4.68 percentage points (display) / 4.65 percentage points (unrounded) due to assuming $TN = 42$ ($43 - 1$) rather than $TN = 40$ ($43 - 3$).

### 3.5 False-Positive Rate (FPR)
- **Formula:** $FP / (TN + FP) = 3 / (40 + 3) = 3 / 43$
- **Corrected Value:** $6.9767\% \approx 6.98\%$
- **Previously Reported:** $1 / 43 = 2.3256\% \approx 2.30\%$
- **Display Signed Delta:** $6.98\% - 2.30\% = \mathbf{+4.68\text{ percentage points}}$
- **Exact Unrounded Delta:** $(3/43 - 1/43) \times 100 = +2/43 \times 100 = \mathbf{+4.6512\text{ percentage points}}$
- **Interpretation:** False-positive rate was previously understated by 4.68 percentage points because 2 of the 3 true false alarms in the valid cohort were omitted.

### 3.6 False-Negative Rate (FNR)
- **Formula:** $FN / (TP + FN) = 11 / (66 + 11) = 11 / 77$
- **Corrected Value:** $14.2857\% \approx 14.29\%$
- **Previously Reported:** *Not reported*
- **Display Signed Delta:** $\mathbf{+14.29\text{ percentage points (populated from unpopulated state)}}$
- **Interpretation:** Missed drift rate was omitted from the previous table; now documented as 14.29% across 11 false negatives.

### 3.7 F1 Score
- **Formula:** $2TP / (2TP + FP + FN) = 132 / (132 + 3 + 11) = 132 / 146$
- **Corrected Value:** $0.904109... \approx \mathbf{0.9041}$ (or $0.904$)
- **Previously Reported:** $0.917$
- **Signed Delta:** $0.9041 - 0.9170 = \mathbf{-0.0129\text{ score points}}$
- **Interpretation:** F1 score was previously overstated by 0.0129 points due to being derived from the inflated Precision (0.98507) and Recall (0.85714).

---

## 4. Quarantined Ambiguous Cases & False Negatives

### 4.1 Ambiguous Cohort (5 Cases Quarantined Outside Binary Denominator)
- **Total Cases:** 5
- **Correctly Routed to Manual Review:** 0 / 5 (0.0%)
- **Inappropriately Accepted As Valid:** 4 / 5 (80.0%)
- **Inappropriately Rejected As Drift:** 1 / 5 (20.0%)
- **Human Adjudication Status:** **`PENDING`** (0 / 5 adjudicated)

### 4.2 False Negative Failure Classes (11 Cases Missed)
- **Reversed Causal Direction (4 cases):** Active causal verbs (`accelerated`, `induced`, `triggered`, `delayed`) inverted without triggering connector rules.
- **Unit-Scale Invariants (2 cases):** 1,000x magnitude distortions occurred because `KB/MB` and `MHz/GHz` were omitted from monitored unit dictionaries.
- **Qualitative Hallucinations (2 cases):** Descriptive narrative additions lack numeric or named entity markers.
- **Negation & Quantifier Scope Shifts (2 cases):** Polarities swapped between clauses or shifted from "not every" to "no".
- **Lost Epistemic Hedging (1 case):** Conversational rumor upgraded to confirmed corporate fact.

---

## 5. Human Quality Evaluation Status

- **Comparisons Prepared:** 36 paired live Cloudflare Workers AI inferences.
- **Completed Human Reviews:** **0**
- **Distinct Human Reviewers:** **0**
- **Missing / Incomplete Scores:** **36**
- **Evaluation Status:** **`PENDING`** (Zero fabrication confirmed).

---

## 6. Final Readiness Verdict

### Verdict: **`CONDITIONAL_NOT_PRODUCTION_READY`**

The mathematical reconciliation of the reporting layer completes the integrity audit. However, system readiness cannot be declared for unmonitored production deployment due to the following confirmed technical blockers:
1. **Missed Drift Rate (14.29%):** 11 of 77 genuine corruptions evade deterministic invariants.
2. **Ambiguous Routing Failure (0%):** The validator fails to trigger manual review for rhetorical questions and idiomatic expressions.
3. **Pending Human Evaluation:** Zero human quality ratings have been submitted to verify that context-aware rewrites preserve voice and improve readability.
