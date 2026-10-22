import { writeFileSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ARTIFACTS_DIR = resolve(__dirname, '../tests/eval/artifacts');

export interface MetricComparison {
  metricName: string;
  previouslyReported: {
    fraction: string;
    percentageDisplay: string;
    numericValue: number | null;
  };
  correctedBenchmark: {
    fraction: string;
    percentageDisplay: string;
    numericValue: number;
    numerator: number;
    denominator: number;
  };
  signedDelta: {
    convention: 'delta = corrected - reported';
    percentagePointsDisplay: string;
    percentagePointsUnrounded: number | null;
    rawNumericDelta: number | null;
    unit: 'percentage_points' | 'score_points' | 'unpopulated';
    interpretation: string;
  };
  rootCause: string;
}

export function computeMetricDelta(
  metricName: string,
  reportedFraction: string,
  reportedPercentageDisplay: string,
  reportedNumeric: number | null,
  correctedNumerator: number,
  correctedDenominator: number,
  isScore: boolean,
  rootCause: string
): MetricComparison {
  if (correctedDenominator === 0) {
    throw new Error(`Denominator for metric ${metricName} cannot be zero.`);
  }

  const correctedVal = correctedNumerator / correctedDenominator;
  const correctedPctDisplay = isScore
    ? correctedVal.toFixed(3)
    : `${(correctedVal * 100).toFixed(2)}%`;

  let signedDeltaDisplay: string;
  let signedDeltaUnrounded: number | null = null;
  let rawNumericDelta: number | null = null;
  let unit: 'percentage_points' | 'score_points' | 'unpopulated';
  let interpretation: string;

  if (reportedNumeric === null) {
    signedDeltaDisplay = isScore ? `+${correctedVal.toFixed(4)}` : `+${(correctedVal * 100).toFixed(2)} pp (from unpopulated)`;
    unit = 'unpopulated';
    interpretation = 'Metric was omitted from the previous scorecard; populated from reconciled confusion matrix.';
  } else {
    rawNumericDelta = correctedVal - reportedNumeric;

    if (isScore) {
      unit = 'score_points';
      const deltaFixed = (correctedVal - reportedNumeric).toFixed(4);
      const sign = (correctedVal - reportedNumeric) >= 0 ? '+' : '';
      signedDeltaDisplay = `${sign}${deltaFixed}`;
      interpretation = rawNumericDelta < 0
        ? `Previously overstated by ${Math.abs(rawNumericDelta).toFixed(4)} score points.`
        : `Previously understated by ${rawNumericDelta.toFixed(4)} score points.`;
    } else {
      unit = 'percentage_points';
      signedDeltaUnrounded = (correctedVal - reportedNumeric) * 100;

      // Extract numeric values from display strings for display-aligned comparison
      const reportedPctNum = parseFloat(reportedPercentageDisplay.replace('%', ''));
      const correctedPctNum = parseFloat((correctedVal * 100).toFixed(2));
      const displayDelta = correctedPctNum - reportedPctNum;
      const sign = displayDelta >= 0 ? '+' : '';

      signedDeltaDisplay = `${sign}${displayDelta.toFixed(2)} percentage points`;
      interpretation = displayDelta < 0
        ? `Previously overstated by ${Math.abs(displayDelta).toFixed(2)} percentage points.`
        : `Previously understated by ${displayDelta.toFixed(2)} percentage points.`;
    }
  }

  return {
    metricName,
    previouslyReported: {
      fraction: reportedFraction,
      percentageDisplay: reportedPercentageDisplay,
      numericValue: reportedNumeric,
    },
    correctedBenchmark: {
      fraction: `${correctedNumerator} / ${correctedDenominator}`,
      percentageDisplay: correctedPctDisplay,
      numericValue: correctedVal,
      numerator: correctedNumerator,
      denominator: correctedDenominator,
    },
    signedDelta: {
      convention: 'delta = corrected - reported',
      percentagePointsDisplay: signedDeltaDisplay,
      percentagePointsUnrounded: signedDeltaUnrounded,
      rawNumericDelta,
      unit,
      interpretation,
    },
    rootCause,
  };
}

export function generatePhase11_2Data() {
  const p10_1Audit = JSON.parse(
    readFileSync(resolve(ARTIFACTS_DIR, 'phase10_1_metric_audit.json'), 'utf-8')
  );

  const clean = p10_1Audit.metricReconciliationTable.cleanBinaryProtocol.phase9;

  const tn = clean.tn; // 40
  const fp = clean.fp; // 3
  const tp = clean.tp; // 66
  const fn = clean.fn; // 11
  const binaryTotal = tn + fp + tp + fn; // 120

  const accuracyComparison = computeMetricDelta(
    'Accuracy',
    '105 / 120',
    '87.50%',
    105 / 120, // 0.875
    tn + tp, // 106
    binaryTotal, // 120
    false,
    'Phase 11 draft subtracted the stale contaminated Phase 10 error count 15 (120 - 15 = 105) rather than summing true predictions TN + TP (40 + 66 = 106).'
  );

  const precisionComparison = computeMetricDelta(
    'Precision',
    '66 / 67',
    '98.50%',
    66 / 67, // 0.9850746268656716
    tp, // 66
    tp + fp, // 69
    false,
    'Phase 11 draft denominator assumed FP = 1 (66 + 1 = 67) rather than true positive predictions (66 TP + 3 FP = 69).'
  );

  const recallComparison = computeMetricDelta(
    'Recall',
    '66 / 77',
    '85.70%',
    66 / 77, // 0.8571428571428571
    tp, // 66
    tp + fn, // 77
    false,
    'Numerators and denominators matched correctly (66 TP / 77 true drift); minor +0.01 pp display difference from rounding.'
  );

  const specificityComparison = computeMetricDelta(
    'Specificity',
    '42 / 43',
    '97.70%',
    42 / 43, // 0.9767441860465116
    tn, // 40
    tn + fp, // 43
    false,
    'Phase 11 draft assumed 42 TN (43 - 1 FP) rather than true 40 TN (43 valid - 3 FP).'
  );

  const fprComparison = computeMetricDelta(
    'False-Positive Rate (FPR)',
    '1 / 43',
    '2.30%',
    1 / 43, // 0.023255813953488372
    fp, // 3
    tn + fp, // 43
    false,
    'Phase 11 draft conflated the 1 inappropriately rejected manual review case (p10_creat_16) with valid-cohort false alarms, omitting the 3 valid-cohort false alarms.'
  );

  const fnrComparison = computeMetricDelta(
    'False-Negative Rate (FNR)',
    'Not reported',
    'Not reported',
    null,
    fn, // 11
    tp + fn, // 77
    false,
    'Metric was omitted from the Phase 11 readiness scorecard; now explicitly tracked as 14.29% (11 / 77).'
  );

  const f1Comparison = computeMetricDelta(
    'F1 Score',
    'Derived from precision/recall',
    '0.917',
    0.917,
    2 * tp, // 132
    2 * tp + fp + fn, // 146
    true,
    'Phase 11 draft derived F1 from inflated Precision (0.98507) and Recall (0.85714), yielding 0.9167 ≈ 0.917, rather than using true confusion matrix: 132 / 146 = 0.9041.'
  );

  const comparisons: MetricComparison[] = [
    accuracyComparison,
    precisionComparison,
    recallComparison,
    specificityComparison,
    fprComparison,
    fnrComparison,
    f1Comparison,
  ];

  return {
    metadata: {
      phase: 'Phase 11.2: Signed Metric Delta Verification & Final Readiness Report',
      auditTimestamp: new Date().toISOString(),
      frozenSourceAuditJson: 'tests/eval/artifacts/phase10_1_metric_audit.json',
      datasetFixture: 'tests/eval/fixtures/phase10_independent_semantic.json',
      datasetTotalSamples: 125,
      binaryEligibleSamples: binaryTotal,
      ambiguousQuarantinedSamples: 5,
      deltaSignConvention: 'delta = corrected value - previously reported value',
      provenanceType: 'programmatically_computed_signed_metric_reconciliation',
    },
    confusionMatrixReconciled: {
      trueNegatives: tn,
      falsePositives: fp,
      truePositives: tp,
      falseNegatives: fn,
      totalBinary: binaryTotal,
    },
    metricComparisonsProgrammatic: comparisons,
    ambiguousCohortAccounting: {
      totalAmbiguous: 5,
      correctlyRoutedToManualReview: 0,
      inappropriatelyAcceptedAsValid: 4,
      inappropriatelyRejectedAsDrift: 1,
      independentlyAdjudicatedByHumans: 0,
      humanReviewStatus: 'PENDING',
      cases: [
        {
          id: 'p10_acad_16_ambiguous_epistemic_rhetorical',
          genre: 'academic',
          automatedResult: 'Inappropriately Accepted (Cleared without manual review trigger)',
          humanAdjudicationStatus: 'PENDING',
        },
        {
          id: 'p10_tech_17_ambiguous_configuration_syntax',
          genre: 'technical',
          automatedResult: 'Inappropriately Accepted (Cleared without manual review trigger)',
          humanAdjudicationStatus: 'PENDING',
        },
        {
          id: 'p10_prof_16_ambiguous_corporate_rhetoric',
          genre: 'professional',
          automatedResult: 'Inappropriately Accepted (Cleared without manual review trigger)',
          humanAdjudicationStatus: 'PENDING',
        },
        {
          id: 'p10_conv_16_ambiguous_idiomatic_expression',
          genre: 'conversational',
          automatedResult: 'Inappropriately Accepted (Cleared without manual review trigger)',
          humanAdjudicationStatus: 'PENDING',
        },
        {
          id: 'p10_creat_16_ambiguous_metaphorical_riddle',
          genre: 'creative',
          automatedResult: 'Inappropriately Rejected (Triggered negation check on dropped rhetorical \'not\')',
          humanAdjudicationStatus: 'PENDING',
        },
      ],
    },
    frozenFalseNegativesSummary: {
      count: 11,
      missedDriftRate: '14.29% (11 / 77)',
      categories: [
        { category: 'reversed_causality', count: 4, severity: 'High' },
        { category: 'unit_scale_mutation', count: 2, severity: 'Critical' },
        { category: 'unsupported_addition', count: 2, severity: 'Medium' },
        { category: 'negation_scope_shift', count: 2, severity: 'High' },
        { category: 'lost_epistemic_hedging', count: 1, severity: 'Medium' },
      ],
      cases: p10_1Audit.binaryFalseNegativesDetail,
    },
    humanReviewCompletionStatus: {
      status: 'PENDING',
      targetComparisonsCount: 36,
      completedReviewsCount: 0,
      distinctReviewersCount: 0,
      missingScoresCount: 36,
      zeroFabricationConfirmed: true,
      protocolDescription: 'Anonymized randomized pairwise comparison workflow (dual-rater protocol prepared, awaiting human graders)',
    },
    finalReadinessVerdict: {
      verdict: 'CONDITIONAL_NOT_PRODUCTION_READY',
      reasons: [
        '14.29% of semantic corruptions (including 1,000x hardware unit distortions and reversed cause-and-effect relationships) evade frozen invariant heuristics.',
        '0% of ambiguous rhetorical structures are routed to manual review (all 5 borderline cases misrouted).',
        'Human quality evaluation remains strictly PENDING (0 of 36 comparisons graded by independent human judges).',
      ],
    },
  };
}

export function generatePhase11_2Markdown(data: ReturnType<typeof generatePhase11_2Data>): string {
  const tableRows = data.metricComparisonsProgrammatic.map((c) => {
    return `| **${c.metricName}** | ${c.previouslyReported.fraction} (${c.previouslyReported.percentageDisplay}) | **${c.correctedBenchmark.fraction}** (${c.correctedBenchmark.percentageDisplay}) | **${c.signedDelta.percentagePointsDisplay}** | ${c.rootCause} |`;
  }).join('\n');

  return `# Phase 11.2: Signed Metric Delta Verification & Final Readiness Report

**Audit Date:** ${data.metadata.auditTimestamp}  
**Status:** COMPLETE (Programmatic Signed-Delta Verification)  
**Convention:** \`delta = corrected value - previously reported value\`  
**Target:** Eliminate remaining delta-sign inversion errors from Phase 11.1 and establish a fully reproducible reporting layer.

---

## 1. Root Cause of Signed-Delta Inversion in Phase 11.1

In the Phase 11.1 reconciliation report, delta values were computed using the inverted formula:

$$\\Delta_{\\text{erroneous}} = \\text{reported value} - \\text{corrected value}$$

This inverted the mathematical signs of the discrepancy column:
- An improvement in Accuracy (from 87.50% to 88.33%) was erroneously listed with a minus sign (\`-0.83%\`).
- A reduction in Precision (from 98.50% to 95.65%) was erroneously listed with a plus sign (\`+2.85%\`).
- A reduction in Specificity (from 97.70% to 93.02%) was erroneously listed with a plus sign (\`+4.68%\`).
- An increase in False-Positive Rate (from 2.30% to 6.98%) was erroneously listed with a minus sign (\`-4.68%\`).
- A reduction in F1 Score (from 0.917 to 0.904) was erroneously listed with a plus sign (\`+0.013\`).

### Corrected Standard Convention
In Phase 11.2, all comparisons strictly enforce the standard evaluation convention:

$$\\Delta = \\text{corrected value} - \\text{previously reported value}$$

Under this convention:
- A **positive delta (+)** indicates the corrected true value is higher than previously claimed (the metric was previously understated).
- A **negative delta (−)** indicates the corrected true value is lower than previously claimed (the metric was previously overstated).

---

## 2. Programmatically Reconciled Metric & Signed-Delta Table

All values in the table below are computed directly from the frozen confusion matrix ($TN = 40, FP = 3, TP = 66, FN = 11$, Total Binary $= 120$):

| Evaluation Metric | Phase 11 Reported (Old Draft) | Corrected Phase 10.1 (True Benchmark) | Corrected Signed Delta ($\\Delta = \\text{Corr} - \\text{Rep}$) | Root Cause & Diagnostic Summary |
| :--- | :--- | :--- | :--- | :--- |
${tableRows}

---

## 3. Detailed Metric Derivations & Units

### 3.1 Accuracy
- **Formula:** $(TN + TP) / \\text{Total Binary} = (40 + 66) / 120 = 106 / 120$
- **Corrected Value:** $88.3333\\% \\approx 88.33\\%$
- **Previously Reported:** $105 / 120 = 87.50\\%$
- **Display Signed Delta:** $88.33\\% - 87.50\\% = \\mathbf{+0.83\\text{ percentage points}}$
- **Exact Unrounded Delta:** $(106/120 - 105/120) \\times 100 = +1/120 \\times 100 = \\mathbf{+0.8333\\text{ percentage points}}$
- **Interpretation:** Accuracy was previously understated by 0.83 percentage points because the author subtracted 15 (stale Phase 10 FN count) from 120 rather than summing actual true predictions ($40 + 66 = 106$).

### 3.2 Precision
- **Formula:** $TP / (TP + FP) = 66 / (66 + 3) = 66 / 69$
- **Corrected Value:** $95.6522\\% \\approx 95.65\\%$
- **Previously Reported:** $66 / 67 = 98.5075\\% \\approx 98.50\\%$
- **Display Signed Delta:** $95.65\\% - 98.50\\% = \\mathbf{-2.85\\text{ percentage points}}$
- **Exact Unrounded Delta:** $(66/69 - 66/67) \\times 100 = \\mathbf{-2.8553\\text{ percentage points}}$
- **Interpretation:** Precision was previously overstated by 2.85 percentage points due to assuming $FP = 1$ rather than $FP = 3$.

### 3.3 Recall
- **Formula:** $TP / (TP + FN) = 66 / (66 + 11) = 66 / 77$
- **Corrected Value:** $85.7143\\% \\approx 85.71\\%$
- **Previously Reported:** $66 / 77 \\approx 85.70\\%$
- **Display Signed Delta:** $85.71\\% - 85.70\\% = \\mathbf{+0.01\\text{ percentage points}}$ (display rounding difference)
- **Exact Unrounded Delta:** $(66/77 - 66/77) \\times 100 = \\mathbf{0.0000\\text{ percentage points}}$
- **Interpretation:** True drift detection recall was previously recorded accurately.

### 3.4 Specificity
- **Formula:** $TN / (TN + FP) = 40 / (40 + 3) = 40 / 43$
- **Corrected Value:** $93.0233\\% \\approx 93.02\\%$
- **Previously Reported:** $42 / 43 = 97.6744\\% \\approx 97.70\\%$
- **Display Signed Delta:** $93.02\\% - 97.70\\% = \\mathbf{-4.68\\text{ percentage points}}$
- **Exact Unrounded Delta:** $(40/43 - 42/43) \\times 100 = -2/43 \\times 100 = \\mathbf{-4.6512\\text{ percentage points}}$
- **Interpretation:** Specificity was previously overstated by 4.68 percentage points (display) / 4.65 percentage points (unrounded) due to assuming $TN = 42$ ($43 - 1$) rather than $TN = 40$ ($43 - 3$).

### 3.5 False-Positive Rate (FPR)
- **Formula:** $FP / (TN + FP) = 3 / (40 + 3) = 3 / 43$
- **Corrected Value:** $6.9767\\% \\approx 6.98\\%$
- **Previously Reported:** $1 / 43 = 2.3256\\% \\approx 2.30\\%$
- **Display Signed Delta:** $6.98\\% - 2.30\\% = \\mathbf{+4.68\\text{ percentage points}}$
- **Exact Unrounded Delta:** $(3/43 - 1/43) \\times 100 = +2/43 \\times 100 = \\mathbf{+4.6512\\text{ percentage points}}$
- **Interpretation:** False-positive rate was previously understated by 4.68 percentage points because 2 of the 3 true false alarms in the valid cohort were omitted.

### 3.6 False-Negative Rate (FNR)
- **Formula:** $FN / (TP + FN) = 11 / (66 + 11) = 11 / 77$
- **Corrected Value:** $14.2857\\% \\approx 14.29\\%$
- **Previously Reported:** *Not reported*
- **Display Signed Delta:** $\\mathbf{+14.29\\text{ percentage points (populated from unpopulated state)}}$
- **Interpretation:** Missed drift rate was omitted from the previous table; now documented as 14.29% across 11 false negatives.

### 3.7 F1 Score
- **Formula:** $2TP / (2TP + FP + FN) = 132 / (132 + 3 + 11) = 132 / 146$
- **Corrected Value:** $0.904109... \\approx \\mathbf{0.9041}$ (or $0.904$)
- **Previously Reported:** $0.917$
- **Signed Delta:** $0.9041 - 0.9170 = \\mathbf{-0.0129\\text{ score points}}$
- **Interpretation:** F1 score was previously overstated by 0.0129 points due to being derived from the inflated Precision (0.98507) and Recall (0.85714).

---

## 4. Quarantined Ambiguous Cases & False Negatives

### 4.1 Ambiguous Cohort (5 Cases Quarantined Outside Binary Denominator)
- **Total Cases:** 5
- **Correctly Routed to Manual Review:** 0 / 5 (0.0%)
- **Inappropriately Accepted As Valid:** 4 / 5 (80.0%)
- **Inappropriately Rejected As Drift:** 1 / 5 (20.0%)
- **Human Adjudication Status:** **\`PENDING\`** (0 / 5 adjudicated)

### 4.2 False Negative Failure Classes (11 Cases Missed)
- **Reversed Causal Direction (4 cases):** Active causal verbs (\`accelerated\`, \`induced\`, \`triggered\`, \`delayed\`) inverted without triggering connector rules.
- **Unit-Scale Invariants (2 cases):** 1,000x magnitude distortions occurred because \`KB/MB\` and \`MHz/GHz\` were omitted from monitored unit dictionaries.
- **Qualitative Hallucinations (2 cases):** Descriptive narrative additions lack numeric or named entity markers.
- **Negation & Quantifier Scope Shifts (2 cases):** Polarities swapped between clauses or shifted from "not every" to "no".
- **Lost Epistemic Hedging (1 case):** Conversational rumor upgraded to confirmed corporate fact.

---

## 5. Human Quality Evaluation Status

- **Comparisons Prepared:** 36 paired live Cloudflare Workers AI inferences.
- **Completed Human Reviews:** **0**
- **Distinct Human Reviewers:** **0**
- **Missing / Incomplete Scores:** **36**
- **Evaluation Status:** **\`PENDING\`** (Zero fabrication confirmed).

---

## 6. Final Readiness Verdict

### Verdict: **\`CONDITIONAL_NOT_PRODUCTION_READY\`**

The mathematical reconciliation of the reporting layer completes the integrity audit. However, system readiness cannot be declared for unmonitored production deployment due to the following confirmed technical blockers:
1. **Missed Drift Rate (14.29%):** 11 of 77 genuine corruptions evade deterministic invariants.
2. **Ambiguous Routing Failure (0%):** The validator fails to trigger manual review for rhetorical questions and idiomatic expressions.
3. **Pending Human Evaluation:** Zero human quality ratings have been submitted to verify that context-aware rewrites preserve voice and improve readability.
`;
}

function run() {
  const data = generatePhase11_2Data();
  const jsonPath = resolve(ARTIFACTS_DIR, 'phase11_2_final_readiness_audit.json');
  writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`Wrote JSON: ${jsonPath}`);

  const md = generatePhase11_2Markdown(data);
  const mdPath = resolve(ARTIFACTS_DIR, 'phase11_2_final_readiness_audit.md');
  writeFileSync(mdPath, md, 'utf-8');
  console.log(`Wrote Markdown: ${mdPath}`);
}

if (process.argv[1] && process.argv[1].includes('generate_phase11_2_final_readiness_audit')) {
  run();
}
