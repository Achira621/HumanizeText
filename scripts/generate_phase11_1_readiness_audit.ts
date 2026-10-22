import { writeFileSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ARTIFACTS_DIR = resolve(__dirname, '../tests/eval/artifacts');

function generatePhase11_1Audit() {
  const p10_1Audit = JSON.parse(
    readFileSync(resolve(ARTIFACTS_DIR, 'phase10_1_metric_audit.json'), 'utf-8')
  );

  const clean = p10_1Audit.metricReconciliationTable.cleanBinaryProtocol.phase9;

  // Exact recomputed metrics
  const tn = clean.tn; // 40
  const fp = clean.fp; // 3
  const tp = clean.tp; // 66
  const fn = clean.fn; // 11
  const binaryTotal = tn + fp + tp + fn; // 120

  const accuracyExact = (tn + tp) / binaryTotal; // 106 / 120 = 0.8833333333333333
  const precisionExact = tp / (tp + fp); // 66 / 69 = 0.9565217391304348
  const recallExact = tp / (tp + fn); // 66 / 77 = 0.8571428571428571
  const specificityExact = tn / (tn + fp); // 40 / 43 = 0.9302325581395349
  const fprExact = fp / (fp + tn); // 3 / 43 = 0.06976744186046512
  const fnrExact = fn / (fn + tp); // 11 / 77 = 0.14285714285714285
  const f1Exact = (2 * tp) / (2 * tp + fp + fn); // 132 / 146 = 0.9041095890410958

  const auditData = {
    metadata: {
      phase: "Phase 11.1: Evaluation Report Integrity & Readiness Metric Reconciliation",
      auditTimestamp: new Date().toISOString(),
      frozenSourceAuditJson: "tests/eval/artifacts/phase10_1_metric_audit.json",
      datasetFixture: "tests/eval/fixtures/phase10_independent_semantic.json",
      datasetTotalSamples: 125,
      binaryEligibleSamples: binaryTotal,
      ambiguousQuarantinedSamples: 5,
      provenanceType: "audit_report_reconciliation"
    },
    confusionMatrixReconciled: {
      trueNegatives: tn,
      falsePositives: fp,
      truePositives: tp,
      falseNegatives: fn,
      totalBinary: binaryTotal
    },
    discrepancyAnalysis: {
      summary: "Phase 11 report inadvertently used intermediate draft estimates where false positives were assumed to be 1 instead of 3, and accuracy subtracted the stale Phase 10 error count (15) from 120 rather than summing TN + TP (40 + 66 = 106).",
      table: [
        {
          metric: "Accuracy",
          phase11Reported: {
            fraction: "105 / 120",
            percentage: "87.5%",
            numeric: 0.875
          },
          recomputedPhase10_1: {
            fraction: "106 / 120",
            percentage: "88.33%",
            numeric: accuracyExact
          },
          discrepancyDelta: "-0.83 percentage points (105 vs 106 numerator)",
          rootCause: "Report author subtracted stale contaminated error count of 15 (120 - 15 = 105) instead of computing actual correct predictions (40 TN + 66 TP = 106)."
        },
        {
          metric: "Precision",
          phase11Reported: {
            fraction: "66 / 67",
            percentage: "98.5%",
            numeric: 0.98507
          },
          recomputedPhase10_1: {
            fraction: "66 / 69",
            percentage: "95.65%",
            numeric: precisionExact
          },
          discrepancyDelta: "+2.85 percentage points (67 vs 69 denominator)",
          rootCause: "Denominator used 67 (either from contaminated Phase 10 TP count 67, or assuming FP = 1) instead of true positive predictions (66 TP + 3 FP = 69)."
        },
        {
          metric: "Recall",
          phase11Reported: {
            fraction: "66 / 77",
            percentage: "85.7%",
            numeric: 0.85714
          },
          recomputedPhase10_1: {
            fraction: "66 / 77",
            percentage: "85.71%",
            numeric: recallExact
          },
          discrepancyDelta: "0.00 percentage points (rounding display only)",
          rootCause: "Numerator and denominator matched correctly (66 TP / 77 total true drift)."
        },
        {
          metric: "Specificity",
          phase11Reported: {
            fraction: "42 / 43",
            percentage: "97.7%",
            numeric: 0.97674
          },
          recomputedPhase10_1: {
            fraction: "40 / 43",
            percentage: "93.02%",
            numeric: specificityExact
          },
          discrepancyDelta: "+4.68 percentage points (42 vs 40 numerator)",
          rootCause: "Numerator assumed 42 TN (43 - 1 FP) instead of true 40 TN (43 valid - 3 FP)."
        },
        {
          metric: "False Positive Rate (FPR)",
          phase11Reported: {
            fraction: "1 / 43",
            percentage: "2.3%",
            numeric: 0.02326
          },
          recomputedPhase10_1: {
            fraction: "3 / 43",
            percentage: "6.98%",
            numeric: fprExact
          },
          discrepancyDelta: "-4.68 percentage points (1 vs 3 numerator)",
          rootCause: "Conflated the 1 inappropriately rejected manual review case (p10_creat_16) with valid-cohort false alarms, omitting the 3 true false alarms in the valid cohort."
        },
        {
          metric: "False Negative Rate (FNR)",
          phase11Reported: {
            fraction: "Not reported",
            percentage: "Not reported",
            numeric: null
          },
          recomputedPhase10_1: {
            fraction: "11 / 77",
            percentage: "14.29%",
            numeric: fnrExact
          },
          discrepancyDelta: "Omitted from Phase 11 readiness table",
          rootCause: "Metric was absent from the Phase 11 summary scorecard."
        },
        {
          metric: "F1 Score",
          phase11Reported: {
            fraction: "Derived",
            percentage: "N/A",
            numeric: 0.917
          },
          recomputedPhase10_1: {
            fraction: "132 / 146",
            percentage: "N/A",
            numeric: f1Exact
          },
          discrepancyDelta: "+0.013 (+1.4% relative error)",
          rootCause: "Derived harmonic mean using inflated Precision (0.985) and Recall (0.857) instead of true confusion matrix values (2 * 66 / (132 + 3 + 11) = 132 / 146 = 0.904)."
        }
      ]
    },
    correctedReadinessMetrics: {
      datasetDescription: "Phase 10 independent synthetic evaluation dataset (n = 125)",
      binaryConfusionMatrix: {
        trueNegatives: 40,
        falsePositives: 3,
        truePositives: 66,
        falseNegatives: 11,
        total: 120
      },
      metrics: {
        accuracy: {
          fraction: "106 / 120",
          percentage: "88.33%",
          value: Math.round(accuracyExact * 10000) / 10000
        },
        precision: {
          fraction: "66 / 69",
          percentage: "95.65%",
          value: Math.round(precisionExact * 10000) / 10000
        },
        recall: {
          fraction: "66 / 77",
          percentage: "85.71%",
          value: Math.round(recallExact * 10000) / 10000
        },
        specificity: {
          fraction: "40 / 43",
          percentage: "93.02%",
          value: Math.round(specificityExact * 10000) / 10000
        },
        falsePositiveRate: {
          fraction: "3 / 43",
          percentage: "6.98%",
          value: Math.round(fprExact * 10000) / 10000
        },
        falseNegativeRate: {
          fraction: "11 / 77",
          percentage: "14.29%",
          value: Math.round(fnrExact * 10000) / 10000
        },
        f1Score: {
          fraction: "132 / 146",
          percentage: "N/A",
          value: Math.round(f1Exact * 1000) / 1000
        }
      }
    },
    ambiguousCohortDisposition: {
      totalAmbiguous: 5,
      correctlyRoutedToManualReview: 0,
      inappropriatelyAcceptedAsValid: 4,
      inappropriatelyRejectedAsDrift: 1,
      independentlyAdjudicatedByHumans: 0,
      humanReviewStatus: "PENDING",
      cases: [
        {
          id: "p10_acad_16_ambiguous_epistemic_rhetorical",
          genre: "academic",
          automatedResult: "Inappropriately Accepted (Cleared without manual review trigger)",
          humanAdjudicationStatus: "PENDING"
        },
        {
          id: "p10_tech_17_ambiguous_configuration_syntax",
          genre: "technical",
          automatedResult: "Inappropriately Accepted (Cleared without manual review trigger)",
          humanAdjudicationStatus: "PENDING"
        },
        {
          id: "p10_prof_16_ambiguous_corporate_rhetoric",
          genre: "professional",
          automatedResult: "Inappropriately Accepted (Cleared without manual review trigger)",
          humanAdjudicationStatus: "PENDING"
        },
        {
          id: "p10_conv_16_ambiguous_idiomatic_expression",
          genre: "conversational",
          automatedResult: "Inappropriately Accepted (Cleared without manual review trigger)",
          humanAdjudicationStatus: "PENDING"
        },
        {
          id: "p10_creat_16_ambiguous_metaphorical_riddle",
          genre: "creative",
          automatedResult: "Inappropriately Rejected (Triggered negation check on dropped rhetorical 'not')",
          humanAdjudicationStatus: "PENDING"
        }
      ]
    },
    frozenFalseNegatives: {
      count: 11,
      missedDriftRate: "14.29% (11 / 77)",
      cases: p10_1Audit.binaryFalseNegativesDetail
    },
    humanReviewCompletionStatus: {
      status: "PENDING",
      targetComparisonsCount: 36,
      completedReviewsCount: 0,
      distinctReviewersCount: 0,
      missingScoresCount: 36,
      zeroFabricationConfirmed: true,
      protocolDescription: "Anonymized randomized pairwise comparison workflow (dual-rater protocol prepared, awaiting human graders)"
    },
    readinessAssessment: {
      verdict: "CONDITIONAL_NOT_PRODUCTION_READY",
      justification: "While clean binary metrics (Accuracy 88.33%, Precision 95.65%, F1 0.904) exceed synthetic targets, the validator suffers from 14.29% missed drifts across active causal verbs and hardware unit scales, 0% manual review routing on ambiguous rhetorical structures, and zero completed human evaluation ratings."
    }
  };

  // Write JSON
  const jsonPath = resolve(ARTIFACTS_DIR, 'phase11_1_readiness_metric_audit.json');
  writeFileSync(jsonPath, JSON.stringify(auditData, null, 2), 'utf-8');
  console.log(`Wrote JSON: ${jsonPath}`);

  // Generate Markdown
  let md = `# Phase 11.1: Evaluation Report Integrity & Readiness Metric Reconciliation

**Audit Date:** ${auditData.metadata.auditTimestamp}  
**Status:** RECONCILIATION COMPLETE (Strict Artifact Integrity)  
**Scope:** Reconcile reporting-layer discrepancies between Phase 10.1 corrected audit and Phase 11 readiness scorecard.  

---

## 1. Executive Summary & Root Cause Analysis

During Phase 11, an inconsistency was introduced in the **Section 7.1 readiness table** of the evaluation report. While the underlying data, tests, and frozen artifacts remained untouched and correct, the summary table reported values that diverged from the reconciled Phase 10.1 benchmark ([phase10_1_metric_audit.json](file:///d:/humanizeText/tests/eval/artifacts/phase10_1_metric_audit.json)).

### 1.1 Root Causes of Phase 11 Reporting Discrepancies
1. **False Positive Count Under-Reporting (1 vs. 3):**
   - The Phase 11 table assumed $FP = 1$ rather than $FP = 3$. This occurred because the author conflated the **1 inappropriately rejected manual-review case** (\`p10_creat_16\`) with the false positive count, omitting the 3 true false alarms in the valid cohort (\`p10_conv_09\`, \`p10_conv_22\`, \`p10_creat_17\`).
   - Consequently, Specificity was computed as $42 / 43 = 97.7%$ (instead of $40 / 43 = 93.02%$), and FPR was computed as $1 / 43 = 2.3%$ (instead of $3 / 43 = 6.98%$).
2. **Precision Inflation (98.5% vs. 95.65%):**
   - With $FP = 1$, Precision was calculated as $66 / 67 = 98.5%$ rather than $66 / (66 + 3) = 66 / 69 = 95.65%$.
3. **Accuracy Under-Reporting (87.5% vs. 88.33%):**
   - The Phase 11 report cited $105 / 120 = 87.5%$. The numerator 105 was obtained by subtracting the **stale contaminated Phase 10 false negative count (15)** from 120 ($120 - 15 = 105$). In the clean binary protocol, $TN + TP = 40 + 66 = 106$, yielding $106 / 120 = 88.33%$.
4. **F1 Score Distortion (0.917 vs. 0.904):**
   - F1 was calculated as the harmonic mean of the distorted Precision (0.98507) and Recall (0.85714), producing $0.9167 \\approx 0.917$. Using the exact confusion matrix ($TN=40, FP=3, TP=66, FN=11$), $F_1 = 2(66) / (2(66) + 3 + 11) = 132 / 146 = 0.9041 \\approx 0.904$.

---

## 2. Discrepancy & Reconciliation Table

The following table provides an exhaustive comparison between the erroneous Phase 11 reporting values and the true, mathematically reconciled Phase 10.1 figures.

| Evaluation Metric | Phase 11 Reported (Erroneous Layer) | Recomputed Phase 10.1 (True Benchmark) | Discrepancy Delta | Root Cause & Derivation |
| :--- | :---: | :---: | :---: | :--- |
| **True Negatives (TN)** | ~42 (implied) | **40** | Stale / mixed | Conflated valid cohort with ambiguous cases |
| **False Positives (FP)** | 1 (implied) | **3** | -2 (-66.7%) | Only counted 1 rejected ambiguous case |
| **True Positives (TP)** | 66 | **66** | 0 (Exact) | Preserved true drift detection count |
| **False Negatives (FN)** | 11 | **11** | 0 (Exact) | Preserved true missed drift count |
| **Binary Total** | 120 | **120** | 0 (Exact) | Excludes 5 ambiguous cases |
| **Accuracy** | **87.5%** (105 / 120) | **88.33%** (106 / 120) | -0.83% | Numerator 105 used $120 - 15$; should be $40 + 66 = 106$ |
| **Precision** | **98.5%** (66 / 67) | **95.65%** (66 / 69) | +2.85% | Used denominator 67 ($66 + 1$) instead of 69 ($66 + 3$) |
| **Recall** | **85.7%** (66 / 77) | **85.71%** (66 / 77) | 0.00% | Preserved ($66 / 77$) |
| **Specificity** | **97.7%** (42 / 43) | **93.02%** (40 / 43) | +4.68% | Used numerator 42 ($43 - 1$) instead of 40 ($43 - 3$) |
| **False Positive Rate (FPR)** | **2.3%** (1 / 43) | **6.98%** (3 / 43) | -4.68% | Omitted 2 of 3 valid-cohort false positives |
| **False Negative Rate (FNR)** | *Not reported* | **14.29%** (11 / 77) | Missing | Omitted from Phase 11 scorecard |
| **F1 Score** | **0.917** | **0.904** (132 / 146) | +0.013 | Derived from biased Precision instead of confusion matrix |
| **Ambiguous Routing** | **0%** (0 / 5) | **0%** (0 / 5) | 0 (Exact) | Accurately recorded 0% routing |

---

## 3. Ambiguous-Case Exclusion Policy & Accounting

To preserve mathematical validity, all 5 ambiguous cases remain **strictly quarantined** outside the binary 120-sample denominator. They are accounted for independently:

- **Total Ambiguous Cases:** 5
- **Correctly Routed to Manual Review:** 0 / 5 (0.0%)
- **Inappropriately Accepted As Valid:** 4 / 5 (80.0%)
  - \`p10_acad_16_ambiguous_epistemic_rhetorical\` (Academic hypothesis query converted to literature assertion)
  - \`p10_tech_17_ambiguous_configuration_syntax\` (Promotional developer pitch flattened to declarative stance)
  - \`p10_prof_16_ambiguous_corporate_rhetoric\` (Corporate Q&A flattened into direct assertion)
  - \`p10_conv_16_ambiguous_idiomatic_expression\` (Humorous hyperbole literalized into workout equivalence)
- **Inappropriately Rejected As Drift:** 1 / 5 (20.0%)
  - \`p10_creat_16_ambiguous_metaphorical_riddle\` (Aphorism restructured; dropped rhetorical "not" triggered negation check)
- **Independently Adjudicated by Humans:** 0 / 5 (Pending human review)

---

## 4. Frozen False-Negative Failure Classes (11 Missed Drifts)

The 11 missed semantic corruptions from Phase 10 / 10.1 represent a **14.29% missed-drift rate** (11 / 77):

1. **Reversed Causal Direction (4 cases, 36.4%):**
   - \`p10_acad_07_reversed_causality\` (Atmospheric carbon $\\leftrightarrow$ ocean acidification)
   - \`p10_acad_23_causal_chain_inversion\` (Cellular dehydration $\\leftrightarrow$ membrane breakdown)
   - \`p10_prof_07_reversed_causality_corporate\` (Price cuts $\\leftrightarrow$ margin compression)
   - \`p10_conv_07_reversed_causality_flight\` (Flight delay $\\leftrightarrow$ thunderstorm)
2. **Unit-Scale Mutations (2 cases, 18.2%):**
   - \`p10_tech_16_memory_unit_scale_mutation\` (512 KB mutated to 512 MB — 1,000x error)
   - \`p10_tech_25_hardware_frequency_mutation\` (16 MHz mutated to 16 GHz — 1,000x error)
3. **Unsupported Qualitative Narrative Hallucinations (2 cases, 18.2%):**
   - \`p10_conv_06_unsupported_addition_party\` (Added ungrounded "open bar and live DJ")
   - \`p10_creat_06_unsupported_addition_magical_lore\` (Added ungrounded "enchanted Valyrian... dragonfire")
4. **Negation & Quantifier Scope Shifts (2 cases, 18.2%):**
   - \`p10_conv_10_negation_target_shift_food\` (Transposed ordered food items across negation)
   - \`p10_creat_15_negation_scope_stars\` ("Not every star" converted to "No star")
5. **Lost Epistemic Hedging (1 case, 9.1%):**
   - \`p10_conv_25_hedging_destruction_rumor\` ("Heard rumors" upgraded to corporate fact)

---

## 5. Human Quality Evaluation Protocol & Blinding Disclosure

### 5.1 Accurate Protocol Characterization
The review workflow is structured as an **anonymized randomized pairwise review workflow**:
- Outputs are pseudorandomly assigned as Output A or Output B based on a SHA-256 coin flip.
- Evaluators are blinded to model and pipeline identity.
- The workflow constitutes an anonymized pairwise comparison; it should not be described as a clinical double-blind administration until human graders are independently managed and administered.

### 5.2 Review Completion Status
- **Target Comparisons:** 36 paired live Cloudflare Workers AI inferences.
- **Completed Human Reviews:** **0**
- **Distinct Human Reviewers:** **0**
- **Missing / Incomplete Scores:** **36**
- **Review Status:** **\`PENDING\`** (Zero fabrication confirmed)

---

## 6. Corrected Readiness Assessment & Final Verdict

| Dimension | Corrected Value | Threshold Target | Status |
| :--- | :---: | :---: | :--- |
| **Synthetic Accuracy** | 88.33% (106 / 120) | $\\ge 85.0\\%$ | **Pass** |
| **Synthetic Precision** | 95.65% (66 / 69) | $\\ge 90.0\\%$ | **Pass** |
| **Synthetic Recall** | 85.71% (66 / 77) | $\\ge 85.0\\%$ | **Marginal Pass** |
| **Synthetic Specificity** | 93.02% (40 / 43) | $\\ge 95.0\\%$ | **Near Target** (-1.98%) |
| **False Positive Rate** | 6.98% (3 / 43) | $\\le 5.0\\%$ | **Near Target** (+1.98%) |
| **False Negative Rate** | 14.29% (11 / 77) | $\\le 15.0\\%$ | **Pass** |
| **F1 Score** | 0.904 (132 / 146) | $\\ge 0.880$ | **Pass** |
| **Ambiguous Case Routing** | 0.0% (0 / 5) | $\\ge 80.0\\%$ | **FAIL** |
| **Human Quality Verification** | 0 / 36 Completed | $\\ge 2$ independent raters | **PENDING** |

### Final Verdict: CONDITIONAL_NOT_PRODUCTION_READY
The correction of reporting-layer figures establishes an honest, reproducible baseline. However, production readiness cannot be claimed because:
1. 14.29% of genuine semantic drifts (including causal reversals and 1,000x unit mutations) evade frozen invariant rules.
2. 0% of ambiguous rhetorical structures are routed to manual review.
3. Human quality verification remains strictly **\`PENDING\`** with 0 completed reviews.
`;

  const mdPath = resolve(ARTIFACTS_DIR, 'phase11_1_readiness_metric_audit.md');
  writeFileSync(mdPath, md, 'utf-8');
  console.log(`Wrote Markdown: ${mdPath}`);
}

generatePhase11_1Audit();
