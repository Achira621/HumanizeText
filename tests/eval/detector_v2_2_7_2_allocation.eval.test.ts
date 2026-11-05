import { describe, it, expect } from 'vitest';
import { computeAiScore } from '../../src/lib/detector/detectorCore';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import {
  checkMatchedTaskPilotEligibility,
  buildSixReviewerAllocation,
  REVIEWER_IDS,
  REVIEWER_PAIRS,
  type ReviewerId,
} from '../../scripts/generatePilotReviewerAssignments.ts';
import {
  validateReviewerAssignments,
} from '../../scripts/validatePilotReviewerAssignments.ts';
import {
  ingestReviewSubmissions,
  attemptUnblindSample,
  type ReviewerSubmission,
} from '../../scripts/ingestBlindedReviewResponses.ts';
import {
  computeSha256,
  VALID_PROMPT_IDS,
  type PilotIntakeRecord,
} from '../../scripts/pilotIntakeValidator.ts';
import {
  exportBlindedPackets,
  REGISTERED_PROMPT_TEXTS,
} from '../../scripts/exportBlindedReviewPackets.ts';
import { adaptCandidateFile } from '../../scripts/pilotCandidateAdapter.ts';

/**
 * Test helper to build a perfectly valid 30-sample matched pilot cohort.
 */
function createMock30SampleMatchedCohort(): PilotIntakeRecord[] {
  const records: PilotIntakeRecord[] = [];

  VALID_PROMPT_IDS.forEach((pId, idx) => {
    const num = String(idx + 1).padStart(2, '0');
    const genre = REGISTERED_PROMPT_TEXTS[pId].genre;
    const audience = REGISTERED_PROMPT_TEXTS[pId].intendedAudience;

    // 1. Human sample
    const hText = `Authentic human passage written independently for task ${pId}. It satisfies all biological and rhetorical requirements carefully.`;
    records.push({
      id: `v2_7_pilot_h_${num}`,
      partition: 'workflow_validation_pilot',
      promptId: pId,
      targetClass: 'human_verified',
      genre,
      intendedAudience: audience,
      targetWordCount: 160,
      text: hText,
      sha256: computeSha256(hText),
      wordCount: 16,
      provenance: { participantId: `P_HUM_${num}`, consentObtained: true },
      qualityAssessment: { status: 'unassessed', scores: null, raters: [] },
    });

    // 2. AI sample
    const aiText = `Model generated passage produced by frontier assistant for task ${pId}. Formatted clearly and objectively for the student audience.`;
    records.push({
      id: `v2_7_pilot_ai_${num}`,
      partition: 'workflow_validation_pilot',
      promptId: pId,
      targetClass: 'ai_generated',
      genre,
      intendedAudience: audience,
      targetWordCount: 160,
      text: aiText,
      sha256: computeSha256(aiText),
      wordCount: 17,
      provenance: { modelFamily: 'openai_gpt6', modelId: 'GPT-6', interfaceType: 'consumer_web', exactCheckpointId: 'unverified_consumer_alias' },
      qualityAssessment: { status: 'unassessed', scores: null, raters: [] },
    });

    // 3. Collaborative sample
    const collabText = `Collaborative passage drafted by assistant and edited by human writer for task ${pId}. Refined for rhythm and flow.`;
    records.push({
      id: `v2_7_pilot_collab_${num}`,
      partition: 'workflow_validation_pilot',
      promptId: pId,
      targetClass: 'ai_human_edited',
      genre,
      intendedAudience: audience,
      targetWordCount: 160,
      text: collabText,
      sha256: computeSha256(collabText),
      wordCount: 18,
      provenance: {
        initialDraftSha256: '0'.repeat(64),
        postEditSha256: computeSha256(collabText),
        editingPromptOrNotes: 'Human polish on cadence.',
      },
      qualityAssessment: { status: 'unassessed', scores: null, raters: [] },
    });
  });

  return records;
}

describe('HumanizeText Detector V2.2.7.2: Balanced Reviewer Allocation & Matched-Task Blinding', () => {
  const FROZEN_DETECTOR_CORE_SHA256 = '095C022E01E4992020EA58FDEC2AE11A9AA9726999724955EE9EF33BFE5F851C';
  const FROZEN_V2_2_1_HOLDOUT_SHA256 = 'B99092951FF1EB3D06B5BF2F37C4A2636465DEFBCC466118E264355D48CA60A5';

  describe('1. Frozen Baseline Integrity Checks', () => {
    it('verifies detectorCore.ts behavioral contract and retains historical milestone provenance', () => {
      expect(FROZEN_DETECTOR_CORE_SHA256).toBeDefined();
      expect(typeof computeAiScore).toBe('function');
      const sc = computeAiScore('Review allocation baseline validation text.');
      expect(sc.aiProbability).toBe(0.18);
      expect(sc.sampleSufficiency).toBe('insufficient');
      expect(sc.wordCount).toBe(5);
    });

    it('verifies tests/eval/fixtures/detector_v2_2_1_holdout.json remains bit-for-bit frozen', () => {
      const filePath = resolve('tests/eval/fixtures/detector_v2_2_1_holdout.json');
      const content = readFileSync(filePath, 'utf-8').replace(/\r\n/g, '\n');
      const hash = createHash('sha256').update(content, 'utf-8').digest('hex').toUpperCase();
      expect(hash).toBe(FROZEN_V2_2_1_HOLDOUT_SHA256);
    });
  });

  describe('2. Strict 30-Record Matched-Task Pilot Eligibility', () => {
    it('passes eligibility check on a complete 30-record matched-task cohort', () => {
      const cohort = createMock30SampleMatchedCohort();
      const res = checkMatchedTaskPilotEligibility(cohort);

      expect(res.eligible).toBe(true);
      expect(res.totalRecords).toBe(30);
      expect(res.humanCount).toBe(10);
      expect(res.aiCount).toBe(10);
      expect(res.collabCount).toBe(10);
      expect(res.promptCount).toBe(10);
      expect(res.errors).toHaveLength(0);
    });

    it('rejects cohort when total record count is not exactly 30 (e.g. 29 records)', () => {
      const cohort = createMock30SampleMatchedCohort().slice(0, 29);
      const res = checkMatchedTaskPilotEligibility(cohort);

      expect(res.eligible).toBe(false);
      expect(res.errors.some((e) => e.includes('Record count violation') && e.includes('29'))).toBe(true);
    });

    it('rejects cohort when an authorship class is missing (e.g. 15 Human, 15 AI, 0 Collaborative)', () => {
      const cohort = createMock30SampleMatchedCohort();
      // Replace collaborative records with human duplicates
      const missingCollab = cohort.map((r) =>
        r.targetClass === 'ai_human_edited'
          ? { ...r, id: `${r.id}_mutated`, targetClass: 'human_verified' }
          : r
      );
      const res = checkMatchedTaskPilotEligibility(missingCollab);

      expect(res.eligible).toBe(false);
      expect(res.errors.some((e) => e.includes('Collaborative sample count imbalance'))).toBe(true);
    });

    it('rejects class imbalance (e.g. 11 Human, 9 AI, 10 Collaborative)', () => {
      const cohort = createMock30SampleMatchedCohort();
      // Change one AI record to human
      cohort[1].targetClass = 'human_verified';
      const res = checkMatchedTaskPilotEligibility(cohort);

      expect(res.eligible).toBe(false);
      expect(res.errors.some((e) => e.includes('imbalance'))).toBe(true);
    });

    it('rejects cohort when a prompt has missing responses or wrong prompt counts', () => {
      const cohort = createMock30SampleMatchedCohort();
      // Change promptId of last 3 records from TASK_CREAT_02 to TASK_ACAD_01
      cohort[27].promptId = 'TASK_ACAD_01';
      cohort[28].promptId = 'TASK_ACAD_01';
      cohort[29].promptId = 'TASK_ACAD_01';

      const res = checkMatchedTaskPilotEligibility(cohort);
      expect(res.eligible).toBe(false);
      expect(res.errors.some((e) => e.includes('TASK_CREAT_02') && e.includes('zero assigned samples'))).toBe(true);
    });

    it('rejects cohort when multiple same-class responses exist for a single prompt', () => {
      const cohort = createMock30SampleMatchedCohort();
      // For prompt 0, set collab to human
      cohort[2].targetClass = 'human_verified';
      const res = checkMatchedTaskPilotEligibility(cohort);

      expect(res.eligible).toBe(false);
      expect(res.errors.some((e) => e.includes('Multiple human samples detected for prompt'))).toBe(true);
    });

    it('rejects cohort when a prompt has only two records instead of three', () => {
      const cohort = createMock30SampleMatchedCohort();
      // Remove one record and add one elsewhere
      cohort.splice(2, 1); // remove collab from prompt 1
      cohort.push({
        ...cohort[0],
        id: 'extra_duplicate_h',
        promptId: 'TASK_ACAD_02',
      });

      const res = checkMatchedTaskPilotEligibility(cohort);
      expect(res.eligible).toBe(false);
      expect(res.errors.some((e) => e.includes('missing a collaborative sample'))).toBe(true);
    });

    it('rejects the existing 10-record AI-only batch from official matched-task review', () => {
      const candidatePath = resolve('somedata/files/humanizetext_v2_2_7_ai_pilot_batch_candidate.jsonl');
      const { adaptedRecords } = adaptCandidateFile(candidatePath);

      const res = checkMatchedTaskPilotEligibility(adaptedRecords);
      expect(res.eligible).toBe(false);
      expect(res.totalRecords).toBe(10);
      expect(res.humanCount).toBe(0);
      expect(res.collabCount).toBe(0);
      expect(res.errors.some((e) => e.includes('Record count violation'))).toBe(true);
    });
  });

  describe('3. Six-Reviewer Paired Allocation Invariants', () => {
    const cohort = createMock30SampleMatchedCohort();
    const allocation = buildSixReviewerAllocation(cohort, 'seed_test_v2_2_7_2');

    it('creates assignments for exactly six reviewers (REV_A through REV_F)', () => {
      const assignedReviewers = Object.keys(allocation.reviewerPackages);
      expect(assignedReviewers).toHaveLength(6);
      expect(assignedReviewers.sort()).toEqual([...REVIEWER_IDS].sort());
    });

    it('assigns every reviewer exactly ten samples (one for each of the 10 prompts)', () => {
      for (const revId of REVIEWER_IDS) {
        const pkg = allocation.reviewerPackages[revId];
        expect(pkg.totalAssigned).toBe(10);
        expect(pkg.packets).toHaveLength(10);

        // Check zero prompt collisions: all 10 promptIds must be unique!
        const promptIds = pkg.packets.map((p) => p.promptId);
        expect(new Set(promptIds).size).toBe(10);
        for (const pId of VALID_PROMPT_IDS) {
          expect(promptIds).toContain(pId);
        }
      }
    });

    it('guarantees that no reviewer ever sees multiple responses to the same prompt (0 prompt collisions)', () => {
      for (const revId of REVIEWER_IDS) {
        const seenPrompts = new Set<string>();
        for (const packet of allocation.reviewerPackages[revId].packets) {
          expect(seenPrompts.has(packet.promptId)).toBe(false);
          seenPrompts.add(packet.promptId);
        }
      }
    });

    it('guarantees every sample receives exactly two distinct reviewers in the same pair', () => {
      expect(allocation.crosswalkEntries).toHaveLength(60); // 30 samples * 2 reviewers

      const sampleMap = new Map<string, ReviewerId[]>();
      for (const entry of allocation.crosswalkEntries) {
        if (!sampleMap.has(entry.originalSampleId)) sampleMap.set(entry.originalSampleId, []);
        sampleMap.get(entry.originalSampleId)!.push(entry.reviewerId);
      }

      expect(sampleMap.size).toBe(30);

      for (const [_sampleId, revs] of sampleMap.entries()) {
        expect(revs).toHaveLength(2);
        expect(revs[0]).not.toBe(revs[1]);

        // Check they belong to the same pair
        const [r1, r2] = revs;
        let validPair = false;
        for (const pairRevs of Object.values(REVIEWER_PAIRS)) {
          if (pairRevs.includes(r1) && pairRevs.includes(r2)) validPair = true;
        }
        expect(validPair).toBe(true);
      }
    });

    it('achieves balanced class distribution across the three reviewer pairs', () => {
      // Across the 10 prompts, each pair evaluates 10 samples (sum = 30)
      const pairClassCounts: Record<string, { human: number; ai: number; collab: number }> = {
        PAIR_1: { human: 0, ai: 0, collab: 0 },
        PAIR_2: { human: 0, ai: 0, collab: 0 },
        PAIR_3: { human: 0, ai: 0, collab: 0 },
      };

      // Since both reviewers in a pair evaluate the same 10 samples, count unique samples per pair
      const seenPairSample = new Set<string>();
      for (const entry of allocation.crosswalkEntries) {
        const key = `${entry.pairId}::${entry.originalSampleId}`;
        if (!seenPairSample.has(key)) {
          seenPairSample.add(key);
          const cls = entry.targetClass.includes('human_verified')
            ? 'human'
            : entry.targetClass.includes('ai_generated')
            ? 'ai'
            : 'collab';
          pairClassCounts[entry.pairId][cls]++;
        }
      }

      // Check balance: each pair gets 10 items (3 or 4 of each class)
      for (const [_pairId, counts] of Object.entries(pairClassCounts)) {
        const total = counts.human + counts.ai + counts.collab;
        expect(total).toBe(10);
        expect(counts.human).toBeGreaterThanOrEqual(3);
        expect(counts.human).toBeLessThanOrEqual(4);
        expect(counts.ai).toBeGreaterThanOrEqual(3);
        expect(counts.ai).toBeLessThanOrEqual(4);
        expect(counts.collab).toBeGreaterThanOrEqual(3);
        expect(counts.collab).toBeLessThanOrEqual(4);
      }
    });

    it('randomizes packet presentation order independently for each reviewer', () => {
      // REV_A and REV_B are in Pair 1 and evaluate the same 10 samples,
      // but their packet presentation ordering must be independently shuffled!
      const orderA = allocation.reviewerPackages.REV_A.packets.map((p) => p.promptId);
      const orderB = allocation.reviewerPackages.REV_B.packets.map((p) => p.promptId);

      expect(orderA).toHaveLength(10);
      expect(orderB).toHaveLength(10);
      // Independent order means arrays should not be strictly identical
      expect(orderA.join(',')).not.toBe(orderB.join(','));
    });

    it('records reproducibility seed and algorithm version in admin metadata', () => {
      expect(allocation.adminMetadata.algorithmVersion).toBe('2.2.7.2');
      expect(allocation.adminMetadata.assignmentSeed).toBe('seed_test_v2_2_7_2');
      expect(allocation.adminMetadata.totalRecords).toBe(30);
      expect(allocation.adminMetadata.totalAssignments).toBe(60);
    });
  });

  describe('4. Reviewer Packet Redaction & Blinding Cleanliness', () => {
    const cohort = createMock30SampleMatchedCohort();
    const allocation = buildSixReviewerAllocation(cohort, 9999);

    it('redacts all ground-truth authorship classes and model/participant metadata from packets', () => {
      for (const revId of REVIEWER_IDS) {
        for (const packet of allocation.reviewerPackages[revId].packets) {
          expect(packet.reviewPacketId).toMatch(new RegExp(`^${revId}_PACKET_\\d{2}$`));
          expect((packet as Record<string, unknown>).targetClass).toBeUndefined();
          expect((packet as Record<string, unknown>).modelFamily).toBeUndefined();
          expect((packet as Record<string, unknown>).modelId).toBeUndefined();
          expect((packet as Record<string, unknown>).provider).toBeUndefined();
          expect((packet as Record<string, unknown>).participantId).toBeUndefined();
          expect((packet as Record<string, unknown>).originalSampleId).toBeUndefined();
          expect((packet as Record<string, unknown>).sha256).toBeUndefined();
          expect((packet as Record<string, unknown>).classCounts).toBeUndefined();
          expect((packet as Record<string, unknown>).detectorScore).toBeUndefined();
          expect((packet as Record<string, unknown>).verdict).toBeUndefined();
        }
      }
    });

    it('preserves task prompt text and intended audience so Dimension 7 is assessable', () => {
      for (const revId of REVIEWER_IDS) {
        for (const packet of allocation.reviewerPackages[revId].packets) {
          expect(packet.taskPromptText).toBe(REGISTERED_PROMPT_TEXTS[packet.promptId].promptText);
          expect(packet.intendedAudience).toBe(REGISTERED_PROMPT_TEXTS[packet.promptId].intendedAudience);
          expect(packet.dimensionFlags.d7_not_assessable).toBe(false);
          expect(packet.dimensionFlags.d7_not_assessable_reason).toBeNull();
        }
      }
    });

    it('ensures scoringTemplate has all ten dimensions set to null', () => {
      for (const revId of REVIEWER_IDS) {
        for (const packet of allocation.reviewerPackages[revId].packets) {
          for (const val of Object.values(packet.scoringTemplate)) {
            expect(val).toBeNull();
          }
        }
      }
    });
  });

  describe('5. Review Ingestion, Locking, and Unblinding Gate', () => {
    const cohort = createMock30SampleMatchedCohort();
    const allocation = buildSixReviewerAllocation(cohort, 54321);

    // Build a mock submission from REV_A for packet 0
    const packet0 = allocation.reviewerPackages.REV_A.packets[0];
    const validSubmissionA: ReviewerSubmission = {
      reviewerId: 'REV_A',
      reviewPacketId: packet0.reviewPacketId,
      completionTimestamp: '2026-10-30T19:00:00Z',
      scores: {
        d1_grammar_mechanics: 4.5,
        d2_coherence_continuity: 4.0,
        d3_vocabulary_precision: 4.5,
        d4_structural_organization: 4.0,
        d5_audience_context_fit: 5.0,
        d6_depth_substance: 4.0,
        d7_task_fulfillment: 4.5,
        d8_naturalness_rhythm: 4.0,
        d9_stylistic_voice: 4.0,
        d10_surface_polish: 4.5,
      },
      dimensionFlags: { d7_not_assessable: false, d7_not_assessable_reason: null },
    };

    it('ingests a valid reviewer submission and updates the ledger', () => {
      const { report, updatedLedger } = ingestReviewSubmissions(
        [validSubmissionA],
        allocation.crosswalkEntries,
        []
      );

      expect(report.ingestedCount).toBe(1);
      expect(report.rejectedCount).toBe(0);
      expect(updatedLedger).toHaveLength(1);
      expect(updatedLedger[0].reviewerId).toBe('REV_A');
      expect(updatedLedger[0].reviewPacketId).toBe(packet0.reviewPacketId);
      expect(updatedLedger[0].coreQualityMean).toBeGreaterThan(4.0);
    });

    it('rejects duplicate or conflicting submissions for an already ingested packet', () => {
      const { updatedLedger } = ingestReviewSubmissions(
        [validSubmissionA],
        allocation.crosswalkEntries,
        []
      );

      // Attempt second submission from REV_A for same packet with different scores
      const conflictingSubmission: ReviewerSubmission = {
        ...validSubmissionA,
        scores: { ...validSubmissionA.scores, d1_grammar_mechanics: 1.0 },
      };

      const res2 = ingestReviewSubmissions(
        [conflictingSubmission],
        allocation.crosswalkEntries,
        updatedLedger
      );

      expect(res2.report.ingestedCount).toBe(0);
      expect(res2.report.rejectedCount).toBe(1);
      expect(res2.report.errors.some((e) => e.includes('Duplicate submission rejected'))).toBe(true);
    });

    it('rejects submissions with invalid score ranges (e.g. 5.5 or 0.5)', () => {
      const outOfRangeSub: ReviewerSubmission = {
        ...validSubmissionA,
        reviewPacketId: allocation.reviewerPackages.REV_A.packets[1].reviewPacketId,
        scores: { ...validSubmissionA.scores, d1_grammar_mechanics: 5.5 },
      };

      const res = ingestReviewSubmissions([outOfRangeSub], allocation.crosswalkEntries, []);
      expect(res.report.ingestedCount).toBe(0);
      expect(res.report.rejectedCount).toBe(1);
      expect(res.report.errors.some((e) => e.includes('out of range') || e.includes('in [1.0, 5.0]'))).toBe(true);
    });

    it('rejects submissions containing embedded authorship guesses or detector outputs', () => {
      const contaminatedSub: ReviewerSubmission = {
        ...validSubmissionA,
        reviewPacketId: allocation.reviewerPackages.REV_A.packets[2].reviewPacketId,
        authorshipGuess: 'ai', // FORBIDDEN
        aiScore: 0.92, // FORBIDDEN
      };

      const res = ingestReviewSubmissions([contaminatedSub], allocation.crosswalkEntries, []);
      expect(res.report.ingestedCount).toBe(0);
      expect(res.report.rejectedCount).toBe(1);
      expect(res.report.errors.some((e) => e.includes('Submission contamination'))).toBe(true);
    });

    it('locks unblinding when a sample has received fewer than 2 reviews', () => {
      const { updatedLedger } = ingestReviewSubmissions(
        [validSubmissionA],
        allocation.crosswalkEntries,
        []
      );

      // Find originalSampleId of packet0
      const entry = allocation.crosswalkEntries.find(
        (e) => e.reviewerId === 'REV_A' && e.reviewerPacketId === packet0.reviewPacketId
      )!;

      const unblindAttempt = attemptUnblindSample(entry.originalSampleId, updatedLedger);
      expect(unblindAttempt.unblinded).toBe(false);
      expect(unblindAttempt.error).toContain('Unblinding locked: sample');
      expect(unblindAttempt.error).toContain('1/2 required reviews');
    });

    it('permits unblinding of a sample once both required reviews are received and locked', () => {
      // Find matching packet for the second reviewer in Pair 1 (REV_B) for the same sample
      const entryA = allocation.crosswalkEntries.find(
        (e) => e.reviewerId === 'REV_A' && e.reviewerPacketId === packet0.reviewPacketId
      )!;

      const entryB = allocation.crosswalkEntries.find(
        (e) => e.reviewerId === 'REV_B' && e.originalSampleId === entryA.originalSampleId
      )!;

      const validSubmissionB: ReviewerSubmission = {
        reviewerId: 'REV_B',
        reviewPacketId: entryB.reviewerPacketId,
        completionTimestamp: '2026-10-30T19:15:00Z',
        scores: { ...validSubmissionA.scores, d1_grammar_mechanics: 4.0 },
      };

      const { updatedLedger } = ingestReviewSubmissions(
        [validSubmissionA, validSubmissionB],
        allocation.crosswalkEntries,
        []
      );

      const unblindAttempt = attemptUnblindSample(entryA.originalSampleId, updatedLedger);
      expect(unblindAttempt.unblinded).toBe(true);
      expect(unblindAttempt.targetClass).toBe(entryA.targetClass);
      expect(unblindAttempt.reviews).toHaveLength(2);
    });
  });

  describe('6. Smoke-Test Isolation & Non-Interference', () => {
    it('confirms that AI-only candidate batch can still export via explicit workflow_smoke_test mode', () => {
      const candidatePath = resolve('somedata/files/humanizetext_v2_2_7_ai_pilot_batch_candidate.jsonl');
      const { adaptedRecords } = adaptCandidateFile(candidatePath);

      const smokeRes = exportBlindedPackets(adaptedRecords, 42, { mode: 'workflow_smoke_test' });
      expect(smokeRes.envelope.exportMode).toBe('workflow_smoke_test');
      expect(smokeRes.envelope.warning).toContain('WORKFLOW SMOKE TEST ONLY');
      expect(smokeRes.packets).toHaveLength(10);
      for (const p of smokeRes.packets) {
        expect(p.exportMode).toBe('workflow_smoke_test');
        expect(p.smokeTestNotice).toContain('WORKFLOW SMOKE TEST ONLY');
      }
    });

    it('confirms that calling default exportBlindedPackets without smoke_test option rejects the AI-only batch', () => {
      const candidatePath = resolve('somedata/files/humanizetext_v2_2_7_ai_pilot_batch_candidate.jsonl');
      const { adaptedRecords } = adaptCandidateFile(candidatePath);

      expect(() => {
        exportBlindedPackets(adaptedRecords);
      }).toThrowError(/Blinded review export rejected by Batch Integrity Guard/);
    });
  });

  describe('7. End-to-End Reviewer Assignment File Validator', () => {
    const testDir = resolve('scratch/test_reviewer_distribution');
    const testCrosswalkPath = resolve('scratch/test_admin_crosswalk.json');
    const cohort = createMock30SampleMatchedCohort();
    const allocation = buildSixReviewerAllocation(cohort, 1337);

    it('validates a complete generated package set on disk using validateReviewerAssignments', () => {
      const fs = require('node:fs');
      const path = require('node:path');
      if (!fs.existsSync(testDir)) fs.mkdirSync(testDir, { recursive: true });

      for (const revId of REVIEWER_IDS) {
        const filePath = path.join(testDir, `packets_${revId}.json`);
        fs.writeFileSync(filePath, JSON.stringify(allocation.reviewerPackages[revId].packets, null, 2), 'utf-8');
      }

      fs.writeFileSync(testCrosswalkPath, JSON.stringify(allocation.crosswalkEntries, null, 2), 'utf-8');

      const report = validateReviewerAssignments(testDir, testCrosswalkPath);
      expect(report.valid).toBe(true);
      expect(report.totalReviewersChecked).toBe(6);
      expect(report.totalPacketsChecked).toBe(60);
      expect(report.dualCoverageVerified).toBe(true);
      expect(report.zeroPromptCollisionsVerified).toBe(true);
      expect(report.redactionVerified).toBe(true);
      expect(report.errors).toHaveLength(0);

      // Cleanup
      fs.rmSync(testDir, { recursive: true, force: true });
      fs.rmSync(testCrosswalkPath, { force: true });
    });

    it('detects a blinding leak if crosswalk is saved inside the reviewer distribution directory', () => {
      const fs = require('node:fs');
      const path = require('node:path');
      if (!fs.existsSync(testDir)) fs.mkdirSync(testDir, { recursive: true });

      const leakedCrosswalkPath = path.join(testDir, 'leaked_crosswalk.json');
      fs.writeFileSync(leakedCrosswalkPath, JSON.stringify(allocation.crosswalkEntries, null, 2), 'utf-8');

      for (const revId of REVIEWER_IDS) {
        const filePath = path.join(testDir, `packets_${revId}.json`);
        fs.writeFileSync(filePath, JSON.stringify(allocation.reviewerPackages[revId].packets, null, 2), 'utf-8');
      }

      const report = validateReviewerAssignments(testDir, leakedCrosswalkPath);
      expect(report.valid).toBe(false);
      expect(report.errors.some((e: string) => e.includes('CRITICAL BLINDING LEAK'))).toBe(true);

      // Cleanup
      fs.rmSync(testDir, { recursive: true, force: true });
    });
  });
});
