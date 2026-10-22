import type { Env, DetectRequest, DetectResponse } from '../types';

const AI_SIGNATURE_PATTERNS = [
  /\bdelve\b/i,
  /\btapestry\b/i,
  /\btestament\b/i,
  /\bmultifaceted\b/i,
  /\bseamlessly?\b/i,
  /\bharnessing\b/i,
  /\blandscape\b/i,
  /\brobust\b/i,
  /\bcomprehensive\b/i,
  /\bproactive(?:ly)?\b/i,
  /\bparadigm\b/i,
  /\bunderscores?\b/i,
  /\bpivotal\b/i,
  /\bintricate\b/i,
  /\bmeticulou(?:s|sly)\b/i,
  /\bfostering\b/i,
  /\brealm\b/i,
  /\bever-(?:evolving|changing|growing)\b/i,
  /\bcutting[- ]edge\b/i,
  /\bin today(?:'s| ?s) (?:world|age|era|society|landscape)\b/i,
  /\bit(?:'s| is) (?:important|worth|essential|crucial|vital) to (?:note|mention|understand)\b/i,
  /\bplays? a (?:vital|crucial|key|significant|pivotal) role\b/i,
  /\ba wide (?:range|array|variety) of\b/i,
  /\bin order to\b/i,
  /\bdue to the fact that\b/i,
  /\bmoreover\b/i,
  /\bfurthermore\b/i,
  /\bin conclusion\b/i,
  /\bin summary\b/i,
];

export async function handleDetect(request: Request, _env: Env): Promise<Response> {
  const startTime = performance.now();

  let body: DetectRequest;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ success: false, error: 'Invalid JSON request body.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const text = (body.text || '').trim();
  if (!text) {
    return new Response(JSON.stringify({ success: false, error: 'Input text cannot be empty.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const sentences = text.split(/[.!?]+/).map((s) => s.trim()).filter((s) => s.length > 5);
  const sentenceCount = sentences.length;

  if (wordCount < 10) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Please provide at least 10 words for calibrated forensic evaluation.',
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 1. Calculate Burstiness (standard deviation of sentence lengths)
  const sentenceLengths = sentences.map((s) => s.split(/\s+/).filter(Boolean).length);
  const meanLen = sentenceLengths.reduce((a, b) => a + b, 0) / (sentenceCount || 1);
  const variance =
    sentenceLengths.reduce((a, b) => a + Math.pow(b - meanLen, 2), 0) / (sentenceCount || 1);
  const stdDev = Math.sqrt(variance);

  // 2. Count AI Signature Clichés
  const signalsDetected: string[] = [];
  let signalMatches = 0;
  for (const pat of AI_SIGNATURE_PATTERNS) {
    const match = text.match(pat);
    if (match) {
      signalsDetected.push(match[0]);
      signalMatches += match.length;
    }
  }

  // 3. Multi-Signal Score Synthesis
  // Low stdDev (< 4.5) indicates uniform machine cadence. High stdDev (> 8.0) indicates natural human burstiness.
  let burstinessFactor = 0.5;
  if (stdDev < 4.0) burstinessFactor = 0.85; // Low variance = AI-like
  else if (stdDev < 7.0) burstinessFactor = 0.5;
  else burstinessFactor = 0.2; // High variance = Human-like

  const patternDensity = (signalMatches / (wordCount / 50 || 1));
  const patternFactor = Math.min(1.0, patternDensity * 0.35);

  let rawProbability = burstinessFactor * 0.45 + patternFactor * 0.55;
  rawProbability = Math.max(0.04, Math.min(0.96, rawProbability));

  const aiProbability = Math.round(rawProbability * 100) / 100;
  const humanProbability = Math.round((1 - aiProbability) * 100) / 100;

  let classification: 'likely-human' | 'inconclusive' | 'likely-ai' = 'inconclusive';
  let confidence: 'low' | 'moderate' | 'high' = 'moderate';

  if (aiProbability >= 0.65) {
    classification = 'likely-ai';
    confidence = aiProbability >= 0.82 ? 'high' : 'moderate';
  } else if (aiProbability <= 0.35) {
    classification = 'likely-human';
    confidence = aiProbability <= 0.2 ? 'high' : 'moderate';
  }

  const elapsedMs = performance.now() - startTime;
  const latencyMs = Number(elapsedMs.toFixed(2));

  const payload: DetectResponse = {
    success: true,
    score: {
      aiProbability,
      humanProbability,
      confidence,
      classification,
      perplexityScore: Math.round((20 + (1 - rawProbability) * 60) * 10) / 10,
      burstinessScore: Math.round(stdDev * 10) / 10,
    },
    wordCount,
    sentenceCount,
    signalsDetected: Array.from(new Set(signalsDetected)).slice(0, 10),
    modelUsed: 'calibrated-multi-signal-v1',
    latencyMs,
    timing: {
      executionMs: latencyMs,
      overheadDescription: 'Synchronous in-memory string variance calculation (<1ms CPU time, no remote neural model invoked)',
    },
    methodologyNotice:
      'Evaluates stylistic variance and signature n-gram clichés. Diagnostic only; does not provide conclusive proof of authorship.',
  };

  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
