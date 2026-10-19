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
