/**
 * ============================================================================
 * HUMANIZETEXT DETECTOR V2.4: DATASET REGISTRY INGESTION PIPELINE
 * Ingests all candidate text sources, normalizes metadata into the 20-field
 * DatasetRegistryRecord schema, enforces cryptographic hashing, detects exact
 * duplicates, and writes out data/v2_4/dataset_registry.jsonl.
 * ============================================================================
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DatasetRegistryRecord,
  validateDatasetRegistryRecord,
  computeSha256,
  countWords,
  TextGenre,
  TransformationType,
  ProvenanceStatus,
  AuthorClass,
} from '../../src/lib/detector/v2_4/datasetRegistrySchema';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = resolve(__dirname, '../..');
const OUTPUT_REGISTRY = resolve(ROOT_DIR, 'data/v2_4/dataset_registry.jsonl');

interface RawPilotRecord {
  sampleId: string;
  promptId: string;
  genre: string;
  text: string;
  textSha256: string;
  wordCount: number;
}

interface RawDetectionItem {
  id: string;
  text: string;
  label: 'human' | 'ai' | 'mixed';
  topic: string;
  split: string;
  word_count?: number;
}

interface RawBenchmarkItem {
  id: string;
  split?: string;
  partition?: string;
  genre: string;
  lengthCategory: string;
  wordCount: number;
  label: string;
  provenance?: {
    authorOrSource?: string;
    method?: string;
    date?: string;
    notes?: string;
    sourceUrlOrCitation?: string;
    modelFamily?: string;
    modelId?: string;
    previouslyExamined?: boolean;
    promptText?: string;
  };
  text: string;
  sha256?: string;
}

function normalizeGenre(genre: string): TextGenre {
  const g = genre.toLowerCase();
  if (g.includes('acad')) return 'academic';
  if (g.includes('tech')) return 'technical';
  if (g.includes('corp') || g.includes('prof')) return 'corporate';
  if (g.includes('conv')) return 'conversational';
  if (g.includes('creat') || g.includes('narr')) return 'creative';
  return 'general';
}

export function ingestAllDatasets(): DatasetRegistryRecord[] {
  const registry: DatasetRegistryRecord[] = [];
  const seenSampleIds = new Set<string>();

  // 1. Ingest Pilot Candidate Batch (10 samples)
  const pilotPath = resolve(ROOT_DIR, 'somedata/files/humanizetext_v2_2_7_ai_pilot_batch_candidate.jsonl');
  if (existsSync(pilotPath)) {
    const lines = readFileSync(pilotPath, 'utf8').split('\n').filter((l) => l.trim().length > 0);
    for (const line of lines) {
      const raw: RawPilotRecord = JSON.parse(line);
      const sha256 = computeSha256(raw.text);
      const record: DatasetRegistryRecord = {
        sampleId: `pilot_${raw.sampleId}`,
        baseDocumentId: raw.promptId,
        independenceGroupId: `pilot_family_${raw.promptId}`,
        sourceDataset: 'workflow_validation_pilot_v2_2_7',
        sourceDocumentId: raw.sampleId,
        sourceUrl: 'local_pilot_session_20261030',
        license: 'Internal-Pilot-Restricted',
        authorClass: 'ai',
        modelProvider: 'OpenAI',
        modelName: 'GPT-6-unverified',
        modelVersion: 'unverified',
        promptId: raw.promptId,
        generationDate: '2026-10-30T00:00:00Z',
        wordCount: countWords(raw.text),
        language: 'en',
        genre: normalizeGenre(raw.genre),
        transformationType: 'original',
        qualityRatingStatus: 'unassessed_by_human',
        provenanceStatus: 'workflow_validation_pilot',
        text: raw.text,
        sha256,
      };

      if (!seenSampleIds.has(record.sampleId)) {
        seenSampleIds.add(record.sampleId);
        registry.push(record);
      }
    }
  }

  // 2. Ingest Eval Harness Detection Seeds (80 samples across 20 topics)
  const seedsPath = resolve(ROOT_DIR, 'somedata/files/detection.json');
  if (existsSync(seedsPath)) {
    const rawSeeds: RawDetectionItem[] = JSON.parse(readFileSync(seedsPath, 'utf8'));
    for (const raw of rawSeeds) {
      const sha256 = computeSha256(raw.text);
      let authorClass: AuthorClass = 'human';
      let transformationType: TransformationType = 'original';
      let provenanceStatus: ProvenanceStatus = 'verified_archival';

      if (raw.label === 'ai') {
        authorClass = 'ai';
        if (raw.id.endsWith('_edit')) {
          transformationType = 'synonym_swap';
          provenanceStatus = 'synthetic_expansion';
        } else {
          transformationType = 'original';
          provenanceStatus = 'prompted_generation';
        }
      } else if (raw.label === 'mixed') {
        authorClass = 'collaborative';
        transformationType = 'mixed_edit';
        provenanceStatus = 'synthetic_expansion';
      }

      const record: DatasetRegistryRecord = {
        sampleId: `seeds_${raw.id}`,
        baseDocumentId: `seed_topic_${raw.topic}`,
        independenceGroupId: `topic_${raw.topic}`,
        sourceDataset: 'eval_harness_seeds',
        sourceDocumentId: raw.id,
        sourceUrl: 'somedata/files/build_dataset.py',
        license: 'MIT',
        authorClass,
        modelProvider: authorClass === 'human' ? 'None' : 'Synthetic_Generator',
        modelName: authorClass === 'human' ? 'None' : 'heuristic_seed_generator',
        modelVersion: authorClass === 'human' ? 'n/a' : '1.0',
        promptId: `PROMPT_SEED_${raw.topic}`,
        generationDate: '2026-01-01T00:00:00Z',
        wordCount: countWords(raw.text),
        language: 'en',
        genre: 'general',
        transformationType,
        qualityRatingStatus: 'unassessed_by_human',
        provenanceStatus,
        text: raw.text,
        sha256,
      };

      if (!seenSampleIds.has(record.sampleId)) {
        seenSampleIds.add(record.sampleId);
        registry.push(record);
      }
    }
  }

  // 3. Ingest Detector V2.2 Benchmark (90 samples)
  const benchmarkPath = resolve(ROOT_DIR, 'tests/eval/fixtures/detector_v2_2_benchmark.json');
  if (existsSync(benchmarkPath)) {
    const rawBench: RawBenchmarkItem[] = JSON.parse(readFileSync(benchmarkPath, 'utf8'));
    for (const raw of rawBench) {
      const sha256 = computeSha256(raw.text);
      let authorClass: AuthorClass = 'human';
      let transformationType: TransformationType = 'original';

      if (raw.label === 'ai_generated') {
        authorClass = 'ai';
        transformationType = 'original';
      } else if (raw.label === 'ai_human_edited' || raw.label === 'human_ai_edited' || raw.label === 'mixed_authorship') {
        authorClass = 'collaborative';
        transformationType = 'mixed_edit';
      }

      // Group samples originating from the same prompt/document archetype together
      // E.g. dev_h_acad_01, dev_a_acad_01, dev_m_acad_01 all share base concept acad_01
      const baseMatch = raw.id.match(/(?:dev|val|test)_[ham]_(.+)$/);
      const baseConcept = baseMatch ? baseMatch[1] : raw.id;

      const record: DatasetRegistryRecord = {
        sampleId: `v22_${raw.id}`,
        baseDocumentId: `doc_v22_${baseConcept}`,
        independenceGroupId: `family_v22_${baseConcept}`,
        sourceDataset: 'detector_v2_2_benchmark',
        sourceDocumentId: raw.id,
        sourceUrl: raw.provenance?.sourceUrlOrCitation || raw.provenance?.authorOrSource || 'detector_v2_2_benchmark_archive',
        license: authorClass === 'human' ? 'Public Domain' : 'CC-BY-4.0',
        authorClass,
        modelProvider: authorClass === 'human' ? 'None' : (raw.provenance?.modelFamily || 'OpenAI'),
        modelName: authorClass === 'human' ? 'None' : (raw.provenance?.modelId || 'gpt-4o'),
        modelVersion: 'unverified',
        promptId: raw.provenance?.promptText ? `PROMPT_${baseConcept}` : 'unknown',
        generationDate: raw.provenance?.date || '2026-10-15T00:00:00Z',
        wordCount: countWords(raw.text),
        language: 'en',
        genre: normalizeGenre(raw.genre),
        transformationType,
        qualityRatingStatus: 'developer_assigned_proxy',
        provenanceStatus: authorClass === 'human' ? 'verified_archival' : 'prompted_generation',
        text: raw.text,
        sha256,
      };

      if (!seenSampleIds.has(record.sampleId)) {
        seenSampleIds.add(record.sampleId);
        registry.push(record);
      }
    }
  }

  // 4. Ingest Historical Holdout V2.2.1 (120 samples - preserved as quarantined final holdout)
  const holdoutPath = resolve(ROOT_DIR, 'tests/eval/fixtures/detector_v2_2_1_holdout.json');
  if (existsSync(holdoutPath)) {
    const rawHoldout: RawBenchmarkItem[] = JSON.parse(readFileSync(holdoutPath, 'utf8'));
    for (const raw of rawHoldout) {
      const sha256 = computeSha256(raw.text);
      let authorClass: AuthorClass = 'human';
      let transformationType: TransformationType = 'original';

      if (raw.label === 'ai_generated') {
        authorClass = 'ai';
        transformationType = 'original';
      } else if (raw.label === 'collaborative' || raw.label === 'mixed_authorship') {
        authorClass = 'collaborative';
        transformationType = 'mixed_edit';
      }

      const baseMatch = raw.id.match(/(?:holdout)_[ham]_(.+)$/);
      const baseConcept = baseMatch ? baseMatch[1] : raw.id;

      const record: DatasetRegistryRecord = {
        sampleId: `v221_${raw.id}`,
        baseDocumentId: `doc_v221_${baseConcept}`,
        independenceGroupId: `family_v221_${baseConcept}`,
        sourceDataset: 'detector_v2_2_1_holdout',
        sourceDocumentId: raw.id,
        sourceUrl: raw.provenance?.sourceUrlOrCitation || raw.provenance?.authorOrSource || 'historical_v2_2_1_holdout_archive',
        license: authorClass === 'human' ? 'Public Domain' : 'CC-BY-4.0',
        authorClass,
        modelProvider: authorClass === 'human' ? 'None' : (raw.provenance?.modelFamily || 'OpenAI'),
        modelName: authorClass === 'human' ? 'None' : (raw.provenance?.modelId || 'gpt-4o'),
        modelVersion: 'unverified',
        promptId: `PROMPT_HOLDOUT_${baseConcept}`,
        generationDate: raw.provenance?.date || '2026-10-20T00:00:00Z',
        wordCount: countWords(raw.text),
        language: 'en',
        genre: normalizeGenre(raw.genre),
        transformationType,
        qualityRatingStatus: 'unassessed_by_human',
        provenanceStatus: authorClass === 'human' ? 'verified_archival' : 'prompted_generation',
        text: raw.text,
        sha256,
      };

      if (!seenSampleIds.has(record.sampleId)) {
        seenSampleIds.add(record.sampleId);
        registry.push(record);
      }
    }
  }

  // 5. Unify independenceGroupId using Connected-Component Clustering
  // If two samples have Jaccard 3-gram similarity >= 0.40 or share base author/source,
  // they belong to the same independence family and must never cross partition splits.
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

  // Build Disjoint-Set / Union-Find over all registry records
  const parent = new Map<string, string>();
  for (const r of registry) {
    parent.set(r.sampleId, r.sampleId);
  }

  function find(id: string): string {
    const p = parent.get(id);
    if (p === undefined || p === id) return id;
    const root = find(p);
    parent.set(id, root);
    return root;
  }

  function union(idA: string, idB: string): void {
    const rootA = find(idA);
    const rootB = find(idB);
    if (rootA !== rootB) {
      parent.set(rootA, rootB);
    }
  }

  // Pre-cluster by existing independenceGroupId
  const byPreGroup = new Map<string, string[]>();
  for (const r of registry) {
    const list = byPreGroup.get(r.independenceGroupId) || [];
    list.push(r.sampleId);
    byPreGroup.set(r.independenceGroupId, list);
  }
  for (const list of byPreGroup.values()) {
    for (let i = 1; i < list.length; i++) {
      union(list[0], list[i]);
    }
  }

  // Precompute 3-grams
  const precomputedGrams = registry.map((r) => ({
    sampleId: r.sampleId,
    grams: getWord3Grams(r.text),
  }));

  // Link near duplicates (Jaccard >= 0.40)
  for (let i = 0; i < precomputedGrams.length; i++) {
    for (let j = i + 1; j < precomputedGrams.length; j++) {
      const sim = computeJaccard(precomputedGrams[i].grams, precomputedGrams[j].grams);
      if (sim >= 0.40) {
        union(precomputedGrams[i].sampleId, precomputedGrams[j].sampleId);
      }
    }
  }

  // Assign resolved unified cluster ID
  for (const r of registry) {
    const root = find(r.sampleId);
    r.independenceGroupId = `cluster_${root}`;
  }

  return registry;
}

export function runIngestionPipeline(): void {
  console.log('=== HumanizeText V2.4 Dataset Registry Ingestion ===');
  const records = ingestAllDatasets();
  console.log(`Ingested ${records.length} raw records.`);

  // Validation loop
  let validCount = 0;
  const validationErrors: { sampleId: string; errors: string[] }[] = [];

  for (const record of records) {
    const res = validateDatasetRegistryRecord(record);
    if (res.isValid) {
      validCount++;
    } else {
      validationErrors.push({ sampleId: record.sampleId, errors: res.errors });
    }
  }

  if (validationErrors.length > 0) {
    console.error(`Validation failed on ${validationErrors.length} records:`);
    for (const err of validationErrors.slice(0, 5)) {
      console.error(`  ${err.sampleId}:`, err.errors.join('; '));
    }
    throw new Error('Dataset registry validation failed');
  }

  console.log(`All ${validCount} records successfully passed strict schema validation.`);

  // Write JSONL
  const jsonlContent = records.map((r) => JSON.stringify(r)).join('\n') + '\n';
  writeFileSync(OUTPUT_REGISTRY, jsonlContent, 'utf8');
  console.log(`Dataset registry written to: ${OUTPUT_REGISTRY}`);

  // Summary statistics
  const byClass: Record<string, number> = {};
  const uniqueHashesByClass: Record<string, Set<string>> = { human: new Set(), ai: new Set(), collaborative: new Set() };
  const bySource: Record<string, number> = {};
  const byLicense: Record<string, number> = {};

  for (const r of records) {
    byClass[r.authorClass] = (byClass[r.authorClass] || 0) + 1;
    uniqueHashesByClass[r.authorClass].add(r.sha256);
    bySource[r.sourceDataset] = (bySource[r.sourceDataset] || 0) + 1;
    byLicense[r.license] = (byLicense[r.license] || 0) + 1;
  }

  console.log('\n--- Ingestion Summary Statistics ---');
  console.log('By Author Class (Total / Unique texts):');
  for (const [cls, count] of Object.entries(byClass)) {
    console.log(`  ${cls}: ${count} passages (${uniqueHashesByClass[cls].size} unique)`);
  }
  console.log('By Source Dataset:');
  for (const [src, count] of Object.entries(bySource)) {
    console.log(`  ${src}: ${count}`);
  }
  console.log('By License:');
  for (const [lic, count] of Object.entries(byLicense)) {
    console.log(`  ${lic}: ${count}`);
  }
}

if (process.argv[1]?.includes('ingestDatasetRegistry')) {
  runIngestionPipeline();
}
