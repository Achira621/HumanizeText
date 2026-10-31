/**
 * ============================================================================
 * HUMANIZETEXT DETECTOR V2.2.7.2: BLINDED REVIEW RESPONSE INGESTION ENGINE
 * Validates, records, and immutably stores reviewer submissions:
 *  - Verifies reviewer authorization and assignment validity against crosswalk.
 *  - Validates 10-dimension rubric scores within [1.0, 5.0] (or not_assessable).
 *  - Enforces duplicate-submission and conflicting-submission rejection.
 *  - Rejects embedded authorship guesses and detector predictions.
 *  - Enforces strict unblinding locks until both reviews per sample are complete.
 * ============================================================================
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import {
  REVIEWER_IDS,
  type ReviewerId,
  type ReviewerAllocationCrosswalkEntry,
} from './generatePilotReviewerAssignments.ts';

export const VALID_RUBRIC_KEYS = [
  'd1_grammar_mechanics',
  'd2_coherence_continuity',
  'd3_vocabulary_precision',
  'd4_structural_organization',
  'd5_audience_context_fit',
  'd6_depth_substance',
  'd7_task_fulfillment',
  'd8_naturalness_rhythm',
  'd9_stylistic_voice',
  'd10_surface_polish',
] as const;

export type RubricDimensionKey = (typeof VALID_RUBRIC_KEYS)[number];

export interface ReviewerSubmission {
  reviewerId: string;
  reviewPacketId: string;
  completionTimestamp?: string;
  scores: Record<RubricDimensionKey, number | null>;
  dimensionFlags?: {
    d7_not_assessable?: boolean;
    d7_not_assessable_reason?: string | null;
  };
  reviewerNotes?: string;
  [key: string]: unknown;
}

export interface IngestedReviewRecord {
  submissionId: string;
  reviewerId: ReviewerId;
  reviewPacketId: string;
  originalSampleId: string;
  promptId: string;
  targetClass: string;
  pairId: string;
  ingestedTimestamp: string;
  scores: Record<RubricDimensionKey, number | null>;
  dimensionFlags: {
    d7_not_assessable: boolean;
    d7_not_assessable_reason: string | null;
  };
  reviewerNotes?: string;
  coreQualityMean: number;
  fullQualityMean: number;
}

export interface ReviewIngestionReport {
  ingestedCount: number;
  rejectedCount: number;
  totalLedgerCount: number;
  totalSamplesDualReviewed: number;
  totalSamplesPending: number;
  isStudyCompleteForUnblinding: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Computes mean of non-null numeric scores.
 */
export function calculateScoreMean(scores: Array<number | null | undefined>): number {
  const valid = scores.filter((s): s is number => typeof s === 'number' && !Number.isNaN(s));
  if (valid.length === 0) return 0;
  return Number((valid.reduce((a, b) => a + b, 0) / valid.length).toFixed(3));
}

/**
 * Validates a single reviewer submission against crosswalk and scoring rules.
 */
export function validateSubmission(
  submission: ReviewerSubmission,
  crosswalkMap: Map<string, ReviewerAllocationCrosswalkEntry>,
  existingLedger: Map<string, IngestedReviewRecord>
): { valid: boolean; errors: string[]; crosswalkEntry?: ReviewerAllocationCrosswalkEntry } {
  const errors: string[] = [];

  const revId = submission.reviewerId as ReviewerId;
  const packetId = submission.reviewPacketId;

  // 1. Reviewer identity check
  if (!REVIEWER_IDS.includes(revId)) {
    errors.push(`Unauthorized or invalid reviewerId "${submission.reviewerId}". Must be one of: ${REVIEWER_IDS.join(', ')}.`);
    return { valid: false, errors };
  }

  // 2. Crosswalk assignment check
  const assignmentKey = `${revId}::${packetId}`;
  const crosswalkEntry = crosswalkMap.get(assignmentKey);
  if (!crosswalkEntry) {
    errors.push(`Reviewer assignment violation: ${revId} is NOT assigned to packet "${packetId}".`);
    return { valid: false, errors };
  }

  // 3. Duplicate and conflicting submission check
  if (existingLedger.has(assignmentKey)) {
    const existing = existingLedger.get(assignmentKey)!;
    // Check if conflicting
    errors.push(
      `Duplicate submission rejected for ${assignmentKey}. Packet already ingested at ${existing.ingestedTimestamp}. Overwrites are forbidden.`
    );
    return { valid: false, errors };
  }

  // 4. Forbidden contamination check (no detector scores or authorship guesses)
  const forbiddenKeys = ['targetClass', 'guess', 'authorshipGuess', 'aiScore', 'detectorScore', 'verdict'];
  for (const k of forbiddenKeys) {
    if ((submission as Record<string, unknown>)[k] !== undefined) {
      errors.push(`Submission contamination in ${packetId}: contains forbidden property "${k}". Evaluators must rate quality only.`);
    }
  }

  // 5. Score validations
  if (!submission.scores || typeof submission.scores !== 'object') {
    errors.push(`Missing scores object in submission for ${packetId}.`);
    return { valid: false, errors };
  }

  for (const dim of VALID_RUBRIC_KEYS) {
    const score = submission.scores[dim];

    if (dim === 'd7_task_fulfillment') {
      const isNotAssessable = submission.dimensionFlags?.d7_not_assessable;
      if (isNotAssessable) {
        if (!submission.dimensionFlags?.d7_not_assessable_reason) {
          errors.push(`Dimension 7 marked not_assessable without required reason flag.`);
        }
      } else {
        if (typeof score !== 'number' || score < 1.0 || score > 5.0 || Number.isNaN(score)) {
          errors.push(`Score for "${dim}" (${score}) must be a valid number in [1.0, 5.0] or marked not_assessable.`);
        }
      }
    } else {
      if (typeof score !== 'number' || score < 1.0 || score > 5.0 || Number.isNaN(score)) {
        errors.push(`Score for "${dim}" (${score}) must be a valid number in [1.0, 5.0].`);
      }
    }
  }

  return { valid: errors.length === 0, errors, crosswalkEntry };
}

/**
 * Ingests a batch of reviewer submissions, validating them against the master crosswalk
 * and updating the append-only ledger.
 */
export function ingestReviewSubmissions(
  submissions: ReviewerSubmission[],
  crosswalkEntries: ReviewerAllocationCrosswalkEntry[],
  existingLedgerRecords: IngestedReviewRecord[] = []
): {
  report: ReviewIngestionReport;
  updatedLedger: IngestedReviewRecord[];
} {
  // Build lookup maps
  const crosswalkMap = new Map<string, ReviewerAllocationCrosswalkEntry>();
  for (const entry of crosswalkEntries) {
    crosswalkMap.set(`${entry.reviewerId}::${entry.reviewerPacketId}`, entry);
  }

  const ledgerMap = new Map<string, IngestedReviewRecord>();
  for (const rec of existingLedgerRecords) {
    ledgerMap.set(`${rec.reviewerId}::${rec.reviewPacketId}`, rec);
  }

  const errors: string[] = [];
  const warnings: string[] = [];
  let ingestedCount = 0;
  let rejectedCount = 0;

  for (const sub of submissions) {
    const valResult = validateSubmission(sub, crosswalkMap, ledgerMap);
    if (!valResult.valid) {
      rejectedCount++;
      errors.push(...valResult.errors);
      continue;
    }

    const entry = valResult.crosswalkEntry!;
    const assignmentKey = `${sub.reviewerId}::${sub.reviewPacketId}`;

    // Compute composites
    const d7NotAssessable = sub.dimensionFlags?.d7_not_assessable === true;
    const coreScores = [
      sub.scores.d1_grammar_mechanics,
      sub.scores.d2_coherence_continuity,
      sub.scores.d3_vocabulary_precision,
      sub.scores.d4_structural_organization,
      sub.scores.d5_audience_context_fit,
      sub.scores.d6_depth_substance,
      d7NotAssessable ? null : sub.scores.d7_task_fulfillment,
    ];

    const allScores = [
      ...coreScores,
      sub.scores.d8_naturalness_rhythm,
      sub.scores.d9_stylistic_voice,
      sub.scores.d10_surface_polish,
    ];

    const ingestedRecord: IngestedReviewRecord = {
      submissionId: `SUB_${createHash('sha256').update(`${assignmentKey}_${Date.now()}`).digest('hex').slice(0, 12)}`,
      reviewerId: sub.reviewerId as ReviewerId,
      reviewPacketId: sub.reviewPacketId,
      originalSampleId: entry.originalSampleId,
      promptId: entry.promptId,
      targetClass: entry.targetClass,
      pairId: entry.pairId,
      ingestedTimestamp: new Date().toISOString(),
      scores: sub.scores,
      dimensionFlags: {
        d7_not_assessable: d7NotAssessable,
        d7_not_assessable_reason: sub.dimensionFlags?.d7_not_assessable_reason || null,
      },
      reviewerNotes: sub.reviewerNotes,
      coreQualityMean: calculateScoreMean(coreScores),
      fullQualityMean: calculateScoreMean(allScores),
    };

    ledgerMap.set(assignmentKey, ingestedRecord);
    ingestedCount++;
  }

  // Calculate study completion status
  const sampleReviewCounts = new Map<string, number>();
  for (const rec of ledgerMap.values()) {
    sampleReviewCounts.set(rec.originalSampleId, (sampleReviewCounts.get(rec.originalSampleId) || 0) + 1);
  }

  let totalSamplesDualReviewed = 0;
  for (const count of sampleReviewCounts.values()) {
    if (count >= 2) totalSamplesDualReviewed++;
  }

  const isStudyCompleteForUnblinding = ledgerMap.size === 60 && totalSamplesDualReviewed === 30;

  const report: ReviewIngestionReport = {
    ingestedCount,
    rejectedCount,
    totalLedgerCount: ledgerMap.size,
    totalSamplesDualReviewed,
    totalSamplesPending: 30 - totalSamplesDualReviewed,
    isStudyCompleteForUnblinding,
    errors,
    warnings,
  };

  return {
    report,
    updatedLedger: Array.from(ledgerMap.values()),
  };
}

/**
 * Attempts to unblind a sample. Fails closed if the sample does not have
 * both required reviews completed and locked.
 */
export function attemptUnblindSample(
  sampleId: string,
  ledgerRecords: IngestedReviewRecord[]
): { unblinded: boolean; sampleId: string; targetClass?: string; reviews: IngestedReviewRecord[]; error?: string } {
  const matchingReviews = ledgerRecords.filter((r) => r.originalSampleId === sampleId);

  if (matchingReviews.length < 2) {
    return {
      unblinded: false,
      sampleId,
      reviews: matchingReviews,
      error: `Unblinding locked: sample "${sampleId}" has received ${matchingReviews.length}/2 required reviews. Unblinding before dual completion is strictly prohibited.`,
    };
  }

  return {
    unblinded: true,
    sampleId,
    targetClass: matchingReviews[0].targetClass,
    reviews: matchingReviews,
  };
}

// CLI entry point
if (process.argv[1] && process.argv[1].endsWith('ingestBlindedReviewResponses.ts')) {
  const submissionsFile = process.argv[2];
  const crosswalkFile = process.argv[3] || 'scratch/admin_reviewer_allocation_crosswalk.json';
  const ledgerFile = process.argv[4] || 'scratch/admin_ingested_reviews.json';

  if (!submissionsFile || !existsSync(resolve(submissionsFile))) {
    console.error(`Submissions file not found: ${submissionsFile}`);
    process.exit(1);
  }
  if (!existsSync(resolve(crosswalkFile))) {
    console.error(`Admin crosswalk file not found: ${crosswalkFile}`);
    process.exit(1);
  }

  const submissionsRaw = readFileSync(resolve(submissionsFile), 'utf-8').trim();
  let submissions: ReviewerSubmission[] = [];
  try {
    const parsed = JSON.parse(submissionsRaw);
    submissions = Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    const lines = submissionsRaw.split(/\r?\n/).filter((l) => l.trim().length > 0);
    submissions = lines.map((l) => JSON.parse(l));
  }

  const crosswalk: ReviewerAllocationCrosswalkEntry[] = JSON.parse(readFileSync(resolve(crosswalkFile), 'utf-8'));
  let existingLedger: IngestedReviewRecord[] = [];
  if (existsSync(resolve(ledgerFile))) {
    try {
      existingLedger = JSON.parse(readFileSync(resolve(ledgerFile), 'utf-8'));
    } catch {
      existingLedger = [];
    }
  }

  const { report, updatedLedger } = ingestReviewSubmissions(submissions, crosswalk, existingLedger);

  writeFileSync(resolve(ledgerFile), JSON.stringify(updatedLedger, null, 2), 'utf-8');

  console.log(`[IngestBlindedReviewResponses] Submissions evaluated: ${submissions.length}`);
  console.log(`[IngestBlindedReviewResponses] Ingested: ${report.ingestedCount}`);
  console.log(`[IngestBlindedReviewResponses] Rejected: ${report.rejectedCount}`);
  console.log(`[IngestBlindedReviewResponses] Total ledger reviews: ${report.totalLedgerCount}/60`);
  console.log(`[IngestBlindedReviewResponses] Dual-reviewed samples: ${report.totalSamplesDualReviewed}/30`);
  console.log(`[IngestBlindedReviewResponses] Study complete for unblinding: ${report.isStudyCompleteForUnblinding}`);

  if (report.errors.length > 0) {
    console.log('\n--- Rejection Diagnostics ---');
    report.errors.forEach((e) => console.log(`   - Error: ${e}`));
  }
}
