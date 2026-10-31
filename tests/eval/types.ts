export type Split = 'train' | 'test';
export type DetectionLabel = 'human' | 'ai' | 'mixed';

export interface DetectionRow {
  readonly id: string;
  readonly text: string;
  readonly label: DetectionLabel;
  readonly topic: string;
  readonly split: Split;
}

export type PlagiarismType =
  | 'verbatim_copy'
  | 'synonym_swap'
  | 'sentence_reorder'
  | 'mosaic_partial'
  | 'same_topic_different_text'
  | 'unrelated_original';

export interface PlagiarismRow {
  readonly id: string;
  readonly sourceText: string;
  readonly candidateText: string;
  readonly type: PlagiarismType;
  readonly isPlagiarised: boolean;
  readonly topic: string;
  readonly split: Split;
}

export interface HumanizerRow {
  readonly id: string;
  readonly inputAiText: string;
  readonly targetHumanizedText: string;
  readonly topic: string;
  readonly split: Split;
  /** AI cliché markers known to be present in `inputAiText`. */
  readonly markers: readonly string[];
}

export type Intensity = 'low' | 'med' | 'high' | 'max';
export const INTENSITIES: readonly Intensity[] = ['low', 'med', 'high', 'max'];

export type DetectorV2Split = 'dev' | 'calibration' | 'held_out';
export type DetectorV2Genre = 'academic' | 'technical' | 'corporate' | 'conversational' | 'creative';
export type DetectorV2Label =
  | 'human_verified'
  | 'ai_generated'
  | 'human_ai_edited'
  | 'ai_human_edited'
  | 'mixed_authorship';

export interface DetectorV2Provenance {
  readonly authorOrSource: string;
  readonly method: string;
  readonly date: string;
  readonly notes?: string;
}

export interface DetectorV2BenchmarkRow {
  readonly id: string;
  readonly split: DetectorV2Split;
  readonly genre: DetectorV2Genre;
  readonly lengthCategory: 'short' | 'medium' | 'long';
  readonly wordCount: number;
  readonly label: DetectorV2Label;
  readonly provenance: DetectorV2Provenance;
  readonly text: string;
}

export type DetectorV2_2Partition =
  | 'dev'
  | 'calibration'
  | 'legacy_eval_examined'
  | 'fresh_dev'
  | 'fresh_calib'
  | 'examined_tuning_holdout';

export interface DetectorV2_2Provenance {
  readonly authorOrSource: string;
  readonly sourceUrlOrCitation?: string;
  readonly method: string;
  readonly date: string;
  readonly notes?: string;
  readonly previouslyExamined: boolean;
  readonly tuningInfluence?: string;
}

export interface DetectorV2_2_1HoldoutRow {
  readonly id: string;
  readonly partition: 'fresh_held_out_v2_2_1';
  readonly genre: DetectorV2Genre;
  readonly lengthCategory: 'short' | 'medium' | 'long';
  readonly wordCount: number;
  readonly label: DetectorV2Label;
  readonly sha256: string;
  readonly provenance: {
    readonly authorOrSource: string;
    readonly sourceUrlOrCitation?: string;
    readonly method: string;
    readonly date: string;
    readonly prompt?: string;
    readonly model?: string;
    readonly configuration?: string;
    readonly notes?: string;
    readonly previouslyExamined: false;
  };
  readonly text: string;
}

export interface DetectorV2_2BenchmarkRow {
  readonly id: string;
  readonly partition: DetectorV2_2Partition;
  readonly genre: DetectorV2Genre;
  readonly lengthCategory: 'short' | 'medium' | 'long';
  readonly wordCount: number;
  readonly label: DetectorV2Label;
  readonly sha256: string;
  readonly provenance: DetectorV2_2Provenance;
  readonly text: string;
}

export interface ComparatorObservation {
  readonly comparator: string;
  readonly testDate: string;
  readonly reportedScore: number;
  readonly reportedLabel: string;
  readonly scoreSemantics: string;
  readonly notes: string;
}

export interface ComparatorBenchmarkRow {
  readonly sampleId: string;
  readonly genre: string;
  readonly wordCount: number;
  readonly trueLabel: DetectorV2Label;
  readonly authorOrSource: string;
  readonly text: string;
  readonly observations: readonly ComparatorObservation[];
}
