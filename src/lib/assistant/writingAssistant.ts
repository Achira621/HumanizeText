// ============================================================================
// ON-DEVICE WRITING ASSISTANT & GRAMMAR / STYLE ENGINE (QuillBot / LanguageTool inspired)
// 100% Client-Side • Zero Data Transmission • Private By Design
// ============================================================================

import type { WritingAnalysis, WritingSuggestion } from '../../types';

// Common redundancies and wordiness patterns
const WORDINESS_PATTERNS: { regex: RegExp; replacement: string; alternatives?: string[]; explanation: string }[] = [
  {
    regex: /\bin order to\b/gi,
    replacement: 'to',
    explanation: '"In order to" is unnecessarily wordy. Replace with "to" for cleaner prose.',
  },
  {
    regex: /\bdue to the fact that\b/gi,
    replacement: 'because',
    alternatives: ['since', 'as'],
    explanation: 'Replace wordy clause "due to the fact that" with direct causal connective "because".',
  },
  {
    regex: /\bat this point in time\b/gi,
    replacement: 'now',
    alternatives: ['currently', 'presently'],
    explanation: '"At this point in time" can be expressed more concisely as "now" or "currently".',
  },
  {
    regex: /\bin the event that\b/gi,
    replacement: 'if',
    alternatives: ['should'],
    explanation: 'Simplify "in the event that" to "if".',
  },
  {
    regex: /\bfor the purpose of\b/gi,
    replacement: 'to',
    alternatives: ['for'],
    explanation: '"For the purpose of" adds unnecessary syllables. Use "to" instead.',
  },
  {
    regex: /\bis able to\b/gi,
    replacement: 'can',
    explanation: 'Streamline "is able to" to the active modal verb "can".',
  },
  {
    regex: /\ba large number of\b/gi,
    replacement: 'many',
    alternatives: ['numerous', 'several'],
    explanation: 'Replace "a large number of" with "many" or "numerous".',
  },
  {
    regex: /\ba wide variety of\b/gi,
    replacement: 'various',
    alternatives: ['diverse', 'many'],
    explanation: 'Replace "a wide variety of" with "various" or "diverse".',
  },
  {
    regex: /\btake into consideration\b/gi,
    replacement: 'consider',
    explanation: 'Nominalization: use the active verb "consider" instead of "take into consideration".',
  },
  {
    regex: /\breach a conclusion\b/gi,
    replacement: 'conclude',
    explanation: 'Use the concise verb "conclude".',
  },
  {
    regex: /\bmake an assumption\b/gi,
    replacement: 'assume',
    explanation: 'Use the direct verb "assume".',
  },
  {
    regex: /\bconduct an investigation into\b/gi,
    replacement: 'investigate',
    explanation: 'Replace bureaucratic phrasing with "investigate".',
  },
  {
    regex: /\bon a daily basis\b/gi,
    replacement: 'daily',
    explanation: 'Replace "on a daily basis" with the adverb "daily".',
  },
  {
    regex: /\bin close proximity to\b/gi,
    replacement: 'near',
    alternatives: ['close to'],
    explanation: 'Simplify "in close proximity to" to "near".',
  },
  {
    regex: /\bwith the exception of\b/gi,
    replacement: 'except',
    alternatives: ['besides', 'excluding'],
    explanation: 'Simplify "with the exception of" to "except".',
  },
  {
    regex: /\bas a matter of fact\b/gi,
    replacement: 'in fact',
    alternatives: ['actually'],
    explanation: '"As a matter of fact" is conversational filler. Use "in fact" or omit.',
  },
  {
    regex: /\beach and every\b/gi,
    replacement: 'every',
    alternatives: ['each'],
    explanation: '"Each and every" is tautological. Choose either "each" or "every".',
  },
  {
    regex: /\bfirst and foremost\b/gi,
    replacement: 'first',
    alternatives: ['primarily'],
    explanation: 'Cliché redundancy: choose "first" or "primarily".',
  },
  {
    regex: /\bend result\b/gi,
    replacement: 'result',
    explanation: 'A result is inherently at the end. Use "result".',
  },
  {
    regex: /\bfuture plans\b/gi,
    replacement: 'plans',
    explanation: 'Plans by definition refer to the future. Use "plans".',
  },
  {
    regex: /\bbasic fundamentals\b/gi,
    replacement: 'fundamentals',
    explanation: 'Fundamentals are inherently basic. Use "fundamentals".',
  },
  {
    regex: /\bpast experience\b/gi,
    replacement: 'experience',
    explanation: 'Experience is always acquired in the past. Use "experience".',
  },
  {
    regex: /\btrue facts\b/gi,
    replacement: 'facts',
    explanation: 'Facts are true by definition. Use "facts".',
  },
];

// Grammar and spelling confusions
const GRAMMAR_CONFUSIONS: { regex: RegExp; replacement: string; alternatives?: string[]; explanation: string }[] = [
  {
    regex: /\btheir\s+(?:going|having|doing|making|taking|being)\b/gi,
    replacement: "they're $1",
    explanation: 'Use the contraction "they\'re" (they are) before present participles.',
  },
  {
    regex: /\bthere\s+(?:car|dog|house|book|idea|work|opinion|effort|laptop)\b/gi,
    replacement: 'their $1',
    explanation: 'Use possessive pronoun "their" instead of directional "there".',
  },
  {
    regex: /\bit(?:'s|’s)\s+(?:color|shape|weight|speed|value|purpose|design|origin|size|name)\b/gi,
    replacement: 'its $1',
    explanation: 'Use the possessive pronoun "its" (no apostrophe) before a noun.',
  },
  {
    regex: /\byour\s+(?:welcome|right|wrong|mistaken|correct)\b/gi,
    replacement: "you're $1",
    explanation: 'Use the contraction "you\'re" (you are) instead of possessive "your".',
  },
  {
    regex: /\bcould\s+of\b/gi,
    replacement: 'could have',
    explanation: 'Standard English is "could have", not "could of".',
  },
  {
    regex: /\bwould\s+of\b/gi,
    replacement: 'would have',
    explanation: 'Standard English is "would have", not "would of".',
  },
  {
    regex: /\bshould\s+of\b/gi,
    replacement: 'should have',
    explanation: 'Standard English is "should have", not "should of".',
  },
  {
    regex: /\bmore\s+better\b/gi,
    replacement: 'better',
    explanation: '"Better" is already comparative. Do not combine with "more".',
  },
  {
    regex: /\birregardless\b/gi,
    replacement: 'regardless',
    explanation: '"Irregardless" is nonstandard. Use "regardless".',
  },
  {
    regex: /\bvery\s+unique\b/gi,
    replacement: 'unique',
    explanation: '"Unique" is an absolute adjective that cannot be modified by degree.',
  },
  {
    regex: /\breally\s+important\b/gi,
    replacement: 'crucial',
    alternatives: ['vital', 'essential'],
    explanation: 'Replace weak modifier "really important" with vivid adjective like "crucial".',
  },
  {
    regex: /\bvery\s+difficult\b/gi,
    replacement: 'challenging',
    alternatives: ['arduous', 'demanding'],
    explanation: 'Replace "very difficult" with "challenging" or "arduous".',
  },
];

// AI clichés
const AI_CLICHE_PATTERNS: { regex: RegExp; replacement: string; alternatives?: string[]; explanation: string }[] = [
  {
    regex: /\bdelve\s+into\b/gi,
    replacement: 'explore',
    alternatives: ['examine', 'analyze', 'investigate'],
    explanation: '"Delve into" is a frequent LLM marker. Consider "explore" or "examine".',
  },
  {
    regex: /\ba\s+testament\s+to\b/gi,
    replacement: 'evidence of',
    alternatives: ['shows', 'demonstrates'],
    explanation: '"Testament to" is heavily overused by AI models. Replace with "evidence of".',
  },
  {
    regex: /\bintricate\s+tapestry\b/gi,
    replacement: 'complex system',
    alternatives: ['rich blend', 'network'],
    explanation: '"Intricate tapestry" is a classic hallucination cliché. Use more specific language.',
  },
  {
    regex: /\bmultifaceted\b/gi,
    replacement: 'complex',
    alternatives: ['diverse', 'broad'],
    explanation: '"Multifaceted" is overused by LLMs. Consider "complex" or "diverse".',
  },
  {
    regex: /\bseamlessly\b/gi,
    replacement: 'smoothly',
    alternatives: ['effortlessly', 'naturally'],
    explanation: '"Seamlessly" is ubiquitous in synthetic marketing prose. Consider "smoothly".',
  },
  {
    regex: /\bin\s+conclusion\b/gi,
    replacement: 'finally',
    alternatives: ['ultimately', 'to conclude'],
    explanation: 'Formulaic transition common in introductory AI essays. Use "finally" or integrate smoothly.',
  },
  {
    regex: /\bever-evolving\s+landscape\b/gi,
    replacement: 'changing industry',
    alternatives: ['dynamic field', 'evolving market'],
    explanation: '"Ever-evolving landscape" is a top synthetic buzzphrase.',
  },
];

// Passive voice patterns
const PASSIVE_VOICE_REGEX = /\b(is|are|was|were|been|being)\s+([a-z]+ed|made|conducted|written|analyzed|seen|chosen|given|found)\s+by\b/gi;

// Simple syllable counter for Flesch-Kincaid
function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!w || w.length <= 3) return 1;
  const cleaned = w.replace(/(?:[^laeiouy]|ed|es|e)$/, '').replace(/^y/, '');
  const matches = cleaned.match(/[aeiouy]{1,2}/g);
  return matches ? Math.max(1, matches.length) : 1;
}

export function analyzeWriting(text: string): WritingAnalysis {
  if (!text || text.trim().length === 0) {
    return {
      suggestions: [],
      readability: {
        fleschKincaidScore: 100,
        gradeLevel: 'Grade 5 (Easy)',
        readingTimeMinutes: 0,
        wordCount: 0,
        sentenceCount: 0,
        avgSentenceLength: 0,
        tone: 'Neutral',
      },
      aiProbability: 0,
      burstinessScore: 80,
      passiveSentenceCount: 0,
    };
  }

  const suggestions: WritingSuggestion[] = [];
  const words = text.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  const rawSentences = text.match(/[^.!?\r\n]+(?:[.!?]+|\r?\n+|$)/g) || [text];
  const validSentences = rawSentences.map((s) => s.trim()).filter((s) => s.length > 3);
  const sentenceCount = Math.max(1, validSentences.length);

  // 1. Check Redundancy / Wordiness
  for (const item of WORDINESS_PATTERNS) {
    let match: RegExpExecArray | null;
    const re = new RegExp(item.regex.source, 'gi');
    while ((match = re.exec(text)) !== null) {
      suggestions.push({
        id: `sug_word_${match.index}_${Date.now()}`,
        original: match[0],
        replacement: item.replacement,
        alternatives: item.alternatives,
        explanation: item.explanation,
        category: 'wordiness',
        severity: 'suggestion',
        startChar: match.index,
        endChar: match.index + match[0].length,
      });
    }
  }

  // 2. Check Grammar Confusions
  for (const item of GRAMMAR_CONFUSIONS) {
    let match: RegExpExecArray | null;
    const re = new RegExp(item.regex.source, 'gi');
    while ((match = re.exec(text)) !== null) {
      let rep = item.replacement;
      if (rep.includes('$1') && match[1]) {
        rep = rep.replace('$1', match[1]);
      }
      suggestions.push({
        id: `sug_gram_${match.index}_${Date.now()}`,
        original: match[0],
        replacement: rep,
        alternatives: item.alternatives,
        explanation: item.explanation,
        category: 'grammar',
        severity: 'warning',
        startChar: match.index,
        endChar: match.index + match[0].length,
      });
    }
  }

  // 3. Check AI Clichés
  for (const item of AI_CLICHE_PATTERNS) {
    let match: RegExpExecArray | null;
    const re = new RegExp(item.regex.source, 'gi');
    while ((match = re.exec(text)) !== null) {
      suggestions.push({
        id: `sug_ai_${match.index}_${Date.now()}`,
        original: match[0],
        replacement: item.replacement,
        alternatives: item.alternatives,
        explanation: item.explanation,
        category: 'ai_cliche',
        severity: 'suggestion',
        startChar: match.index,
        endChar: match.index + match[0].length,
      });
    }
  }

  // 4. Passive Voice Detection
  let passiveCount = 0;
  let passiveMatch: RegExpExecArray | null;
  const passRe = new RegExp(PASSIVE_VOICE_REGEX.source, 'gi');
  while ((passiveMatch = passRe.exec(text)) !== null) {
    passiveCount++;
    const orig = passiveMatch[0];
    suggestions.push({
      id: `sug_pass_${passiveMatch.index}_${Date.now()}`,
      original: orig,
      replacement: orig.replace(/\bby\b/gi, ''),
      explanation: `Passive construction detected ("${orig}"). Consider inverting to active voice for direct impact.`,
      category: 'passive_voice',
      severity: 'suggestion',
      startChar: passiveMatch.index,
      endChar: passiveMatch.index + orig.length,
    });
  }

  // 5. Run-On / Long Sentence Detection (QuillBot getSplitSentenceSuggestion)
  for (const s of validSentences) {
    const sWords = s.split(/\s+/).filter(Boolean);
    if (sWords.length > 34) {
      const charIndex = text.indexOf(s);
      // Find midpoint conjunction (and, but, however, which, because)
      const splitMatch = s.match(/(,\s+(?:and|but|while|whereas|although|because|since))\s+/i);
      let suggestedSplit = s;
      if (splitMatch && splitMatch.index) {
        const p1 = s.substring(0, splitMatch.index).trim() + '.';
        const conjWord = splitMatch[1].replace(/,\s+/, '');
        const p2 = s.substring(splitMatch.index + splitMatch[0].length).trim();
        suggestedSplit = `${p1} ${conjWord.charAt(0).toUpperCase() + conjWord.slice(1)} ${p2}`;
      }

      suggestions.push({
        id: `sug_split_${charIndex}_${Date.now()}`,
        original: s,
        replacement: suggestedSplit !== s ? suggestedSplit : s,
        explanation: `Long complex sentence (${sWords.length} words). Splitting into two concise sentences improves burstiness and clarity.`,
        category: 'split_sentence',
        severity: 'warning',
        startChar: Math.max(0, charIndex),
        endChar: Math.max(0, charIndex + s.length),
        sentence: s,
      });
    }
  }

  // 6. Repetitive Word Detection (QuillBot repetitiveWordSuggestion)
  const wordFrequency = new Map<string, number>();
  const commonStopWords = new Set([
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with', 'he', 'as',
    'you', 'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or', 'an', 'will',
    'my', 'one', 'all', 'would', 'there', 'their', 'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which',
    'go', 'me', 'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take', 'people', 'into', 'year',
    'your', 'good', 'some', 'could', 'them', 'see', 'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its',
  ]);

  for (const w of words) {
    const cleanW = w.toLowerCase().replace(/[^a-z]/g, '');
    if (cleanW.length > 4 && !commonStopWords.has(cleanW)) {
      wordFrequency.set(cleanW, (wordFrequency.get(cleanW) || 0) + 1);
    }
  }

  const repetitiveEntries = [...wordFrequency.entries()].filter(([_, count]) => count >= 4 && wordCount < 300);
  for (const [repWord, count] of repetitiveEntries.slice(0, 3)) {
    const firstIdx = text.toLowerCase().indexOf(repWord);
    suggestions.push({
      id: `sug_rep_${repWord}_${Date.now()}`,
      original: repWord,
      replacement: repWord,
      explanation: `"${repWord}" is repeated ${count} times in this document. Consider diversifying your vocabulary using synonyms.`,
      category: 'repetitive_words',
      severity: 'suggestion',
      startChar: Math.max(0, firstIdx),
      endChar: Math.max(0, firstIdx + repWord.length),
    });
  }

  // 7. Readability & Metrics
  let totalSyllables = 0;
  for (const w of words) {
    totalSyllables += countSyllables(w);
  }

  const wordsPerSentence = wordCount / sentenceCount;
  const syllablesPerWord = totalSyllables / Math.max(1, wordCount);

  // Flesch Reading Ease
  const fleschScore = Math.max(
    0,
    Math.min(100, Math.round(206.835 - 1.015 * wordsPerSentence - 84.6 * syllablesPerWord))
  );

  let gradeLevel = 'Grade 8 (Standard)';
  if (fleschScore >= 90) gradeLevel = 'Grade 5 (Very Easy)';
  else if (fleschScore >= 80) gradeLevel = 'Grade 6 (Easy)';
  else if (fleschScore >= 70) gradeLevel = 'Grade 7 (Fairly Easy)';
  else if (fleschScore >= 60) gradeLevel = 'Grade 8-9 (Plain English)';
  else if (fleschScore >= 50) gradeLevel = 'Grade 10-12 (High School)';
  else if (fleschScore >= 30) gradeLevel = 'College Level';
  else gradeLevel = 'Post-Graduate / Technical';

  // Tone estimation
  let tone: 'Confident' | 'Academic' | 'Conversational' | 'Formal' | 'Neutral' = 'Neutral';
  if (wordsPerSentence > 22 && syllablesPerWord > 1.7) {
    tone = 'Academic';
  } else if (text.includes("I'm") || text.includes("don't") || text.includes("you're") || text.includes("we've")) {
    tone = 'Conversational';
  } else if (passiveCount > 2 || text.includes('furthermore') || text.includes('therefore')) {
    tone = 'Formal';
  } else if (wordCount > 30) {
    tone = 'Confident';
  }

  // Burstiness
  const sentenceLengths = validSentences.map((s) => s.split(/\s+/).filter(Boolean).length);
  const meanLen = sentenceLengths.reduce((a, b) => a + b, 0) / Math.max(1, sentenceLengths.length);
  const variance = sentenceLengths.reduce((a, b) => a + Math.pow(b - meanLen, 2), 0) / Math.max(1, sentenceLengths.length);
  const stdDev = Math.sqrt(variance);
  const burstinessScore = Math.min(100, Math.round((stdDev / Math.max(1, meanLen)) * 100));

  // AI Probability estimation based on signals
  let aiProb = 0.05;
  const aiClichesFound = suggestions.filter((s) => s.category === 'ai_cliche').length;
  if (aiClichesFound >= 3) aiProb = 0.88;
  else if (aiClichesFound === 2) aiProb = 0.65;
  else if (aiClichesFound === 1) aiProb = 0.40;
  if (burstinessScore < 20 && wordCount > 50) aiProb = Math.max(aiProb, 0.72);

  return {
    suggestions,
    readability: {
      fleschKincaidScore: fleschScore,
      gradeLevel,
      readingTimeMinutes: Math.max(1, Math.round(wordCount / 200)),
      wordCount,
      sentenceCount,
      avgSentenceLength: Math.round(wordsPerSentence),
      tone,
    },
    aiProbability: Math.round(aiProb * 100) / 100,
    burstinessScore,
    passiveSentenceCount: passiveCount,
  };
}

export function applySingleSuggestion(text: string, suggestion: WritingSuggestion): string {
  if (suggestion.category === 'split_sentence' && suggestion.sentence) {
    return text.replace(suggestion.sentence, suggestion.replacement);
  }
  const before = text.substring(0, suggestion.startChar);
  const target = text.substring(suggestion.startChar, suggestion.endChar);
  const after = text.substring(suggestion.endChar);

  // Preserve uppercase casing
  const isTargetCapitalized =
    target.length > 0 && target[0] === target[0].toUpperCase() && target[0] !== target[0].toLowerCase();
  const formattedReplacement =
    isTargetCapitalized && suggestion.replacement.length > 0
      ? suggestion.replacement.charAt(0).toUpperCase() + suggestion.replacement.slice(1)
      : suggestion.replacement;

  // If text at position matches original
  if (target.toLowerCase() === suggestion.original.toLowerCase()) {
    return before + formattedReplacement + after;
  }

  // Fallback string replacement
  return text.replace(new RegExp(`\\b${escapeRegExp(suggestion.original)}\\b`, 'i'), formattedReplacement);
}

export function applyAllApplicableSuggestions(text: string, suggestions: WritingSuggestion[]): string {
  let updated = text;
  // Apply wordiness and grammar fixes in reverse order to keep character offsets valid
  const sorted = [...suggestions]
    .filter((s) => s.category === 'wordiness' || s.category === 'grammar' || s.category === 'ai_cliche')
    .sort((a, b) => b.startChar - a.startChar);

  for (const s of sorted) {
    updated = applySingleSuggestion(updated, s);
  }
  return updated;
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
