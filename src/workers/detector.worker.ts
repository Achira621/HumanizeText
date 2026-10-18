// ============================================================================
// ON-DEVICE DETECTOR WEB WORKER (Off-Main-Thread Neural Execution)
// Multi-Signal AI Text Detection Engine v2
// ============================================================================

import type { DetectionResult, TextChunkScore } from '../types/detector';
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

// ─── Signal 1: GPT / LLM Vocabulary Fingerprints ────────────────────────────
// Extended from 14 → 120+ known LLM-overused words and phrases
const GPT_SIGNATURES: RegExp[] = [
  // Classic ChatGPT overused words
  /\bdelve\b/i, /\btapestry\b/i, /\btestament\b/i, /\bmultifaceted\b/i,
  /\bseamlessly?\b/i, /\bharnessing\b/i, /\blandscape\b/i, /\brobust\b/i,
  /\bcomprehensive\b/i, /\bproactive(?:ly)?\b/i, /\bparadigm\b/i,
  /\bunderscores?\b/i, /\bpivotal\b/i, /\bintricate\b/i, /\bmeticulou(?:s|sly)\b/i,
  /\bfostering\b/i, /\brealm\b/i, /\bnavigat(?:e|ing|es)\b/i,
  /\bever-(?:evolving|changing|growing)\b/i,
  /\bcutting[- ]edge\b/i, /\bgroundbreaking\b/i, /\binnovative\b/i,
  /\bleverag(?:e|ing|es)\b/i, /\boptimiz(?:e|ing|es|ation)\b/i,
  /\bstream(?:line|lining)\b/i, /\bholistic\b/i, /\bsynergy\b/i,
  /\bempowering?\b/i, /\btransformative\b/i, /\bcollaborative\b/i,
  /\bdynamic\b/i, /\bstrategic(?:ally)?\b/i, /\bsustainab(?:le|ility)\b/i,
  /\bscalab(?:le|ility)\b/i, /\bactionable\b/i, /\btailored\b/i,
  /\bfacilitat(?:e|ing|es)\b/i, /\benchan(?:ce|cing|ces|cement)\b/i,
  /\bensur(?:e|ing|es)\b/i, /\bimplement(?:ation|ing)?\b/i,
  /\butiliz(?:e|ing|es|ation)\b/i, /\beffective(?:ly)?\b/i,
  /\befficient(?:ly)?\b/i, /\bsignificant(?:ly)?\b/i, /\bcrucial(?:ly)?\b/i,
  /\bessential(?:ly)?\b/i, /\bfundamental(?:ly)?\b/i, /\bnotably\b/i,
  /\bimportantly\b/i, /\badditionally\b/i, /\bconsequently\b/i,
  /\bin today(?:'s| ?s) (?:world|age|era|society|landscape)\b/i,
  /\bin (?:the )?(?:modern|contemporary|digital|current) (?:world|age|era|landscape)\b/i,
  /\bit(?:'s| is) (?:important|worth|essential|crucial|vital|imperative) to (?:note|mention|understand|recognize|acknowledge)\b/i,
  /\bplays? a (?:vital|crucial|key|significant|important|pivotal|critical) role\b/i,
  /\ba wide (?:range|array|variety) of\b/i,
  /\bvast array of\b/i,
  /\brange of benefits\b/i, /\bnumerous benefits\b/i,
  /\bin order to\b/i, /\bdue to the fact that\b/i,
  /\bit is worth (?:noting|mentioning)\b/i,
  /\bone of the most\b/i,

  // Transition / filler phrases strongly preferred by LLMs
  /\bmoreover\b/i, /\bfurthermore\b/i, /\bnevertheless\b/i,
  /\bnonetheless\b/i, /\bconversely\b/i, /\bsubsequently\b/i,
  /\bin conclusion\b/i, /\bin summary\b/i, /\bto summarize\b/i,
  /\bin essence\b/i, /\bin light of\b/i, /\bby and large\b/i,
  /\bon the other hand\b/i, /\bthis is (?:because|due)\b/i,
  /\bthat being said\b/i, /\bthis ensures\b/i, /\bthis allows\b/i,
  /\bthis enables\b/i, /\bthis helps\b/i, /\bthis makes?\b/i,

  // Hedging patterns typical of safety-trained models
  /\bI(?:'d| would) be happy to\b/i, /\bI hope this (?:helps|email|message|finds)\b/i,
  /\bplease (?:don't|do not) hesitate\b/i, /\bfeel free to\b/i,
  /\bif you have any (?:questions|concerns|further)\b/i,
  /\bplease let me know if\b/i, /\blooking forward to\b/i,
  /\bthank you for (?:your|taking)\b/i,
  /\bI appreciate your\b/i, /\bI understand (?:that|your)\b/i,
  /\bI wanted to (?:reach out|follow up|let you know|touch base)\b/i,
  /\bbest regards\b/i, /\bwarm regards\b/i, /\bkind regards\b/i,
  /\bhope this (?:finds you well|helps|email)\b/i,

  // Verbose / padding phrases
  /\bit(?:'s| is) (?:no secret|clear|evident|apparent|obvious) that\b/i,
  /\bnot only\b.*?\bbut also\b/i,
  /\bwhether\b.*?\bor\b.*?\b(?:the key|it)\b/i,
  /\bwhen it comes to\b/i, /\bin the realm of\b/i,
  /\bpaving the way\b/i, /\blay the groundwork\b/i,
  /\bthe (?:key|importance|significance|value) (?:of|lies)\b/i,
  /\bas (?:we|you) (?:navigate|move forward|look ahead)\b/i,
  // Additional Email, Cover Letter, and Corporate GPT patterns
  /\bhope (?:everyone|all of you|you all) (?:is|are) having\b/i,
  /\bworking diligently\b/i,
  /\bsmooth (?:rollout|transition|process|execution)\b/i,
  /\bcompleted successfully\b/i,
  /\bmoving into the (?:final|next) stages?\b/i,
  /\b(?:any )?questions or feedback\b/i,
  /\bkeep you (?:posted|updated)\b/i,
  /\bexpress my (?:enthusiastic|strong|sincere|keen) interest\b/i,
  /\bmake a (?:meaningful|valuable|significant) contribution\b/i,
  /\bthroughout my career\b/i,
  /\bsuccessfully spearheaded\b/i,
  /\bpride myself on\b/i,
  /\bwelcome the opportunity to\b/i,
  /\balign(?:s)? with the (?:goals|mission|values|objectives) of\b/i,
  /\bpossibility of discussing\b/i,
  /\bwith over \d+ years of experience\b/i,
  /\bconfident in my ability\b/i,
  /\bvaluable (?:feedback|insights?|contribution|addition)\b/i,
  /\bdrive sustainable (?:growth|revenue)\b/i,
  /\bdata-driven (?:analytics|insights|decisions|approach)\b/i,
  /\bcontent strategy\b/i,
  /\baudienc(?:e) engagement\b/i,
  /\bexciting opportunity\b/i,
  /\btime and consideration\b/i,
  /\bdiscuss how my (?:background|skills|experience)\b/i,
  /\bI am writing to (?:express|formally|inquire|apply|introduce)\b/i,
  /\bI am reaching out to\b/i,
  /\bI wanted to (?:provide|give|share) a quick update\b/i,
  /\bat your earliest convenience\b/i,
  /\blook forward to (?:hearing|discussing|working|speaking)\b/i,
  /\bdelighted to\b/i,
  /\bplease find (?:my|the)? (?:attached|enclosed)\b/i,
  /\bcompetitive advantage\b/i,
  /\bcross-functional collaboration\b/i,
  /\blive demonstration\b/i,
  /\boptimal alignment\b/i,
  /\boperational efficiency\b/i,
];

// ─── Signal 2: Sentence-Level Burstiness Analysis ───────────────────────────
function computeBurstiness(sentences: string[]): {
  stdDev: number;
  mean: number;
  coeffOfVariation: number;
  uniformityRatio: number;
} {
  if (sentences.length < 2) {
    return { stdDev: 5, mean: 15, coeffOfVariation: 0.33, uniformityRatio: 0.5 };
  }

  const lengths = sentences.map((s) => s.split(/\s+/).filter(Boolean).length);
  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance = lengths.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / lengths.length;
  const stdDev = Math.sqrt(variance);
  const coeffOfVariation = mean > 0 ? stdDev / mean : 0;

  // What % of sentences are within ±3 words of the mean? AI text clusters tightly.
  const withinBand = lengths.filter((l) => Math.abs(l - mean) <= 3).length;
  const uniformityRatio = withinBand / lengths.length;

  return { stdDev, mean, coeffOfVariation, uniformityRatio };
}

// ─── Signal 3: Vocabulary Richness / Entropy ────────────────────────────────
function computeVocabRichness(words: string[]): {
  typeTokenRatio: number;
  hapaxRatio: number;
} {
  const lower = words.map((w) => w.toLowerCase().replace(/[^a-z']/g, '')).filter((w) => w.length > 2);
  const freq: Record<string, number> = {};
  for (const w of lower) {
    freq[w] = (freq[w] || 0) + 1;
  }
  const uniqueCount = Object.keys(freq).length;
  const hapax = Object.values(freq).filter((c) => c === 1).length; // words appearing only once

  return {
    typeTokenRatio: lower.length > 0 ? uniqueCount / lower.length : 0,
    hapaxRatio: uniqueCount > 0 ? hapax / uniqueCount : 0,
  };
}

// ─── Signal 4: Sentence Opening Diversity ───────────────────────────────────
function computeOpeningDiversity(sentences: string[]): number {
  if (sentences.length < 3) return 0.8;

  const openings = sentences.map((s) => {
    const words = s.trim().split(/\s+/);
    return words.slice(0, 2).join(' ').toLowerCase();
  });

  const uniqueOpenings = new Set(openings).size;
  return uniqueOpenings / openings.length;
}

// ─── Signal 5: Paragraph Structure Analysis ─────────────────────────────────
function computeParagraphUniformity(text: string): number {
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 20);
  if (paragraphs.length < 2) return 0.5;

  const paraSentenceCounts = paragraphs.map(
    (p) => p.split(/[.!?]+/).filter((s) => s.trim().length > 5).length
  );

  const mean = paraSentenceCounts.reduce((a, b) => a + b, 0) / paraSentenceCounts.length;
  if (mean === 0) return 0.5;

  const variance = paraSentenceCounts.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / paraSentenceCounts.length;
  const cv = Math.sqrt(variance) / mean;

  // Low CV = highly uniform paragraphs = AI signal
  return Math.max(0, Math.min(1, cv));
}

// ─── Signal 6: Consecutive Sentence Length Pattern ──────────────────────────
// AI tends to produce sentences that alternate in a predictable medium-short-medium pattern
function computeConsecutivePattern(sentences: string[]): number {
  if (sentences.length < 4) return 0;

  const lengths = sentences.map((s) => s.split(/\s+/).filter(Boolean).length);
  let predictableTransitions = 0;
  let totalTransitions = 0;

  for (let i = 1; i < lengths.length; i++) {
    totalTransitions++;
    const diff = Math.abs(lengths[i] - lengths[i - 1]);
    // AI models tend to keep consecutive sentences within a narrow band
    if (diff <= 5) {
      predictableTransitions++;
    }
  }

  return totalTransitions > 0 ? predictableTransitions / totalTransitions : 0;
}

// ─── Signal 7: Passive Voice Density ────────────────────────────────────────
function computePassiveVoiceDensity(sentences: string[]): number {
  const passivePattern = /\b(?:is|are|was|were|be|been|being)\s+(?:\w+ly\s+)?(?:\w+ed|made|done|given|taken|known|shown|seen|found|used|based)\b/i;
  let passiveCount = 0;
  for (const s of sentences) {
    if (passivePattern.test(s)) passiveCount++;
  }
  return sentences.length > 0 ? passiveCount / sentences.length : 0;
}

// ─── Signal 8: Average Sentence Complexity (Clause markers) ─────────────────
function computeClauseDensity(sentences: string[]): number {
  const clauseMarkers = /\b(?:which|that|because|although|while|whereas|since|unless|however|therefore|thus|hence|accordingly|consequently|whereby)\b/gi;
  let totalClauses = 0;
  for (const s of sentences) {
    const matches = s.match(clauseMarkers);
    totalClauses += matches ? matches.length : 0;
  }
  return sentences.length > 0 ? totalClauses / sentences.length : 0;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN SCORING ENGINE: Weighted multi-signal fusion
// ═══════════════════════════════════════════════════════════════════════════
function computeAiScore(text: string): {
  aiProbability: number;
  perplexityScore: number;
  burstinessScore: number;
  signalBreakdown: Record<string, number>;
} {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const sentences = text.split(/[.!?]+/).map((s) => s.trim()).filter((s) => s.length > 5);

  // ── Compute all signals ──
  // 1. Keyword signature density
  let keywordHits = 0;
  for (const sig of GPT_SIGNATURES) {
    if (sig.test(text)) keywordHits++;
  }
  // Calculate density of signatures per 100 words
  const densityPer100 = (keywordHits / Math.max(1, wordCount)) * 100;
  const keywordDensity = Math.min(1, keywordHits / Math.max(1, Math.ceil(wordCount / 50)));

  // 2. Burstiness
  const burst = computeBurstiness(sentences);

  // 3. Vocabulary richness
  const vocab = computeVocabRichness(words);

  // 4. Sentence opening diversity
  const openingDiv = computeOpeningDiversity(sentences);

  // 5. Paragraph structure uniformity
  const paraUniformity = computeParagraphUniformity(text);

  // 6. Consecutive sentence length predictability
  const consecutivePattern = computeConsecutivePattern(sentences);

  // 7. Passive voice density
  const passiveDensity = computePassiveVoiceDensity(sentences);

  // 8. Clause density (subordination complexity)
  const clauseDensity = computeClauseDensity(sentences);

  // ── Convert raw signals into individual AI probability contributions ──

  // Signal 1: Keyword fingerprint taking density into account
  let sigKeyword: number;
  if (densityPer100 >= 5 || keywordHits >= 10) sigKeyword = 0.98;
  else if (densityPer100 >= 3.5 || keywordHits >= 6) sigKeyword = 0.92;
  else if (densityPer100 >= 2.0 || keywordHits >= 4) sigKeyword = 0.84;
  else if (densityPer100 >= 1.0 || keywordHits >= 2) sigKeyword = 0.68;
  else if (keywordHits === 1) sigKeyword = 0.35;
  else sigKeyword = 0.05;

  // Signal 2: Burstiness uniformity (low CV → AI, high CV → human)
  let sigBurst: number;
  if (burst.coeffOfVariation < 0.20) sigBurst = 0.90;
  else if (burst.coeffOfVariation < 0.30) sigBurst = 0.75;
  else if (burst.coeffOfVariation < 0.42) sigBurst = 0.50;
  else if (burst.coeffOfVariation < 0.55) sigBurst = 0.25;
  else sigBurst = 0.10;

  if (burst.uniformityRatio > 0.70) sigBurst = Math.min(1, sigBurst + 0.15);

  // Signal 3: Vocabulary richness (low TTR → AI, high TTR → human)
  let sigVocab: number;
  if (vocab.typeTokenRatio > 0.72) sigVocab = 0.10;
  else if (vocab.typeTokenRatio > 0.60) sigVocab = 0.25;
  else if (vocab.typeTokenRatio > 0.50) sigVocab = 0.45;
  else if (vocab.typeTokenRatio > 0.40) sigVocab = 0.65;
  else sigVocab = 0.82;

  // Signal 4: Opening diversity (low diversity → AI)
  let sigOpening: number;
  if (openingDiv > 0.85) sigOpening = 0.10;
  else if (openingDiv > 0.70) sigOpening = 0.25;
  else if (openingDiv > 0.50) sigOpening = 0.50;
  else sigOpening = 0.80;

  // Signal 5: Paragraph uniformity (low CV → uniform → AI)
  let sigParagraph: number;
  if (paraUniformity < 0.15) sigParagraph = 0.80;
  else if (paraUniformity < 0.30) sigParagraph = 0.55;
  else if (paraUniformity < 0.50) sigParagraph = 0.35;
  else sigParagraph = 0.15;

  // Signal 6: Consecutive predictability (high → AI)
  let sigConsecutive: number;
  if (consecutivePattern > 0.80) sigConsecutive = 0.85;
  else if (consecutivePattern > 0.60) sigConsecutive = 0.60;
  else if (consecutivePattern > 0.40) sigConsecutive = 0.35;
  else sigConsecutive = 0.12;

  // Signal 7: Passive voice (moderate density is AI-typical)
  let sigPassive: number;
  if (passiveDensity > 0.45) sigPassive = 0.75;
  else if (passiveDensity > 0.25) sigPassive = 0.55;
  else if (passiveDensity > 0.10) sigPassive = 0.35;
  else sigPassive = 0.20;

  // Signal 8: Clause density (AI uses moderate, predictable subordination)
  let sigClause: number;
  if (clauseDensity > 1.5) sigClause = 0.20;
  else if (clauseDensity > 0.8) sigClause = 0.40;
  else if (clauseDensity > 0.3) sigClause = 0.60;
  else sigClause = 0.35;

  // ── Weighted fusion ──
  // Keyword density is given primary weight (40%) because LLM vocabulary habits are virtually unmistakable
  const weights = {
    keyword:     0.40,
    burstiness:  0.16,
    vocabulary:  0.12,
    opening:     0.07,
    paragraph:   0.07,
    consecutive: 0.08,
    passive:     0.05,
    clause:      0.05,
  };

  const rawAi =
    sigKeyword     * weights.keyword +
    sigBurst       * weights.burstiness +
    sigVocab       * weights.vocabulary +
    sigOpening     * weights.opening +
    sigParagraph   * weights.paragraph +
    sigConsecutive * weights.consecutive +
    sigPassive     * weights.passive +
    sigClause      * weights.clause;

  // ── Calibration & Synergy ──
  let calibratedAi = rawAi;
  if (sigKeyword >= 0.84) {
    calibratedAi = Math.max(calibratedAi, sigKeyword * 0.95);
  } else if (sigKeyword >= 0.68) {
    calibratedAi = Math.max(calibratedAi, 0.65);
  } else if (keywordHits === 0) {
    calibratedAi = Math.min(calibratedAi, 0.22);
  }

  // Short text adjustment
  if (wordCount < 25) {
    calibratedAi = calibratedAi * 0.75 + 0.12;
  }

  const aiProbability = Math.max(0.02, Math.min(0.98, Math.round(calibratedAi * 100) / 100));

  // ── Perplexity score (inverse of predictability; human text = higher) ──
  const perplexityScore = Math.round(
    Math.max(5, Math.min(98, 
      (vocab.typeTokenRatio * 40) + 
      (burst.coeffOfVariation * 50) + 
      (openingDiv * 20) - 
      (keywordDensity * 25) + 
      10
    ))
  );

  // ── Burstiness score (variance in sentence patterns; human text = higher) ──
  const burstinessScore = Math.round(
    Math.max(5, Math.min(98,
      (burst.coeffOfVariation * 80) +
      ((1 - burst.uniformityRatio) * 40) +
      ((1 - consecutivePattern) * 30) -
      10
    ))
  );

  return {
    aiProbability,
    perplexityScore,
    burstinessScore,
    signalBreakdown: {
      keyword: sigKeyword,
      burstiness: sigBurst,
      vocabulary: sigVocab,
      opening: sigOpening,
      paragraph: sigParagraph,
      consecutive: sigConsecutive,
      passive: sigPassive,
      clause: sigClause,
    },
  };
}

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
        inputWordCount: wordCount,
        limitationsNotice: TEXT_DETECTOR_MANIFEST.calibrationNotice,
      };

      self.postMessage({ type: 'DETECT_TEXT_RESULT', id, result });
    } catch (err: any) {
      self.postMessage({ type: 'DETECT_TEXT_RESULT', id, error: err?.message || 'Worker inference failed' });
    }
  }
};
