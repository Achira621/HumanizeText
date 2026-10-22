/**
 * Human Quality Evaluation Review Aggregator Utility
 * 
 * Aggregates, validates, and summarizes double-blind human review submissions
 * for paired comparisons (System A vs. System B).
 * 
 * Strict integrity guidelines:
 * - Rejects invalid scores and ungrounded comparison IDs.
 * - Keeps individual reviewer ratings unmerged and unmutated.
 * - Computes per-dimension means, preference counts, genre summaries, and inter-rater agreement.
 * - Discloses missing data, sample size limits, and non-generalizability.
 */

export interface HumanReviewEntry {
  comparisonId: string;
  reviewerId: string;
  meaningPreservationA: number; // 1-5
  meaningPreservationB: number; // 1-5
  factualAccuracyA: number;     // 1-5
  factualAccuracyB: number;     // 1-5
  clarityCoherenceA: number;    // 1-5
  clarityCoherenceB: number;    // 1-5
  genreToneFitA: number;        // 1-5
  genreToneFitB: number;        // 1-5
  unnecessaryEditingA: number;  // 1-5 (5 = minimal unnecessary edits, 1 = heavily churned)
  unnecessaryEditingB: number;  // 1-5
  overallPreference: 'A' | 'B' | 'Tie' | 'Neither Is Acceptable';
  materialChangeFlag: boolean;
  reviewerConfidence: 'High' | 'Medium' | 'Low';
  notesRationale?: string;
  submittedAt?: string;
}

export interface ComparisonMetadata {
  comparisonId: string;
  passageId: string;
  genre: 'academic' | 'technical' | 'professional' | 'conversational' | 'creative';
  split?: string;
  targetIntensity?: string;
}

export interface DimensionSummary {
  meanA: number;
  meanB: number;
  deltaBminusA: number;
  distributionA: Record<number, number>;
  distributionB: Record<number, number>;
}

export interface PreferenceSummary {
  preferenceA: { count: number; percentage: number };
  preferenceB: { count: number; percentage: number };
  tie: { count: number; percentage: number };
  neitherAcceptable: { count: number; percentage: number };
  materialChangeFlaggedCount: number;
}

export interface InterRaterAgreement {
  pairedComparisonsCount: number;
  overallPreferenceRawAgreement: number; // 0 to 1
  cohensKappa: number | null;
  notes: string;
}

export interface AggregatedReviewReport {
  metadata: {
    totalTargetComparisons: number;
    submittedReviewsCount: number;
    completedReviewsCount: number;
    incompleteReviewsCount: number;
    distinctReviewersCount: number;
    reviewerIds: string[];
    generatedAt: string;
    sampleSizeCaveat: string;
  };
  overallDimensions: {
    meaningPreservation: DimensionSummary;
    factualAccuracy: DimensionSummary;
    clarityCoherence: DimensionSummary;
    genreToneFit: DimensionSummary;
    unnecessaryEditing: DimensionSummary;
  };
  preferences: PreferenceSummary;
  byGenre: Record<string, {
    count: number;
    preferences: PreferenceSummary;
    dimensionMeans: {
      meaningPreservationA: number;
      meaningPreservationB: number;
      clarityA: number;
      clarityB: number;
      factualA: number;
      factualB: number;
    };
  }>;
  interRaterAgreement?: InterRaterAgreement;
  individualReviews: HumanReviewEntry[];
}

export interface ValidationError {
  comparisonId: string;
  reviewerId: string;
  field: string;
  message: string;
}

/**
 * Validates a single human review entry against the strict schema.
 */
export function validateReviewEntry(
  entry: Partial<HumanReviewEntry>,
  validComparisonIds: Set<string>
): { isValid: boolean; errors: ValidationError[] } {
  const errors: ValidationError[] = [];
  const compId = entry.comparisonId || 'UNKNOWN';
  const revId = entry.reviewerId || 'UNKNOWN';

  if (!entry.comparisonId || !validComparisonIds.has(entry.comparisonId)) {
    errors.push({ comparisonId: compId, reviewerId: revId, field: 'comparisonId', message: `Invalid or unknown comparisonId: ${entry.comparisonId}` });
  }

  if (!entry.reviewerId || typeof entry.reviewerId !== 'string' || entry.reviewerId.trim().length === 0) {
    errors.push({ comparisonId: compId, reviewerId: revId, field: 'reviewerId', message: 'reviewerId is required and must be non-empty' });
  }

  const scoreFields: Array<keyof HumanReviewEntry> = [
    'meaningPreservationA', 'meaningPreservationB',
    'factualAccuracyA', 'factualAccuracyB',
    'clarityCoherenceA', 'clarityCoherenceB',
    'genreToneFitA', 'genreToneFitB',
    'unnecessaryEditingA', 'unnecessaryEditingB',
  ];

  for (const f of scoreFields) {
    const val = entry[f] as number;
    if (typeof val !== 'number' || !Number.isInteger(val) || val < 1 || val > 5) {
      errors.push({ comparisonId: compId, reviewerId: revId, field: f, message: `${f} must be an integer between 1 and 5 (got ${val})` });
    }
  }

  const validPrefs = ['A', 'B', 'Tie', 'Neither Is Acceptable'];
  if (!entry.overallPreference || !validPrefs.includes(entry.overallPreference)) {
    errors.push({ comparisonId: compId, reviewerId: revId, field: 'overallPreference', message: `overallPreference must be one of: ${validPrefs.join(', ')} (got ${entry.overallPreference})` });
  }

  const validConf = ['High', 'Medium', 'Low'];
  if (!entry.reviewerConfidence || !validConf.includes(entry.reviewerConfidence)) {
    errors.push({ comparisonId: compId, reviewerId: revId, field: 'reviewerConfidence', message: `reviewerConfidence must be one of: ${validConf.join(', ')} (got ${entry.reviewerConfidence})` });
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Computes descriptive statistics for a paired 1-5 dimension.
 */
function summarizeDimension(entries: HumanReviewEntry[], fieldA: keyof HumanReviewEntry, fieldB: keyof HumanReviewEntry): DimensionSummary {
  const distA: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const distB: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sumA = 0;
  let sumB = 0;

  for (const e of entries) {
    const valA = e[fieldA] as number;
    const valB = e[fieldB] as number;
    sumA += valA;
    sumB += valB;
    distA[valA] = (distA[valA] || 0) + 1;
    distB[valB] = (distB[valB] || 0) + 1;
  }

  const count = entries.length;
  const meanA = count > 0 ? Math.round((sumA / count) * 100) / 100 : 0;
  const meanB = count > 0 ? Math.round((sumB / count) * 100) / 100 : 0;

  return {
    meanA,
    meanB,
    deltaBminusA: Math.round((meanB - meanA) * 100) / 100,
    distributionA: distA,
    distributionB: distB,
  };
}

/**
 * Computes preference counts and percentages.
 */
function summarizePreferences(entries: HumanReviewEntry[]): PreferenceSummary {
  const total = entries.length;
  let countA = 0;
  let countB = 0;
  let countTie = 0;
  let countNeither = 0;
  let materialFlags = 0;

  for (const e of entries) {
    if (e.overallPreference === 'A') countA++;
    else if (e.overallPreference === 'B') countB++;
    else if (e.overallPreference === 'Tie') countTie++;
    else if (e.overallPreference === 'Neither Is Acceptable') countNeither++;

    if (e.materialChangeFlag) materialFlags++;
  }

  return {
    preferenceA: { count: countA, percentage: total > 0 ? Math.round((countA / total) * 1000) / 10 : 0 },
    preferenceB: { count: countB, percentage: total > 0 ? Math.round((countB / total) * 1000) / 10 : 0 },
    tie: { count: countTie, percentage: total > 0 ? Math.round((countTie / total) * 1000) / 10 : 0 },
    neitherAcceptable: { count: countNeither, percentage: total > 0 ? Math.round((countNeither / total) * 1000) / 10 : 0 },
    materialChangeFlaggedCount: materialFlags,
  };
}

/**
 * Computes Cohen's Kappa for 2 reviewers across shared comparisons.
 */
function computeInterRaterAgreement(entries: HumanReviewEntry[]): InterRaterAgreement | undefined {
  const reviewers = Array.from(new Set(entries.map((e) => e.reviewerId)));
  if (reviewers.length !== 2) {
    return undefined; // Kappa computation requires exactly 2 reviewers
  }

  const [rev1, rev2] = reviewers;
  const rev1Map = new Map<string, HumanReviewEntry>();
  const rev2Map = new Map<string, HumanReviewEntry>();

  for (const e of entries) {
    if (e.reviewerId === rev1) rev1Map.set(e.comparisonId, e);
    if (e.reviewerId === rev2) rev2Map.set(e.comparisonId, e);
  }

  const commonCompIds = Array.from(rev1Map.keys()).filter((id) => rev2Map.has(id));
  const N = commonCompIds.length;
  if (N === 0) return undefined;

  let agreeCount = 0;
  const categories = ['A', 'B', 'Tie', 'Neither Is Acceptable'];
  const count1: Record<string, number> = { A: 0, B: 0, Tie: 0, 'Neither Is Acceptable': 0 };
  const count2: Record<string, number> = { A: 0, B: 0, Tie: 0, 'Neither Is Acceptable': 0 };

  for (const id of commonCompIds) {
    const p1 = rev1Map.get(id)!.overallPreference;
    const p2 = rev2Map.get(id)!.overallPreference;
    if (p1 === p2) agreeCount++;
    count1[p1] = (count1[p1] || 0) + 1;
    count2[p2] = (count2[p2] || 0) + 1;
  }

  const Po = agreeCount / N;
  let Pe = 0;
  for (const cat of categories) {
    Pe += (count1[cat] / N) * (count2[cat] / N);
  }

  const kappa = Pe < 1 ? (Po - Pe) / (1 - Pe) : 1;

  return {
    pairedComparisonsCount: N,
    overallPreferenceRawAgreement: Math.round(Po * 1000) / 1000,
    cohensKappa: Math.round(kappa * 1000) / 1000,
    notes: `Calculated over ${N} overlapping pairwise judgments between ${rev1} and ${rev2}.`,
  };
}

/**
 * Aggregates a complete list of validated human reviews.
 */
export function aggregateReviews(
  entries: HumanReviewEntry[],
  metadataList: ComparisonMetadata[]
): AggregatedReviewReport {
  const metadataMap = new Map<string, ComparisonMetadata>();
  metadataList.forEach((m) => metadataMap.set(m.comparisonId, m));

  const validEntries = entries.filter((e) => metadataMap.has(e.comparisonId));
  const reviewerIds = Array.from(new Set(validEntries.map((e) => e.reviewerId)));

  const byGenre: AggregatedReviewReport['byGenre'] = {};

  // Group by genre
  for (const meta of metadataList) {
    if (!byGenre[meta.genre]) {
      byGenre[meta.genre] = {
        count: 0,
        preferences: {
          preferenceA: { count: 0, percentage: 0 },
          preferenceB: { count: 0, percentage: 0 },
          tie: { count: 0, percentage: 0 },
          neitherAcceptable: { count: 0, percentage: 0 },
          materialChangeFlaggedCount: 0,
        },
        dimensionMeans: {
          meaningPreservationA: 0,
          meaningPreservationB: 0,
          clarityA: 0,
          clarityB: 0,
          factualA: 0,
          factualB: 0,
        },
      };
    }
  }

  // Populate per genre summaries
  for (const [genreName, summary] of Object.entries(byGenre)) {
    const genreEntries = validEntries.filter((e) => {
      const m = metadataMap.get(e.comparisonId);
      return m && m.genre === genreName;
    });

    summary.count = genreEntries.length;
    summary.preferences = summarizePreferences(genreEntries);

    if (genreEntries.length > 0) {
      summary.dimensionMeans = {
        meaningPreservationA: summarizeDimension(genreEntries, 'meaningPreservationA', 'meaningPreservationB').meanA,
        meaningPreservationB: summarizeDimension(genreEntries, 'meaningPreservationA', 'meaningPreservationB').meanB,
        clarityA: summarizeDimension(genreEntries, 'clarityCoherenceA', 'clarityCoherenceB').meanA,
        clarityB: summarizeDimension(genreEntries, 'clarityCoherenceA', 'clarityCoherenceB').meanB,
        factualA: summarizeDimension(genreEntries, 'factualAccuracyA', 'factualAccuracyB').meanA,
        factualB: summarizeDimension(genreEntries, 'factualAccuracyA', 'factualAccuracyB').meanB,
      };
    }
  }

  return {
    metadata: {
      totalTargetComparisons: metadataList.length,
      submittedReviewsCount: validEntries.length,
      completedReviewsCount: validEntries.length,
      incompleteReviewsCount: Math.max(0, metadataList.length - validEntries.length),
      distinctReviewersCount: reviewerIds.length,
      reviewerIds,
      generatedAt: new Date().toISOString(),
      sampleSizeCaveat: 'Findings are observational across 36 controlled pairs. Statistical significance and population-wide generalization must not be claimed without scaled power analysis.',
    },
    overallDimensions: {
      meaningPreservation: summarizeDimension(validEntries, 'meaningPreservationA', 'meaningPreservationB'),
      factualAccuracy: summarizeDimension(validEntries, 'factualAccuracyA', 'factualAccuracyB'),
      clarityCoherence: summarizeDimension(validEntries, 'clarityCoherenceA', 'clarityCoherenceB'),
      genreToneFit: summarizeDimension(validEntries, 'genreToneFitA', 'genreToneFitB'),
      unnecessaryEditing: summarizeDimension(validEntries, 'unnecessaryEditingA', 'unnecessaryEditingB'),
    },
    preferences: summarizePreferences(validEntries),
    byGenre,
    interRaterAgreement: computeInterRaterAgreement(validEntries),
    individualReviews: validEntries,
  };
}

/**
 * Parses raw CSV submissions from a reviewer into structured entries.
 */
export function parseReviewFormCsv(
  csvContent: string,
  validComparisonIds: Set<string>
): { entries: HumanReviewEntry[]; errors: ValidationError[] } {
  const lines = csvContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length <= 1) {
    return { entries: [], errors: [] };
  }

  // Simple CSV parser supporting double-quoted fields
  function parseCsvLine(text: string): string[] {
    const p: string[] = [];
    let insideQuotes = false;
    let entry = '';
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (c === '"') {
        if (insideQuotes && text[i + 1] === '"') {
          entry += '"';
          i++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (c === ',' && !insideQuotes) {
        p.push(entry.trim());
        entry = '';
      } else {
        entry += c;
      }
    }
    p.push(entry.trim());
    return p;
  }

  const header = parseCsvLine(lines[0]);
  const entries: HumanReviewEntry[] = [];
  const allErrors: ValidationError[] = [];

  for (let idx = 1; idx < lines.length; idx++) {
    const cols = parseCsvLine(lines[idx]);
    if (cols.length < header.length) continue;

    const row: Record<string, string> = {};
    header.forEach((h, i) => { row[h] = cols[i] || ''; });

    // Skip uncompleted template rows
    if (!row['overall_preference'] || row['overall_preference'].trim() === '') {
      continue;
    }

    const partialEntry: Partial<HumanReviewEntry> = {
      comparisonId: row['comparison_id'],
      reviewerId: row['reviewer_id'],
      meaningPreservationA: parseInt(row['meaning_preservation_a_1to5'], 10),
      meaningPreservationB: parseInt(row['meaning_preservation_b_1to5'], 10),
      factualAccuracyA: parseInt(row['factual_accuracy_a_1to5'], 10),
      factualAccuracyB: parseInt(row['factual_accuracy_b_1to5'], 10),
      clarityCoherenceA: parseInt(row['clarity_coherence_a_1to5'], 10),
      clarityCoherenceB: parseInt(row['clarity_coherence_b_1to5'], 10),
      genreToneFitA: parseInt(row['genre_tone_fit_a_1to5'], 10),
      genreToneFitB: parseInt(row['genre_tone_fit_b_1to5'], 10),
      unnecessaryEditingA: parseInt(row['unnecessary_editing_a_1to5'], 10),
      unnecessaryEditingB: parseInt(row['unnecessary_editing_b_1to5'], 10),
      overallPreference: row['overall_preference'] as any,
      materialChangeFlag: row['material_change_flag']?.toLowerCase() === 'yes',
      reviewerConfidence: row['reviewer_confidence'] as any,
      notesRationale: row['reviewer_rationale_notes'],
    };

    const val = validateReviewEntry(partialEntry, validComparisonIds);
    if (!val.isValid) {
      allErrors.push(...val.errors);
    } else {
      entries.push(partialEntry as HumanReviewEntry);
    }
  }

  return { entries, errors: allErrors };
}
