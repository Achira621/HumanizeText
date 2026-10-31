import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import {
  checkMatchedTaskPilotEligibility,
  buildRotatingReviewerAllocation,
  REVIEWER_IDS,
  K6_ROUNDS,
  type ReviewerId,
} from '../../scripts/generatePilotReviewerAssignments.ts';
import {
  validateReviewerAssignments,
} from '../../scripts/validatePilotReviewerAssignments.ts';
import {
  computeSha256,
  VALID_PROMPT_IDS,
  type PilotIntakeRecord,
} from '../../scripts/pilotIntakeValidator.ts';
import {
  REGISTERED_PROMPT_TEXTS,
} from '../../scripts/exportBlindedReviewPackets.ts';

/**
 * Creates a mock 30-sample matched pilot cohort adhering to the 10-prompt spec.
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

describe('HUMANIZETEXT V2.2.7.3: Rotating Reviewer Network Allocation', () => {
  const mockCohort = createMock30SampleMatchedCohort();

  describe('Mathematical Properties of the 1-Factorization Network', () => {
    it('verifies K6_ROUNDS defines a valid 1-factorization of K_6', () => {
      // 5 rounds
      expect(K6_ROUNDS).toHaveLength(5);

      const allPairsSeen = new Set<string>();

      for (const round of K6_ROUNDS) {
        // Each round has 3 pairs
        expect(round).toHaveLength(3);

        // Round vertices cover all 6 reviewers disjointly
        const roundVertices = new Set<ReviewerId>();
        for (const [r1, r2] of round) {
          expect(r1).not.toBe(r2);
          expect(REVIEWER_IDS).toContain(r1);
          expect(REVIEWER_IDS).toContain(r2);
          roundVertices.add(r1);
          roundVertices.add(r2);

          const pairKey = [r1, r2].sort().join('--');
          expect(allPairsSeen.has(pairKey)).toBe(false);
          allPairsSeen.add(pairKey);
        }
        expect(roundVertices.size).toBe(6);
      }

      // 15 distinct pairs = binom(6, 2)
      expect(allPairsSeen.size).toBe(15);
    });

    it('generates an allocation with exactly 6 reviewers', () => {
      const allocation = buildRotatingReviewerAllocation(mockCohort, 'test_seed_1');
      expect(Object.keys(allocation.reviewerPackages)).toEqual([
        'REV_A',
        'REV_B',
        'REV_C',
        'REV_D',
        'REV_E',
        'REV_F',
      ]);
    });

    it('assigns exactly 10 samples to each reviewer', () => {
      const allocation = buildRotatingReviewerAllocation(mockCohort, 'test_seed_2');
      for (const revId of REVIEWER_IDS) {
        const pkg = allocation.reviewerPackages[revId];
        expect(pkg.packets).toHaveLength(10);
        expect(pkg.totalAssigned).toBe(10);
      }
    });

    it('enforces exactly one response per prompt for each reviewer (zero prompt collisions)', () => {
      const allocation = buildRotatingReviewerAllocation(mockCohort, 'test_seed_3');
      for (const revId of REVIEWER_IDS) {
        const pkg = allocation.reviewerPackages[revId];
        const promptIds = pkg.packets.map((p) => p.promptId);
        const uniquePrompts = new Set(promptIds);
        expect(uniquePrompts.size).toBe(10);
        for (const pId of VALID_PROMPT_IDS) {
          expect(uniquePrompts.has(pId)).toBe(true);
        }
      }
    });

    it('assigns every sample to exactly two distinct reviewers (dual coverage)', () => {
      const allocation = buildRotatingReviewerAllocation(mockCohort, 'test_seed_4');
      const sampleToReviewers = new Map<string, ReviewerId[]>();

      for (const entry of allocation.crosswalkEntries) {
        if (!sampleToReviewers.has(entry.originalSampleId)) {
          sampleToReviewers.set(entry.originalSampleId, []);
        }
        sampleToReviewers.get(entry.originalSampleId)!.push(entry.reviewerId);
      }

      expect(sampleToReviewers.size).toBe(30);
      for (const [_sampleId, revs] of sampleToReviewers.entries()) {
        expect(revs).toHaveLength(2);
        expect(revs[0]).not.toBe(revs[1]);
      }
    });

    it('guarantees that every reviewer is paired with every other reviewer exactly twice', () => {
      const allocation = buildRotatingReviewerAllocation(mockCohort, 'test_seed_5');
      const sampleToReviewers = new Map<string, ReviewerId[]>();

      for (const entry of allocation.crosswalkEntries) {
        if (!sampleToReviewers.has(entry.originalSampleId)) {
          sampleToReviewers.set(entry.originalSampleId, []);
        }
        sampleToReviewers.get(entry.originalSampleId)!.push(entry.reviewerId);
      }

      // Count pairwise co-ratings across all 30 samples
      const coRatings = new Map<string, number>();
      for (let i = 0; i < REVIEWER_IDS.length; i++) {
        for (let j = i + 1; j < REVIEWER_IDS.length; j++) {
          coRatings.set(`${REVIEWER_IDS[i]}--${REVIEWER_IDS[j]}`, 0);
        }
      }

      for (const revs of sampleToReviewers.values()) {
        const sorted = [...revs].sort();
        const key = `${sorted[0]}--${sorted[1]}`;
        expect(coRatings.has(key)).toBe(true);
        coRatings.set(key, coRatings.get(key)! + 1);
      }

      // All 15 pairs must have co-rated exactly 2 times!
      expect(coRatings.size).toBe(15);
      for (const [_pairKey, count] of coRatings.entries()) {
        expect(count).toBe(2);
      }
    });

    it('balances class exposure between 3 and 4 per reviewer', () => {
      const allocation = buildRotatingReviewerAllocation(mockCohort, 'test_seed_6');
      const revClassCounts: Record<ReviewerId, { human: number; ai: number; collaborative: number }> = {
        REV_A: { human: 0, ai: 0, collaborative: 0 },
        REV_B: { human: 0, ai: 0, collaborative: 0 },
        REV_C: { human: 0, ai: 0, collaborative: 0 },
        REV_D: { human: 0, ai: 0, collaborative: 0 },
        REV_E: { human: 0, ai: 0, collaborative: 0 },
        REV_F: { human: 0, ai: 0, collaborative: 0 },
      };

      for (const entry of allocation.crosswalkEntries) {
        let cls: 'human' | 'ai' | 'collaborative' = 'human';
        if (entry.targetClass.includes('ai_generated')) cls = 'ai';
        else if (entry.targetClass.includes('edit')) cls = 'collaborative';
        revClassCounts[entry.reviewerId][cls]++;
      }

      for (const revId of REVIEWER_IDS) {
        const counts = revClassCounts[revId];
        const total = counts.human + counts.ai + counts.collaborative;
        expect(total).toBe(10);
        expect(counts.human).toBeGreaterThanOrEqual(3);
        expect(counts.human).toBeLessThanOrEqual(4);
        expect(counts.ai).toBeGreaterThanOrEqual(3);
        expect(counts.ai).toBeLessThanOrEqual(4);
        expect(counts.collaborative).toBeGreaterThanOrEqual(3);
        expect(counts.collaborative).toBeLessThanOrEqual(4);
      }
    });

    it('ensures three disjoint pairs evaluate each prompt', () => {
      const allocation = buildRotatingReviewerAllocation(mockCohort, 'test_seed_7');
      const promptReviewers = new Map<string, Set<ReviewerId>>();

      for (const entry of allocation.crosswalkEntries) {
        if (!promptReviewers.has(entry.promptId)) {
          promptReviewers.set(entry.promptId, new Set<ReviewerId>());
        }
        promptReviewers.get(entry.promptId)!.add(entry.reviewerId);
      }

      expect(promptReviewers.size).toBe(10);
      for (const [_pId, revSet] of promptReviewers.entries()) {
        expect(revSet.size).toBe(6); // all 6 reviewers evaluate 1 sample for each prompt
      }
    });

    it('ensures no duplicate reviewer-sample assignments occur', () => {
      const allocation = buildRotatingReviewerAllocation(mockCohort, 'test_seed_8');
      const seen = new Set<string>();

      for (const entry of allocation.crosswalkEntries) {
        const key = `${entry.reviewerId}::${entry.originalSampleId}`;
        expect(seen.has(key)).toBe(false);
        seen.add(key);
      }
      expect(seen.size).toBe(60);
    });

    it('generates reproducible allocations with identical seeds', () => {
      const alloc1 = buildRotatingReviewerAllocation(mockCohort, 'fixed_seed_abc');
      const alloc2 = buildRotatingReviewerAllocation(mockCohort, 'fixed_seed_abc');

      // Compare deterministic allocation fields (excluding non-deterministic timestamp)
      const stripTs = (entries: typeof alloc1.crosswalkEntries) =>
        entries.map((e) => ({
          ...e,
          assignmentTimestamp: 'STATIC_TS',
        }));

      expect(stripTs(alloc1.crosswalkEntries)).toEqual(stripTs(alloc2.crosswalkEntries));
      for (const revId of REVIEWER_IDS) {
        expect(alloc1.reviewerPackages[revId].packets).toEqual(alloc2.reviewerPackages[revId].packets);
      }
    });

    it('generates valid allocations without a seed using crypto randomness', () => {
      const alloc = buildRotatingReviewerAllocation(mockCohort);
      expect(alloc.crosswalkEntries).toHaveLength(60);
      expect(alloc.adminMetadata.algorithmVersion).toBe('2.2.7.3');
      expect(alloc.networkType).toBe('rotating_1_factorization');
    });
  });

  describe('Blinding, Redaction, and Presentation Order', () => {
    it('completely redacts ground truth metadata from reviewer packets', () => {
      const allocation = buildRotatingReviewerAllocation(mockCohort, 'redaction_test');
      const forbiddenKeys = [
        'targetClass',
        'modelFamily',
        'modelId',
        'provider',
        'participantId',
        'originalSampleId',
        'sha256',
        'detectorScore',
        'aiScore',
        'verdict',
        'unblindingKey',
        'classCounts',
      ];

      for (const revId of REVIEWER_IDS) {
        const pkg = allocation.reviewerPackages[revId];
        for (const packet of pkg.packets) {
          for (const key of forbiddenKeys) {
            expect((packet as Record<string, unknown>)[key]).toBeUndefined();
          }
          expect(packet.exportMode).toBe('official_blinded_review');
          expect(packet.reviewPacketId).toMatch(new RegExp(`^${revId}_PACKET_\\d{2}$`));
          expect(packet.text.length).toBeGreaterThan(0);
          expect(packet.taskPromptText).toBeTruthy();
          expect(packet.scoringTemplate).toEqual({
            d1_grammar_mechanics: null,
            d2_coherence_continuity: null,
            d3_vocabulary_precision: null,
            d4_structural_organization: null,
            d5_audience_context_fit: null,
            d6_depth_substance: null,
            d7_task_fulfillment: null,
            d8_naturalness_rhythm: null,
            d9_stylistic_voice: null,
            d10_surface_polish: null,
          });
        }
      }
    });

    it('randomizes packet presentation order independently per reviewer', () => {
      const allocation = buildRotatingReviewerAllocation(mockCohort, 'order_test_seed');
      const promptOrders = REVIEWER_IDS.map((revId) =>
        allocation.reviewerPackages[revId].packets.map((p) => p.promptId).join(',')
      );

      // At least some reviewers should have distinct presentation orders
      const uniqueOrders = new Set(promptOrders);
      expect(uniqueOrders.size).toBeGreaterThan(1);
    });
  });

  describe('Eligibility Gate and Non-Fabrication Enforcement', () => {
    it('rejects incomplete AI-only candidate cohort in official mode', () => {
      const aiOnly = mockCohort.filter((r) => r.targetClass === 'ai_generated');
      expect(aiOnly).toHaveLength(10);

      expect(() => buildRotatingReviewerAllocation(aiOnly)).toThrow(
        /Cannot generate rotating reviewer allocation\. Eligibility check failed/
      );
    });

    it('fails closed when given empty records', () => {
      expect(() => buildRotatingReviewerAllocation([])).toThrow(
        /Intake records list is empty/
      );
    });

    it('detects missing prompt coverage or class imbalance', () => {
      const corrupted = [...mockCohort];
      // Replace prompt 1 human with another AI sample
      corrupted[0] = { ...corrupted[0], targetClass: 'ai_generated', id: 'corrupted_ai_sample' };

      const check = checkMatchedTaskPilotEligibility(corrupted);
      expect(check.eligible).toBe(false);
      expect(check.errors.some((e) => e.includes('Human sample count imbalance'))).toBe(true);
      expect(check.errors.some((e) => e.includes('AI sample count imbalance'))).toBe(true);
    });
  });

  describe('Validator Integration and Administrator Security', () => {
    const testTempDir = resolve('scratch/test_v2_2_7_3_network');
    const packetsDir = join(testTempDir, 'reviewer_packets');
    const secureCrosswalkDir = join(testTempDir, 'admin_secure');
    const crosswalkPath = join(secureCrosswalkDir, 'crosswalk.json');

    beforeEach(() => {
      if (existsSync(testTempDir)) {
        rmSync(testTempDir, { recursive: true, force: true });
      }
      mkdirSync(packetsDir, { recursive: true });
      mkdirSync(secureCrosswalkDir, { recursive: true });
    });

    afterEach(() => {
      if (existsSync(testTempDir)) {
        rmSync(testTempDir, { recursive: true, force: true });
      }
    });

    it('passes complete validation for a correctly generated rotating allocation', () => {
      const alloc = buildRotatingReviewerAllocation(mockCohort, 'validation_pass_seed', {
        externalCrosswalkPath: crosswalkPath,
      });

      // Write packets
      for (const revId of REVIEWER_IDS) {
        writeFileSync(
          join(packetsDir, `packets_${revId}.json`),
          JSON.stringify(alloc.reviewerPackages[revId].packets, null, 2),
          'utf-8'
        );
      }
      // Write crosswalk to separate secure directory
      writeFileSync(crosswalkPath, JSON.stringify(alloc.crosswalkEntries, null, 2), 'utf-8');

      const report = validateReviewerAssignments(packetsDir, crosswalkPath);
      expect(report.valid).toBe(true);
      expect(report.networkType).toBe('rotating_1_factorization');
      expect(report.dualCoverageVerified).toBe(true);
      expect(report.zeroPromptCollisionsVerified).toBe(true);
      expect(report.rotatingPairBalanceVerified).toBe(true);
      expect(report.classExposureBalanceVerified).toBe(true);
      expect(report.redactionVerified).toBe(true);
      expect(report.crosswalkIsolationVerified).toBe(true);
      expect(report.errors).toHaveLength(0);
    });

    it('fails validation when crosswalk is located inside reviewer packets directory', () => {
      const leakedCrosswalkPath = join(packetsDir, 'leaked_crosswalk.json');

      const alloc = buildRotatingReviewerAllocation(mockCohort, 'leak_test');
      for (const revId of REVIEWER_IDS) {
        writeFileSync(
          join(packetsDir, `packets_${revId}.json`),
          JSON.stringify(alloc.reviewerPackages[revId].packets, null, 2),
          'utf-8'
        );
      }
      writeFileSync(leakedCrosswalkPath, JSON.stringify(alloc.crosswalkEntries, null, 2), 'utf-8');

      const report = validateReviewerAssignments(packetsDir, leakedCrosswalkPath);
      expect(report.valid).toBe(false);
      expect(report.crosswalkIsolationVerified).toBe(false);
      expect(report.errors.some((e) => e.includes('CRITICAL BLINDING LEAK'))).toBe(true);
    });

    it('fails validation if suspicious key/secret file is found in reviewer directory', () => {
      const alloc = buildRotatingReviewerAllocation(mockCohort, 'suspicious_file_test');
      for (const revId of REVIEWER_IDS) {
        writeFileSync(
          join(packetsDir, `packets_${revId}.json`),
          JSON.stringify(alloc.reviewerPackages[revId].packets, null, 2),
          'utf-8'
        );
      }
      writeFileSync(crosswalkPath, JSON.stringify(alloc.crosswalkEntries, null, 2), 'utf-8');

      // Drop a secret file in reviewer directory
      writeFileSync(join(packetsDir, 'unblind_key.txt'), 'secret_key_123', 'utf-8');

      const report = validateReviewerAssignments(packetsDir, crosswalkPath);
      expect(report.valid).toBe(false);
      expect(report.crosswalkIsolationVerified).toBe(false);
      expect(report.errors.some((e) => e.includes('Suspicious administrative file'))).toBe(true);
    });
  });
});
