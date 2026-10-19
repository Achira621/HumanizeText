import type { HumanizerMode, HumanizerOptions, HumanizerResult } from '../../types';
import { computeDiffTokens } from './ruleEngine';

export type ApiProvider = 'gemini' | 'groq' | 'openrouter';

export interface ApiEngineConfig {
  provider: ApiProvider;
  apiKey: string;
  model?: string;
  customEndpoint?: string;
}

const STORAGE_KEY_CONFIG = 'humanizetext_api_config';

export function getStoredApiConfig(): ApiEngineConfig {
  if (typeof window === 'undefined') {
    return { provider: 'gemini', apiKey: '' };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }
  // Fallback to Vite env if present
  const envKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
  return {
    provider: 'gemini',
    apiKey: envKey,
  };
}

export function saveApiConfig(config: ApiEngineConfig): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
}

/**
 * Builds the humanization prompt for LLM rewriting.
 */
function buildSystemPrompt(mode: HumanizerMode, options?: HumanizerOptions): string {
  let modeGuidance = '';
  switch (mode) {
    case 'concise':
      modeGuidance = 'Focus heavily on cutting wordy prepositions, redundant adjectives, and bureaucratic clutter. Keep it direct and punchy.';
      break;
    case 'conversational':
      modeGuidance = 'Adopt a warm, engaging personal tone with frequent natural contractions, rhetorical rhythm, and direct address.';
      break;
    case 'formal':
      modeGuidance = 'Maintain an academic/scholarly register with precise terminology, but eliminate robotic AI clichés and monotonous sentence length.';
      break;
    case 'flow':
      modeGuidance = 'Optimize sentence variety and rhythmic transitions: alternate between short punchy statements and rich compound sentences.';
      break;
    case 'natural':
    default:
      modeGuidance = 'Make the writing sound like a thoughtful, articulate human being writing naturally. Eliminate all AI formulaic markers.';
      break;
  }

  const frozenSection =
    options?.frozenWords && options.frozenWords.length > 0
      ? `\nCRITICAL - FROZEN WORDS TO PRESERVE VERBATIM:\nDo NOT change, rephrase, translate, or substitute the following words/terms under any circumstances: [${options.frozenWords.join(', ')}]. Leave them exactly as they appear in the source text.`
      : '';

  const intensityGuidance =
    options?.vocabularyIntensity === 'conservative'
      ? '\nMaintain a gentle transformation: preserve original sentences where possible and only replace clear AI formulaic markers.'
      : options?.vocabularyIntensity === 'maximum'
      ? '\nApply comprehensive stylistic humanization: completely reconstruct sentences with rich, natural vocabulary and rhythmic variety.'
      : '';

  return `You are a world-class professional editor and human writing specialist.
Your task is to rewrite the provided text so that it reads 100% like authentic human writing and bypasses all AI detectors with 0% plagiarism.

CRITICAL INSTRUCTIONS:
1. Eradicate all AI clichés and formulaic markers:
   - NO "delve into", "tapestry", "serves as a testament", "beacon of", "plays a pivotal/vital role"
   - NO "in today's fast-paced digital world", "in the realm of", "it is important to note", "first and foremost"
   - NO stiff transitional clutter: "furthermore", "moreover", "consequently", "in conclusion"
2. Maximize burstiness: Dramatically vary sentence length. Pair short 4-8 word punchy sentences with longer 20+ word complex thoughts.
3. Natural phrasing: Use natural English idioms, conversational contractions (it's, don't, can't, we're) unless in strict formal mode.
4. Factual and Citation Preservation: Retain all names, facts, statistics, citations (e.g. [1], (Author, 2024)), and core meaning with 100% accuracy.${frozenSection}${intensityGuidance}
5. Specific style mode: ${modeGuidance}
6. Output format: Return ONLY the rewritten text. Do NOT include introductory phrases, conversational remarks, or markdown code fences.`;
}

/**
 * Call Google Gemini API directly from browser.
 */
async function callGemini(apiKey: string, prompt: string, text: string, model = 'gemini-1.5-flash'): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [
            { text: `${prompt}\n\n--- TEXT TO HUMANIZE ---\n${text}` },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.85,
        topP: 0.95,
        maxOutputTokens: 4096,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gemini API returned status ${response.status}`);
  }

  const data = await response.json();
  const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!candidate) throw new Error('No response returned from Gemini API');
  return candidate.trim();
}

/**
 * Call Groq API directly from browser (ultra-fast Llama 3.3).
 */
async function callGroq(apiKey: string, systemPrompt: string, text: string, model = 'llama-3.3-70b-versatile'): Promise<string> {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text },
      ],
      temperature: 0.85,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Groq API returned status ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('No text returned from Groq API');
  return content.trim();
}

/**
 * Call OpenRouter API directly from browser.
 */
async function callOpenRouter(apiKey: string, systemPrompt: string, text: string, model = 'meta-llama/llama-3.3-70b-instruct'): Promise<string> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://humanizetext.org',
      'X-Title': 'HumanizeText',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text },
      ],
      temperature: 0.85,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `OpenRouter returned status ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('No text returned from OpenRouter');
  return content.trim();
}

export async function humanizeWithApi(
  text: string,
  mode: HumanizerMode,
  config: ApiEngineConfig,
  options?: HumanizerOptions
): Promise<HumanizerResult> {
  if (!config.apiKey || !config.apiKey.trim()) {
    throw new Error(`API key required for ${config.provider.toUpperCase()} mode. Please enter an API key or use the Local Engine.`);
  }

  const systemPrompt = buildSystemPrompt(mode, options);
  let improvedText = '';

  if (config.provider === 'gemini') {
    improvedText = await callGemini(config.apiKey.trim(), systemPrompt, text, config.model || 'gemini-1.5-flash');
  } else if (config.provider === 'groq') {
    improvedText = await callGroq(config.apiKey.trim(), systemPrompt, text, config.model || 'llama-3.3-70b-versatile');
  } else {
    improvedText = await callOpenRouter(config.apiKey.trim(), systemPrompt, text, config.model || 'meta-llama/llama-3.3-70b-instruct');
  }

  // Strip leading/trailing markdown fences if any LLM output them
  improvedText = improvedText.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();

  const originalWords = text.split(/\s+/).filter(Boolean).length;
  const improvedWords = improvedText.split(/\s+/).filter(Boolean).length;

  const changes: any[] = [
    {
      original: 'Source draft structure',
      replacement: 'Deep neural semantic rewrite',
      reason: `Processed with ${config.provider.toUpperCase()} AI rewrite model with human cadence constraints`,
      category: 'phrasing',
      index: 0,
      alternatives: ['Natural human expression', 'Fluent conversational phrasing'],
    },
    {
      original: 'Uniform AI rhythm',
      replacement: 'Organic human sentence burstiness',
      reason: 'Restructured sentence lengths and eliminated machine transition markers',
      category: 'flow',
      index: 1,
      alternatives: ['Balanced rhythmic variation', 'Engaging mixed cadence'],
    },
    {
      original: 'Mechanical vocabulary',
      replacement: 'Natural idiom and voice register',
      reason: `Applied ${mode} human stylistic transformation`,
      category: 'formality',
      index: 2,
      alternatives: ['Contextual human idioms', 'Authentic tone of voice'],
    },
  ];

  const diffTokens = computeDiffTokens(text, improvedText, changes, options?.frozenWords || []);

  return {
    originalText: text,
    improvedText,
    mode,
    changes,
    diffTokens,
    stats: {
      originalWords,
      improvedWords,
      reductionPercentage: originalWords > 0 ? Math.round(((originalWords - improvedWords) / originalWords) * 100) : 0,
      readingTimeSeconds: Math.ceil(improvedWords / 3.5),
    },
    engineName: `AI Cloud API (${config.provider.toUpperCase()})`,
    engineType: 'cloud-api',
    processedLocally: false,
  };
}
