/**
 * ============================================================================
 * HUMANIZETEXT DETECTOR V2.4: DETERMINISTIC FEATURE EXTRACTOR
 * Zero-dependency, deterministic stylometric feature extractor computing 21
 * linguistic and syntactic indicators across sentence structure, lexical diversity,
 * cliché markers, punctuation cadence, and discourse structure.
 * ============================================================================
 */

import type {
  V24FeatureVector,
} from './types';
import {
  V24_FEATURE_NAMES,
} from './types';

// Standard English stop/function words
const FUNCTION_WORDS: ReadonlySet<string> = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and',
  'any', 'are', 'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below',
  'between', 'both', 'but', 'by', 'can', 'could', 'did', 'do', 'does', 'doing',
  'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had', 'has', 'have',
  'having', 'he', 'her', 'here', 'hers', 'herself', 'him', 'himself', 'his', 'how',
  'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself', 'just', 'me', 'more',
  'most', 'my', 'myself', 'no', 'nor', 'not', 'now', 'of', 'off', 'on', 'once',
  'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own',
  'same', 'she', 'should', 'so', 'some', 'such', 'than', 'that', 'the', 'their',
  'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they', 'this', 'those',
  'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'we', 'were',
  'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'why', 'with', 'would',
  'you', 'your', 'yours', 'yourself', 'yourselves',
]);

const SUBORDINATING_CONJUNCTIONS: ReadonlySet<string> = new Set([
  'although', 'because', 'since', 'unless', 'while', 'whereas', 'wherever',
  'whenever', 'inasmuch', 'provided', 'supposing', 'even', 'though', 'whether',
]);

const COMMON_TRANSITIONS: RegExp[] = [
  /\bmoreover\b/i,
  /\bfurthermore\b/i,
  /\bnevertheless\b/i,
  /\bnonetheless\b/i,
  /\bin conclusion\b/i,
  /\bto summarize\b/i,
  /\badditionally\b/i,
  /\bconsequently\b/i,
  /\bsubsequently\b/i,
  /\bin addition\b/i,
  /\bimportantly\b/i,
];

const COMMON_CLICHES: RegExp[] = [
  /\bdelve(?:s|d|ing)?\b/i,
  /\btapestry\b/i,
  /\btestament\b/i,
  /\bmultifaceted\b/i,
  /\bseamlessly\b/i,
  /\bharnessing\b/i,
  /\bpivotal\b/i,
  /\brobust\b/i,
  /\bunderscores?\b/i,
  /\bfostering\b/i,
  /\btransformative\b/i,
  /\bin today(?:'s| ?s) (?:world|age|era|society|landscape)\b/i,
  /\bplays? a (?:vital|crucial|key|pivotal) role\b/i,
  /\bit is (?:important|crucial|worth noting|vital) (?:that|to)\b/i,
  /\ba wide (?:range|array|variety) of\b/i,
  /\boperational efficiency\b/i,
  /\bessential for ensuring\b/i,
];

const CONTRACTION_REGEX = /\b[a-z]+'(?:t|s|re|ve|m|ll|d)\b/gi;

const PASSIVE_VOICE_REGEX = /\b(?:is|are|was|were|be|been|being)\s+([a-z]+(?:ed|en|t))\b/gi;

/**
 * Clean sentence splitting.
 */
export function extractSentences(text: string): string[] {
  if (!text || typeof text !== 'string') return [];
  const trimmed = text.trim();
  if (!trimmed) return [];

  // Protect common abbreviations
  const protectedText = trimmed
    .replace(/\b(Mr|Mrs|Ms|Dr|Prof|Sr|Jr|vs|etc|i\.e|e\.g)\./gi, '$1_DOT_')
    .replace(/(\d+)\.(\d+)/g, '$1_NUMDOT_$2');

  const rawMatches = protectedText.match(/[^.!?]+[.!?]+|\s*[^.!?]+$/g);
  if (!rawMatches) return [trimmed];

  return rawMatches
    .map((s) => s.replace(/_DOT_/g, '.').replace(/_NUMDOT_/g, '.').trim())
    .filter((s) => s.length > 0);
}

/**
 * Tokenize text into words.
 */
export function tokenizeWords(text: string): string[] {
  if (!text) return [];
  const matches = text.match(/[a-zA-Z0-9']+/g);
  return matches ? matches.map((m) => m.toLowerCase()) : [];
}

/**
 * Extracts 21 deterministic stylometric features from a text passage.
 */
export function extractV24Features(text: string): V24FeatureVector {
  const trimmed = text ? text.trim() : '';
  const sentences = extractSentences(trimmed);
  const words = tokenizeWords(trimmed);
  const totalWords = words.length;

  if (totalWords === 0) {
    const zeroVec = {} as V24FeatureVector;
    for (const name of V24_FEATURE_NAMES) {
      zeroVec[name] = 0;
    }
    return zeroVec;
  }

  // 1-3. Sentence Length Statistics
  const sentenceWordCounts = sentences.map((s) => tokenizeWords(s).length).filter((c) => c > 0);
  const sentenceCount = sentenceWordCounts.length > 0 ? sentenceWordCounts.length : 1;
  const sentenceLengthMean = totalWords / sentenceCount;

  let sentenceVarianceSum = 0;
  for (const c of sentenceWordCounts) {
    sentenceVarianceSum += Math.pow(c - sentenceLengthMean, 2);
  }
  const sentenceLengthVariance = sentenceWordCounts.length > 1 ? sentenceVarianceSum / sentenceWordCounts.length : 0;
  const sentenceLengthCv = sentenceLengthMean > 0 ? Math.sqrt(sentenceLengthVariance) / sentenceLengthMean : 0;

  // 4-5. Paragraph Length Statistics
  const paragraphs = trimmed.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
  const paragraphWordCounts = paragraphs.map((p) => tokenizeWords(p).length).filter((c) => c > 0);
  const paragraphCount = paragraphWordCounts.length > 0 ? paragraphWordCounts.length : 1;
  const paragraphLengthMean = totalWords / paragraphCount;

  let paragraphVarianceSum = 0;
  for (const c of paragraphWordCounts) {
    paragraphVarianceSum += Math.pow(c - paragraphLengthMean, 2);
  }
  const paragraphLengthVariance = paragraphWordCounts.length > 1 ? paragraphVarianceSum / paragraphWordCounts.length : 0;

  // 6-9. Lexical Diversity & Entropy
  const wordFreq = new Map<string, number>();
  for (const w of words) {
    wordFreq.set(w, (wordFreq.get(w) || 0) + 1);
  }

  const uniqueWords = wordFreq.size;
  const typeTokenRatio = uniqueWords / totalWords;

  let hapaxCount = 0;
  let simpsonsNumerator = 0;
  let lexicalEntropy = 0;

  for (const count of wordFreq.values()) {
    if (count === 1) hapaxCount++;
    simpsonsNumerator += count * (count - 1);
    const p = count / totalWords;
    lexicalEntropy -= p * Math.log2(p);
  }

  const hapaxLegomenaRatio = hapaxCount / totalWords;
  const simpsonsDenominator = totalWords > 1 ? totalWords * (totalWords - 1) : 1;
  const simpsonsIndex = totalWords > 1 ? simpsonsNumerator / simpsonsDenominator : 0;

  // 10. N-gram Repetition (word 3-grams)
  let repeatedNgrams = 0;
  const totalNgrams = Math.max(0, totalWords - 2);
  if (totalNgrams > 0) {
    const ngramCounts = new Map<string, number>();
    for (let i = 0; i < totalWords - 2; i++) {
      const gram = `${words[i]}_${words[i + 1]}_${words[i + 2]}`;
      ngramCounts.set(gram, (ngramCounts.get(gram) || 0) + 1);
    }
    for (const cnt of ngramCounts.values()) {
      if (cnt > 1) repeatedNgrams += (cnt - 1);
    }
  }
  const ngramRepetitionRatio = totalNgrams > 0 ? repeatedNgrams / totalNgrams : 0;

  // 11. Sentence Opening Phrase Diversity (first 2 words of each sentence)
  const openingPhrases = new Set<string>();
  for (const s of sentences) {
    const sWords = tokenizeWords(s);
    if (sWords.length >= 2) {
      openingPhrases.add(`${sWords[0]}_${sWords[1]}`);
    } else if (sWords.length === 1 && sWords[0]) {
      openingPhrases.add(sWords[0]);
    }
  }
  const openingPhraseDiversity = sentenceCount > 0 ? openingPhrases.size / sentenceCount : 0;

  // 12. Transition Phrase Density
  let transitionCount = 0;
  for (const regex of COMMON_TRANSITIONS) {
    const matches = trimmed.match(regex);
    if (matches) transitionCount += matches.length;
  }
  const transitionPhraseDensity = (transitionCount * 100) / totalWords;

  // 13. Cliché Density
  let clicheCount = 0;
  for (const regex of COMMON_CLICHES) {
    const matches = trimmed.match(regex);
    if (matches) clicheCount += matches.length;
  }
  const clicheDensity = (clicheCount * 100) / totalWords;

  // 14-16. Punctuation Cadence & Entropy
  const commas = (trimmed.match(/,/g) || []).length;
  const semicolons = (trimmed.match(/;/g) || []).length;
  const colons = (trimmed.match(/:/g) || []).length;
  const periods = (trimmed.match(/\./g) || []).length;
  const exclamations = (trimmed.match(/!/g) || []).length;
  const questions = (trimmed.match(/\?/g) || []).length;
  const dashes = (trimmed.match(/[—–-]/g) || []).length;

  const commaDensity = (commas * 100) / totalWords;
  const semicolonColonDensity = ((semicolons + colons) * 100) / totalWords;

  const punctMarks = [commas, semicolons, colons, periods, exclamations, questions, dashes];
  const totalPunct = punctMarks.reduce((a, b) => a + b, 0);
  let punctuationEntropy = 0;
  if (totalPunct > 0) {
    for (const pCount of punctMarks) {
      if (pCount > 0) {
        const p = pCount / totalPunct;
        punctuationEntropy -= p * Math.log2(p);
      }
    }
  }

  // 17. Passive Voice Density
  const passiveMatches = trimmed.match(PASSIVE_VOICE_REGEX) || [];
  const passiveVoiceDensity = (passiveMatches.length * 100) / totalWords;

  // 18. Clause Complexity
  let subConjunctions = 0;
  for (const w of words) {
    if (SUBORDINATING_CONJUNCTIONS.has(w)) subConjunctions++;
  }
  const clauseComplexity = sentenceCount > 0 ? subConjunctions / sentenceCount : 0;

  // 19. Function Word Ratio
  let functionWordCount = 0;
  for (const w of words) {
    if (FUNCTION_WORDS.has(w)) functionWordCount++;
  }
  const functionWordRatio = functionWordCount / totalWords;

  // 20. Contraction Density
  const contractionMatches = trimmed.match(CONTRACTION_REGEX) || [];
  const contractionDensity = (contractionMatches.length * 100) / totalWords;

  // 21. Entity Density (Capitalized tokens not at sentence beginnings)
  const rawTokens = trimmed.match(/[a-zA-Z0-9']+/g) || [];
  let capitalizedNonInitial = 0;
  for (let i = 1; i < rawTokens.length; i++) {
    const tok = rawTokens[i];
    if (tok && /^[A-Z][a-z0-9]/.test(tok) && !tok.endsWith('.')) {
      capitalizedNonInitial++;
    }
  }
  const entityDensity = (capitalizedNonInitial * 100) / totalWords;

  return {
    sentenceLengthMean,
    sentenceLengthVariance,
    sentenceLengthCv,
    paragraphLengthMean,
    paragraphLengthVariance,
    typeTokenRatio,
    hapaxLegomenaRatio,
    simpsonsIndex,
    lexicalEntropy,
    ngramRepetitionRatio,
    openingPhraseDiversity,
    transitionPhraseDensity,
    clicheDensity,
    commaDensity,
    semicolonColonDensity,
    punctuationEntropy,
    passiveVoiceDensity,
    clauseComplexity,
    functionWordRatio,
    contractionDensity,
    entityDensity,
  };
}
