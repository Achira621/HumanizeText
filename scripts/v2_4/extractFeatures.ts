/**
 * ============================================================================
 * HUMANIZETEXT DETECTOR V2.4: FEATURE EXTRACTION & NORMALIZATION FITTING
 * Extracts the 21 stylometric features across Train, Dev, and Final Test.
 * Computes normalization parameters (mean, std) STRICTLY from Train, and
 * applies them to all partitions without leakage.
 * ============================================================================
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  V24FeatureName,
  V24FeatureVector,
  V24NormalizationParams,
  V24_FEATURE_NAMES,
} from '../../src/lib/detector/v2_4/types';
import { extractV24Features } from '../../src/lib/detector/v2_4/featureExtractor';
import { DatasetRegistryRecord } from '../../src/lib/detector/v2_4/datasetRegistrySchema';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = resolve(__dirname, '../..');

const TRAIN_PATH = resolve(ROOT_DIR, 'data/v2_4/train.jsonl');
const DEV_PATH = resolve(ROOT_DIR, 'data/v2_4/dev.jsonl');
const FINAL_TEST_PATH = resolve(ROOT_DIR, 'data/v2_4/final_test.jsonl');

const NORMALIZATION_PARAMS_PATH = resolve(ROOT_DIR, 'data/v2_4/normalization_params.json');
const TRAIN_FEATURES_PATH = resolve(ROOT_DIR, 'data/v2_4/train_features.json');
const DEV_FEATURES_PATH = resolve(ROOT_DIR, 'data/v2_4/dev_features.json');
const FINAL_TEST_FEATURES_PATH = resolve(ROOT_DIR, 'data/v2_4/final_test_features.json');

export interface FeatureRecord {
  sampleId: string;
  baseDocumentId: string;
  independenceGroupId: string;
  authorClass: 'human' | 'ai' | 'collaborative';
  binaryLabel: number; // 1 for AI, 0 for Human, -1 for Collaborative / unassigned
  rawFeatures: V24FeatureVector;
  normalizedFeatures: Record<V24FeatureName, number>;
}

function loadPartition(path: string): DatasetRegistryRecord[] {
  if (!existsSync(path)) throw new Error(`Missing partition file: ${path}`);
  return readFileSync(path, 'utf8')
    .split('\n')
    .filter((l) => l.trim().length > 0)
    .map((l) => JSON.parse(l));
}

export function extractAndNormalizeAll(): void {
  console.log('=== HumanizeText V2.4 Feature Extraction & Normalization Fitting ===');

  const trainRecords = loadPartition(TRAIN_PATH);
  const devRecords = loadPartition(DEV_PATH);
  const finalTestRecords = loadPartition(FINAL_TEST_PATH);

  console.log(`Loaded Train: ${trainRecords.length}, Dev: ${devRecords.length}, Final Test: ${finalTestRecords.length}`);

  // 1. Extract raw features for all partitions
  const extractList = (records: DatasetRegistryRecord[]) =>
    records.map((r) => {
      const rawFeatures = extractV24Features(r.text);
      const binaryLabel = r.authorClass === 'ai' ? 1 : (r.authorClass === 'human' ? 0 : -1);
      return {
        sampleId: r.sampleId,
        baseDocumentId: r.baseDocumentId,
        independenceGroupId: r.independenceGroupId,
        authorClass: r.authorClass,
        binaryLabel,
        rawFeatures,
      };
    });

  const rawTrain = extractList(trainRecords);
  const rawDev = extractList(devRecords);
  const rawTest = extractList(finalTestRecords);

  // 2. Fit Normalization (mean and standard deviation) STRICTLY on Training Set
  console.log('Fitting normalization parameters on Training Partition ONLY...');
  const means = {} as Record<V24FeatureName, number>;
  const stds = {} as Record<V24FeatureName, number>;

  const N = rawTrain.length;
  if (N === 0) throw new Error('Training set is empty!');

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
        binaryLabel: it.binaryLabel,
        rawFeatures: it.rawFeatures,
        normalizedFeatures,
      };
    });

  const trainFeatures = applyNormalization(rawTrain);
  const devFeatures = applyNormalization(rawDev);
  const testFeatures = applyNormalization(rawTest);

  writeFileSync(TRAIN_FEATURES_PATH, JSON.stringify(trainFeatures, null, 2), 'utf8');
  writeFileSync(DEV_FEATURES_PATH, JSON.stringify(devFeatures, null, 2), 'utf8');
  writeFileSync(FINAL_TEST_FEATURES_PATH, JSON.stringify(testFeatures, null, 2), 'utf8');

  console.log('Feature extraction & normalization complete:');
  console.log(`  Train features: ${TRAIN_FEATURES_PATH} (${trainFeatures.length} records)`);
  console.log(`  Dev features: ${DEV_FEATURES_PATH} (${devFeatures.length} records)`);
  console.log(`  Test features: ${FINAL_TEST_FEATURES_PATH} (${testFeatures.length} records)`);
}

if (process.argv[1]?.includes('extractFeatures')) {
  extractAndNormalizeAll();
}

