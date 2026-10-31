/**
 * ============================================================================
 * HUMANIZETEXT DETECTOR V2.2.7.1: BLINDED REVIEW PACKET EXPORTER
 * Guarded utility to generate ethically blinded reviewer packets from pilot entries.
 * Features a fail-closed batch eligibility guard:
 *  - Enforces multi-class composition for official blinded reviews.
 *  - Rejects single-class (AI-only or Human-only) batches for official evaluation.
 *  - Explicitly marks dry-run exports as 'workflow_smoke_test'.
 *  - Strictly isolates unblinding keys and purges detector scores and metadata.
 *  - Preserves task prompt context for fair Dimension 7 (Task Fulfillment) rating.
 * ============================================================================
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { computeWordCount, computeSha256, type PilotIntakeRecord } from './pilotIntakeValidator.ts';

export type ExportMode = 'official_blinded_review' | 'workflow_smoke_test';

export interface ReviewBatchEligibilityOptions {
  mode?: ExportMode;
  minDistinctClasses?: number;
  requirePreservedPromptContext?: boolean;
  allowedPartition?: string;
  allowEmpty?: boolean;
}

export interface ReviewBatchEligibilityResult {
  eligible: boolean;
  mode: ExportMode;
  totalRecords: number;
  distinctClasses: string[];
  classCounts: Record<string, number>;
  errors: string[];
  warnings: string[];
}

export const REGISTERED_PROMPT_TEXTS: Record<
  string,
  {
    promptId: string;
    genre: string;
    intendedAudience: string;
    targetWordCount: number;
    promptText: string;
  }
> = {
  TASK_ACAD_01: {
    promptId: 'TASK_ACAD_01',
    genre: 'academic',
    intendedAudience: 'undergraduate_biology',
    targetWordCount: 160,
    promptText:
      'Explain how epigenetic modifications—specifically DNA methylation and histone acetylation—regulate eukaryotic gene expression without altering the underlying nucleotide sequence. Discuss chromatin accessibility and the functional outcome of each modification.',
  },
  TASK_ACAD_02: {
    promptId: 'TASK_ACAD_02',
    genre: 'academic',
    intendedAudience: 'introductory_economics_seminar',
    targetWordCount: 160,
    promptText:
      'Analyze the economic consequences of imposing a binding rent ceiling on urban housing markets. Contrast short-run and long-run supply elasticity, and explain the non-price rationing mechanisms that typically emerge.',
  },
  TASK_TECH_01: {
    promptId: 'TASK_TECH_01',
    genre: 'technical',
    intendedAudience: 'senior_backend_engineers',
    targetWordCount: 150,
    promptText:
      'Write a technical integration guide explaining how API clients should use idempotency keys when submitting financial transaction requests over HTTP POST. Explain server-side key deduplication, TTL caching, and handling network retry attempts.',
  },
  TASK_TECH_02: {
    promptId: 'TASK_TECH_02',
    genre: 'technical',
    intendedAudience: 'database_administrators_and_devops',
    targetWordCount: 150,
    promptText:
      'Document best practices for configuring a relational database connection pool (e.g. PostgreSQL with pgbouncer or HikariCP). Explain why oversized pools cause thread contention and connection starvation under high concurrency, and provide a sizing formula.',
  },
  TASK_CORP_01: {
    promptId: 'TASK_CORP_01',
    genre: 'corporate',
    intendedAudience: 'executive_steering_committee',
    targetWordCount: 150,
    promptText:
      'Draft a formal executive briefing memo explaining a three-week schedule adjustment for the enterprise database cutover. Summarize the technical rationale (multi-region replication lag during stress testing), the revised milestones, and risk-mitigation measures.',
  },
  TASK_CORP_02: {
    promptId: 'TASK_CORP_02',
    genre: 'corporate',
    intendedAudience: 'enterprise_b2b_saas_customers',
    targetWordCount: 150,
    promptText:
      'Draft an official notification to enterprise customers announcing an update to our audit log retention policy. Explain the transition from indefinite retention to a default 90-day rolling window, the compliance rationale (GDPR minimization and SOC 2 Type II), and the self-service export archive options.',
  },
  TASK_CONV_01: {
    promptId: 'TASK_CONV_01',
    genre: 'conversational',
    intendedAudience: 'general_adult_reader',
    targetWordCount: 140,
    promptText:
      'Explain the core concept of public-key cryptography to a curious friend who has no background in computer science. Use a clear, relatable physical analogy to illustrate why someone can publicly share a locking key without compromising their ability to keep messages private.',
  },
  TASK_CONV_02: {
    promptId: 'TASK_CONV_02',
    genre: 'conversational',
    intendedAudience: 'homeowner_troubleshooting_wifi',
    targetWordCount: 140,
    promptText:
      'Write a friendly, practical response advising someone whose home Wi-Fi drops intermittently during video conferences. Explain the difference between 2.4 GHz and 5 GHz frequency bands in simple terms, and suggest three actionable steps to resolve interference.',
  },
  TASK_CREAT_01: {
    promptId: 'TASK_CREAT_01',
    genre: 'creative',
    intendedAudience: 'general_literary_fiction_readership',
    targetWordCount: 150,
    promptText:
      "Write a short literary narrative scene depicting a veteran watchmaker in a quiet evening workshop inspecting an antique pocket watch brought in for repair. Focus on sensory details—brass gear teeth, the jeweler's loupe, ticking cadences—and a subtle anomaly discovered inside the escapement wheel.",
  },
  TASK_CREAT_02: {
    promptId: 'TASK_CREAT_02',
    genre: 'creative',
    intendedAudience: 'general_literary_fiction_readership',
    targetWordCount: 150,
    promptText:
      'Write a short literary narrative scene describing a botanist tending a high-altitude research greenhouse during an alpine winter blizzard. Focus on the contrast between the freezing storm outside the glass and the humid warmth inside, centering on an unseasonal, unexpected flowering specimen.',
  },
};

export interface BlindedReviewPacket {
  reviewPacketId: string;
  exportMode: ExportMode;
  promptId: string;
  taskPromptText: string | null;
  genre: string;
  intendedAudience: string;
  targetWordCount: number;
  actualWordCount: number;
  text: string;
  rubricDimensions: string[];
  scoringTemplate: {
    d1_grammar_mechanics: null;
    d2_coherence_continuity: null;
    d3_vocabulary_precision: null;
    d4_structural_organization: null;
    d5_audience_context_fit: null;
    d6_depth_substance: null;
    d7_task_fulfillment: null;
    d8_naturalness_rhythm: null;
    d9_stylistic_voice: null;
    d10_surface_polish: null;
  };
  dimensionFlags: {
    d7_not_assessable: boolean;
    d7_not_assessable_reason: string | null;
  };
  smokeTestNotice?: string;
}

export interface UnblindingKeyEntry {
  reviewPacketId: string;
  originalSlotId: string;
  targetClass: string;
  modelOrParticipant: string;
  sha256: string;
}

export interface BlindedReviewExportEnvelope {
  exportTimestamp: string;
  exportMode: ExportMode;
  batchId: string;
  totalPackets: number;
  workflowPartition: string;
  notice: string;
  warning?: string;
  packets: BlindedReviewPacket[];
}

export interface BlindedExportResult {
  envelope: BlindedReviewExportEnvelope;
  packets: BlindedReviewPacket[];
  unblindingKeys: UnblindingKeyEntry[];
  eligibility: ReviewBatchEligibilityResult;
}

/**
 * Fail-closed eligibility check for blinded review packet export.
 * Verifies multi-class composition, partition isolation, prompt preservation,
 * and absence of detector scores or pre-populated quality ratings.
 */
export function checkReviewBatchEligibility(
  records: PilotIntakeRecord[],
  options?: ReviewBatchEligibilityOptions
): ReviewBatchEligibilityResult {
  const mode: ExportMode = options?.mode ?? 'official_blinded_review';
  const minDistinctClasses = options?.minDistinctClasses ?? 2;
  const allowedPartition = options?.allowedPartition ?? 'workflow_validation_pilot';
  const requirePromptContext = options?.requirePreservedPromptContext ?? true;

  const errors: string[] = [];
  const warnings: string[] = [];

  if (!records || records.length === 0) {
    if (!options?.allowEmpty) {
      errors.push('Cannot export empty review batch. At least one candidate record is required.');
    }
    return {
      eligible: false,
      mode,
      totalRecords: 0,
      distinctClasses: [],
      classCounts: {},
      errors,
      warnings,
    };
  }

  // Count authorship classes
  const classCounts: Record<string, number> = {};
  for (const r of records) {
    const cls = r.targetClass || 'unknown';
    classCounts[cls] = (classCounts[cls] || 0) + 1;
  }
  const distinctClasses = Object.keys(classCounts);

  // 1. Batch Composition & Mono-Class Check (Rule 4, 5, 8)
  if (mode === 'official_blinded_review') {
    if (distinctClasses.length < minDistinctClasses) {
      errors.push(
        `Official blinded review requires multiple distinct authorship classes (found ${distinctClasses.length}: [${distinctClasses.join(', ')}]). ` +
          `Mono-class or single-origin batches disclose or bias authorship priors and cannot be released for official blinded evaluation. ` +
          `Use mode='workflow_smoke_test' for dry-run verification only.`
      );
    }
  } else if (mode === 'workflow_smoke_test') {
    if (distinctClasses.length < 2) {
      warnings.push(
        `Batch contains only a single authorship class ([${distinctClasses.join(', ')}]). ` +
          `This batch is restricted to workflow smoke testing and MUST NOT be distributed to human reviewers for official evaluation.`
      );
    }
  }

  // 2. Individual record checks
  records.forEach((record, idx) => {
    const recId = record.id || `record_idx_${idx}`;

    // Partition isolation (Rule 6, 10)
    if (record.partition !== allowedPartition) {
      errors.push(
        `Sample ${recId} has invalid partition "${record.partition}". Must be strictly "${allowedPartition}".`
      );
    }
    if (
      record.partition?.includes('held_out') ||
      record.partition?.includes('final_validation') ||
      record.partition?.includes('development')
    ) {
      errors.push(
        `Critical partition leak in sample ${recId}: record belongs to forbidden partition "${record.partition}".`
      );
    }

    // Text presence & integrity
    if (typeof record.text !== 'string' || record.text.trim().length === 0) {
      errors.push(`Sample ${recId} is missing text passage.`);
    } else if (record.sha256) {
      const computedHash = computeSha256(record.text);
      if (record.sha256.toLowerCase() !== computedHash.toLowerCase()) {
        errors.push(`Sample ${recId} SHA-256 mismatch between declared digest and actual text.`);
      }
    }

    // Prompt preservation (Rule 6)
    if (requirePromptContext) {
      if (!record.promptId || !REGISTERED_PROMPT_TEXTS[record.promptId]) {
        // If not registered, must be explicitly flagged not assessable
        const d7NotAssessable = record.qualityAssessment?.dimensionFlags?.d7_task_fulfillment_assessable === false;
        if (!d7NotAssessable) {
          errors.push(
            `Sample ${recId} references unregistered prompt "${record.promptId}" without flagging task fulfillment as unassessable.`
          );
        }
      }
    }

    // Contamination check: NO detector scores allowed in review records
    const forbiddenScoreFields = ['detectorScore', 'aiScore', 'score', 'verdict', 'predictedClass'];
    for (const field of forbiddenScoreFields) {
      if ((record as Record<string, unknown>)[field] !== undefined) {
        errors.push(
          `Critical contamination in sample ${recId}: record contains detector output field "${field}". Review records must be strictly uncalibrated to detector predictions.`
        );
      }
    }

    // Quality assessment unassessed check (Rule 9)
    if (record.qualityAssessment) {
      if (record.qualityAssessment.status === 'assessed') {
        errors.push(
          `Sample ${recId} contains pre-populated quality ratings (status="assessed"). Review packets must remain unassessed until human raters submit evaluations.`
        );
      }
      if (record.qualityAssessment.scores !== null && record.qualityAssessment.scores !== undefined) {
        errors.push(
          `Sample ${recId} contains pre-existing quality scores. Quality ratings must remain null prior to rating.`
        );
      }
    }
  });

  return {
    eligible: errors.length === 0,
    mode,
    totalRecords: records.length,
    distinctClasses,
    classCounts,
    errors,
    warnings,
  };
}

/**
 * Strips all identifying authorship, model, and detector metadata to produce
 * an ethically blinded review packet.
 */
export function createBlindedReviewPacket(
  record: PilotIntakeRecord,
  index: number,
  mode: ExportMode = 'official_blinded_review'
): { packet: BlindedReviewPacket; keyEntry: UnblindingKeyEntry } {
  const packetId = `REV_PACKET_${String(index + 1).padStart(2, '0')}`;
  const promptSpec = REGISTERED_PROMPT_TEXTS[record.promptId];

  const actualWords = record.text ? computeWordCount(record.text) : record.wordCount || 0;

  const taskPromptText = promptSpec ? promptSpec.promptText : null;
  const isD7Assessable = taskPromptText !== null;

  const isSmokeTest = mode === 'workflow_smoke_test';

  const packet: BlindedReviewPacket = {
    reviewPacketId: packetId,
    exportMode: mode,
    promptId: record.promptId || 'UNKNOWN_PROMPT',
    taskPromptText,
    genre: record.genre || promptSpec?.genre || 'unknown',
    intendedAudience: record.intendedAudience || promptSpec?.intendedAudience || 'general',
    targetWordCount: record.targetWordCount || promptSpec?.targetWordCount || 150,
    actualWordCount: actualWords,
    text: record.text || '',
    rubricDimensions: [
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
    ],
    scoringTemplate: {
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
    },
    dimensionFlags: {
      d7_not_assessable: !isD7Assessable,
      d7_not_assessable_reason: isD7Assessable ? null : 'no_preregistered_task_prompt',
    },
    ...(isSmokeTest
      ? {
          smokeTestNotice:
            'WORKFLOW SMOKE TEST ONLY: This packet was generated during pipeline testing. It must NOT be used for official blinded evaluation.',
        }
      : {}),
  };

  let modelOrParticipant = 'unknown';
  if (record.provenance) {
    if (record.provenance.participantId) {
      modelOrParticipant = record.provenance.participantId;
    } else if (record.provenance.modelId) {
      modelOrParticipant = record.provenance.modelId;
    } else if (record.provenance.modelFamily) {
      modelOrParticipant = record.provenance.modelFamily;
    } else if (record.provenance.authorOrSource) {
      modelOrParticipant = String(record.provenance.authorOrSource);
    }
  }

  const keyEntry: UnblindingKeyEntry = {
    reviewPacketId: packetId,
    originalSlotId: record.id,
    targetClass: record.targetClass,
    modelOrParticipant,
    sha256: record.sha256 || computeSha256(record.text || ''),
  };

  return { packet, keyEntry };
}

/**
 * Exports blinded packets from a collection of records.
 * Enforces fail-closed review batch eligibility guard.
 * Optionally pseudo-randomly shuffles the order to prevent order-bias.
 */
export function exportBlindedPackets(
  records: PilotIntakeRecord[],
  seed?: number,
  options?: ReviewBatchEligibilityOptions
): BlindedExportResult {
  const mode: ExportMode = options?.mode ?? 'official_blinded_review';

  // Enforce fail-closed integrity guard
  const eligibility = checkReviewBatchEligibility(records, { ...options, mode });
  if (!eligibility.eligible) {
    const errorDetails = eligibility.errors.map((e) => `  - ${e}`).join('\n');
    throw new Error(
      `Blinded review export rejected by Batch Integrity Guard (mode: ${mode}):\n${errorDetails}`
    );
  }

  // Deterministic shuffle if seed provided, else preserve order
  const list = [...records];
  if (seed !== undefined) {
    let state = seed;
    for (let i = list.length - 1; i > 0; i--) {
      state = (state * 1664525 + 1013904223) % 4294967296;
      const j = Math.floor((state / 4294967296) * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
  }

  const packets: BlindedReviewPacket[] = [];
  const unblindingKeys: UnblindingKeyEntry[] = [];

  list.forEach((rec, idx) => {
    const { packet, keyEntry } = createBlindedReviewPacket(rec, idx, mode);
    packets.push(packet);
    unblindingKeys.push(keyEntry);
  });

  const isSmokeTest = mode === 'workflow_smoke_test';
  const envelope: BlindedReviewExportEnvelope = {
    exportTimestamp: new Date().toISOString(),
    exportMode: mode,
    batchId: `BATCH_${mode.toUpperCase()}_${Date.now()}`,
    totalPackets: packets.length,
    workflowPartition: options?.allowedPartition ?? 'workflow_validation_pilot',
    notice: isSmokeTest
      ? 'INTERNAL WORKFLOW SMOKE TEST BATCH: Generated for pipeline testing only.'
      : 'OFFICIAL BLINDED REVIEW BATCH: Evaluators rate writing quality and style only. All authorship and model metadata have been redacted.',
    ...(isSmokeTest
      ? {
          warning:
            'WORKFLOW SMOKE TEST ONLY: Single-class or unverified composition. Must NOT be released to human raters for official evaluation.',
        }
      : {}),
    packets,
  };

  return { envelope, packets, unblindingKeys, eligibility };
}

// CLI entry point
if (process.argv[1] && process.argv[1].endsWith('exportBlindedReviewPackets.ts')) {
  const args = process.argv.slice(2);
  const isSmokeTest = args.some((a) => a === '--mode=smoke_test' || a === '--smoke-test');
  const filteredArgs = args.filter((a) => !a.startsWith('--'));

  const inputPath = filteredArgs[0] || 'scratch/pilot_intake_data.jsonl';
  const outPacketPath = filteredArgs[1] || 'scratch/blinded_review_packets.json';
  const outKeyPath = filteredArgs[2] || 'scratch/.review_unblinding_key.json';

  const mode: ExportMode = isSmokeTest ? 'workflow_smoke_test' : 'official_blinded_review';

  console.log(`[ExportBlindedReviewPackets] Mode: ${mode}`);
  console.log(`[ExportBlindedReviewPackets] Ingesting from: ${inputPath}`);

  if (!existsSync(resolve(inputPath))) {
    console.error(`Input file not found: ${inputPath}`);
    process.exit(1);
  }

  const content = readFileSync(resolve(inputPath), 'utf-8').trim();
  let records: PilotIntakeRecord[] = [];
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed.slots)) {
      records = parsed.slots;
    } else if (Array.isArray(parsed)) {
      records = parsed;
    } else {
      records = [parsed];
    }
  } catch {
    const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
    records = lines.map((line, idx) => {
      try {
        return JSON.parse(line);
      } catch (e) {
        throw new Error(`JSON parse error on line ${idx + 1}: ${(e as Error).message}`);
      }
    });
  }

  try {
    const { envelope, packets, unblindingKeys, eligibility } = exportBlindedPackets(records, 42, {
      mode,
    });

    writeFileSync(resolve(outPacketPath), JSON.stringify(packets, null, 2), 'utf-8');
    writeFileSync(resolve(outKeyPath), JSON.stringify(unblindingKeys, null, 2), 'utf-8');

    console.log(`[ExportBlindedReviewPackets] Successfully exported ${packets.length} blinded review packets.`);
    console.log(`[ExportBlindedReviewPackets] Mode: ${envelope.exportMode}`);
    if (eligibility.warnings.length > 0) {
      eligibility.warnings.forEach((w) => console.log(`   * Warning: ${w}`));
    }
    console.log(`[ExportBlindedReviewPackets] Packets saved to: ${outPacketPath}`);
    console.log(`[ExportBlindedReviewPackets] Isolated unblinding key saved to: ${outKeyPath}`);
  } catch (err) {
    console.error(`\n[ExportBlindedReviewPackets REJECTED]: ${(err as Error).message}`);
    process.exit(1);
  }
}
