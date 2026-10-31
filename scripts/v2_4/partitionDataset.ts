/**
 * ============================================================================
 * HUMANIZETEXT DETECTOR V2.4: DATASET INDEPENDENCE PARTITIONING & LEAKAGE CHECK
 * Groups records by independenceGroupId and baseDocumentId to guarantee that no
 * derived copies, topic siblings, or prompt families cross partition boundaries.
 * Enforces automated leakage checks: exact text, normalized text, 3-gram Jaccard
 * near-duplicates, and metadata ID collisions.
 * ============================================================================
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import {
  DatasetRegistryRecord,
  computeSha256,
} from '../../src/lib/detector/v2_4/datasetRegistrySchema';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = resolve(__dirname, '../..');

const REGISTRY_PATH = resolve(ROOT_DIR, 'data/v2_4/dataset_registry.jsonl');
const MANIFEST_PATH = resolve(ROOT_DIR, 'data/v2_4/split_manifest.json');
const TRAIN_PATH = resolve(ROOT_DIR, 'data/v2_4/train.jsonl');
const DEV_PATH = resolve(ROOT_DIR, 'data/v2_4/dev.jsonl');
const FINAL_TEST_PATH = resolve(ROOT_DIR, 'data/v2_4/final_test.jsonl');

export interface PartitionSplitManifest {
  manifestVersion: string;
  generatedDate: string;
  registrySha256: string;
  targetPerClassDevTarget: number;
  corpusAdequacyStatus: 'insufficient_data' | 'target_met';
  classDeficits: {
    human: { availableUnique: number; target: number; deficit: number };
    ai: { availableUnique: number; target: number; deficit: number };
    collaborative: { availableUnique: number; target: number; deficit: number };
  };
  partitionCounts: {
    train: { total: number; human: number; ai: number; collaborative: number; groups: number };
    dev: { total: number; human: number; ai: number; collaborative: number; groups: number };
    final_test: { total: number; human: number; ai: number; collaborative: number; groups: number };
  };
  leakageChecks: {
    exactTextDuplicatesAcrossPartitions: number;
    normalizedTextDuplicatesAcrossPartitions: number;
    nearDuplicatesJaccard50AcrossPartitions: number;
    sharedBaseDocumentIdsAcrossPartitions: number;
    sharedIndependenceGroupIdsAcrossPartitions: number;
    sharedPromptIdsAcrossPartitions: number;
    passedAllLeakageChecks: boolean;
  };
  partitionHashes: {
    trainSha256: string;
    devSha256: string;
    finalTestSha256: string;
  };
}

function normalizeForDuplicateCheck(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function getWord3Grams(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 0);
  const ngrams = new Set<string>();
  for (let i = 0; i <= words.length - 3; i++) {
    ngrams.add(`${words[i]}_${words[i + 1]}_${words[i + 2]}`);
  }
  return ngrams;
}

function computeJaccard(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export function partitionDataset(): PartitionSplitManifest {
  if (!existsSync(REGISTRY_PATH)) {
    throw new Error(`Dataset registry not found at ${REGISTRY_PATH}. Run ingestion first.`);
  }

  const registryRaw = readFileSync(REGISTRY_PATH, 'utf8');
  const registrySha256 = createHash('sha256').update(registryRaw, 'utf8').digest('hex');
  const records: DatasetRegistryRecord[] = registryRaw
    .split('\n')
    .filter((l) => l.trim().length > 0)
    .map((l) => JSON.parse(l));

  // 1. Group records by independenceGroupId
  const groupMap = new Map<string, DatasetRegistryRecord[]>();
  for (const rec of records) {
    const list = groupMap.get(rec.independenceGroupId) || [];
    list.push(rec);
    groupMap.set(rec.independenceGroupId, list);
  }

  const trainRecords: DatasetRegistryRecord[] = [];
  const devRecords: DatasetRegistryRecord[] = [];
  const finalTestRecords: DatasetRegistryRecord[] = [];

  const trainGroups = new Set<string>();
  const devGroups = new Set<string>();
  const finalTestGroups = new Set<string>();

  // Stratify / partition deterministically by group
  for (const [groupId, groupRecords] of groupMap.entries()) {
    // Preserved historical holdout is strictly locked into final_test
    if (groupRecords.some((r) => r.sourceDataset === 'detector_v2_2_1_holdout')) {
      finalTestRecords.push(...groupRecords);
      finalTestGroups.add(groupId);
      continue;
    }

    // Pilot candidate records (10 samples, workflow validation) -> dev split for evaluation calibration
    if (groupRecords.some((r) => r.sourceDataset === 'workflow_validation_pilot_v2_2_7')) {
      devRecords.push(...groupRecords);
      devGroups.add(groupId);
      continue;
    }

    // Benchmark and Seed topics: deterministic hash-based 65% train / 35% dev allocation
    const hashVal = parseInt(computeSha256(groupId).substring(0, 8), 16);
    if (hashVal % 100 < 65) {
      trainRecords.push(...groupRecords);
      trainGroups.add(groupId);
    } else {
      devRecords.push(...groupRecords);
      devGroups.add(groupId);
    }
  }

  // 2. Perform Automated Leakage Verification
  console.log('--- Running Automated Leakage Verification ---');

  // Exact hashes
  const trainHashes = new Set(trainRecords.map((r) => r.sha256));
  const devHashes = new Set(devRecords.map((r) => r.sha256));
  const finalTestHashes = new Set(finalTestRecords.map((r) => r.sha256));

  let exactDuplicatesAcross = 0;
  for (const h of devHashes) if (trainHashes.has(h)) exactDuplicatesAcross++;
  for (const h of finalTestHashes) if (trainHashes.has(h) || devHashes.has(h)) exactDuplicatesAcross++;

  // Normalized text
  const trainNorm = new Map(trainRecords.map((r) => [normalizeForDuplicateCheck(r.text), r.sampleId]));
  const devNorm = new Map(devRecords.map((r) => [normalizeForDuplicateCheck(r.text), r.sampleId]));
  const testNorm = new Map(finalTestRecords.map((r) => [normalizeForDuplicateCheck(r.text), r.sampleId]));

  let normDuplicatesAcross = 0;
  for (const [k] of devNorm) if (trainNorm.has(k)) normDuplicatesAcross++;
  for (const [k] of testNorm) if (trainNorm.has(k) || devNorm.has(k)) normDuplicatesAcross++;

  // Near duplicate Jaccard 3-gram check (threshold >= 0.50)
  const trainGrams = trainRecords.map((r) => ({ id: r.sampleId, grams: getWord3Grams(r.text) }));
  const devGrams = devRecords.map((r) => ({ id: r.sampleId, grams: getWord3Grams(r.text) }));
  const testGrams = finalTestRecords.map((r) => ({ id: r.sampleId, grams: getWord3Grams(r.text) }));

  let nearDupsAcross = 0;
  for (const d of devGrams) {
    for (const t of trainGrams) {
      if (computeJaccard(d.grams, t.grams) >= 0.50) {
        nearDupsAcross++;
      }
    }
  }
  for (const te of testGrams) {
    for (const t of trainGrams) {
      if (computeJaccard(te.grams, t.grams) >= 0.50) {
        nearDupsAcross++;
      }
    }
    for (const d of devGrams) {
      if (computeJaccard(te.grams, d.grams) >= 0.50) {
        nearDupsAcross++;
      }
    }
  }

  // Base Document IDs
  const trainBaseDocs = new Set(trainRecords.map((r) => r.baseDocumentId));
  const devBaseDocs = new Set(devRecords.map((r) => r.baseDocumentId));
  const testBaseDocs = new Set(finalTestRecords.map((r) => r.baseDocumentId));

  let sharedBaseDocs = 0;
  for (const id of devBaseDocs) if (trainBaseDocs.has(id)) sharedBaseDocs++;
  for (const id of testBaseDocs) if (trainBaseDocs.has(id) || devBaseDocs.has(id)) sharedBaseDocs++;

  // Independence Group IDs
  let sharedGroupIds = 0;
  for (const id of devGroups) if (trainGroups.has(id)) sharedGroupIds++;
  for (const id of finalTestGroups) if (trainGroups.has(id) || devGroups.has(id)) sharedGroupIds++;

  // Prompt IDs (excluding 'unknown' and 'none')
  const validTrainPrompts = new Set(trainRecords.map((r) => r.promptId).filter((p) => p !== 'unknown' && p !== 'none'));
  const validDevPrompts = new Set(devRecords.map((r) => r.promptId).filter((p) => p !== 'unknown' && p !== 'none'));
  const validTestPrompts = new Set(finalTestRecords.map((r) => r.promptId).filter((p) => p !== 'unknown' && p !== 'none'));

  let sharedPrompts = 0;
  for (const id of validDevPrompts) if (validTrainPrompts.has(id)) sharedPrompts++;
  for (const id of validTestPrompts) if (validTrainPrompts.has(id) || validDevPrompts.has(id)) sharedPrompts++;

  const passedAllLeakageChecks =
    exactDuplicatesAcross === 0 &&
    normDuplicatesAcross === 0 &&
    nearDupsAcross === 0 &&
    sharedBaseDocs === 0 &&
    sharedGroupIds === 0 &&
    sharedPrompts === 0;

  console.log(`Exact text duplicates across partitions: ${exactDuplicatesAcross}`);
  console.log(`Normalized text duplicates across partitions: ${normDuplicatesAcross}`);
  console.log(`Near duplicates (Jaccard >= 0.50) across partitions: ${nearDupsAcross}`);
  console.log(`Shared baseDocumentId across partitions: ${sharedBaseDocs}`);
  console.log(`Shared independenceGroupId across partitions: ${sharedGroupIds}`);
  console.log(`Shared promptId across partitions: ${sharedPrompts}`);
  console.log(`Leakage check passed: ${passedAllLeakageChecks}`);

  // Write partition files
  const trainContent = trainRecords.map((r) => JSON.stringify(r)).join('\n') + '\n';
  const devContent = devRecords.map((r) => JSON.stringify(r)).join('\n') + '\n';
  const finalTestContent = finalTestRecords.map((r) => JSON.stringify(r)).join('\n') + '\n';

  writeFileSync(TRAIN_PATH, trainContent, 'utf8');
  writeFileSync(DEV_PATH, devContent, 'utf8');
  writeFileSync(FINAL_TEST_PATH, finalTestContent, 'utf8');

  // Count unique texts across whole corpus
  const totalUniqueHuman = new Set(records.filter((r) => r.authorClass === 'human').map((r) => r.sha256)).size;
  const totalUniqueAi = new Set(records.filter((r) => r.authorClass === 'ai').map((r) => r.sha256)).size;
  const totalUniqueCollab = new Set(records.filter((r) => r.authorClass === 'collaborative').map((r) => r.sha256)).size;

  const target = 200;

  const manifest: PartitionSplitManifest = {
    manifestVersion: '2.4.0',
    generatedDate: new Date().toISOString(),
    registrySha256,
    targetPerClassDevTarget: target,
    corpusAdequacyStatus:
      totalUniqueHuman >= target && totalUniqueAi >= target && totalUniqueCollab >= target
        ? 'target_met'
        : 'insufficient_data',
    classDeficits: {
      human: { availableUnique: totalUniqueHuman, target, deficit: Math.max(0, target - totalUniqueHuman) },
      ai: { availableUnique: totalUniqueAi, target, deficit: Math.max(0, target - totalUniqueAi) },
      collaborative: { availableUnique: totalUniqueCollab, target, deficit: Math.max(0, target - totalUniqueCollab) },
    },
    partitionCounts: {
      train: {
        total: trainRecords.length,
        human: trainRecords.filter((r) => r.authorClass === 'human').length,
        ai: trainRecords.filter((r) => r.authorClass === 'ai').length,
        collaborative: trainRecords.filter((r) => r.authorClass === 'collaborative').length,
        groups: trainGroups.size,
      },
      dev: {
        total: devRecords.length,
        human: devRecords.filter((r) => r.authorClass === 'human').length,
        ai: devRecords.filter((r) => r.authorClass === 'ai').length,
        collaborative: devRecords.filter((r) => r.authorClass === 'collaborative').length,
        groups: devGroups.size,
      },
      final_test: {
        total: finalTestRecords.length,
        human: finalTestRecords.filter((r) => r.authorClass === 'human').length,
        ai: finalTestRecords.filter((r) => r.authorClass === 'ai').length,
        collaborative: finalTestRecords.filter((r) => r.authorClass === 'collaborative').length,
        groups: finalTestGroups.size,
      },
    },
    leakageChecks: {
      exactTextDuplicatesAcrossPartitions: exactDuplicatesAcross,
      normalizedTextDuplicatesAcrossPartitions: normDuplicatesAcross,
      nearDuplicatesJaccard50AcrossPartitions: nearDupsAcross,
      sharedBaseDocumentIdsAcrossPartitions: sharedBaseDocs,
      sharedIndependenceGroupIdsAcrossPartitions: sharedGroupIds,
      sharedPromptIdsAcrossPartitions: sharedPrompts,
      passedAllLeakageChecks,
    },
    partitionHashes: {
      trainSha256: createHash('sha256').update(trainContent, 'utf8').digest('hex'),
      devSha256: createHash('sha256').update(devContent, 'utf8').digest('hex'),
      finalTestSha256: createHash('sha256').update(finalTestContent, 'utf8').digest('hex'),
    },
  };

  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf8');
  console.log(`Split manifest written to: ${MANIFEST_PATH}`);

  return manifest;
}

if (process.argv[1]?.includes('partitionDataset')) {
  partitionDataset();
}

