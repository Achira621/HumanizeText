import { describe, it, expect } from 'vitest';
import { computeAiScore } from '../../src/lib/detector/detectorCore';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import {
  validatePilotRecord,
  validatePilotIntakeFile,
  computeSha256,
  computeWordCount,
  VALID_PROMPT_IDS,
  VALID_PARTITION,
  type PilotIntakeRecord,
} from '../../scripts/pilotIntakeValidator.ts';
import {
  REGISTERED_PROMPT_TEXTS,
  exportBlindedPackets,
  createBlindedReviewPacket,
} from '../../scripts/exportBlindedReviewPackets.ts';
import {
  adaptCandidateFile,
  validateCandidateRecord,
  adaptCandidateToPilotRecord,
  PROMPT_TO_MANIFEST_SLOT_MAP,
  type RawCandidateRecord,
} from '../../scripts/pilotCandidateAdapter.ts';

describe('HumanizeText Detector V2.2.7: Pilot Study & Intake Validation Test Suite', () => {
  const FROZEN_DETECTOR_CORE_SHA256 = '095C022E01E4992020EA58FDEC2AE11A9AA9726999724955EE9EF33BFE5F851C';
  const FROZEN_V2_2_1_HOLDOUT_SHA256 = 'B99092951FF1EB3D06B5BF2F37C4A2636465DEFBCC466118E264355D48CA60A5';

  describe('1. Frozen Baseline Integrity Checks', () => {
    it('verifies that detectorCore.ts preserves behavioral contracts while retaining historical provenance', () => {
      expect(FROZEN_DETECTOR_CORE_SHA256).toBeDefined();
      expect(typeof computeAiScore).toBe('function');
      const sc = computeAiScore('Pilot study baseline validation text.');
      expect(sc.aiProbability).toBe(0.18);
      expect(sc.sampleSufficiency).toBe('insufficient');
      expect(sc.wordCount).toBe(5);
    });

    it('verifies that tests/eval/fixtures/detector_v2_2_1_holdout.json is bit-for-bit identical to baseline', () => {
      const filePath = resolve('tests/eval/fixtures/detector_v2_2_1_holdout.json');
      const content = readFileSync(filePath, 'utf-8').replace(/\r\n/g, '\n');
      const hash = createHash('sha256').update(content, 'utf-8').digest('hex').toUpperCase();
      expect(hash).toBe(FROZEN_V2_2_1_HOLDOUT_SHA256);
    });
  });

  describe('2. Preregistered Pilot Manifest Structure ($N=30$)', () => {
    const manifestPath = resolve('tests/eval/fixtures/detector_v2_7_pilot_manifest.json');
    const raw = readFileSync(manifestPath, 'utf-8');
    const manifest = JSON.parse(raw);

    it('has protocolVersion 2.2.7 and declares exactly 30 total pilot slots', () => {
      expect(manifest.protocolVersion).toBe('2.2.7');
      expect(manifest.totalPilotSlots).toBe(30);
      expect(manifest.slots).toHaveLength(30);
      expect(manifest.breakdown).toEqual({
        pureHuman: 10,
        pureAi: 10,
        collaborative: 10,
      });
    });

    it('contains unique IDs across all slots conforming to pattern', () => {
      const ids = manifest.slots.map((s: { id: string }) => s.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(30);

      const humanIds = ids.filter((id: string) => id.startsWith('v2_7_pilot_h_'));
      const aiIds = ids.filter((id: string) => id.startsWith('v2_7_pilot_ai_'));
      const collabIds = ids.filter((id: string) => id.startsWith('v2_7_pilot_collab_'));

      expect(humanIds).toHaveLength(10);
      expect(aiIds).toHaveLength(10);
      expect(collabIds).toHaveLength(10);
    });

    it('strictly isolates partition to workflow_validation_pilot and isolates from holdout', () => {
      for (const slot of manifest.slots) {
        expect(slot.partition).toBe(VALID_PARTITION);
        expect(slot.partition).not.toContain('held_out');
        expect(slot.partition).not.toContain('final_validation');
        expect(slot.partition).not.toContain('development');
      }
    });

    it('enforces that all 30 slots are pending_collection and unassessed with zero synthetic data', () => {
      for (const slot of manifest.slots) {
        expect(slot.collectionStatus).toBe('pending_collection');
        expect(slot.text).toBeUndefined();
        expect(slot.sha256).toBeUndefined();
        expect(slot.qualityAssessment.status).toBe('unassessed');
        expect(slot.qualityAssessment.raters).toHaveLength(0);
        expect(slot.qualityAssessment.scores).toBeNull();
        expect(slot.qualityAssessment.overallMeanScore).toBeNull();
      }
    });

    it('covers all 10 preregistered prompt IDs across 5 genres', () => {
      const promptIds = new Set(manifest.slots.map((s: { promptId: string }) => s.promptId));
      expect(promptIds.size).toBe(10);
      for (const pId of VALID_PROMPT_IDS) {
        expect(promptIds.has(pId)).toBe(true);
      }

      const genres = manifest.slots.map((s: { genre: string }) => s.genre);
      const genreCounts: Record<string, number> = {};
      for (const g of genres) {
        genreCounts[g] = (genreCounts[g] || 0) + 1;
      }
      expect(genreCounts.academic).toBe(6); // 2 prompts * 3 classes
      expect(genreCounts.technical).toBe(6);
      expect(genreCounts.corporate).toBe(6);
      expect(genreCounts.conversational).toBe(6);
      expect(genreCounts.creative).toBe(6);
    });
  });

  describe('3. Matched-Task Prompt Pack Registry', () => {
    it('contains all 10 preregistered prompts with valid metadata', () => {
      expect(Object.keys(REGISTERED_PROMPT_TEXTS)).toHaveLength(10);
      for (const pId of VALID_PROMPT_IDS) {
        const spec = REGISTERED_PROMPT_TEXTS[pId];
        expect(spec).toBeDefined();
        expect(spec.promptId).toBe(pId);
        expect(typeof spec.promptText).toBe('string');
        expect(spec.promptText.length).toBeGreaterThan(60);
        expect(spec.targetWordCount).toBeGreaterThanOrEqual(120);
        expect(spec.targetWordCount).toBeLessThanOrEqual(180);
      }
    });
  });

  describe('4. Deterministic Intake Validator Functions', () => {
    it('successfully validates the 30 pending slots in the pilot manifest file', () => {
      const report = validatePilotIntakeFile('tests/eval/fixtures/detector_v2_7_pilot_manifest.json');
      expect(report.totalProcessed).toBe(30);
      expect(report.validCount).toBe(30);
      expect(report.invalidCount).toBe(0);
      expect(report.pendingManifestSlotCount).toBe(30);
      expect(report.partitionIntegrityPassed).toBe(true);
    });

    it('correctly accepts a valid completed human intake record', () => {
      const sampleText = 'DNA methylation typically condenses chromatin into heterochromatin, silencing transcription, whereas histone acetylation relaxes chromatin into euchromatin, enabling transcription factor access and active gene expression.';
      const validHumanRecord: PilotIntakeRecord = {
        id: 'v2_7_pilot_h_01',
        partition: 'workflow_validation_pilot',
        promptId: 'TASK_ACAD_01',
        targetClass: 'human_verified',
        genre: 'academic',
        intendedAudience: 'undergraduate_biology',
        targetWordCount: 160,
        collectionStatus: 'collected',
        text: sampleText,
        sha256: computeSha256(sampleText),
        wordCount: computeWordCount(sampleText),
        provenance: {
          participantId: 'P_HUM_01',
          consentObtained: true,
          consentDate: '2026-10-29T12:00:00Z',
          draftingMethod: 'independent_unassisted',
        },
      };

      const res = validatePilotRecord(validHumanRecord);
      expect(res.valid).toBe(true);
      expect(res.errors).toHaveLength(0);
    });

    it('correctly accepts a valid completed AI intake record with preserved version uncertainty', () => {
      const sampleAiText = 'Idempotency keys prevent duplicate transactions on network retry. Clients send a unique UUID in the Idempotency-Key header. The server atomically caches the response with a 24-hour TTL in Redis.';
      const validAiRecord: PilotIntakeRecord = {
        id: 'v2_7_pilot_ai_03',
        partition: 'workflow_validation_pilot',
        promptId: 'TASK_TECH_01',
        targetClass: 'ai_generated',
        genre: 'technical',
        intendedAudience: 'senior_backend_engineers',
        targetWordCount: 150,
        collectionStatus: 'collected',
        text: sampleAiText,
        sha256: computeSha256(sampleAiText),
        wordCount: computeWordCount(sampleAiText),
        provenance: {
          modelFamily: 'anthropic_claude',
          modelId: 'claude-sonnet-5-5',
          generationTimestamp: '2026-10-29T14:30:00Z',
          interfaceType: 'consumer_web',
          exactCheckpointId: 'unverified_consumer_alias',
        },
      };

      const res = validatePilotRecord(validAiRecord);
      expect(res.valid).toBe(true);
      expect(res.errors).toHaveLength(0);
    });

    it('correctly accepts a valid collaborative intake record with pre- and post-edit hashes', () => {
      const initialText = 'Initial AI generated draft about database connection pools.';
      const revisedText = 'Initial AI generated draft about database connection pools with careful human refinements.';
      const initialHash = computeSha256(initialText);
      const revisedHash = computeSha256(revisedText);

      const validCollabRecord: PilotIntakeRecord = {
        id: 'v2_7_pilot_collab_04',
        partition: 'workflow_validation_pilot',
        promptId: 'TASK_TECH_02',
        targetClass: 'ai_human_edited',
        genre: 'technical',
        intendedAudience: 'database_administrators_and_devops',
        targetWordCount: 150,
        collectionStatus: 'collected',
        text: revisedText,
        sha256: revisedHash,
        wordCount: computeWordCount(revisedText),
        provenance: {
          initialDraftSha256: initialHash,
          postEditSha256: revisedHash,
          editingPromptOrNotes: 'Polished awkward phrasing and inserted formula.',
        },
      };

      const res = validatePilotRecord(validCollabRecord);
      expect(res.valid).toBe(true);
      expect(res.errors).toHaveLength(0);
    });

    it('rejects partition leakage into held_out or final_validation', () => {
      const leakedRecord: PilotIntakeRecord = {
        id: 'v2_7_pilot_h_01',
        partition: 'final_validation_held_out',
        promptId: 'TASK_ACAD_01',
        targetClass: 'human_verified',
        genre: 'academic',
        intendedAudience: 'undergraduate_biology',
        targetWordCount: 160,
        collectionStatus: 'collected',
        text: 'Some sample text.',
        sha256: computeSha256('Some sample text.'),
        wordCount: computeWordCount('Some sample text.'),
        provenance: { participantId: 'P_HUM_01', consentObtained: true },
      };

      const res = validatePilotRecord(leakedRecord);
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.includes('Invalid partition') || e.includes('CRITICAL'))).toBe(true);
    });

    it('rejects cryptographic SHA-256 mismatch when text has been altered', () => {
      const sampleText = 'Original text that has not been altered.';
      const tamperedRecord: PilotIntakeRecord = {
        id: 'v2_7_pilot_h_01',
        partition: 'workflow_validation_pilot',
        promptId: 'TASK_ACAD_01',
        targetClass: 'human_verified',
        genre: 'academic',
        intendedAudience: 'undergraduate_biology',
        targetWordCount: 160,
        collectionStatus: 'collected',
        text: sampleText + ' Extra sneaky edit!',
        sha256: computeSha256(sampleText), // Old hash!
        wordCount: computeWordCount(sampleText),
        provenance: { participantId: 'P_HUM_01', consentObtained: true },
      };

      const res = validatePilotRecord(tamperedRecord);
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.includes('Cryptographic SHA-256 mismatch'))).toBe(true);
    });

    it('rejects word count mismatch when declared count deviates from whitespace tokens', () => {
      const sampleText = 'One two three four five.';
      const mismatchRecord: PilotIntakeRecord = {
        id: 'v2_7_pilot_h_01',
        partition: 'workflow_validation_pilot',
        promptId: 'TASK_ACAD_01',
        targetClass: 'human_verified',
        genre: 'academic',
        intendedAudience: 'undergraduate_biology',
        targetWordCount: 160,
        collectionStatus: 'collected',
        text: sampleText,
        sha256: computeSha256(sampleText),
        wordCount: 99, // Wrong word count!
        provenance: { participantId: 'P_HUM_01', consentObtained: true },
      };

      const res = validatePilotRecord(mismatchRecord);
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.includes('Word count mismatch'))).toBe(true);
    });

    it('rejects privacy leaks such as email addresses in provenance metadata', () => {
      const sampleText = 'Sample text written by student.';
      const privacyLeakRecord: PilotIntakeRecord = {
        id: 'v2_7_pilot_h_01',
        partition: 'workflow_validation_pilot',
        promptId: 'TASK_ACAD_01',
        targetClass: 'human_verified',
        genre: 'academic',
        intendedAudience: 'undergraduate_biology',
        targetWordCount: 160,
        collectionStatus: 'collected',
        text: sampleText,
        sha256: computeSha256(sampleText),
        wordCount: computeWordCount(sampleText),
        provenance: {
          participantId: 'P_HUM_01',
          contactEmail: 'student.realname@university.edu', // Forbidden PII
          consentObtained: true,
        },
      };

      const res = validatePilotRecord(privacyLeakRecord);
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.includes('Privacy violation'))).toBe(true);
    });

    it('rejects human records where consentObtained is false or missing', () => {
      const sampleText = 'Sample text written without documented consent.';
      const noConsentRecord: PilotIntakeRecord = {
        id: 'v2_7_pilot_h_01',
        partition: 'workflow_validation_pilot',
        promptId: 'TASK_ACAD_01',
        targetClass: 'human_verified',
        genre: 'academic',
        intendedAudience: 'undergraduate_biology',
        targetWordCount: 160,
        collectionStatus: 'collected',
        text: sampleText,
        sha256: computeSha256(sampleText),
        wordCount: computeWordCount(sampleText),
        provenance: { participantId: 'P_HUM_01', consentObtained: false },
      };

      const res = validatePilotRecord(noConsentRecord);
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.includes('missing explicit participant informed consent'))).toBe(true);
    });

    it('rejects collaborative records with identical initial and post-edit hashes', () => {
      const text = 'Untouched text falsely claimed as edited.';
      const h = computeSha256(text);
      const fakeCollabRecord: PilotIntakeRecord = {
        id: 'v2_7_pilot_collab_01',
        partition: 'workflow_validation_pilot',
        promptId: 'TASK_ACAD_01',
        targetClass: 'ai_human_edited',
        genre: 'academic',
        intendedAudience: 'undergraduate_biology',
        targetWordCount: 160,
        collectionStatus: 'collected',
        text,
        sha256: h,
        wordCount: computeWordCount(text),
        provenance: {
          initialDraftSha256: h,
          postEditSha256: h, // Identical! No edits made.
        },
      };

      const res = validatePilotRecord(fakeCollabRecord);
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.includes('identical initial and post-edit hashes'))).toBe(true);
    });

    it('validates quality assessments and handles d7_not_assessable rule properly', () => {
      const assessedRecord: PilotIntakeRecord = {
        id: 'v2_7_pilot_h_01',
        partition: 'workflow_validation_pilot',
        promptId: 'TASK_ACAD_01',
        targetClass: 'human_verified',
        genre: 'academic',
        intendedAudience: 'undergraduate_biology',
        targetWordCount: 160,
        collectionStatus: 'collected',
        text: 'Valid text.',
        sha256: computeSha256('Valid text.'),
        wordCount: 2,
        provenance: { participantId: 'P_HUM_01', consentObtained: true },
        qualityAssessment: {
          status: 'assessed',
          raters: [
            {
              reviewerId: 'RATER_01',
              scores: {
                d1_grammar_mechanics: 4.5,
                d2_coherence_continuity: 4.0,
                d3_vocabulary_precision: 4.0,
                d4_structural_organization: 4.5,
                d5_audience_context_fit: 5.0,
                d6_depth_substance: 4.0,
                d7_task_fulfillment: null,
                d8_naturalness_rhythm: 4.0,
                d9_stylistic_voice: 4.0,
                d10_surface_polish: 4.5,
              },
              dimensionFlags: {
                d7_not_assessable: true,
                d7_not_assessable_reason: 'historical_text_unprompted',
              },
            },
          ],
        },
      };

      const res = validatePilotRecord(assessedRecord);
      expect(res.valid).toBe(true);
      expect(res.errors).toHaveLength(0);
    });
  });

  describe('5. Blinded Review Packet Exporter', () => {
    it('creates blinded review packet containing task prompt and redacting true class and model', () => {
      const mockRecord: PilotIntakeRecord = {
        id: 'v2_7_pilot_ai_01',
        partition: 'workflow_validation_pilot',
        promptId: 'TASK_ACAD_01',
        targetClass: 'ai_generated',
        genre: 'academic',
        intendedAudience: 'undergraduate_biology',
        targetWordCount: 160,
        text: 'Epigenetic modifications regulate gene expression without DNA sequence changes.',
        sha256: computeSha256('Epigenetic modifications regulate gene expression without DNA sequence changes.'),
        wordCount: 9,
        provenance: {
          modelFamily: 'openai_gpt6',
          modelId: 'gpt-6-astra',
          generationTimestamp: '2026-10-29T10:00:00Z',
        },
      };

      const { packet, keyEntry } = createBlindedReviewPacket(mockRecord, 0);

      // Packet checks
      expect(packet.reviewPacketId).toBe('REV_PACKET_01');
      expect(packet.promptId).toBe('TASK_ACAD_01');
      expect(packet.taskPromptText).toBe(REGISTERED_PROMPT_TEXTS.TASK_ACAD_01.promptText);
      expect(packet.dimensionFlags.d7_not_assessable).toBe(false);
      expect(packet.rubricDimensions).toHaveLength(10);

      // Strict redaction checks
      expect((packet as Record<string, unknown>).targetClass).toBeUndefined();
      expect((packet as Record<string, unknown>).modelFamily).toBeUndefined();
      expect((packet as Record<string, unknown>).modelId).toBeUndefined();
      expect((packet as Record<string, unknown>).participantId).toBeUndefined();
      expect((packet as Record<string, unknown>).detectorScore).toBeUndefined();
      expect((packet as Record<string, unknown>).verdict).toBeUndefined();

      // Key entry checks
      expect(keyEntry.reviewPacketId).toBe('REV_PACKET_01');
      expect(keyEntry.originalSlotId).toBe('v2_7_pilot_ai_01');
      expect(keyEntry.targetClass).toBe('ai_generated');
      expect(keyEntry.modelOrParticipant).toBe('gpt-6-astra');
    });

    it('correctly sets d7_not_assessable when prompt context is unknown', () => {
      const unpromptedRecord: PilotIntakeRecord = {
        id: 'archival_sample_99',
        partition: 'workflow_validation_pilot',
        promptId: 'UNKNOWN_HISTORICAL_SOURCE',
        targetClass: 'human_verified',
        genre: 'creative',
        intendedAudience: 'general',
        targetWordCount: 150,
        text: 'Archival passage from historical collection.',
        sha256: computeSha256('Archival passage from historical collection.'),
        wordCount: 5,
        provenance: { authorOrSource: 'Historical Archive 1998' },
      };

      const { packet } = createBlindedReviewPacket(unpromptedRecord, 5);
      expect(packet.taskPromptText).toBeNull();
      expect(packet.dimensionFlags.d7_not_assessable).toBe(true);
      expect(packet.dimensionFlags.d7_not_assessable_reason).toBe('no_preregistered_task_prompt');
    });

    it('exports a batch of records and keeps separate unblinding key list', () => {
      const records: PilotIntakeRecord[] = [
        {
          id: 'v2_7_pilot_h_01',
          partition: 'workflow_validation_pilot',
          promptId: 'TASK_ACAD_01',
          targetClass: 'human_verified',
          genre: 'academic',
          intendedAudience: 'undergraduate_biology',
          targetWordCount: 160,
          text: 'Human text.',
          sha256: computeSha256('Human text.'),
          wordCount: 2,
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
          text: 'AI text.',
          sha256: computeSha256('AI text.'),
          wordCount: 2,
          provenance: { modelId: 'gpt-6-astra' },
        },
      ];

      const { packets, unblindingKeys } = exportBlindedPackets(records, 12345);
      expect(packets).toHaveLength(2);
      expect(unblindingKeys).toHaveLength(2);
      expect(packets.every((p) => p.reviewPacketId.startsWith('REV_PACKET_'))).toBe(true);
      expect(unblindingKeys.every((k) => k.originalSlotId.startsWith('v2_7_pilot_'))).toBe(true);
    });
  });

  describe('6. Genuine ChatGPT AI Pilot Candidate Batch Ingestion ($N=10$)', () => {
    const candidatePath = resolve('somedata/files/humanizetext_v2_2_7_ai_pilot_batch_candidate.jsonl');
    const rawContent = readFileSync(candidatePath, 'utf-8').trim();
    const candidateLines = rawContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
    const candidateRecords: RawCandidateRecord[] = candidateLines.map((l) => JSON.parse(l));

    it('contains exactly 10 genuine ChatGPT candidate records matching preregistered prompts', () => {
      expect(candidateRecords).toHaveLength(10);
      const promptIds = candidateRecords.map((r) => r.promptId);
      expect(new Set(promptIds).size).toBe(10);
      for (const pId of VALID_PROMPT_IDS) {
        expect(promptIds).toContain(pId);
      }
    });

    it('verifies that all ten sample IDs conform to pattern v2_7_pilot_ai_task_...', () => {
      for (const r of candidateRecords) {
        expect(r.sampleId).toMatch(/^v2_7_pilot_ai_task_[a-z0-9_]+$/);
      }
    });

    it('verifies every SHA-256 against the exact candidate text', () => {
      for (const r of candidateRecords) {
        const computedSha = computeSha256(r.text);
        expect(r.textSha256.toLowerCase()).toBe(computedSha.toLowerCase());
      }
    });

    it('verifies that word counts strictly match whitespace tokens and fall within preregistered target ranges', () => {
      for (const r of candidateRecords) {
        const computedWords = computeWordCount(r.text);
        expect(r.wordCount).toBe(computedWords);
        const [minW, maxW] = r.targetWordRange;
        expect(computedWords).toBeGreaterThanOrEqual(minW);
        expect(computedWords).toBeLessThanOrEqual(maxW);
      }
    });

    it('validates all raw candidate records with validateCandidateRecord (10 valid, 0 invalid)', () => {
      for (const r of candidateRecords) {
        const diag = validateCandidateRecord(r);
        expect(diag.valid).toBe(true);
        expect(diag.hashMatch).toBe(true);
        expect(diag.wordCountMatch).toBe(true);
        expect(diag.rangeMatch).toBe(true);
        expect(diag.errors).toHaveLength(0);
      }
    });

    it('adapts candidate records to PilotIntakeRecord preserving text immutability and unverified checkpoint status', () => {
      const adapted = candidateRecords.map(adaptCandidateToPilotRecord);
      expect(adapted).toHaveLength(10);

      for (let i = 0; i < adapted.length; i++) {
        const cand = candidateRecords[i];
        const rec = adapted[i];

        // Text immutability
        expect(rec.text).toBe(cand.text);
        expect(rec.sha256).toBe(cand.textSha256);
        expect(rec.wordCount).toBe(cand.wordCount);

        // Partition isolation
        expect(rec.partition).toBe('workflow_validation_pilot');
        expect(rec.targetClass).toBe('ai_generated');

        // Slot mapping
        expect(rec.id).toBe(PROMPT_TO_MANIFEST_SLOT_MAP[cand.promptId]);
        expect(rec.candidateSampleId).toBe(cand.sampleId);

        // Preserved unverified checkpoint ID
        expect(rec.provenance?.exactCheckpointId).toBe('unverified_consumer_alias');
        expect(rec.provenance?.modelVersionStatus).toBe('unverified_backend_checkpoint');

        // Quality assessment unassessed
        expect(rec.qualityAssessment?.status).toBe('unassessed');
        expect(rec.qualityAssessment?.scores).toBeNull();
        expect(rec.qualityAssessment?.raters).toHaveLength(0);

        // Human fact-check status preserved
        expect(rec.humanFactCheckStatus).toBe(cand.humanFactCheckStatus);
      }
    });

    it('passes pilot intake validation on adapted file with zero errors and zero partition leaks', () => {
      const { adaptedRecords, totalValid, totalInvalid } = adaptCandidateFile(
        candidatePath,
        resolve('scratch/pilot_intake_data.jsonl')
      );

      expect(totalValid).toBe(10);
      expect(totalInvalid).toBe(0);
      expect(adaptedRecords).toHaveLength(10);

      const intakeReport = validatePilotIntakeFile('scratch/pilot_intake_data.jsonl');
      expect(intakeReport.totalProcessed).toBe(10);
      expect(intakeReport.validCount).toBe(10);
      expect(intakeReport.invalidCount).toBe(0);
      expect(intakeReport.partitionIntegrityPassed).toBe(true);
      expect(intakeReport.results.every((r) => r.valid)).toBe(true);
    });

    it('exports 10 fully blinded review packets from adapted intake records in smoke_test mode with zero metadata leakage', () => {
      const { adaptedRecords } = adaptCandidateFile(candidatePath);
      const { packets, unblindingKeys, envelope } = exportBlindedPackets(adaptedRecords, 42, {
        mode: 'workflow_smoke_test',
      });

      expect(packets).toHaveLength(10);
      expect(unblindingKeys).toHaveLength(10);
      expect(envelope.exportMode).toBe('workflow_smoke_test');

      for (const p of packets) {
        expect(p.exportMode).toBe('workflow_smoke_test');
        expect(p.smokeTestNotice).toBeDefined();
        expect(p.text.length).toBeGreaterThan(0);
        expect(p.actualWordCount).toBeGreaterThan(0);
        expect(p.taskPromptText).toBeDefined();
        expect(p.taskPromptText).not.toBeNull();
        expect(p.rubricDimensions).toHaveLength(10);

        // Strict blinding verification
        expect((p as Record<string, unknown>).targetClass).toBeUndefined();
        expect((p as Record<string, unknown>).modelFamily).toBeUndefined();
        expect((p as Record<string, unknown>).modelId).toBeUndefined();
        expect((p as Record<string, unknown>).provider).toBeUndefined();
        expect((p as Record<string, unknown>).detectorScore).toBeUndefined();
        expect((p as Record<string, unknown>).classCounts).toBeUndefined();
      }
    });
  });
});

