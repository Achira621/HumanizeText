import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type {
  DetectionLabel,
  DetectionRow,
  HumanizerRow,
  PlagiarismRow,
  PlagiarismType,
  Split,
} from './types';

type UnknownRecord = Readonly<Record<string, unknown>>;

const DETECTION_LABELS: readonly string[] = ['human', 'ai', 'mixed'];
const SPLITS: readonly string[] = ['train', 'test'];
const PLAGIARISM_TYPES: readonly string[] = [
  'verbatim_copy',
  'synonym_swap',
  'sentence_reorder',
  'mosaic_partial',
  'same_topic_different_text',
  'unrelated_original',
];

function isRecord(v: unknown): v is UnknownRecord {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function str(r: UnknownRecord, key: string): string {
  const v = r[key];
  if (typeof v !== 'string') throw new Error(`Fixture field "${key}" must be a string`);
  return v;
}

function bool(r: UnknownRecord, key: string): boolean {
  const v = r[key];
  if (typeof v !== 'boolean') throw new Error(`Fixture field "${key}" must be a boolean`);
  return v;
}

function strArray(r: UnknownRecord, key: string): string[] {
  const v = r[key];
  if (!Array.isArray(v) || !v.every((x): x is string => typeof x === 'string')) {
    throw new Error(`Fixture field "${key}" must be a string[]`);
  }
  return v;
}

function oneOf<T extends string>(value: string, allowed: readonly string[], field: string): T {
  if (!allowed.includes(value)) throw new Error(`Fixture field "${field}" has invalid value "${value}"`);
  return value as T;
}

function readJson(name: string): readonly UnknownRecord[] {
  const path = fileURLToPath(new URL(`./fixtures/${name}.json`, import.meta.url));
  const parsed: unknown = JSON.parse(readFileSync(path, 'utf-8'));
  if (!Array.isArray(parsed) || !parsed.every(isRecord)) throw new Error(`${name}.json must be an array of objects`);
  return parsed;
}

export function loadDetection(): DetectionRow[] {
  return readJson('detection').map((r) => ({
    id: str(r, 'id'),
    text: str(r, 'text'),
    label: oneOf<DetectionLabel>(str(r, 'label'), DETECTION_LABELS, 'label'),
    topic: str(r, 'topic'),
    split: oneOf<Split>(str(r, 'split'), SPLITS, 'split'),
  }));
}

export function loadPlagiarism(): PlagiarismRow[] {
  return readJson('plagiarism').map((r) => ({
    id: str(r, 'id'),
    sourceText: str(r, 'sourceText'),
    candidateText: str(r, 'candidateText'),
    type: oneOf<PlagiarismType>(str(r, 'type'), PLAGIARISM_TYPES, 'type'),
    isPlagiarised: bool(r, 'isPlagiarised'),
    topic: str(r, 'topic'),
    split: oneOf<Split>(str(r, 'split'), SPLITS, 'split'),
  }));
}

export function loadHumanizer(): HumanizerRow[] {
  return readJson('humanizer').map((r) => ({
    id: str(r, 'id'),
    inputAiText: str(r, 'inputAiText'),
    targetHumanizedText: str(r, 'targetHumanizedText'),
    topic: str(r, 'topic'),
    split: oneOf<Split>(str(r, 'split'), SPLITS, 'split'),
    markers: strArray(r, 'markers'),
  }));
}
