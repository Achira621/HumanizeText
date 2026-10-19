// ============================================================================
// ON-DEVICE DETECTOR WEB WORKER (Off-Main-Thread Neural Execution)
// Multi-Signal AI Text Detection Engine v2
// ============================================================================

import type { DetectionResult, TextChunkScore, SentenceScore } from '../types/detector';
import { TEXT_DETECTOR_MANIFEST } from '../lib/detector/manifest';

interface WorkerRequest {
  type: 'DETECT_TEXT';
  id: string;
  text: string;
}

export interface WorkerResponse {
  type: 'DETECT_TEXT_RESULT';
  id: string;
  result?: DetectionResult;
  error?: string;
}

import { computeAiScore, GPT_SIGNATURES } from '../lib/detector/detectorCore';

// ═══════════════════════════════════════════════════════════════════════════
// WORKER MESSAGE HANDLER
// ═══════════════════════════════════════════════════════════════════════════
self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  const { type, id, text } = e.data;

  if (type === 'DETECT_TEXT') {
    const startTime = performance.now();
    try {
      const words = text.trim().split(/\s+/).filter(Boolean);
      const wordCount = words.length;

      // Realistic chunking for documents over 400 words
      const chunkSize = 350;
      const chunks: string[] = [];
      for (let i = 0; i < words.length; i += chunkSize) {
        chunks.push(words.slice(i, i + chunkSize).join(' '));
      }

      const chunkScores: TextChunkScore[] = [];
      let totalAiScore = 0;

      for (let idx = 0; idx < chunks.length; idx++) {
        const chunkText = chunks[idx];
        const { aiProbability: chunkAi } = computeAiScore(chunkText);
        const chunkHuman = Math.round((1 - chunkAi) * 100) / 100;

        chunkScores.push({
          chunkIndex: idx,
          textSnippet: chunkText.substring(0, 80) + '...',
          score: {
            aiProbability: chunkAi,
            humanProbability: chunkHuman,
            confidence: chunkAi > 0.8 || chunkAi < 0.20 ? 'high' : 'moderate',
            classification: chunkAi > 0.60 ? 'likely-ai' : chunkAi < 0.30 ? 'likely-human' : 'inconclusive',
          },
        });

        totalAiScore += chunkAi;
      }

      // Also compute full-document score (captures cross-chunk patterns)
      const fullDocScore = computeAiScore(text);

      // Sentence-by-sentence analysis for QuillBot-style heatmap
      const rawSentences = text.match(/[^.!?\r\n]+(?:[.!?]+|\r?\n+|$)/g) || [text];
      const sentenceScores: SentenceScore[] = [];

      let sIdx = 0;
      for (const rawS of rawSentences) {
        const sTrimmed = rawS.trim();
        if (sTrimmed.length < 5) continue;

        const sScore = computeAiScore(sTrimmed);
        const matchingSigs: string[] = [];
        for (const sig of GPT_SIGNATURES) {
          const match = sTrimmed.match(sig);
          if (match && !matchingSigs.includes(match[0].toLowerCase())) {
            matchingSigs.push(match[0].toLowerCase());
          }
        }

        let sAi = sScore.aiProbability;
        if (matchingSigs.length >= 2) sAi = Math.max(sAi, 0.85);
        else if (matchingSigs.length === 1) sAi = Math.max(sAi, 0.65);
        else if (sTrimmed.split(/\s+/).length < 8 && fullDocScore.aiProbability < 0.35) sAi = Math.min(sAi, 0.20);

        sAi = Math.max(0.02, Math.min(0.98, Math.round(sAi * 100) / 100));
        const sHuman = Math.round((1 - sAi) * 100) / 100;
        const sClass = sAi >= 0.60 ? 'likely-ai' : sAi <= 0.35 ? 'likely-human' : 'inconclusive';

        sentenceScores.push({
          sentenceIndex: sIdx++,
          text: sTrimmed,
          aiProbability: sAi,
          humanProbability: sHuman,
          classification: sClass,
          detectedSignals: matchingSigs,
        });
      }

      // Final score: weighted average of chunk-level and document-level
      const chunkAvgAi = totalAiScore / Math.max(1, chunks.length);
      const blendedAi = chunks.length > 1
        ? chunkAvgAi * 0.4 + fullDocScore.aiProbability * 0.6
        : fullDocScore.aiProbability;

      const roundedAi = Math.max(0.02, Math.min(0.98, Math.round(blendedAi * 100) / 100));
      const roundedHuman = Math.round((1 - roundedAi) * 100) / 100;

      const classification =
        roundedAi > 0.60 ? 'likely-ai' : roundedAi < 0.30 ? 'likely-human' : 'inconclusive';
      const confidence =
        roundedAi > 0.80 || roundedAi < 0.15 ? 'high' : roundedAi >= 0.35 && roundedAi <= 0.55 ? 'low' : 'moderate';

      const result: DetectionResult = {
        id: `loc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        timestamp: Date.now(),
        mode: 'local',
        modelId: TEXT_DETECTOR_MANIFEST.modelId,
        modelVersion: TEXT_DETECTOR_MANIFEST.version,
        latencyMs: Math.round(performance.now() - startTime),
        score: {
          aiProbability: roundedAi,
          humanProbability: roundedHuman,
          confidence,
          classification,
          perplexityScore: fullDocScore.perplexityScore,
          burstinessScore: fullDocScore.burstinessScore,
        },
        chunkBreakdown: chunks.length > 1 ? chunkScores : undefined,
        sentenceBreakdown: sentenceScores.length > 0 ? sentenceScores : undefined,
        inputWordCount: wordCount,
        limitationsNotice: TEXT_DETECTOR_MANIFEST.calibrationNotice,
      };

      self.postMessage({ type: 'DETECT_TEXT_RESULT', id, result });
    } catch (err: any) {
      self.postMessage({ type: 'DETECT_TEXT_RESULT', id, error: err?.message || 'Worker inference failed' });
    }
  }
};
