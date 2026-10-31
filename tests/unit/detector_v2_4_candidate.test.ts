/**
 * ============================================================================
 * HUMANIZETEXT DETECTOR V2.4: CANDIDATE INTEGRITY & UNIT TEST SUITE
 * Tests registry schema validation, provenance tracking, partition leakage
 * prevention, deterministic feature extraction, trained model loading,
 * selective decision policies, and baseline regression protection.
 * ============================================================================
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  validateDatasetRegistryRecord,
  computeSha256,
  countWords,
  type DatasetRegistryRecord,
} from '../../src/lib/detector/v2_4/datasetRegistrySchema';
import {
  extractV24Features,
} from '../../src/lib/detector/v2_4/featureExtractor';
import {
  predictV24Text,
  DEFAULT_V24_MODEL,
} from '../../src/lib/detector/v2_4/trainedModelInference';
import { computeAiScore } from '../../src/lib/detector/detectorCore';
import { executeDetectorEngine } from '../../src/lib/detector/candidateIntegrationBoundary';

describe('HUMANIZETEXT DETECTOR V2.4: Candidate Verification & Safety Gates', () => {
  const sampleHumanText = `
    The discovery of deep-sea hydrothermal vents in 1977 revolutionized biological oceanography.
    Before this expedition, marine scientists universally assumed that all oceanic ecosystems ultimately
    relied upon solar radiation and photosynthetic primary production. These volcanic fissures proved
    that complex benthic communities could flourish in complete darkness, deriving energy entirely from
    chemosynthetic sulfur-oxidizing bacteria. Why did it take so long to find them? Submersibles were crude.
    Equipment was scarce. Yet, against all odds, Alvin succeeded.
  `.trim();

  const sampleAiText = `
    Hydrothermal vents play a crucial role in modern marine ecosystems.
    It is important to note that these delicate mineral fissures discharge mineral-rich fluids directly into benthic environments.
    Moreover, the surrounding biological communities utilize dissolved hydrogen sulfide for metabolic processes.
    Furthermore, marine biologists continue investigating these unique deep benthic ecological habitats worldwide,
    fostering a transformative understanding of operational biodiversity.
  `.trim();

  // --------------------------------------------------------------------------
  // 1. DATASET REGISTRY SCHEMA VALIDATION
  // --------------------------------------------------------------------------
  describe('Dataset Registry Schema Validation', () => {
    it('accepts a fully compliant dataset registry record', () => {
      const validText = 'Authentic archival text for rigorous testing purposes.';
      const validRecord: DatasetRegistryRecord = {
        sampleId: 'test_sample_001',
        baseDocumentId: 'doc_root_001',
        independenceGroupId: 'group_family_001',
        sourceDataset: 'test_corpus',
        sourceDocumentId: 'raw_001',
        sourceUrl: 'https://example.com/source',
        license: 'CC-BY-4.0',
        authorClass: 'human',
        modelProvider: 'None',
        modelName: 'None',
        modelVersion: 'n/a',
        promptId: 'none',
        generationDate: '2026-01-01T00:00:00Z',
        wordCount: countWords(validText),
        language: 'en',
        genre: 'academic',
        transformationType: 'original',
        qualityRatingStatus: 'unassessed_by_human',
        provenanceStatus: 'verified_archival',
        text: validText,
        sha256: computeSha256(validText),
      };

      const result = validateDatasetRegistryRecord(validRecord);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects a record with an invalid authorClass', () => {
      const record = {
        sampleId: 'test_invalid_01',
        baseDocumentId: 'doc_01',
        independenceGroupId: 'grp_01',
        sourceDataset: 'test',
        sourceDocumentId: 's1',
        sourceUrl: 'https://test.com',
        license: 'MIT',
        authorClass: 'robot', // Invalid
        modelProvider: 'test',
        modelName: 'test',
        modelVersion: '1.0',
        promptId: 'p1',
        generationDate: '2026-01-01',
        wordCount: 5,
        language: 'en',
        genre: 'academic',
        transformationType: 'original',
        qualityRatingStatus: 'unassessed_by_human',
        provenanceStatus: 'verified_archival',
        text: 'Hello world this is test',
        sha256: computeSha256('Hello world this is test'),
      };

      const result = validateDatasetRegistryRecord(record);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('authorClass'))).toBe(true);
    });

    it('rejects a record when sha256 does not match the actual text', () => {
      const record = {
        sampleId: 'test_invalid_hash',
        baseDocumentId: 'doc_01',
        independenceGroupId: 'grp_01',
        sourceDataset: 'test',
        sourceDocumentId: 's1',
        sourceUrl: 'https://test.com',
        license: 'MIT',
        authorClass: 'human',
        modelProvider: 'None',
        modelName: 'None',
        modelVersion: 'n/a',
        promptId: 'none',
        generationDate: '2026-01-01',
        wordCount: 4,
        language: 'en',
        genre: 'academic',
        transformationType: 'original',
        qualityRatingStatus: 'unassessed_by_human',
        provenanceStatus: 'verified_archival',
        text: 'Some actual text here',
        sha256: '0000000000000000000000000000000000000000000000000000000000000000', // Mismatch
      };

      const result = validateDatasetRegistryRecord(record);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('mismatch'))).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // 2. PARTITION SPLIT MANIFEST AND LEAKAGE CHECKS
  // --------------------------------------------------------------------------
  describe('Dataset Partitioning & Leakage Prevention', () => {
    const manifestPath = resolve(process.cwd(), 'data/v2_4/split_manifest.json');

    it('verifies the split manifest exists and passed all automated leakage checks', () => {
      expect(existsSync(manifestPath)).toBe(true);
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

      expect(manifest.leakageChecks.passedAllLeakageChecks).toBe(true);
      expect(manifest.leakageChecks.exactTextDuplicatesAcrossPartitions).toBe(0);
      expect(manifest.leakageChecks.normalizedTextDuplicatesAcrossPartitions).toBe(0);
      expect(manifest.leakageChecks.nearDuplicatesJaccard50AcrossPartitions).toBe(0);
      expect(manifest.leakageChecks.sharedBaseDocumentIdsAcrossPartitions).toBe(0);
      expect(manifest.leakageChecks.sharedIndependenceGroupIdsAcrossPartitions).toBe(0);
      expect(manifest.leakageChecks.sharedPromptIdsAcrossPartitions).toBe(0);
    });

    it('accurately reports corpus adequacy status and class deficits', () => {
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
      expect(manifest.corpusAdequacyStatus).toBe('insufficient_data');
      expect(manifest.classDeficits.human.deficit).toBeGreaterThan(0);
      expect(manifest.classDeficits.ai.deficit).toBeGreaterThan(0);
      expect(manifest.classDeficits.collaborative.deficit).toBeGreaterThan(0);
    });
  });

  // --------------------------------------------------------------------------
  // 3. DETERMINISTIC FEATURE EXTRACTION
  // --------------------------------------------------------------------------
  describe('Feature Extraction Determinism', () => {
    it('produces bit-identical feature vectors on repeated runs', () => {
      const run1 = extractV24Features(sampleHumanText);
      const run2 = extractV24Features(sampleHumanText);

      expect(run1).toEqual(run2);
      expect(run1.sentenceLengthMean).toBeGreaterThan(0);
      expect(run1.typeTokenRatio).toBeGreaterThan(0);
      expect(run1.lexicalEntropy).toBeGreaterThan(0);
    });

    it('detects higher cliché and transition densities in AI text than human text', () => {
      const humanFeats = extractV24Features(sampleHumanText);
      const aiFeats = extractV24Features(sampleAiText);

      expect(aiFeats.clicheDensity).toBeGreaterThan(humanFeats.clicheDensity);
      expect(aiFeats.transitionPhraseDensity).toBeGreaterThan(humanFeats.transitionPhraseDensity);
    });

    it('gracefully handles empty strings and single-word passages without throwing', () => {
      const emptyFeats = extractV24Features('');
      expect(emptyFeats.sentenceLengthMean).toBe(0);
      expect(emptyFeats.typeTokenRatio).toBe(0);

      const singleFeats = extractV24Features('Greetings.');
      expect(singleFeats.sentenceLengthMean).toBe(1);
      expect(singleFeats.typeTokenRatio).toBe(1);
    });
  });

  // --------------------------------------------------------------------------
  // 4. TRAINED MODEL ARTIFACT AND TS INFERENCE
  // --------------------------------------------------------------------------
  describe('Trained Model Artifact & Selective Inference', () => {
    it('verifies the model artifact structure and provenance metadata', () => {
      expect(DEFAULT_V24_MODEL.modelArchitecture).toBe('regularized_logistic_regression');
      expect(DEFAULT_V24_MODEL.featureSchemaVersion).toBe('2.4.0');
      expect(DEFAULT_V24_MODEL.featureNames.length).toBe(21);
      expect(Object.keys(DEFAULT_V24_MODEL.coefficients).length).toBe(21);
      expect(typeof DEFAULT_V24_MODEL.intercept).toBe('number');
      expect(DEFAULT_V24_MODEL.calibrationMethod).toBe('platt_scaling');
      expect(DEFAULT_V24_MODEL.calibrationParams).not.toBeNull();
      expect(DEFAULT_V24_MODEL.trainingProvenance.scikitLearnVersion).toBe('1.9.1');
    });

    it('abtains with too_short reason on undersized input (< 20 words)', () => {
      const shortText = 'This is far too brief for meaningful statistical inference.';
      const result = predictV24Text(shortText);

      expect(result.isAbstained).toBe(true);
      expect(result.abstentionReason).toBe('too_short');
      expect(result.verdict).toBe('inconclusive');
    });

    it('classifies stereotypical AI text as ai_like with high probability', () => {
      const result = predictV24Text(sampleAiText);

      expect(result.calibratedProbability).toBeGreaterThanOrEqual(0.65);
      expect(result.verdict).toBe('ai_like');
      expect(result.isAbstained).toBe(false);
    });

    it('classifies authentic human historical writing as human_like', () => {
      const authenticHuman =
        'The Nellie, a cruising yawl, swung to her anchor without a flutter of the sails, and was at rest. The flood had made, the wind was nearly calm, and being bound down the river, the only thing for it was to come to and wait for the turn of the tide. The sea-reach of the Thames stretched before us like the beginning of an interminable waterway.';
      const result = predictV24Text(authenticHuman);

      expect(result.calibratedProbability).toBeLessThanOrEqual(0.35);
      expect(result.verdict).toBe('human_like');
    });
  });

  // --------------------------------------------------------------------------
  // 5. BASELINE ISOLATION & REGRESSION PROTECTION
  // --------------------------------------------------------------------------
  describe('Baseline Protection & Integration Boundary', () => {
    it('confirms existing production computeAiScore remains functional and bit-frozen', () => {
      const result = computeAiScore(sampleAiText);
      expect(typeof result.aiProbability).toBe('number');
      expect(result.aiProbability).toBeGreaterThan(0);
      expect(result.aiProbability).toBeLessThanOrEqual(100);
    });

    it('confirms candidateIntegrationBoundary strictly defaults to production_default', () => {
      const boundaryResult = executeDetectorEngine(sampleHumanText);
      expect(boundaryResult.engineId).toBe('production_default');
      expect(boundaryResult.isProductionDefault).toBe(true);
      expect(boundaryResult.score).toBeDefined();
    });
  });
});
