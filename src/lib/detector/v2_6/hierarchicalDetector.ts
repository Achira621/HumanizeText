/**
 * ============================================================================
 * HUMANIZETEXT DETECTOR V2.6: HIERARCHICAL MULTI-SECTION DETECTOR
 * 
 * Features:
 *   - Decoupled Stylometric Measurements (Human Style vs AI Pattern)
 *   - Domain-Aware Calibration (RFC, legal, academic false-alarm mitigation)
 *   - Hierarchical Multi-Section Analysis (parses sections, detects mixed content)
 *   - Length-Aware Confidence Calibration (calibrated confidence based on sample size)
 *   - Zero external network dependencies (pure client-side TS inference)
 * ============================================================================
 */

import type {
  HierarchicalDetectionResult,
  OriginClassification,
  ConfidenceLevel,
  SectionAnalysisResult,
  StyleMetrics,
} from './types';
import { calibrateStylometricFeatures } from './domainCalibrator';
import { extractV24Features } from '../v2_4/featureExtractor';
import { DEFAULT_V25_MODEL } from '../v2_5/detectorV2_5';
import { parseDocumentToBlocks, type ContentBlock } from '../../pipeline/documentModel';

export interface HierarchicalDetectorOptions {
  minWordCount?: number;
  sectionThresholdWords?: number; // Word count above which hierarchical sectioning activates
}

/**
 * Evaluates raw linear margin and base Platt probability for a string of text.
 */
function evaluateRawLinearMargin(text: string): {
  rawFeatures: Record<string, number>;
  linearMargin: number;
  baseCalibratedProb: number;
  wordCount: number;
} {
  const model = DEFAULT_V25_MODEL;
  const rawFeatures = extractV24Features(text);
  const words = text ? text.trim().split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;

  // Feature Normalization
  let linearMargin = model.intercept;
  for (const f of model.featureNames) {
    const mean = model.normalizationParams.means[f] ?? 0;
    const std = model.normalizationParams.stds[f] ?? 1.0;
    const rawVal = rawFeatures[f] ?? 0;
    const normalized = (rawVal - mean) / std;
    const coef = model.coefficients[f] ?? 0;
    linearMargin += coef * normalized;
  }

  // Base Platt scaling
  let baseCalibratedProb = 0.5;
  if (model.calibrationParams && typeof model.calibrationParams.A === 'number') {
    const { A, B } = model.calibrationParams;
    const z = A * linearMargin + B;
    const clampedZ = Math.max(-30.0, Math.min(30.0, z));
    baseCalibratedProb = 1.0 / (1.0 + Math.exp(-clampedZ));
  }

  return { rawFeatures, linearMargin, baseCalibratedProb, wordCount };
}

/**
 * Groups content blocks into logical sections for hierarchical analysis.
 */
function groupBlocksIntoSections(blocks: ContentBlock[]): Array<{
  heading?: string;
  blocks: ContentBlock[];
  startIndex: number;
  endIndex: number;
  text: string;
  wordCount: number;
}> {
  const sections: Array<{
    heading?: string;
    blocks: ContentBlock[];
    startIndex: number;
    endIndex: number;
    text: string;
    wordCount: number;
  }> = [];

  let currentHeading: string | undefined = undefined;
  let currentBlocks: ContentBlock[] = [];
  let startIndex = 0;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];

    if (block.type === 'heading') {
      if (currentBlocks.length > 0) {
        const fullText = currentBlocks.map(b => b.rawText).join('\n\n');
        const words = fullText.trim().split(/\s+/).filter(Boolean).length;
        if (words >= 20) {
          sections.push({
            heading: currentHeading,
            blocks: [...currentBlocks],
            startIndex,
            endIndex: i - 1,
            text: fullText,
            wordCount: words,
          });
          currentBlocks = [];
          startIndex = i;
        }
      }
      currentHeading = block.rawText;
    } else if (block.type === 'paragraph' || block.type === 'quote') {
      currentBlocks.push(block);
    }
  }

  if (currentBlocks.length > 0) {
    const fullText = currentBlocks.map(b => b.rawText).join('\n\n');
    const words = fullText.trim().split(/\s+/).filter(Boolean).length;
    sections.push({
      heading: currentHeading,
      blocks: [...currentBlocks],
      startIndex,
      endIndex: blocks.length - 1,
      text: fullText,
      wordCount: words,
    });
  }

  // If no headings existed and there's only 1 big section with >= 280 words and multiple paragraphs,
  // split into multi-paragraph chunks of ~130-220 words
  if (sections.length === 1 && sections[0].blocks.length >= 3 && sections[0].wordCount >= 280) {
    const origBlocks = sections[0].blocks;
    const chunkedSections: typeof sections = [];
    let chunk: ContentBlock[] = [];
    let chunkStart = 0;
    let runningWords = 0;

    for (let j = 0; j < origBlocks.length; j++) {
      const b = origBlocks[j];
      const bWords = b.rawText.trim().split(/\s+/).filter(Boolean).length;
      chunk.push(b);
      runningWords += bWords;

      if (runningWords >= 130 && j < origBlocks.length - 1) {
        const chunkText = chunk.map(cb => cb.rawText).join('\n\n');
        chunkedSections.push({
          heading: `Part ${chunkedSections.length + 1}`,
          blocks: [...chunk],
          startIndex: chunkStart,
          endIndex: j,
          text: chunkText,
          wordCount: runningWords,
        });
        chunk = [];
        chunkStart = j + 1;
        runningWords = 0;
      }
    }

    if (chunk.length > 0) {
      const chunkText = chunk.map(cb => cb.rawText).join('\n\n');
      chunkedSections.push({
        heading: `Part ${chunkedSections.length + 1}`,
        blocks: [...chunk],
        startIndex: chunkStart,
        endIndex: origBlocks.length - 1,
        text: chunkText,
        wordCount: runningWords,
      });
    }

    if (chunkedSections.length > 1) {
      return chunkedSections;
    }
  }

  return sections;
}

/**
 * Determine classification and confidence from calibrated probability and sample size.
 */
function determineClassificationAndConfidence(
  prob: number,
  wordCount: number,
  isDomainProtected: boolean,
  isMixed: boolean
): { classification: OriginClassification; confidence: ConfidenceLevel; reason: string } {
  if (isMixed) {
    return {
      classification: 'mixed',
      confidence: 'high',
      reason: 'Multi-section document contains both confirmed human passages and generative AI segments.',
    };
  }

  let classification: OriginClassification = 'inconclusive';
  if (prob >= 0.65) {
    classification = 'likely-ai';
  } else if (prob <= 0.35) {
    classification = 'likely-human';
  } else {
    classification = 'inconclusive';
  }

  let confidence: ConfidenceLevel = 'low';
  let reason = '';

  if (classification === 'inconclusive') {
    confidence = 'low';
    reason = 'Statistical features fall in the ambiguity boundary between human cadence and generative patterns.';
  } else if (wordCount < 60) {
    confidence = 'medium';
    reason = `Short sample (${wordCount} words). Stylometric variance is inherently elevated for texts under 60 words.`;
  } else if (wordCount >= 200) {
    if (prob >= 0.82 || prob <= 0.18) {
      confidence = 'high';
      reason = isDomainProtected
        ? 'High statistical significance with domain-specific structural protection active.'
        : 'High confidence across comprehensive document-length stylometric markers.';
    } else {
      confidence = 'medium';
      reason = 'Moderate statistical divergence from expected human distribution.';
    }
  } else {
    // 60 - 199 words
    if (prob >= 0.85 || prob <= 0.15) {
      confidence = 'high';
      reason = 'Strong statistical divergence across multiple independent feature dimensions.';
    } else {
      confidence = 'medium';
      reason = 'Moderate certainty based on paragraph-level stylometric features.';
    }
  }

  return { classification, confidence, reason };
}

/**
 * Main V2.6 Hierarchical Detector Entry Point.
 */
export function analyzeHierarchicalContent(
  text: string,
  options: HierarchicalDetectorOptions = {}
): HierarchicalDetectionResult {
  const startTime = performance.now();
  const minWords = options.minWordCount ?? 40;
  const sectionThresholdWords = options.sectionThresholdWords ?? 220;

  const words = text ? text.trim().split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;

  // 1. Abstention Guard for Under-length Text
  if (wordCount < minWords) {
    const emptyMetrics: StyleMetrics = {
      lexicalDiversityTTR: 0,
      sentenceBurstinessCv: 0,
      passiveVoiceFrequency: 0,
      clicheMarkerCount: 0,
      structuralEntropy: 0,
      functionWordBalance: 0,
    };

    return {
      humanStyleScore: 50,
      aiSignatureScore: 50,
      calibratedAiProbability: 0.5,
      originClassification: 'inconclusive',
      confidence: 'low',
      confidenceReason: `Input length (${wordCount} words) is below the minimum required length (${minWords} words) for statistically reliable analysis.`,
      wordCount,
      genre: 'general',
      isDocumentLevel: false,
      totalSections: 0,
      styleMetrics: emptyMetrics,
      latencyMs: Number((performance.now() - startTime).toFixed(2)),
      modelIdentifier: 'humanizetext-detector-v2.6-hierarchical',
      modelVersion: '2.6.0',
      evaluationMode: 'single_pass',
      abstentionReason: 'length_below_minimum',
    };
  }

  // 2. Document Structure & Block Parsing
  const structuredDoc = parseDocumentToBlocks(text);
  const sections = groupBlocksIntoSections(structuredDoc.blocks);
  const hasExplicitHeadings = sections.some(s => s.heading);
  const isDocumentLevel = sections.length > 1 && (hasExplicitHeadings ? wordCount >= 80 : wordCount >= sectionThresholdWords);

  // 3. Document-Level / Single-Pass Analysis
  const { rawFeatures, linearMargin, baseCalibratedProb } = evaluateRawLinearMargin(text);
  const globalCalibrated = calibrateStylometricFeatures(text, rawFeatures, linearMargin, baseCalibratedProb);

  // If not document level, return single-pass result
  if (!isDocumentLevel) {
    const { classification, confidence, reason } = determineClassificationAndConfidence(
      globalCalibrated.calibratedAiProbability,
      wordCount,
      globalCalibrated.isDomainProtected,
      false
    );

    return {
      humanStyleScore: globalCalibrated.humanStyleScore,
      aiSignatureScore: globalCalibrated.aiSignatureScore,
      calibratedAiProbability: globalCalibrated.calibratedAiProbability,
      originClassification: classification,
      confidence,
      confidenceReason: reason,
      wordCount,
      genre: globalCalibrated.genre,
      isDocumentLevel: false,
      totalSections: 1,
      styleMetrics: globalCalibrated.metrics,
      latencyMs: Number((performance.now() - startTime).toFixed(2)),
      modelIdentifier: 'humanizetext-detector-v2.6-hierarchical',
      modelVersion: '2.6.0',
      evaluationMode: 'single_pass',
    };
  }

  // 4. Hierarchical Multi-Section Analysis
  const sectionResults: SectionAnalysisResult[] = [];
  let aiSectionCount = 0;
  let humanSectionCount = 0;
  let totalWeightedProb = 0;
  let totalWeight = 0;

  for (let i = 0; i < sections.length; i++) {
    const sec = sections[i];
    const secRaw = evaluateRawLinearMargin(sec.text);
    const secCalibrated = calibrateStylometricFeatures(sec.text, secRaw.rawFeatures, secRaw.linearMargin, secRaw.baseCalibratedProb);

    const { classification: secClass, confidence: secConf } = determineClassificationAndConfidence(
      secCalibrated.calibratedAiProbability,
      sec.wordCount,
      secCalibrated.isDomainProtected,
      false
    );

    if (secClass === 'likely-ai') aiSectionCount++;
    if (secClass === 'likely-human') humanSectionCount++;

    const weight = sec.wordCount;
    totalWeightedProb += secCalibrated.calibratedAiProbability * weight;
    totalWeight += weight;

    sectionResults.push({
      sectionId: `sec_${i + 1}`,
      headingText: sec.heading,
      wordCount: sec.wordCount,
      humanStyleScore: secCalibrated.humanStyleScore,
      aiSignatureScore: secCalibrated.aiSignatureScore,
      calibratedAiProbability: secCalibrated.calibratedAiProbability,
      originClassification: secClass,
      confidence: secConf,
      startParagraphIndex: sec.startIndex,
      endParagraphIndex: sec.endIndex,
    });
  }

  // Weighted document-level probability
  const documentWeightedProb = totalWeight > 0 ? Number((totalWeightedProb / totalWeight).toFixed(4)) : globalCalibrated.calibratedAiProbability;

  // Detect Mixed Content:
  // If at least one substantial section is AI and at least one is Human, flag as mixed!
  const isMixed = (aiSectionCount >= 1 && humanSectionCount >= 1);

  const { classification, confidence, reason } = determineClassificationAndConfidence(
    documentWeightedProb,
    wordCount,
    globalCalibrated.isDomainProtected,
    isMixed
  );

  return {
    humanStyleScore: globalCalibrated.humanStyleScore,
    aiSignatureScore: globalCalibrated.aiSignatureScore,
    calibratedAiProbability: documentWeightedProb,
    originClassification: classification,
    confidence,
    confidenceReason: reason,
    wordCount,
    genre: globalCalibrated.genre,
    isDocumentLevel: true,
    totalSections: sectionResults.length,
    sectionBreakdown: sectionResults,
    styleMetrics: globalCalibrated.metrics,
    latencyMs: Number((performance.now() - startTime).toFixed(2)),
    modelIdentifier: 'humanizetext-detector-v2.6-hierarchical',
    modelVersion: '2.6.0',
    evaluationMode: 'hierarchical_multisection',
  };
}
