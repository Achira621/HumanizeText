import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import {
  checkReviewBatchEligibility,
  exportBlindedPackets,
  createBlindedReviewPacket,
  REGISTERED_PROMPT_TEXTS,
} from '../../scripts/exportBlindedReviewPackets.ts';
import { adaptCandidateFile } from '../../scripts/pilotCandidateAdapter.ts';
import { computeSha256, type PilotIntakeRecord } from '../../scripts/pilotIntakeValidator.ts';

describe('HumanizeText Detector V2.2.7.1: Blinded Review Batch Integrity Guard', () => {
  const FROZEN_DETECTOR_CORE_SHA256 = '095C022E01E4992020EA58FDEC2AE11A9AA9726999724955EE9EF33BFE5F851C';
  const FROZEN_V2_2_1_HOLDOUT_SHA256 = 'B99092951FF1EB3D06B5BF2F37C4A2636465DEFBCC466118E264355D48CA60A5';

  describe('1. Baseline Integrity Checks', () => {
    it('verifies src/lib/detector/detectorCore.ts remains bit-for-bit frozen', () => {
      const filePath = resolve('src/lib/detector/detectorCore.ts');
      const hash = createHash('sha256').update(readFileSync(filePath)).digest('hex').toUpperCase();
      expect(hash).toBe(FROZEN_DETECTOR_CORE_SHA256);
    });

    it('verifies tests/eval/fixtures/detector_v2_2_1_holdout.json remains bit-for-bit frozen', () => {
      const filePath = resolve('tests/eval/fixtures/detector_v2_2_1_holdout.json');
      const hash = createHash('sha256').update(readFileSync(filePath)).digest('hex').toUpperCase();
      expect(hash).toBe(FROZEN_V2_2_1_HOLDOUT_SHA256);
    });
  });

  describe('2. Fail-Closed Batch Eligibility Guard: Mono-Class Batch Rejections', () => {
    const candidatePath = resolve('somedata/files/humanizetext_v2_2_7_ai_pilot_batch_candidate.jsonl');
    const { adaptedRecords: aiOnlyRecords } = adaptCandidateFile(candidatePath);

    it('rejects an AI-only batch from official blinded review (checkReviewBatchEligibility)', () => {
      const result = checkReviewBatchEligibility(aiOnlyRecords, { mode: 'official_blinded_review' });

      expect(result.eligible).toBe(false);
      expect(result.mode).toBe('official_blinded_review');
      expect(result.distinctClasses).toEqual(['ai_generated']);
      expect(result.classCounts.ai_generated).toBe(10);
      expect(
        result.errors.some((e) =>
          e.includes('Official blinded review requires multiple distinct authorship classes')
        )
      ).toBe(true);
    });

    it('throws a descriptive Error when exportBlindedPackets is invoked on an AI-only batch in official mode', () => {
      expect(() => {
        // Defaults to official_blinded_review fail-closed
        exportBlindedPackets(aiOnlyRecords, 42);
      }).toThrowError(/Blinded review export rejected by Batch Integrity Guard/);

      expect(() => {
        exportBlindedPackets(aiOnlyRecords, 42, { mode: 'official_blinded_review' });
      }).toThrowError(/Official blinded review requires multiple distinct authorship classes/);
    });

    it('rejects a Human-only batch from official blinded review', () => {
      const humanOnlyRecords: PilotIntakeRecord[] = [
        {
          id: 'v2_7_pilot_h_01',
          partition: 'workflow_validation_pilot',
          promptId: 'TASK_ACAD_01',
          targetClass: 'human_verified',
          genre: 'academic',
          intendedAudience: 'undergraduate_biology',
          targetWordCount: 160,
          text: 'Human sample text one for biology.',
          sha256: computeSha256('Human sample text one for biology.'),
          wordCount: 6,
          provenance: { participantId: 'P_HUM_01', consentObtained: true },
        },
        {
          id: 'v2_7_pilot_h_02',
          partition: 'workflow_validation_pilot',
          promptId: 'TASK_ACAD_02',
          targetClass: 'human_verified',
          genre: 'academic',
          intendedAudience: 'introductory_economics_seminar',
          targetWordCount: 160,
          text: 'Human sample text two for economics.',
          sha256: computeSha256('Human sample text two for economics.'),
          wordCount: 6,
          provenance: { participantId: 'P_HUM_02', consentObtained: true },
        },
      ];

      const result = checkReviewBatchEligibility(humanOnlyRecords, { mode: 'official_blinded_review' });
      expect(result.eligible).toBe(false);
      expect(result.distinctClasses).toEqual(['human_verified']);
      expect(
        result.errors.some((e) =>
          e.includes('Official blinded review requires multiple distinct authorship classes')
        )
      ).toBe(true);

      expect(() => {
        exportBlindedPackets(humanOnlyRecords, 42);
      }).toThrowError(/Official blinded review requires multiple distinct authorship classes/);
    });

    it('permits mono-class batches in workflow_smoke_test mode with explicit warning and stamps packets', () => {
      const result = checkReviewBatchEligibility(aiOnlyRecords, { mode: 'workflow_smoke_test' });
      expect(result.eligible).toBe(true);
      expect(result.mode).toBe('workflow_smoke_test');
      expect(result.warnings.some((w) => w.includes('restricted to workflow smoke testing'))).toBe(true);

      const exportRes = exportBlindedPackets(aiOnlyRecords, 42, { mode: 'workflow_smoke_test' });
      expect(exportRes.envelope.exportMode).toBe('workflow_smoke_test');
      expect(exportRes.envelope.warning).toBeDefined();
      expect(exportRes.packets).toHaveLength(10);
      for (const p of exportRes.packets) {
        expect(p.exportMode).toBe('workflow_smoke_test');
        expect(p.smokeTestNotice).toContain('WORKFLOW SMOKE TEST ONLY');
      }
    });
  });

  describe('3. Proper Mixed-Batch Export & Zero Class Disclosure', () => {
    const mixedRecords: PilotIntakeRecord[] = [
      {
        id: 'v2_7_pilot_h_01',
        partition: 'workflow_validation_pilot',
        promptId: 'TASK_ACAD_01',
        targetClass: 'human_verified',
        genre: 'academic',
        intendedAudience: 'undergraduate_biology',
        targetWordCount: 160,
        text: 'Human text discussing chromatin accessibility and DNA methylation.',
        sha256: computeSha256('Human text discussing chromatin accessibility and DNA methylation.'),
        wordCount: 8,
        provenance: { participantId: 'P_HUM_01', consentObtained: true },
      },
      {
        id: 'v2_7_pilot_ai_01',
        partition: 'workflow_validation_pilot',
        promptId: 'TASK_ACAD_01',
        targetClass: 'ai_generated',
        genre: 'academic',
        intendedAudience: 'undergraduate_biology',
        targetWordCount: 160,
        text: 'AI text discussing chromatin accessibility and DNA methylation.',
        sha256: computeSha256('AI text discussing chromatin accessibility and DNA methylation.'),
        wordCount: 8,
        provenance: { modelFamily: 'openai_gpt6', modelId: 'GPT-6' },
      },
      {
        id: 'v2_7_pilot_collab_01',
        partition: 'workflow_validation_pilot',
        promptId: 'TASK_ACAD_01',
        targetClass: 'ai_human_edited',
        genre: 'academic',
        intendedAudience: 'undergraduate_biology',
        targetWordCount: 160,
        text: 'Collaborative text polished by human after initial AI draft generation.',
        sha256: computeSha256('Collaborative text polished by human after initial AI draft generation.'),
        wordCount: 10,
        provenance: {
          initialDraftSha256: 'a'.repeat(64),
          postEditSha256: computeSha256('Collaborative text polished by human after initial AI draft generation.'),
        },
      },
    ];

    it('accepts mixed batch in official mode without errors', () => {
      const eligibility = checkReviewBatchEligibility(mixedRecords, { mode: 'official_blinded_review' });
      expect(eligibility.eligible).toBe(true);
      expect(eligibility.distinctClasses).toHaveLength(3);
      expect(eligibility.errors).toHaveLength(0);
    });

    it('exports mixed batch with official_blinded_review mode without disclosing class counts', () => {
      const exportRes = exportBlindedPackets(mixedRecords, 100, { mode: 'official_blinded_review' });

      expect(exportRes.envelope.exportMode).toBe('official_blinded_review');
      expect(exportRes.packets).toHaveLength(3);

      // Verify class counts are NOT disclosed in envelope or packets
      expect((exportRes.envelope as Record<string, unknown>).classCounts).toBeUndefined();
      expect((exportRes.envelope as Record<string, unknown>).distinctClasses).toBeUndefined();

      for (const p of exportRes.packets) {
        expect(p.exportMode).toBe('official_blinded_review');
        expect(p.smokeTestNotice).toBeUndefined();
        expect((p as Record<string, unknown>).targetClass).toBeUndefined();
        expect((p as Record<string, unknown>).modelFamily).toBeUndefined();
        expect((p as Record<string, unknown>).modelId).toBeUndefined();
        expect((p as Record<string, unknown>).participantId).toBeUndefined();
        expect((p as Record<string, unknown>).classCounts).toBeUndefined();
      }
    });
  });

  describe('4. Metadata Redaction, Unblinding Key Separation & Scoring Hygiene', () => {
    it('isolates unblinding keys completely from reviewer packets', () => {
      const sampleRecord: PilotIntakeRecord = {
        id: 'v2_7_pilot_ai_01',
        partition: 'workflow_validation_pilot',
        promptId: 'TASK_TECH_01',
        targetClass: 'ai_generated',
        genre: 'technical',
        intendedAudience: 'senior_backend_engineers',
        targetWordCount: 150,
        text: 'Idempotency keys ensure exactly-once semantics across network retries.',
        sha256: computeSha256('Idempotency keys ensure exactly-once semantics across network retries.'),
        wordCount: 8,
        provenance: { modelFamily: 'openai_gpt6', modelId: 'GPT-6' },
      };

      const { packet, keyEntry } = createBlindedReviewPacket(sampleRecord, 0, 'official_blinded_review');

      // Packet checks
      expect(packet.reviewPacketId).toBe('REV_PACKET_01');
      expect((packet as Record<string, unknown>).unblindingKey).toBeUndefined();
      expect((packet as Record<string, unknown>).originalSlotId).toBeUndefined();
      expect((packet as Record<string, unknown>).targetClass).toBeUndefined();

      // Key checks
      expect(keyEntry.reviewPacketId).toBe('REV_PACKET_01');
      expect(keyEntry.originalSlotId).toBe('v2_7_pilot_ai_01');
      expect(keyEntry.targetClass).toBe('ai_generated');
      expect(keyEntry.modelOrParticipant).toBe('GPT-6');
    });

    it('rejects records contaminated with detector continuous scores or classifications', () => {
      const contaminatedRecord: PilotIntakeRecord = {
        id: 'v2_7_pilot_ai_01',
        partition: 'workflow_validation_pilot',
        promptId: 'TASK_ACAD_01',
        targetClass: 'ai_generated',
        genre: 'academic',
        intendedAudience: 'undergraduate_biology',
        targetWordCount: 160,
        text: 'Contaminated text with detector score.',
        sha256: computeSha256('Contaminated text with detector score.'),
        wordCount: 5,
        provenance: { modelFamily: 'openai_gpt6' },
        detectorScore: 0.94, // FORBIDDEN CONTAMINATION
        verdict: 'ai', // FORBIDDEN CONTAMINATION
      };

      const result = checkReviewBatchEligibility([contaminatedRecord], { mode: 'workflow_smoke_test' });
      expect(result.eligible).toBe(false);
      expect(
        result.errors.some((e) => e.includes('Critical contamination') && e.includes('detectorScore'))
      ).toBe(true);
      expect(
        result.errors.some((e) => e.includes('Critical contamination') && e.includes('verdict'))
      ).toBe(true);
    });

    it('rejects records with pre-populated quality ratings prior to human evaluation', () => {
      const preAssessedRecord: PilotIntakeRecord = {
        id: 'v2_7_pilot_h_01',
        partition: 'workflow_validation_pilot',
        promptId: 'TASK_ACAD_01',
        targetClass: 'human_verified',
        genre: 'academic',
        intendedAudience: 'undergraduate_biology',
        targetWordCount: 160,
        text: 'Sample text.',
        sha256: computeSha256('Sample text.'),
        wordCount: 2,
        provenance: { participantId: 'P_HUM_01', consentObtained: true },
        qualityAssessment: {
          status: 'assessed', // FORBIDDEN PRE-POPULATION
          scores: { d1_grammar_mechanics: 5.0 },
        },
      };

      const result = checkReviewBatchEligibility([preAssessedRecord], { mode: 'workflow_smoke_test' });
      expect(result.eligible).toBe(false);
      expect(
        result.errors.some((e) => e.includes('pre-populated quality ratings'))
      ).toBe(true);
    });

    it('preserves prompt context correctly in packets for fair Dimension 7 evaluation', () => {
      const record: PilotIntakeRecord = {
        id: 'v2_7_pilot_ai_01',
        partition: 'workflow_validation_pilot',
        promptId: 'TASK_TECH_02',
        targetClass: 'ai_generated',
        genre: 'technical',
        intendedAudience: 'database_administrators_and_devops',
        targetWordCount: 150,
        text: 'Database connection pools should be sized based on disk spindles and CPU cores.',
        sha256: computeSha256('Database connection pools should be sized based on disk spindles and CPU cores.'),
        wordCount: 12,
        provenance: { modelFamily: 'openai_gpt6' },
      };

      const { packet } = createBlindedReviewPacket(record, 2, 'official_blinded_review');
      expect(packet.promptId).toBe('TASK_TECH_02');
      expect(packet.taskPromptText).toBe(REGISTERED_PROMPT_TEXTS.TASK_TECH_02.promptText);
      expect(packet.dimensionFlags.d7_not_assessable).toBe(false);
      expect(packet.dimensionFlags.d7_not_assessable_reason).toBeNull();
    });

    it('rejects partition leakage into dev or held-out partitions', () => {
      const leakedRecord: PilotIntakeRecord = {
        id: 'v2_7_pilot_ai_01',
        partition: 'held_out_final_validation', // FORBIDDEN LEAK
        promptId: 'TASK_ACAD_01',
        targetClass: 'ai_generated',
        genre: 'academic',
        intendedAudience: 'undergraduate_biology',
        targetWordCount: 160,
        text: 'Sample text.',
        sha256: computeSha256('Sample text.'),
        wordCount: 2,
        provenance: { modelFamily: 'openai_gpt6' },
      };

      const result = checkReviewBatchEligibility([leakedRecord], { mode: 'workflow_smoke_test' });
      expect(result.eligible).toBe(false);
      expect(result.errors.some((e) => e.includes('Critical partition leak'))).toBe(true);
    });
  });
});

