/**
 * ============================================================================
 * HUMANIZETEXT DETECTOR V2.5: FEATURE EXTRACTION & NORMALIZATION FITTING
 * Extracts the 21 stylometric features across the preregistered four-way partitions:
 *   - TRAIN (254 samples: 126 Human, 128 AI)
 *   - DEV (64 samples: 32 Human, 32 AI)
 *   - CAL (42 samples: 21 Human, 21 AI)
 *   - FINAL_TEST (62 samples: 31 Human, 31 AI)
 * 
 * Computes normalization parameters (mean, std) STRICTLY from TRAIN partition.
 * Applies normalization parameters to TRAIN, DEV, CAL, and FINAL_TEST.
 * 
 * Also generates the required manifest files:
 *   - data/v2_5/training_manifest.json
 *   - data/v2_5/development_manifest.json
 *   - data/v2_5/calibration_manifest.json
 *   - data/v2_5/updated_feature_audit.json
 * ============================================================================
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import {
  V24FeatureName,
  V24FeatureVector,
  V24NormalizationParams,
  V24_FEATURE_NAMES,
} from '../../src/lib/detector/v2_4/types';
import { extractV24Features } from '../../src/lib/detector/v2_4/featureExtractor';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = resolve(__dirname, '../..');

const REGISTRY_PATH = resolve(ROOT_DIR, 'data/v2_4_4/qualified_corpus_registry.jsonl');
const SPLIT_MANIFEST_PATH = resolve(ROOT_DIR, 'data/v2_4_4/preregistered_four_way_split_manifest.json');

const NORMALIZATION_PARAMS_PATH = resolve(ROOT_DIR, 'data/v2_5/normalization_params.json');
const TRAIN_FEATURES_PATH = resolve(ROOT_DIR, 'data/v2_5/train_features.json');
const DEV_FEATURES_PATH = resolve(ROOT_DIR, 'data/v2_5/dev_features.json');
const CAL_FEATURES_PATH = resolve(ROOT_DIR, 'data/v2_5/cal_features.json');
const FINAL_TEST_FEATURES_PATH = resolve(ROOT_DIR, 'data/v2_5/final_test_features.json');

const TRAINING_MANIFEST_PATH = resolve(ROOT_DIR, 'data/v2_5/training_manifest.json');
const DEV_MANIFEST_PATH = resolve(ROOT_DIR, 'data/v2_5/development_manifest.json');
const CAL_MANIFEST_PATH = resolve(ROOT_DIR, 'data/v2_5/calibration_manifest.json');
const UPDATED_FEATURE_AUDIT_PATH = resolve(ROOT_DIR, 'data/v2_5/updated_feature_audit.json');

export interface FeatureRecord {
  sampleId: string;
  baseDocumentId: string;
  independenceGroupId: string;
  authorClass: string;
  subgroup: string;
  genre: string;
  wordCount: number;
  binaryLabel: number; // 1 for AI, 0 for Human, -1 for other
  rawFeatures: V24FeatureVector;
  normalizedFeatures: Record<V24FeatureName, number>;
}

interface SplitManifest {
  sampleAssignments: Array<{
    sampleId: string;
    partition: string;
    authorClass: string;
    genre: string;
    independenceGroupId: string;
    sha256: string;
  }>;
}

interface RegistryRecord {
  sampleId: string;
  baseDocumentId: string;
  independenceGroupId: string;
  authorClass: string;
  genre: string;
  wordCount: number;
  text: string;
  sourceDataset: string;
  sourceDocumentId?: string;
  modelName?: string;
  modelProvider?: string;
  sha256: string;
}

export function runExtraction(): void {
  console.log('=== HumanizeText V2.5 Feature Extraction & Normalization Fitting ===');

  if (!existsSync(REGISTRY_PATH)) {
    throw new Error(`Missing registry: ${REGISTRY_PATH}`);
  }
  if (!existsSync(SPLIT_MANIFEST_PATH)) {
    throw new Error(`Missing split manifest: ${SPLIT_MANIFEST_PATH}`);
  }

  const rawSplitManifest: SplitManifest = JSON.parse(readFileSync(SPLIT_MANIFEST_PATH, 'utf8'));
  const assignmentMap = new Map<string, string>();
  for (const item of rawSplitManifest.sampleAssignments) {
    assignmentMap.set(item.sampleId, item.partition);
  }

  const allRecords: RegistryRecord[] = readFileSync(REGISTRY_PATH, 'utf8')
    .split('\n')
    .filter((l) => l.trim().length > 0)
    .map((l) => JSON.parse(l));

  console.log(`Total registry records loaded: ${allRecords.length}`);

  const trainRecords: RegistryRecord[] = [];
  const devRecords: RegistryRecord[] = [];
  const calRecords: RegistryRecord[] = [];
  const finalTestRecords: RegistryRecord[] = [];

  for (const r of allRecords) {
    const partition = assignmentMap.get(r.sampleId);
    if (partition === 'TRAIN') trainRecords.push(r);
    else if (partition === 'DEV') devRecords.push(r);
    else if (partition === 'CAL') calRecords.push(r);
    else if (partition === 'FINAL_TEST') finalTestRecords.push(r);
  }

  console.log(`Partition assignments:`);
  console.log(`  TRAIN: ${trainRecords.length}`);
  console.log(`  DEV: ${devRecords.length}`);
  console.log(`  CAL: ${calRecords.length}`);
  console.log(`  FINAL_TEST: ${finalTestRecords.length}`);

  if (trainRecords.length !== 254 || devRecords.length !== 64 || calRecords.length !== 42 || finalTestRecords.length !== 62) {
    throw new Error(`Partition count mismatch! Expected 254, 64, 42, 62; got ${trainRecords.length}, ${devRecords.length}, ${calRecords.length}, ${finalTestRecords.length}`);
  }

  // Helper to determine binary label & subgroup
  const getLabelInfo = (r: RegistryRecord) => {
    let binaryLabel = -1;
    let subgroup = 'other';
    
    if (r.authorClass === 'verified_human') {
      binaryLabel = 0;
      subgroup = 'verified_human';
    } else if (r.authorClass === 'historical_human_proxy') {
      binaryLabel = 0;
      if (r.sourceDataset === 'sec_edgar_10k_item7_mda') {
        subgroup = 'corporate_human_proxy';
      } else {
        subgroup = 'historical_human_proxy';
      }
    } else if (r.authorClass === 'verified_ai') {
      binaryLabel = 1;
      const m = String(r.modelName || '').toLowerCase();
      if (m.includes('gpt-4') || m.includes('gpt4')) {
        subgroup = 'gpt4_family';
      } else if (m.includes('claude')) {
        subgroup = 'claude_family';
      } else if (m.includes('llama')) {
        subgroup = 'llama_family';
      } else if (m.includes('mistral')) {
        subgroup = 'mistral_family';
      } else if (m.includes('seed')) {
        subgroup = 'heuristic_seed';
      } else if (m.includes('unverified') || m.includes('gpt-6')) {
        subgroup = 'unverified_frontier_seed';
      } else {
        subgroup = 'ai_other';
      }
    }
    return { binaryLabel, subgroup };
  };

  // 1. Extract raw features for all partitions
  console.log('Extracting 21 stylometric features across all partitions...');
  const extractList = (records: RegistryRecord[]) =>
    records.map((r) => {
      const rawFeatures = extractV24Features(r.text);
      const { binaryLabel, subgroup } = getLabelInfo(r);
      return {
        sampleId: r.sampleId,
        baseDocumentId: r.baseDocumentId,
        independenceGroupId: r.independenceGroupId,
        authorClass: r.authorClass,
        subgroup,
        genre: r.genre,
        wordCount: r.wordCount,
        binaryLabel,
        rawFeatures,
      };
    });

  const rawTrain = extractList(trainRecords);
  const rawDev = extractList(devRecords);
  const rawCal = extractList(calRecords);
  const rawFinalTest = extractList(finalTestRecords);

  // 2. Fit Normalization (mean and standard deviation) STRICTLY on Training Set
  console.log('Fitting normalization parameters on TRAIN partition ONLY (254 samples)...');
  const means = {} as Record<V24FeatureName, number>;
  const stds = {} as Record<V24FeatureName, number>;

  const N = rawTrain.length;
  for (const name of V24_FEATURE_NAMES) {
    let sum = 0;
    for (const item of rawTrain) {
      sum += item.rawFeatures[name];
    }
    const mean = sum / N;
    means[name] = mean;

    let varSum = 0;
    for (const item of rawTrain) {
      varSum += Math.pow(item.rawFeatures[name] - mean, 2);
    }
    const variance = N > 1 ? varSum / (N - 1) : 0;
    const std = Math.sqrt(variance);
    // Avoid division by zero: clamp minimal standard deviation to 1.0 if constant
    stds[name] = std > 1e-6 ? std : 1.0;
  }

  const normalizationParams: V24NormalizationParams = { means, stds };
  writeFileSync(NORMALIZATION_PARAMS_PATH, JSON.stringify(normalizationParams, null, 2), 'utf8');
  console.log(`Saved training-fitted normalization parameters to ${NORMALIZATION_PARAMS_PATH}`);

  // 3. Normalize features using train-fitted parameters
  const applyNormalization = (items: typeof rawTrain): FeatureRecord[] =>
    items.map((it) => {
      const normalizedFeatures = {} as Record<V24FeatureName, number>;
      for (const name of V24_FEATURE_NAMES) {
        normalizedFeatures[name] = (it.rawFeatures[name] - means[name]) / stds[name];
      }
      return {
        sampleId: it.sampleId,
        baseDocumentId: it.baseDocumentId,
        independenceGroupId: it.independenceGroupId,
        authorClass: it.authorClass,
        subgroup: it.subgroup,
        genre: it.genre,
        wordCount: it.wordCount,
        binaryLabel: it.binaryLabel,
        rawFeatures: it.rawFeatures,
        normalizedFeatures,
      };
    });

  const trainFeatures = applyNormalization(rawTrain);
  const devFeatures = applyNormalization(rawDev);
  const calFeatures = applyNormalization(rawCal);
  const finalTestFeatures = applyNormalization(rawFinalTest);

  writeFileSync(TRAIN_FEATURES_PATH, JSON.stringify(trainFeatures, null, 2), 'utf8');
  writeFileSync(DEV_FEATURES_PATH, JSON.stringify(devFeatures, null, 2), 'utf8');
  writeFileSync(CAL_FEATURES_PATH, JSON.stringify(calFeatures, null, 2), 'utf8');
  writeFileSync(FINAL_TEST_FEATURES_PATH, JSON.stringify(finalTestFeatures, null, 2), 'utf8');

  console.log(`Saved feature files:`);
  console.log(`  Train features: ${TRAIN_FEATURES_PATH} (${trainFeatures.length} records)`);
  console.log(`  Dev features: ${DEV_FEATURES_PATH} (${devFeatures.length} records)`);
  console.log(`  Cal features: ${CAL_FEATURES_PATH} (${calFeatures.length} records)`);
  console.log(`  Final Test features: ${FINAL_TEST_FEATURES_PATH} (${finalTestFeatures.length} records)`);

  // 4. Generate Training, Development, and Calibration Manifests
  const generateManifest = (name: string, records: FeatureRecord[], path: string, desc: string) => {
    const manifest = {
      manifestVersion: '2.5.0',
      partitionName: name,
      description: desc,
      sampleCount: records.length,
      humanCount: records.filter((r) => r.binaryLabel === 0).length,
      aiCount: records.filter((r) => r.binaryLabel === 1).length,
      independenceGroupCount: new Set(records.map((r) => r.independenceGroupId)).size,
      baseDocumentCount: new Set(records.map((r) => r.baseDocumentId)).size,
      samples: records.map((r) => ({
        sampleId: r.sampleId,
        baseDocumentId: r.baseDocumentId,
        independenceGroupId: r.independenceGroupId,
        authorClass: r.authorClass,
        subgroup: r.subgroup,
        genre: r.genre,
        wordCount: r.wordCount,
        binaryLabel: r.binaryLabel,
      })),
      sha256: createHash('sha256').update(JSON.stringify(records)).digest('hex'),
    };
    writeFileSync(path, JSON.stringify(manifest, null, 2), 'utf8');
    console.log(`Saved ${name} manifest: ${path}`);
  };

  generateManifest('TRAIN', trainFeatures, TRAINING_MANIFEST_PATH, 'V2.5 Supervised Model Training Partition (254 samples)');
  generateManifest('DEV', devFeatures, DEV_MANIFEST_PATH, 'V2.5 Model Comparison & Hyperparameter Selection Partition (64 samples)');
  generateManifest('CAL', calFeatures, CAL_MANIFEST_PATH, 'V2.5 Platt Scaling Probability Calibration Partition (42 samples)');

  // 5. Updated Feature Audit
  const featureAudit = {
    featureSchemaVersion: '2.5.0',
    totalFeatures: V24_FEATURE_NAMES.length,
    featureNames: V24_FEATURE_NAMES,
    normalizationFittedOn: 'TRAIN (254 samples)',
    means,
    stds,
    featureDescriptions: {
      sentenceLengthMean: 'Mean number of words per sentence',
      sentenceLengthVariance: 'Variance in sentence word length',
      sentenceLengthCv: 'Coefficient of variation in sentence length (std / mean)',
      paragraphLengthMean: 'Mean word count across paragraphs',
      paragraphLengthVariance: 'Variance in paragraph word lengths',
      typeTokenRatio: 'TTR = unique words / total words',
      hapaxLegomenaRatio: 'Words occurring exactly once / total words',
      simpsonsIndex: 'Simpson diversity index for word occurrence',
      lexicalEntropy: 'Shannon entropy of word distribution in bits',
      ngramRepetitionRatio: 'Proportion of repeated word bigrams',
      openingPhraseDiversity: 'Ratio of unique sentence opening 2-word stems to sentence count',
      transitionPhraseDensity: 'Frequency of formal transition phrases per 100 words',
      clicheDensity: 'Frequency of common AI-typical cliché terms per 100 words',
      commaDensity: 'Comma count per 100 words',
      semicolonColonDensity: 'Semicolon and colon count per 100 words',
      punctuationEntropy: 'Shannon entropy across punctuation marks',
      passiveVoiceDensity: 'Passive voice syntactic constructions per 100 words',
      clauseComplexity: 'Subordinating conjunctions per sentence',
      functionWordRatio: 'Proportion of closed-class function/stop words',
      contractionDensity: 'Informal/formal contraction frequency per 100 words',
      entityDensity: 'Capitalized named entity density per 100 words',
    },
  };
  writeFileSync(UPDATED_FEATURE_AUDIT_PATH, JSON.stringify(featureAudit, null, 2), 'utf8');
  console.log(`Saved feature audit to ${UPDATED_FEATURE_AUDIT_PATH}`);
}

runExtraction();
