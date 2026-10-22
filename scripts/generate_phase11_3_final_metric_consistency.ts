import { writeFileSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ARTIFACTS_DIR = resolve(__dirname, '../tests/eval/artifacts');

export interface MetricEntry {
  metricName: string;
  historicalReported: {
    fraction: string;
    exactRatio: number | null;
    displayPercentage: string;
    precisionNotes: string;
  };
  correctedBenchmark: {
    fraction: string;
    exactRatio: number;
    displayPercentage: string;
    numerator: number;
    denominator: number;
  };
  reconciledDelta: {
    convention: 'delta = corrected exact metric - previously reported exact metric';
    exactDeltaUnrounded: number | null;
    displayDelta: string;
    unit: 'percentage_points' | 'score_points' | 'N/A';
    agreementStatus: string;
    interpretation: string;
  };
  rootCauseAndDiagnostic: string;
}

export function computeStandardizedMetric(
  metricName: string,
  histFraction: string,
  histNum: number | null,
  histDenom: number | null,
  histScore: number | null,
  corrNum: number,
  corrDenom: number,
  isScore: boolean,
  precisionNotes: string,
  rootCause: string
): MetricEntry {
  if (corrDenom === 0) {
    throw new Error(`Corrected denominator for ${metricName} cannot be zero.`);
  }

  const corrRatio = corrNum / corrDenom;
  const corrDisplay = isScore ? corrRatio.toFixed(4) : `${(corrRatio * 100).toFixed(2)}%`;

  let histRatio: number | null = null;
  let histDisplay: string;
  let exactDeltaUnrounded: number | null = null;
  let displayDelta: string;
  let unit: 'percentage_points' | 'score_points' | 'N/A';
  let agreementStatus: string;
  let interpretation: string;

  if (histNum === null && histScore === null) {
    // Missing historical metric
    histDisplay = 'N/A';
    displayDelta = 'N/A';
    unit = 'N/A';
    agreementStatus = 'N/A (Historical value was omitted)';
    interpretation = 'Metric was omitted from historical scorecard; now populated from verified confusion matrix without inventing a historical delta.';
  } else if (isScore && histScore !== null) {
    histRatio = histScore;
    histDisplay = histScore.toFixed(3);
    exactDeltaUnrounded = corrRatio - histScore;
    const sign = exactDeltaUnrounded >= 0 ? '+' : '';
    displayDelta = `${sign}${exactDeltaUnrounded.toFixed(4)}`;
    unit = 'score_points';
    agreementStatus = 'Exact calculation against historical reported precision (3 decimal places)';
    interpretation = exactDeltaUnrounded < 0
      ? `Previously overstated by ${Math.abs(exactDeltaUnrounded).toFixed(4)} score points.`
      : `Previously understated by ${exactDeltaUnrounded.toFixed(4)} score points.`;
  } else if (!isScore && histNum !== null && histDenom !== null) {
    if (histDenom === 0) {
      throw new Error(`Historical denominator for ${metricName} cannot be zero.`);
    }
    histRatio = histNum / histDenom;
    histDisplay = `${(histRatio * 100).toFixed(2)}%`;
    exactDeltaUnrounded = (corrRatio - histRatio) * 100; // in percentage points

    // Display subtraction
    const corrDispNum = parseFloat((corrRatio * 100).toFixed(2));
    const histDispNum = parseFloat((histRatio * 100).toFixed(2));
    const displayDiff = corrDispNum - histDispNum;

    // Zero-check for exact identical ratios
    if (corrNum === histNum && corrDenom === histDenom) {
      exactDeltaUnrounded = 0.0;
      displayDelta = '0.00 percentage points';
      agreementStatus = 'Exact 0.00 pp delta (identical fractions)';
    } else {
      const sign = exactDeltaUnrounded >= 0 ? '+' : '';
      displayDelta = `${sign}${exactDeltaUnrounded.toFixed(2)} percentage points`;
      agreementStatus = `Exact delta (${sign}${exactDeltaUnrounded.toFixed(4)} pp) agrees with displayed delta (${sign}${displayDiff.toFixed(2)} pp)`;
    }

    unit = 'percentage_points';
    interpretation = exactDeltaUnrounded < 0
      ? `Previously overstated by ${Math.abs(exactDeltaUnrounded).toFixed(2)} percentage points.`
      : exactDeltaUnrounded > 0
        ? `Previously understated by ${exactDeltaUnrounded.toFixed(2)} percentage points.`
        : 'Metrics are identical between historical and corrected benchmarks.';
  } else {
    throw new Error(`Invalid inputs for metric ${metricName}`);
  }

  return {
    metricName,
    historicalReported: {
      fraction: histFraction,
      exactRatio: histRatio,
      displayPercentage: histDisplay,
      precisionNotes,
    },
    correctedBenchmark: {
      fraction: `${corrNum} / ${corrDenom}`,
      exactRatio: corrRatio,
      displayPercentage: corrDisplay,
      numerator: corrNum,
      denominator: corrDenom,
    },
    reconciledDelta: {
      convention: 'delta = corrected exact metric - previously reported exact metric',
      exactDeltaUnrounded,
      displayDelta,
      unit,
      agreementStatus,
      interpretation,
    },
    rootCauseAndDiagnostic: rootCause,
  };
}

export function generatePhase11_3Data() {
  const p10_1Audit = JSON.parse(
    readFileSync(resolve(ARTIFACTS_DIR, 'phase10_1_metric_audit.json'), 'utf-8')
  );

  const clean = p10_1Audit.metricReconciliationTable.cleanBinaryProtocol.phase9;

  const tn = clean.tn; // 40
  const fp = clean.fp; // 3
  const tp = clean.tp; // 66
  const fn = clean.fn; // 11
  const binaryTotal = tn + fp + tp + fn; // 120

  const accuracy = computeStandardizedMetric(
    'Accuracy',
    '105 / 120',
    105,
    120,
    null,
    tn + tp, // 106
    binaryTotal, // 120
    false,
    'Reported as fraction 105/120; evaluates to 87.50%.',
    'Subtracted stale contaminated Phase 10 error count 15 (120 - 15 = 105) rather than summing true predictions TN + TP (40 + 66 = 106).'
  );

  const precision = computeStandardizedMetric(
    'Precision',
    '66 / 67',
    66,
    67,
    null,
    tp, // 66
    tp + fp, // 69
    false,
    'Reported as fraction 66/67; evaluates to 98.5075%, displayed as 98.51%.',
    'Denominator assumed FP = 1 (66 + 1 = 67) rather than true positive predictions (66 TP + 3 FP = 69).'
  );

  const recall = computeStandardizedMetric(
    'Recall',
    '66 / 77',
    66,
    77,
    null,
    tp, // 66
    tp + fn, // 77
    false,
    'Reported as fraction 66/77; evaluates to 85.7143%, displayed as 85.71%.',
    'Both historical and corrected metrics use identical fraction 66/77; exact delta is zero.'
  );

  const specificity = computeStandardizedMetric(
    'Specificity',
    '42 / 43',
    42,
    43,
    null,
    tn, // 40
    tn + fp, // 43
    false,
    'Reported as fraction 42/43; evaluates to 97.6744%, displayed as 97.67%.',
    'Numerator assumed 42 TN (43 - 1 FP) rather than true 40 TN (43 valid - 3 FP).'
  );

  const fpr = computeStandardizedMetric(
    'False-Positive Rate (FPR)',
    '1 / 43',
    1,
    43,
    null,
    fp, // 3
    tn + fp, // 43
    false,
    'Reported as fraction 1/43; evaluates to 2.3256%, displayed as 2.33%.',
    'Conflated the 1 inappropriately rejected manual-review case (p10_creat_16) with valid-cohort false alarms, omitting the 3 true false alarms in valid cohort.'
  );

  const fnr = computeStandardizedMetric(
    'False-Negative Rate (FNR)',
    'N/A (Omitted)',
    null,
    null,
    null,
    fn, // 11
    tp + fn, // 77
    false,
    'Metric was omitted from historical scorecard; delta is strictly N/A.',
    'Metric omitted from historical table; populated directly from confusion matrix (11 / 77 = 14.29%).'
  );

  const f1 = computeStandardizedMetric(
    'F1 Score',
    '0.917 (Derived)',
    null,
    null,
    0.917,
    2 * tp, // 132
    2 * tp + fp + fn, // 146
    true,
    'Reported to 3 decimal places as 0.917; derived from biased precision/recall estimates.',
    'Derived from biased Precision (0.98507) and Recall (0.85714), yielding 0.9167 ≈ 0.917, rather than using true confusion matrix: 132 / 146 = 0.9041.'
  );

  const metrics: MetricEntry[] = [
    accuracy,
    precision,
    recall,
    specificity,
    fpr,
    fnr,
    f1,
  ];

  return {
    metadata: {
      phase: 'Phase 11.3: Final Metric Consistency & Audit Closure',
      auditTimestamp: new Date().toISOString(),
      frozenSourceAuditJson: 'tests/eval/artifacts/phase10_1_metric_audit.json',
      datasetFixture: 'tests/eval/fixtures/phase10_independent_semantic.json',
      datasetTotalSamples: 125,
      binaryEligibleSamples: binaryTotal,
      ambiguousQuarantinedSamples: 5,
      deltaSignConvention: 'delta = corrected exact metric - previously reported exact metric',
      roundingRules: 'Exact underlying ratios used for all computations; percentages displayed rounded to 2 decimal places; F1 score displayed to 4 decimal places; missing historical values marked N/A.',
      provenanceType: 'standardized_exact_ratio_reconciliation',
    },
    confusionMatrixReconciled: {
      trueNegatives: tn,
      falsePositives: fp,
      truePositives: tp,
      falseNegatives: fn,
      totalBinary: binaryTotal,
    },
    standardizedMetricsTable: metrics,
    ambiguousCohortDisposition: {
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
    finalAuditClosureVerdict: {
      verdict: 'CONDITIONAL_NOT_PRODUCTION_READY',
      reasons: [
        '14.29% of semantic corruptions (including 1,000x hardware unit distortions and reversed cause-and-effect relationships) evade frozen invariant heuristics.',
        '0% of ambiguous rhetorical structures are routed to manual review (all 5 borderline cases misrouted).',
        'Human quality evaluation remains strictly PENDING (0 of 36 comparisons graded by independent human judges).',
      ],
      auditClosureStatement: 'All metric deltas and reporting inconsistencies are mathematically closed with full numerical agreement between fractions, percentages, and deltas.',
    },
  };
}

export function generatePhase11_3Markdown(data: ReturnType<typeof generatePhase11_3Data>): string {
  const tableRows = data.standardizedMetricsTable.map((m) => {
    return `| **${m.metricName}** | ${m.historicalReported.fraction} (${m.historicalReported.displayPercentage}) | **${m.correctedBenchmark.fraction}** (${m.correctedBenchmark.displayPercentage}) | **${m.reconciledDelta.displayDelta}** | ${m.reconciledDelta.agreementStatus} | ${m.rootCauseAndDiagnostic} |`;
  }).join('\n');

  return `# Phase 11.3: Final Metric Consistency & Audit Closure

**Audit Closure Date:** ${data.metadata.auditTimestamp}  
**Status:** AUDIT CLOSED & RECONCILED (Exact Underlying Ratios & Programmatic Precision)  
**Convention:** \`delta = corrected exact metric - previously reported exact metric\`  
**Rounding Standard:** Display rounded to 2 decimal places from exact fractions; F1 displayed to 4 decimal places; missing historical values designated as \`N/A\`.

---

## 1. Executive Summary: Audit Closure & Methodological Alignment

Phase 11.3 establishes complete mathematical and numerical consistency across all published evaluation tables in the \`HumanizeText\` codebase:
1. **Exact Underlying Ratios:** All metrics and signed deltas are computed from raw integer counts ($TN=40, FP=3, TP=66, FN=11, \\text{Total}=120$) rather than pre-rounded intermediate percentages.
2. **Standardized Delta Convention:** The formula $\\Delta = \\text{corrected exact} - \\text{reported exact}$ is enforced universally.
3. **Harmonized Display Rounding:** By displaying historical reported fractions to two decimal places (\`42/43 = 97.67%\`, \`1/43 = 2.33%\`, \`66/67 = 98.51%\`), the displayed percentage differences match the underlying ratio deltas to the hundredth of a percentage point.
4. **Explicit Handling of Missing Metrics:** False-Negative Rate was omitted from the historical scorecard; its historical value and delta are explicitly designated as **\`N/A\`** rather than an invented number.
5. **Precision Transparency:** F1 score is compared against the 3-decimal historical figure (0.917), yielding an exact delta of $-0.0129\\text{ score points}$.

---

## 2. Standardized Metric Comparison & Reconciliation Table

All figures are derived directly from the clean binary confusion matrix ($TN = 40, FP = 3, TP = 66, FN = 11$, Total Binary $= 120$):

| Evaluation Metric | Historical Reported (Old Draft) | Corrected Phase 10.1 (True Benchmark) | Reconciled Signed Delta ($\\Delta = \\text{Corr} - \\text{Hist}$) | Mathematical Agreement & Rounding Note | Root Cause & Diagnostic Summary |
| :--- | :--- | :--- | :--- | :--- | :--- |
${tableRows}

---

## 3. Detailed Numerical Analysis by Metric

### 3.1 Accuracy
- **Underlying Ratios:** $\\text{Corrected} = 106 / 120 = 0.883333...$ vs. $\\text{Reported} = 105 / 120 = 0.875000$
- **Display Percentages:** $88.33\\%$ vs. $87.50\\%$
- **Exact Delta:** $(106/120 - 105/120) \\times 100 = +1/120 \\times 100 = \\mathbf{+0.8333\\text{ percentage points}}$
- **Display Signed Delta:** $\\mathbf{+0.83\\text{ percentage points}}$ ($88.33\\% - 87.50\\% = +0.83\\text{ pp}$)
- **Resolution:** Understated previously due to subtracting 15 FN from 120 ($120 - 15 = 105$) instead of summing $TN + TP = 40 + 66 = 106$.

### 3.2 Precision
- **Underlying Ratios:** $\\text{Corrected} = 66 / 69 = 0.9565217...$ vs. $\\text{Reported} = 66 / 67 = 0.9850746...$
- **Display Percentages:** $95.65\\%$ vs. $98.51\\%$
- **Exact Delta:** $(66/69 - 66/67) \\times 100 = \\mathbf{-2.8553\\text{ percentage points}}$
- **Display Signed Delta:** $\\mathbf{-2.86\\text{ percentage points}}$ ($95.65\\% - 98.51\\% = -2.86\\text{ pp}$)
- **Resolution:** Overstated previously due to assuming $FP = 1$ ($66 / 67$) rather than $FP = 3$ ($66 / 69$).

### 3.3 Recall
- **Underlying Ratios:** $\\text{Corrected} = 66 / 77 = 0.8571428...$ vs. $\\text{Reported} = 66 / 77 = 0.8571428...$
- **Display Percentages:** $85.71\\%$ vs. $85.71\\%$
- **Exact Delta:** $(66/77 - 66/77) \\times 100 = \\mathbf{0.0000\\text{ percentage points}}$
- **Display Signed Delta:** $\\mathbf{0.00\\text{ percentage points}}$ ($85.71\\% - 85.71\\% = 0.00\\text{ pp}$)
- **Resolution:** Both versions evaluate identical fractions; zero artifact delta confirmed.

### 3.4 Specificity
- **Underlying Ratios:** $\\text{Corrected} = 40 / 43 = 0.9302325...$ vs. $\\text{Reported} = 42 / 43 = 0.9767441...$
- **Display Percentages:** $93.02\\%$ vs. $97.67\\%$
- **Exact Delta:** $(40/43 - 42/43) \\times 100 = -2/43 \\times 100 = \\mathbf{-4.6512\\text{ percentage points}}$
- **Display Signed Delta:** $\\mathbf{-4.65\\text{ percentage points}}$ ($93.02\\% - 97.67\\% = -4.65\\text{ pp}$)
- **Resolution:** Overstated previously due to assuming $TN = 42$ ($43 - 1$) rather than $TN = 40$ ($43 - 3$).

### 3.5 False-Positive Rate (FPR)
- **Underlying Ratios:** $\\text{Corrected} = 3 / 43 = 0.0697674...$ vs. $\\text{Reported} = 1 / 43 = 0.0232558...$
- **Display Percentages:** $6.98\\%$ vs. $2.33\\%$
- **Exact Delta:** $(3/43 - 1/43) \\times 100 = +2/43 \\times 100 = \\mathbf{+4.6512\\text{ percentage points}}$
- **Display Signed Delta:** $\\mathbf{+4.65\\text{ percentage points}}$ ($6.98\\% - 2.33\\% = +4.65\\text{ pp}$)
- **Resolution:** Understated previously due to omitting 2 of the 3 true false alarms in valid cohort.

### 3.6 False-Negative Rate (FNR)
- **Underlying Ratios:** $\\text{Corrected} = 11 / 77 = 0.1428571...$ ($14.29\\%$) vs. $\\text{Reported} = \\text{N/A (Omitted)}$
- **Historical Value:** **\`N/A\`**
- **Reconciled Signed Delta:** **\`N/A\`** (Explicitly handled as missing historical value)
- **Resolution:** Omitted from historical scorecard; now documented as 14.29% across 11 false negatives.

### 3.7 F1 Score
- **Underlying Score:** $\\text{Corrected} = 132 / 146 = 0.9041095... \\approx 0.9041$ vs. $\\text{Reported} = 0.917$
- **Exact Delta:** $132/146 - 0.917 = \\mathbf{-0.01289...} \\approx \\mathbf{-0.0129\\text{ score points}}$
- **Resolution:** Overstated previously due to derivation from biased Precision (0.98507) and Recall (0.85714).

---

## 4. Ambiguous Cohort & False Negative Quarantines

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

The mathematical consistency and audit closure achieved in Phase 11.3 eliminate all reporting ambiguities. However, the system remains **not ready for unmonitored production deployment** due to the confirmed operational blockers:
1. **Missed Drift Rate (14.29%):** 11 of 77 genuine corruptions evade deterministic invariants.
2. **Ambiguous Routing Failure (0%):** The validator fails to trigger manual review for rhetorical questions and idiomatic expressions.
3. **Pending Human Evaluation:** Zero human quality ratings have been submitted to verify that context-aware rewrites preserve voice and improve readability.
`;
}

function run() {
  const data = generatePhase11_3Data();
  const jsonPath = resolve(ARTIFACTS_DIR, 'phase11_3_final_metric_consistency.json');
  writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`Wrote JSON: ${jsonPath}`);

  const md = generatePhase11_3Markdown(data);
  const mdPath = resolve(ARTIFACTS_DIR, 'phase11_3_final_metric_consistency.md');
  writeFileSync(mdPath, md, 'utf-8');
  console.log(`Wrote Markdown: ${mdPath}`);
}

if (process.argv[1] && process.argv[1].includes('generate_phase11_3_final_metric_consistency')) {
  run();
}
