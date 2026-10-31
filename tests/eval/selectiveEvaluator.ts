// ============================================================================
// HUMANIZETEXT DETECTOR V2.2.4: SELECTIVE CLASSIFICATION EVALUATION ENGINE
// Deterministic evaluation infrastructure for risk-controlled abstention.
// Frozen detector evaluation code only. Zero changes to production detector.
// ============================================================================

import { computeAiScore } from '../../src/lib/detector/detectorCore';

export type SelectiveGenre = 'academic' | 'technical' | 'corporate' | 'conversational' | 'creative';
export type SelectiveLengthCategory = 'short' | 'medium' | 'long';
export type SelectiveCohort = 'dev' | 'final_validation';
export type SelectiveSampleLabel =
  | 'human_verified'
  | 'ai_generated'
  | 'collaborative'
  | 'mixed_authorship'
  | 'ai_human_edited'
  | 'human_ai_edited';

export interface BaseProvenance {
  readonly authorOrSource: string;
  readonly method?: string;
  readonly date?: string;
  readonly notes?: string;
  readonly verificationStatus?: 'verified' | 'unverified' | 'pending_generation';
  readonly [key: string]: unknown;
}

export interface SelectiveCorpusRow {
  readonly id: string;
  readonly cohort: SelectiveCohort;
  readonly genre: SelectiveGenre;
  readonly lengthCategory: SelectiveLengthCategory;
  readonly wordCount: number;
  readonly label: SelectiveSampleLabel;
  readonly sha256: string;
  readonly provenance: BaseProvenance;
  readonly text: string;
}

export type AbstentionVerdict =
  | 'human'
  | 'ai'
  | 'abstain_length'
  | 'abstain_score';

export type PolicyType = 'policy_a_baseline' | 'policy_b_min_length' | 'policy_c_selective_region';

export interface CandidatePolicy {
  readonly id: string;
  readonly type: PolicyType;
  readonly name: string;
  readonly description: string;
  readonly minWordCount: number;
  readonly tauHuman: number;
  readonly tauAi: number;
}

export const CANDIDATE_POLICIES: Record<string, CandidatePolicy> = {
  POLICY_A_BASELINE: {
    id: 'policy_a_baseline',
    type: 'policy_a_baseline',
    name: 'Policy A: Existing Baseline (Fixed tau=0.50, No Abstention)',
    description: 'Always issues a binary verdict using the current 0.50 threshold regardless of length or signal ambiguity.',
    minWordCount: 0,
    tauHuman: 0.50,
    tauAi: 0.50,
  },
  POLICY_B_MIN_LENGTH_35: {
    id: 'policy_b_min_length_35',
    type: 'policy_b_min_length',
    name: 'Policy B: Minimum Length Guard (theta=35 words)',
    description: 'Abstains on passages under 35 words; applies 0.50 threshold on >= 35 words.',
    minWordCount: 35,
    tauHuman: 0.50,
    tauAi: 0.50,
  },
  POLICY_B_MIN_LENGTH_50: {
    id: 'policy_b_min_length_50',
    type: 'policy_b_min_length',
    name: 'Policy B: Minimum Length Guard (theta=50 words)',
    description: 'Abstains on passages under 50 words; applies 0.50 threshold on >= 50 words.',
    minWordCount: 50,
    tauHuman: 0.50,
    tauAi: 0.50,
  },
  POLICY_C_SELECTIVE_35_65: {
    id: 'policy_c_selective_35_65',
    type: 'policy_c_selective_region',
    name: 'Policy C: Length (theta=50) + Intermediate Region [0.35, 0.65]',
    description: 'Abstains on text < 50 words and on ambiguous score band [0.35, 0.65]. Human < 0.35, AI > 0.65.',
    minWordCount: 50,
    tauHuman: 0.35,
    tauAi: 0.65,
  },
  POLICY_C_SELECTIVE_30_70: {
    id: 'policy_c_selective_30_70',
    type: 'policy_c_selective_region',
    name: 'Policy C: Length (theta=45) + Wider Intermediate Region [0.30, 0.70]',
    description: 'Abstains on text < 45 words and score band [0.30, 0.70]. Human < 0.30, AI > 0.70.',
    minWordCount: 45,
    tauHuman: 0.30,
    tauAi: 0.70,
  },
};

export class CorpusIntegrityError extends Error {
  public readonly errors: readonly string[];
  constructor(message: string, errors: readonly string[]) {
    super(`${message}:\n${errors.map((e) => `  - ${e}`).join('\n')}`);
    this.name = 'CorpusIntegrityError';
    this.errors = errors;
  }
}

/**
 * Validates the structural integrity and provenance of an evaluation cohort.
 * Never silently drops malformed records.
 */
export function validateCorpusIntegrity(samples: readonly SelectiveCorpusRow[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const seenIds = new Set<string>();

  for (let i = 0; i < samples.length; i++) {
    const s = samples[i];
    const prefix = `[Sample index ${i}${s?.id ? ` (ID: ${s.id})` : ''}]`;

    if (!s) {
      errors.push(`${prefix} Record is null or undefined.`);
      continue;
    }
    if (!s.id || typeof s.id !== 'string' || s.id.trim() === '') {
      errors.push(`${prefix} Missing or non-string 'id'.`);
    } else {
      if (seenIds.has(s.id)) {
        errors.push(`${prefix} Duplicate sample ID detected: '${s.id}'. Stable IDs must be globally unique.`);
      }
      seenIds.add(s.id);
    }

    if (typeof s.text !== 'string' || s.text.trim() === '') {
      errors.push(`${prefix} Text passage is empty or not a string.`);
    }

    if (!s.label) {
      errors.push(`${prefix} Missing class 'label'.`);
    }

    if (!s.genre) {
      errors.push(`${prefix} Missing 'genre'.`);
    }

    if (typeof s.wordCount !== 'number' || s.wordCount < 0) {
      errors.push(`${prefix} Invalid 'wordCount' (${s.wordCount}). Must be a non-negative number.`);
    }

    if (!s.provenance || typeof s.provenance !== 'object') {
      errors.push(`${prefix} Missing provenance object.`);
    } else {
      if (!s.provenance.authorOrSource || String(s.provenance.authorOrSource).trim() === '') {
        errors.push(`${prefix} Provenance missing 'authorOrSource'. Every sample must have traceable authorship or generation source.`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Applies a candidate abstention policy to a single sample given its continuous heuristic score.
 * Pure function: deterministic and side-effect free.
 */
export function evaluateSamplePolicy(
  text: string,
  rawAiScore: number,
  policy: CandidatePolicy
): AbstentionVerdict {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // 1. Length Gate
  if (policy.minWordCount > 0 && wordCount < policy.minWordCount) {
    return 'abstain_length';
  }

  // 2. Score Gate
  if (policy.tauHuman === policy.tauAi) {
    // Degenerate threshold boundary (Policy A and Policy B fixed cutoff)
    return rawAiScore >= policy.tauAi ? 'ai' : 'human';
  }

  // Intermediate abstention region: tauHuman <= score <= tauAi
  if (rawAiScore >= policy.tauHuman && rawAiScore <= policy.tauAi) {
    return 'abstain_score';
  }

  if (rawAiScore < policy.tauHuman) {
    return 'human';
  }

  return 'ai';
}

export interface EvaluatedSampleResult {
  readonly id: string;
  readonly label: SelectiveSampleLabel;
  readonly isPureBinary: boolean;
  readonly genre: SelectiveGenre;
  readonly lengthCategory: SelectiveLengthCategory;
  readonly wordCount: number;
  readonly rawAiScore: number;
  readonly verdict: AbstentionVerdict;
  readonly isDecided: boolean;
  readonly isAbstained: boolean;
  readonly isCorrect: boolean | null; // null if collaborative or abstained
}

export interface CoverageMetrics {
  readonly totalEligible: number;
  readonly decidedCount: number;
  readonly abstainedCount: number;
  readonly abstainedLengthCount: number;
  readonly abstainedScoreCount: number;
  readonly coverageProportion: number | null;
  readonly abstentionRate: number | null;
}

export interface ClassCoverage {
  readonly total: number;
  readonly decided: number;
  readonly abstained: number;
  readonly coverage: number | null;
  readonly abstentionRate: number | null;
}

export interface ClassConditionalCoverage {
  readonly human: ClassCoverage;
  readonly ai: ClassCoverage;
}

export interface SelectiveConfusionMatrix {
  readonly sTP: number;
  readonly sFP: number;
  readonly sTN: number;
  readonly sFN: number;
  readonly totalDecided: number;
}

export interface SelectivePerformanceRates {
  readonly precision: number | null;
  readonly recall: number | null;
  readonly specificity: number | null;
  readonly falsePositiveRate: number | null;
  readonly falseNegativeRate: number | null;
  readonly balancedAccuracy: number | null;
}

export interface OverallCohortOutcomes {
  readonly totalEligible: number;
  readonly correctCount: number;
  readonly incorrectCount: number;
  readonly abstainedCount: number;
  readonly proportionCorrect: number | null;
  readonly proportionIncorrect: number | null;
  readonly effectiveRecall: number | null;
  readonly effectiveFalseAlarmRate: number | null;
}

export interface CollaborativeCohortReport {
  readonly totalCount: number;
  readonly scoreMean: number | null;
  readonly scoreMin: number | null;
  readonly scoreMax: number | null;
  readonly decidedHumanCount: number;
  readonly decidedAiCount: number;
  readonly abstainedCount: number;
  readonly abstainedProportion: number | null;
  readonly decidedHumanProportion: number | null;
  readonly decidedAiProportion: number | null;
  readonly bySubLabel: Record<string, { count: number; meanScore: number; abstainedCount: number }>;
}

export interface StratifiedMetrics {
  readonly eligible: number;
  readonly decided: number;
  readonly abstained: number;
  readonly coverage: number | null;
  readonly sTP: number;
  readonly sFP: number;
  readonly sTN: number;
  readonly sFN: number;
  readonly precision: number | null;
  readonly recall: number | null;
  readonly specificity: number | null;
  readonly fpr: number | null;
}

export interface SelectiveEvaluationReport {
  readonly policy: CandidatePolicy;
  readonly cohortName: string;
  readonly timestamp: string;
  readonly totalSamplesEvaluated: number;
  readonly pureBinaryEligibleCount: number;
  readonly coverage: CoverageMetrics;
  readonly classConditionalCoverage: ClassConditionalCoverage;
  readonly selectiveConfusionMatrix: SelectiveConfusionMatrix;
  readonly selectivePerformanceRates: SelectivePerformanceRates;
  readonly overallCohortOutcomes: OverallCohortOutcomes;
  readonly collaborativeReport?: CollaborativeCohortReport;
  readonly genreStratification: Record<SelectiveGenre, StratifiedMetrics>;
  readonly lengthStratification: Record<SelectiveLengthCategory, StratifiedMetrics>;
}

function safeRatio(numerator: number, denominator: number): number | null {
  if (denominator <= 0 || !Number.isFinite(denominator) || Number.isNaN(denominator)) {
    return null;
  }
  return Number((numerator / denominator).toFixed(4));
}

/**
 * Computes stratified metrics for a subset of evaluated pure-binary results.
 */
function computeStratifiedSubset(subset: readonly EvaluatedSampleResult[]): StratifiedMetrics {
  const eligible = subset.length;
  const decided = subset.filter((r) => r.isDecided);
  const abstained = eligible - decided.length;

  let sTP = 0;
  let sFP = 0;
  let sTN = 0;
  let sFN = 0;

  for (const r of decided) {
    if (r.label === 'ai_generated') {
      if (r.verdict === 'ai') sTP++;
      else if (r.verdict === 'human') sFN++;
    } else if (r.label === 'human_verified') {
      if (r.verdict === 'human') sTN++;
      else if (r.verdict === 'ai') sFP++;
    }
  }

  const precision = safeRatio(sTP, sTP + sFP);
  const recall = safeRatio(sTP, sTP + sFN);
  const specificity = safeRatio(sTN, sTN + sFP);
  const fpr = safeRatio(sFP, sTN + sFP);

  return {
    eligible,
    decided: decided.length,
    abstained,
    coverage: safeRatio(decided.length, eligible),
    sTP,
    sFP,
    sTN,
    sFN,
    precision,
    recall,
    specificity,
    fpr,
  };
}

/**
 * Evaluates an entire corpus against a candidate policy deterministically.
 * Guarantees zero mutation of the input corpus or detectorCore.
 */
export function evaluateSelectiveCorpus(
  samples: readonly SelectiveCorpusRow[],
  policy: CandidatePolicy,
  options?: {
    cohortName?: string;
    strictValidation?: boolean;
    customScoreEvaluator?: (text: string) => number;
  }
): {
  report: SelectiveEvaluationReport;
  evaluatedSamples: readonly EvaluatedSampleResult[];
} {
  // 1. Data Integrity Audit
  const validation = validateCorpusIntegrity(samples);
  if (!validation.valid && options?.strictValidation !== false) {
    throw new CorpusIntegrityError('Corpus integrity validation failed', validation.errors);
  }

  const scoreEvaluator = options?.customScoreEvaluator ?? ((text: string) => computeAiScore(text).aiProbability);
  const evaluatedSamples: EvaluatedSampleResult[] = [];

  const collaborativeSamples: EvaluatedSampleResult[] = [];
  const pureBinarySamples: EvaluatedSampleResult[] = [];

  for (const sample of samples) {
    const rawAiScore = scoreEvaluator(sample.text);
    const verdict = evaluateSamplePolicy(sample.text, rawAiScore, policy);
    const isDecided = verdict === 'human' || verdict === 'ai';
    const isAbstained = !isDecided;

    const isPureBinary = sample.label === 'human_verified' || sample.label === 'ai_generated';

    let isCorrect: boolean | null = null;
    if (isPureBinary && isDecided) {
      if (sample.label === 'human_verified') {
        isCorrect = verdict === 'human';
      } else if (sample.label === 'ai_generated') {
        isCorrect = verdict === 'ai';
      }
    }

    const evalResult: EvaluatedSampleResult = Object.freeze({
      id: sample.id,
      label: sample.label,
      isPureBinary,
      genre: sample.genre,
      lengthCategory: sample.lengthCategory,
      wordCount: sample.wordCount,
      rawAiScore,
      verdict,
      isDecided,
      isAbstained,
      isCorrect,
    });

    evaluatedSamples.push(evalResult);

    if (isPureBinary) {
      pureBinarySamples.push(evalResult);
    } else {
      collaborativeSamples.push(evalResult);
    }
  }

  // 2. Pure Binary Metrics Computation
  const totalEligible = pureBinarySamples.length;
  const decidedPure = pureBinarySamples.filter((r) => r.isDecided);
  const decidedCount = decidedPure.length;
  const abstainedPure = pureBinarySamples.filter((r) => r.isAbstained);
  const abstainedCount = abstainedPure.length;
  const abstainedLengthCount = abstainedPure.filter((r) => r.verdict === 'abstain_length').length;
  const abstainedScoreCount = abstainedPure.filter((r) => r.verdict === 'abstain_score').length;

  const coverageProportion = safeRatio(decidedCount, totalEligible);
  const abstentionRate = safeRatio(abstainedCount, totalEligible);

  // Class-conditional coverage
  const humanSamples = pureBinarySamples.filter((r) => r.label === 'human_verified');
  const humanDecided = humanSamples.filter((r) => r.isDecided).length;
  const humanAbstained = humanSamples.length - humanDecided;

  const aiSamples = pureBinarySamples.filter((r) => r.label === 'ai_generated');
  const aiDecided = aiSamples.filter((r) => r.isDecided).length;
  const aiAbstained = aiSamples.length - aiDecided;

  const classConditionalCoverage: ClassConditionalCoverage = {
    human: {
      total: humanSamples.length,
      decided: humanDecided,
      abstained: humanAbstained,
      coverage: safeRatio(humanDecided, humanSamples.length),
      abstentionRate: safeRatio(humanAbstained, humanSamples.length),
    },
    ai: {
      total: aiSamples.length,
      decided: aiDecided,
      abstained: aiAbstained,
      coverage: safeRatio(aiDecided, aiSamples.length),
      abstentionRate: safeRatio(aiAbstained, aiSamples.length),
    },
  };

  // Selective confusion matrix
  let sTP = 0;
  let sFP = 0;
  let sTN = 0;
  let sFN = 0;

  for (const r of decidedPure) {
    if (r.label === 'ai_generated') {
      if (r.verdict === 'ai') sTP++;
      else if (r.verdict === 'human') sFN++;
    } else if (r.label === 'human_verified') {
      if (r.verdict === 'human') sTN++;
      else if (r.verdict === 'ai') sFP++;
    }
  }

  const precision = safeRatio(sTP, sTP + sFP);
  const recall = safeRatio(sTP, sTP + sFN);
  const specificity = safeRatio(sTN, sTN + sFP);
  const fpr = safeRatio(sFP, sTN + sFP);
  const fnr = safeRatio(sFN, sTP + sFN);
  const balancedAccuracy =
    specificity !== null && recall !== null ? Number(((specificity + recall) / 2).toFixed(4)) : null;

  const selectiveConfusionMatrix: SelectiveConfusionMatrix = {
    sTP,
    sFP,
    sTN,
    sFN,
    totalDecided: decidedCount,
  };

  const selectivePerformanceRates: SelectivePerformanceRates = {
    precision,
    recall,
    specificity,
    falsePositiveRate: fpr,
    falseNegativeRate: fnr,
    balancedAccuracy,
  };

  // Overall cohort outcomes (denominator = totalEligible)
  const correctCount = sTP + sTN;
  const incorrectCount = sFP + sFN;

  const overallCohortOutcomes: OverallCohortOutcomes = {
    totalEligible,
    correctCount,
    incorrectCount,
    abstainedCount,
    proportionCorrect: safeRatio(correctCount, totalEligible),
    proportionIncorrect: safeRatio(incorrectCount, totalEligible),
    effectiveRecall: safeRatio(sTP, aiSamples.length),
    effectiveFalseAlarmRate: safeRatio(sFP, humanSamples.length),
  };

  // Stratifications
  const genres: SelectiveGenre[] = ['academic', 'technical', 'corporate', 'conversational', 'creative'];
  const genreStratification = {} as Record<SelectiveGenre, StratifiedMetrics>;
  for (const g of genres) {
    const subset = pureBinarySamples.filter((r) => r.genre === g);
    genreStratification[g] = computeStratifiedSubset(subset);
  }

  const lengths: SelectiveLengthCategory[] = ['short', 'medium', 'long'];
  const lengthStratification = {} as Record<SelectiveLengthCategory, StratifiedMetrics>;
  for (const len of lengths) {
    const subset = pureBinarySamples.filter((r) => r.lengthCategory === len);
    lengthStratification[len] = computeStratifiedSubset(subset);
  }

  // Collaborative analysis
  let collaborativeReport: CollaborativeCohortReport | undefined;
  if (collaborativeSamples.length > 0) {
    const scores = collaborativeSamples.map((r) => r.rawAiScore);
    const scoreSum = scores.reduce((a, b) => a + b, 0);
    const scoreMean = Number((scoreSum / scores.length).toFixed(4));
    const scoreMin = Number(Math.min(...scores).toFixed(4));
    const scoreMax = Number(Math.max(...scores).toFixed(4));

    const decidedHumanCount = collaborativeSamples.filter((r) => r.verdict === 'human').length;
    const decidedAiCount = collaborativeSamples.filter((r) => r.verdict === 'ai').length;
    const abstainedCountCollab = collaborativeSamples.filter((r) => r.isAbstained).length;

    const bySubLabel: Record<string, { count: number; meanScore: number; abstainedCount: number }> = {};
    for (const r of collaborativeSamples) {
      const entry = bySubLabel[r.label] ?? { count: 0, sumScore: 0, abstainedCount: 0 };
      (entry as unknown as { count: number; sumScore: number; abstainedCount: number }).count++;
      (entry as unknown as { count: number; sumScore: number; abstainedCount: number }).sumScore += r.rawAiScore;
      if (r.isAbstained) {
        (entry as unknown as { count: number; sumScore: number; abstainedCount: number }).abstainedCount++;
      }
      bySubLabel[r.label] = entry;
    }

    const formattedBySub: Record<string, { count: number; meanScore: number; abstainedCount: number }> = {};
    for (const [k, v] of Object.entries(bySubLabel)) {
      const cast = v as unknown as { count: number; sumScore: number; abstainedCount: number };
      formattedBySub[k] = {
        count: cast.count,
        meanScore: Number((cast.sumScore / cast.count).toFixed(4)),
        abstainedCount: cast.abstainedCount,
      };
    }

    collaborativeReport = {
      totalCount: collaborativeSamples.length,
      scoreMean,
      scoreMin,
      scoreMax,
      decidedHumanCount,
      decidedAiCount,
      abstainedCount: abstainedCountCollab,
      abstainedProportion: safeRatio(abstainedCountCollab, collaborativeSamples.length),
      decidedHumanProportion: safeRatio(decidedHumanCount, collaborativeSamples.length),
      decidedAiProportion: safeRatio(decidedAiCount, collaborativeSamples.length),
      bySubLabel: formattedBySub,
    };
  }

  const report: SelectiveEvaluationReport = {
    policy,
    cohortName: options?.cohortName ?? 'Evaluation Cohort',
    timestamp: new Date().toISOString(),
    totalSamplesEvaluated: samples.length,
    pureBinaryEligibleCount: totalEligible,
    coverage: {
      totalEligible,
      decidedCount,
      abstainedCount,
      abstainedLengthCount,
      abstainedScoreCount,
      coverageProportion,
      abstentionRate,
    },
    classConditionalCoverage,
    selectiveConfusionMatrix,
    selectivePerformanceRates,
    overallCohortOutcomes,
    collaborativeReport,
    genreStratification,
    lengthStratification,
  };

  return {
    report,
    evaluatedSamples: Object.freeze(evaluatedSamples),
  };
}

/**
 * Formats a selective evaluation report into clean GitHub-flavored markdown.
 */
export function formatSelectiveReportMarkdown(report: SelectiveEvaluationReport): string {
  const p = report.policy;
  const cov = report.coverage;
  const ccc = report.classConditionalCoverage;
  const cm = report.selectiveConfusionMatrix;
  const rates = report.selectivePerformanceRates;
  const out = report.overallCohortOutcomes;

  const fmtPct = (val: number | null): string => (val === null ? 'N/A' : `${(val * 100).toFixed(1)}%`);

  let md = `# Selective Evaluation Report: ${report.cohortName}\n\n`;
  md += `**Policy:** ${p.name} (\`${p.id}\`)\n`;
  md += `**Description:** ${p.description}\n`;
  md += `**Parameters:** $\\theta_{\\text{min}} = ${p.minWordCount}$ words, $\\tau_{\\text{human}} = ${p.tauHuman}$, $\\tau_{\\text{ai}} = ${p.tauAi}$\n`;
  md += `**Evaluation Timestamp:** ${report.timestamp}\n\n`;

  md += `## 1. Coverage & Decision Volume\n\n`;
  md += `| Coverage Dimension | Count | Proportion | Note |\n`;
  md += `| :--- | :---: | :---: | :--- |\n`;
  md += `| **Eligible Pure-Binary Samples** | ${cov.totalEligible} | 100.0% | Ground truth: 50 Human, 50 AI |\n`;
  md += `| **Decided Samples (Verdict Issued)** | ${cov.decidedCount} | **${fmtPct(cov.coverageProportion)}** | System issued Human or AI classification |\n`;
  md += `| **Total Abstained Samples** | ${cov.abstainedCount} | **${fmtPct(cov.abstentionRate)}** | System declined to judge |\n`;
  md += `| ↳ *Abstained: Length Guard (<${p.minWordCount}w)* | ${cov.abstainedLengthCount} | ${fmtPct(safeRatio(cov.abstainedLengthCount, cov.totalEligible))} | Insufficient text length |\n`;
  md += `| ↳ *Abstained: Ambiguous Signal* | ${cov.abstainedScoreCount} | ${fmtPct(safeRatio(cov.abstainedScoreCount, cov.totalEligible))} | Heuristic score in ambiguous band |\n\n`;

  md += `## 2. Class-Conditional Coverage\n\n`;
  md += `| True Class | Total | Decided | Coverage | Abstained | Abstention Rate |\n`;
  md += `| :--- | :---: | :---: | :---: | :---: | :---: |\n`;
  md += `| **Human Verified** | ${ccc.human.total} | ${ccc.human.decided} | **${fmtPct(ccc.human.coverage)}** | ${ccc.human.abstained} | ${fmtPct(ccc.human.abstentionRate)} |\n`;
  md += `| **AI Generated** | ${ccc.ai.total} | ${ccc.ai.decided} | **${fmtPct(ccc.ai.coverage)}** | ${ccc.ai.abstained} | ${fmtPct(ccc.ai.abstentionRate)} |\n\n`;

  md += `## 3. Selective Classification Performance (Decided Samples Only, N = ${cm.totalDecided})\n\n`;
  md += `| Metric | Count / Value | Formula | Operational Meaning |\n`;
  md += `| :--- | :---: | :--- | :--- |\n`;
  md += `| **Selective TP ($sTP$)** | ${cm.sTP} | True AI classified as AI | Correct detection on decided AI |\n`;
  md += `| **Selective FP ($sFP$)** | ${cm.sFP} | True Human classified as AI | **False accusations on decided Human** |\n`;
  md += `| **Selective TN ($sTN$)** | ${cm.sTN} | True Human classified as Human | Correct protection on decided Human |\n`;
  md += `| **Selective FN ($sFN$)** | ${cm.sFN} | True AI classified as Human | Missed AI drafts on decided AI |\n`;
  md += `| **Selective Precision ($sPrec$)** | **${fmtPct(rates.precision)}** | $\\frac{sTP}{sTP + sFP}$ (${cm.sTP}/${cm.sTP + cm.sFP}) | Trustworthiness of positive AI flags |\n`;
  md += `| **Selective Recall ($sRec$)** | **${fmtPct(rates.recall)}** | $\\frac{sTP}{sTP + sFN}$ (${cm.sTP}/${cm.sTP + cm.sFN}) | Sensitivity among decided AI drafts |\n`;
  md += `| **Selective Specificity ($sSpec$)** | **${fmtPct(rates.specificity)}** | $\\frac{sTN}{sTN + sFP}$ (${cm.sTN}/${cm.sTN + cm.sFP}) | Protection against false accusations |\n`;
  md += `| **Selective False Positive Rate ($sFPR$)** | **${fmtPct(rates.falsePositiveRate)}** | $\\frac{sFP}{sTN + sFP}$ (${cm.sFP}/${cm.sTN + cm.sFP}) | False alarm rate on decided Human |\n`;
  md += `| **Selective Balanced Accuracy** | **${fmtPct(rates.balancedAccuracy)}** | $\\frac{sSpec + sRec}{2}$ | Unbiased accuracy on decided samples |\n\n`;

  md += `## 4. Overall Cohort Outcomes (Denominator = Full Cohort N = ${out.totalEligible})\n\n`;
  md += `| Outcome Dimension | Count | Proportion | Note |\n`;
  md += `| :--- | :---: | :---: | :--- |\n`;
  md += `| **Correct Verdict Issued** | ${out.correctCount} | **${fmtPct(out.proportionCorrect)}** | Correct verdict across ALL eligible samples |\n`;
  md += `| **Incorrect Verdict Issued** | ${out.incorrectCount} | **${fmtPct(out.proportionIncorrect)}** | Erroneous decision across ALL eligible samples |\n`;
  md += `| **Abstained (No Decision)** | ${out.abstainedCount} | **${fmtPct(safeRatio(out.abstainedCount, out.totalEligible))}** | Safe abstention across ALL eligible samples |\n`;
  md += `| **Cohort Effective Recall** | ${cm.sTP}/${ccc.ai.total} | **${fmtPct(out.effectiveRecall)}** | Proportion of ALL true AI samples correctly flagged |\n`;
  md += `| **Cohort Effective False Alarm Rate** | ${cm.sFP}/${ccc.human.total} | **${fmtPct(out.effectiveFalseAlarmRate)}** | Proportion of ALL true Human samples falsely flagged |\n\n`;

  if (report.collaborativeReport) {
    const col = report.collaborativeReport;
    md += `## 5. Collaborative / Mixed Cohort Analysis (N = ${col.totalCount})\n\n`;
    md += `> Collaborative samples are strictly non-binary and excluded from pure-binary metrics.\n\n`;
    md += `* **Heuristic Score Range:** Min = ${col.scoreMin}, Mean = ${col.scoreMean}, Max = ${col.scoreMax}\n`;
    md += `* **Abstained Count:** ${col.abstainedCount} (${fmtPct(col.abstainedProportion)})\n`;
    md += `* **Decided Human Writing:** ${col.decidedHumanCount} (${fmtPct(col.decidedHumanProportion)})\n`;
    md += `* **Decided AI Characteristics:** ${col.decidedAiCount} (${fmtPct(col.decidedAiProportion)})\n\n`;
  }

  return md;
}

