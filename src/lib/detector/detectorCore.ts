// ============================================================================
// PURE LINGUISTIC AI DETECTION CORE (Node & Browser Compatible)
// Multi-Signal AI Text Detection Engine
// ============================================================================

export const GPT_SIGNATURES: RegExp[] = [
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

// High-confidence formulaic AI signatures that are strong indicators of LLM generation
export const HIGH_CONFIDENCE_SIGNATURES: RegExp[] = [
  /\bdelve\b/i, /\btapestry\b/i, /\btestament\b/i, /\bmultifaceted\b/i,
  /\bseamlessly?\b/i, /\bharnessing\b/i, /\blandscape\b/i, /\brobust\b/i,
  /\bcomprehensive\b/i, /\bproactive(?:ly)?\b/i, /\bparadigm\b/i,
  /\bunderscores?\b/i, /\bpivotal\b/i, /\bintricate\b/i, /\bmeticulou(?:s|sly)\b/i,
  /\bfostering\b/i, /\brealm\b/i, /\bever-(?:evolving|changing|growing)\b/i,
  /\bcutting[- ]edge\b/i, /\bgroundbreaking\b/i,
  /\bleverag(?:e|ing|es)\b/i, /\bstream(?:line|lining)\b/i, /\bholistic\b/i, /\bsynergy\b/i,
  /\btransformative\b/i, /\bactionable\b/i,
  /\bin today(?:'s| ?s) (?:world|age|era|society|landscape)\b/i,
  /\bin (?:the )?(?:modern|contemporary|digital|current) (?:world|age|era|landscape)\b/i,
  /\bit(?:'s| is) (?:important|worth|essential|crucial|vital|imperative) to (?:note|mention|understand|recognize|acknowledge)\b/i,
  /\bplays? a (?:vital|crucial|key|significant|important|pivotal|critical) role\b/i,
  /\ba wide (?:range|array|variety) of\b/i,
  /\bvast array of\b/i,
  /\brange of benefits\b/i, /\bnumerous benefits\b/i,
  /\bit is worth (?:noting|mentioning)\b/i,
  /\bone of the most\b/i,
  /\bmoreover\b/i, /\bfurthermore\b/i, /\bnevertheless\b/i,
  /\bnonetheless\b/i, /\bconversely\b/i, /\bsubsequently\b/i,
  /\bin conclusion\b/i, /\bin summary\b/i, /\bto summarize\b/i,
  /\bin essence\b/i, /\bin light of\b/i, /\bby and large\b/i,
  /\bthat being said\b/i, /\bthis ensures\b/i, /\bthis allows\b/i,
  /\bthis enables\b/i, /\bthis helps\b/i,
  /\bI(?:'d| would) be happy to\b/i, /\bI hope this (?:helps|email|message|finds)\b/i,
  /\bplease (?:don't|do not) hesitate\b/i,
  /\bif you have any (?:questions|concerns|further)\b/i,
  /\bplease let me know if\b/i,
  /\bhope this (?:finds you well|helps|email)\b/i,
  /\bit(?:'s| is) (?:no secret|clear|evident|apparent|obvious) that\b/i,
  /\bwhen it comes to\b/i, /\bin the realm of\b/i,
  /\bpaving the way\b/i, /\blay the groundwork\b/i,
  /\bworking diligently\b/i,
  /\bsmooth (?:rollout|transition|process|execution)\b/i,
  /\bcompleted successfully\b/i,
  /\bmoving into the (?:final|next) stages?\b/i,
  /\bkeep you (?:posted|updated)\b/i,
  /\bexpress my (?:enthusiastic|strong|sincere|keen) interest\b/i,
  /\bmake a (?:meaningful|valuable|significant) contribution\b/i,
  /\bsuccessfully spearheaded\b/i,
  /\bwelcome the opportunity to\b/i,
  /\balign(?:s)? with the (?:goals|mission|values|objectives) of\b/i,
  /\bdata-driven (?:analytics|insights|decisions|approach)\b/i,
  /\bat your earliest convenience\b/i,
  /\blook forward to (?:hearing|discussing|working|speaking)\b/i,
  /\bcross-functional collaboration\b/i,
  /\boptimal alignment\b/i,
  /\boperational efficiency\b/i,
];

export function computeBurstiness(sentences: string[]): {
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

  const withinBand = lengths.filter((l) => Math.abs(l - mean) <= 3).length;
  const uniformityRatio = withinBand / lengths.length;

  return { stdDev, mean, coeffOfVariation, uniformityRatio };
}

export function computeVocabRichness(words: string[]): {
  typeTokenRatio: number;
  hapaxRatio: number;
} {
  const lower = words.map((w) => w.toLowerCase().replace(/[^a-z']/g, '')).filter((w) => w.length > 2);
  const freq: Record<string, number> = {};
  for (const w of lower) {
    freq[w] = (freq[w] || 0) + 1;
  }
  const uniqueCount = Object.keys(freq).length;
  const hapax = Object.values(freq).filter((c) => c === 1).length;

  return {
    typeTokenRatio: lower.length > 0 ? uniqueCount / lower.length : 0,
    hapaxRatio: uniqueCount > 0 ? hapax / uniqueCount : 0,
  };
}

export function computeOpeningDiversity(sentences: string[]): number {
  if (sentences.length < 3) return 0.8;

  const openings = sentences.map((s) => {
    const words = s.trim().split(/\s+/);
    return words.slice(0, 2).join(' ').toLowerCase();
  });

  const uniqueOpenings = new Set(openings).size;
  return uniqueOpenings / openings.length;
}

export function computeParagraphUniformity(text: string): number {
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 20);
  if (paragraphs.length < 2) return 0.5;

  const paraSentenceCounts = paragraphs.map(
    (p) => p.split(/[.!?]+/).filter((s) => s.trim().length > 5).length
  );

  const mean = paraSentenceCounts.reduce((a, b) => a + b, 0) / paraSentenceCounts.length;
  if (mean === 0) return 0.5;

  const variance = paraSentenceCounts.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / paraSentenceCounts.length;
  const cv = Math.sqrt(variance) / mean;

  return Math.max(0, Math.min(1, cv));
}

export function computeConsecutivePattern(sentences: string[]): number {
  if (sentences.length < 4) return 0;

  const lengths = sentences.map((s) => s.split(/\s+/).filter(Boolean).length);
  let predictableTransitions = 0;
  let totalTransitions = 0;

  for (let i = 1; i < lengths.length; i++) {
    totalTransitions++;
    const diff = Math.abs(lengths[i] - lengths[i - 1]);
    if (diff <= 5) {
      predictableTransitions++;
    }
  }

  return totalTransitions > 0 ? predictableTransitions / totalTransitions : 0;
}

export function computePassiveVoiceDensity(sentences: string[]): number {
  const passivePattern = /\b(?:is|are|was|were|be|been|being)\s+(?:\w+ly\s+)?(?:\w+ed|made|done|given|taken|known|shown|seen|found|used|based)\b/i;
  let passiveCount = 0;
  for (const s of sentences) {
    if (passivePattern.test(s)) passiveCount++;
  }
  return sentences.length > 0 ? passiveCount / sentences.length : 0;
}

export function computeClauseDensity(sentences: string[]): number {
  const clauseMarkers = /\b(?:which|that|because|although|while|whereas|since|unless|however|therefore|thus|hence|accordingly|consequently|whereby)\b/gi;
  let totalClauses = 0;
  for (const s of sentences) {
    const matches = s.match(clauseMarkers);
    totalClauses += matches ? matches.length : 0;
  }
  return sentences.length > 0 ? totalClauses / sentences.length : 0;
}

export interface AiAnalysisResult {
  aiProbability: number;
  perplexityScore: number;
  burstinessScore: number;
  signalBreakdown: Record<string, number>;
  keywordHits: number;
  matchingSignatures: string[];
  sampleSufficiency: 'insufficient' | 'limited' | 'sufficient';
  uncertaintyMargin: number;
  wordCount: number;
}

export function computeAiScore(text: string): AiAnalysisResult {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const sentences = text.split(/[.!?]+/).map((s) => s.trim()).filter((s) => s.length > 5);

  let keywordHits = 0;
  let highConfidenceHits = 0;
  let lowConfidenceHits = 0;
  const matchingSignatures: string[] = [];
  for (const sig of GPT_SIGNATURES) {
    const match = text.match(sig);
    if (match) {
      keywordHits++;
      const matchedStr = match[0].toLowerCase();
      if (!matchingSignatures.includes(matchedStr)) {
        matchingSignatures.push(matchedStr);
      }
      if (HIGH_CONFIDENCE_SIGNATURES.some((hc) => hc.source === sig.source)) {
        highConfidenceHits++;
      } else {
        lowConfidenceHits++;
      }
    }
  }

  const effectiveHits = highConfidenceHits + lowConfidenceHits * 0.35;
  const densityPer100 = (keywordHits / Math.max(1, wordCount)) * 100;
  const keywordDensity = Math.min(1, keywordHits / Math.max(1, Math.ceil(wordCount / 50)));

  const burst = computeBurstiness(sentences);
  const vocab = computeVocabRichness(words);
  const openingDiv = computeOpeningDiversity(sentences);
  const paraUniformity = computeParagraphUniformity(text);
  const consecutivePattern = computeConsecutivePattern(sentences);
  const passiveDensity = computePassiveVoiceDensity(sentences);
  const clauseDensity = computeClauseDensity(sentences);

  let sigKeyword: number;
  if (highConfidenceHits >= 5 || (densityPer100 >= 3.5 && effectiveHits >= 3.0)) sigKeyword = 0.98;
  else if (highConfidenceHits >= 3 || (densityPer100 >= 2.0 && effectiveHits >= 2.2)) sigKeyword = 0.92;
  else if (highConfidenceHits >= 2 || (densityPer100 >= 1.4 && effectiveHits >= 1.6)) sigKeyword = 0.82;
  else if (highConfidenceHits >= 1 || effectiveHits >= 0.9) sigKeyword = 0.40;
  else if (effectiveHits > 0) sigKeyword = 0.18;
  else sigKeyword = 0.05;

  let sigBurst: number;
  if (burst.coeffOfVariation < 0.20) sigBurst = 0.90;
  else if (burst.coeffOfVariation < 0.30) sigBurst = 0.75;
  else if (burst.coeffOfVariation < 0.42) sigBurst = 0.50;
  else if (burst.coeffOfVariation < 0.55) sigBurst = 0.25;
  else sigBurst = 0.10;

  if (burst.uniformityRatio > 0.70) sigBurst = Math.min(1, sigBurst + 0.15);

  let sigVocab: number;
  if (vocab.typeTokenRatio > 0.72) sigVocab = 0.10;
  else if (vocab.typeTokenRatio > 0.60) sigVocab = 0.25;
  else if (vocab.typeTokenRatio > 0.50) sigVocab = 0.45;
  else if (vocab.typeTokenRatio > 0.40) sigVocab = 0.65;
  else sigVocab = 0.82;

  let sigOpening: number;
  if (openingDiv > 0.85) sigOpening = 0.10;
  else if (openingDiv > 0.70) sigOpening = 0.25;
  else if (openingDiv > 0.50) sigOpening = 0.50;
  else sigOpening = 0.80;

  let sigParagraph: number;
  if (paraUniformity < 0.15) sigParagraph = 0.80;
  else if (paraUniformity < 0.30) sigParagraph = 0.55;
  else if (paraUniformity < 0.50) sigParagraph = 0.35;
  else sigParagraph = 0.15;

  let sigConsecutive: number;
  if (consecutivePattern > 0.80) sigConsecutive = 0.85;
  else if (consecutivePattern > 0.60) sigConsecutive = 0.60;
  else if (consecutivePattern > 0.40) sigConsecutive = 0.35;
  else sigConsecutive = 0.12;

  let sigPassive: number;
  if (passiveDensity > 0.45) sigPassive = 0.75;
  else if (passiveDensity > 0.25) sigPassive = 0.55;
  else if (passiveDensity > 0.10) sigPassive = 0.35;
  else sigPassive = 0.20;

  let sigClause: number;
  if (clauseDensity > 1.5) sigClause = 0.20;
  else if (clauseDensity > 0.8) sigClause = 0.40;
  else if (clauseDensity > 0.3) sigClause = 0.60;
  else sigClause = 0.35;

  const weights = {
    keyword:     0.42,
    burstiness:  0.15,
    vocabulary:  0.12,
    opening:     0.07,
    paragraph:   0.06,
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

  let calibratedAi = rawAi;
  if (sigKeyword >= 0.82 && (highConfidenceHits >= 2 || (densityPer100 >= 1.8 && wordCount >= 30))) {
    calibratedAi = Math.max(calibratedAi, sigKeyword * 0.95);
  } else if (sigKeyword >= 0.65 && (highConfidenceHits >= 1 || densityPer100 >= 1.2)) {
    calibratedAi = Math.max(calibratedAi, 0.65);
  } else if (keywordHits === 0) {
    // If no AI keywords and high burstiness / conversational indicators, sharply lower score
    if (text.includes("I ") || text.includes("I'd") || text.includes("I'm") || text.includes("my ")) {
      calibratedAi = Math.min(calibratedAi, 0.16);
    } else if (vocab.typeTokenRatio > 0.60) {
      calibratedAi = Math.min(calibratedAi, 0.16);
    } else {
      calibratedAi = Math.min(calibratedAi, 0.20);
    }
  }

  // If text exhibits strong human burstiness & diversity with zero high-confidence AI clichés,
  // do not let secondary vocabulary penalize it
  if (burst.coeffOfVariation >= 0.42 && highConfidenceHits === 0 && densityPer100 < 2.0) {
    calibratedAi = Math.min(calibratedAi, 0.28);
  }

  // Technical normative specification discount: RFC normative words & protocol symbols
  const hasRfcNormative = /\b(?:MUST|MUST NOT|SHOULD|SHOULD NOT|SHALL|SHALL NOT)\b/.test(text);
  const technicalTerms = text.match(/\b(?:TCP|UDP|IP|HTTP|HTTPS|DNS|RFC|SQL|API|SDK|p99|latency|socket|buffer|deadlock|half-duplex|mutex)\b/gi) || [];
  if (hasRfcNormative || technicalTerms.length >= 2) {
    calibratedAi = Math.max(0.04, calibratedAi - 0.22);
  }

  let sampleSufficiency: 'insufficient' | 'limited' | 'sufficient' = 'sufficient';
  let uncertaintyMargin = 0.08;

  if (wordCount < 25) {
    sampleSufficiency = 'insufficient';
    uncertaintyMargin = 0.28;
    calibratedAi = calibratedAi * 0.8 + 0.1;
  } else if (wordCount < 50) {
    sampleSufficiency = 'limited';
    uncertaintyMargin = 0.16;
  }

  const aiProbability = Math.max(0.02, Math.min(0.98, Math.round(calibratedAi * 100) / 100));

  const perplexityScore = Math.round(
    Math.max(5, Math.min(98, 
      (vocab.typeTokenRatio * 40) + 
      (burst.coeffOfVariation * 50) + 
      (openingDiv * 20) - 
      (keywordDensity * 25) + 
      10
    ))
  );

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
    keywordHits,
    matchingSignatures,
    sampleSufficiency,
    uncertaintyMargin,
    wordCount,
  };
}
