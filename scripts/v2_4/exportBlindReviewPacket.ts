/**
 * ============================================================================
 * HUMANIZETEXT DETECTOR V2.4: BLIND REVIEW PACKET EXPORT WORKFLOW
 * Prepares strictly blinded review packets for independent human assessment.
 * Strips model identity, author class, detector scores, and ground truth labels.
 * Separates Writing Quality (imperfect / competent / polished / not_assessable)
 * from Authorship ground truth.
 * ============================================================================
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatasetRegistryRecord } from '../../src/lib/detector/v2_4/datasetRegistrySchema';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = resolve(__dirname, '../..');

const DEV_PATH = resolve(ROOT_DIR, 'data/v2_4/dev.jsonl');
const BLIND_PACKET_PATH = resolve(ROOT_DIR, 'data/v2_4/blind_review_packets.json');

export interface BlindReviewItem {
  reviewItemId: string; // Pseudonymous ID (e.g. BLIND_ITEM_001)
  genre: string;
  wordCount: number;
  promptText: string | null;
  text: string;
  instructions: string;
  scoringDimensions: {
    d1_grammar_mechanics: '1 (Poor) to 5 (Flawless)';
    d2_coherence_continuity: '1 (Disjointed) to 5 (Seamless)';
    d3_vocabulary_precision: '1 (Vague/Cliché) to 5 (Nuanced/Precise)';
    d4_structural_cadence: '1 (Monotonous) to 5 (Dynamic/Varied)';
    d5_naturalness_rhythm: '1 (Artificial/Stilted) to 5 (Idiomatic/Organic)';
  };
  overallQualityRatingAllowed: ['imperfect', 'competent', 'polished', 'not_assessable'];
}

export interface BlindReviewPacket {
  packetVersion: string;
  generatedDate: string;
  itemCount: number;
  blindedItems: BlindReviewItem[];
}

export function exportBlindReviewPacket(): BlindReviewPacket {
  if (!existsSync(DEV_PATH)) {
    throw new Error(`Dev partition file not found: ${DEV_PATH}`);
  }

  const records: DatasetRegistryRecord[] = readFileSync(DEV_PATH, 'utf8')
    .split('\n')
    .filter((l) => l.trim().length > 0)
    .map((l) => JSON.parse(l));

  // Deterministically sort/pseudonymize items
  const blindedItems: BlindReviewItem[] = records.map((rec, idx) => {
    const padNum = String(idx + 1).padStart(3, '0');
    return {
      reviewItemId: `BLIND_ITEM_${padNum}`,
      genre: rec.genre,
      wordCount: rec.wordCount,
      promptText: rec.promptId !== 'none' && rec.promptId !== 'unknown' ? `Prompt: ${rec.promptId}` : null,
      text: rec.text,
      instructions:
        'Rate this passage strictly on linguistic quality. Do NOT guess authorship. Ground truth labels and detector predictions have been completely removed.',
      scoringDimensions: {
        d1_grammar_mechanics: '1 (Poor) to 5 (Flawless)',
        d2_coherence_continuity: '1 (Disjointed) to 5 (Seamless)',
        d3_vocabulary_precision: '1 (Vague/Cliché) to 5 (Nuanced/Precise)',
        d4_structural_cadence: '1 (Monotonous) to 5 (Dynamic/Varied)',
        d5_naturalness_rhythm: '1 (Artificial/Stilted) to 5 (Idiomatic/Organic)',
      },
      overallQualityRatingAllowed: ['imperfect', 'competent', 'polished', 'not_assessable'],
    };
  });

  const packet: BlindReviewPacket = {
    packetVersion: '2.4.0',
    generatedDate: new Date().toISOString(),
    itemCount: blindedItems.length,
    blindedItems,
  };

  writeFileSync(BLIND_PACKET_PATH, JSON.stringify(packet, null, 2), 'utf8');
  console.log(`Blinded review packet exported to: ${BLIND_PACKET_PATH} (${blindedItems.length} items)`);
  return packet;
}

if (process.argv[1]?.includes('exportBlindReviewPacket')) {
  exportBlindReviewPacket();
}

