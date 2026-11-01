/**
 * ============================================================================
 * HUMANIZETEXT DETECTOR V2.6: ADVANCED HIERARCHICAL CLASSIFICATION TYPES
 * 
 * Separates measured writing-style characteristics from authorship classification,
 * provides length-aware confidence calibration, domain-aware entropy adjustments,
 * and hierarchical multi-section assessment for long documents.
 * ============================================================================
 */

export type OriginClassification =
  | 'likely-human'
  | 'likely-ai'
  | 'mixed'
  | 'inconclusive';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export type DetectedGenre =
  | 'academic'
  | 'technical'
  | 'professional'
  | 'conversational'
  | 'creative'
  | 'general';

export interface StyleMetrics {
  lexicalDiversityTTR: number;        // Type-Token Ratio (0 - 1)
  sentenceBurstinessCv: number;       // Coefficient of variation of sentence lengths
  passiveVoiceFrequency: number;      // Passive instances per 100 words
  clicheMarkerCount: number;          // Known generative filler/cliché count
  structuralEntropy: number;          // Transition and punctuation entropy
  functionWordBalance: number;        // Function word ratio normalized
}

export interface SectionAnalysisResult {
  sectionId: string;
  headingText?: string;
  wordCount: number;
  humanStyleScore: number;           // 0 to 100
  aiSignatureScore: number;          // 0 to 100
  calibratedAiProbability: number;   // 0.0 to 1.0
  originClassification: OriginClassification;
  confidence: ConfidenceLevel;
  startParagraphIndex: number;
  endParagraphIndex: number;
}

export interface HierarchicalDetectionResult {
  // 1. Separate Style Measurements
  humanStyleScore: number;           // 0 to 100: measured similarity to human validation corpus
  aiSignatureScore: number;          // 0 to 100: strength of generative AI signature patterns
  calibratedAiProbability: number;   // 0.0 to 1.0: mathematically calibrated posterior P(AI | features)

  // 2. Authorship Classification & Confidence
  originClassification: OriginClassification;
  confidence: ConfidenceLevel;
  confidenceReason: string;

  // 3. Document Understanding & Structure
  wordCount: number;
  genre: DetectedGenre;
  isDocumentLevel: boolean;
  totalSections: number;
  sectionBreakdown?: SectionAnalysisResult[];

  // 4. Stylistic Indicators
  styleMetrics: StyleMetrics;

  // 5. Audit & Diagnostics
  latencyMs: number;
  modelIdentifier: string;
  modelVersion: string;
  evaluationMode: 'single_pass' | 'hierarchical_multisection';
  abstentionReason?: string | null;
}

