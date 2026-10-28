import { describe, it, expect } from 'vitest';
import {
  analyzeWriting,
  applySingleSuggestion,
  applyAllApplicableSuggestions,
} from '../../src/lib/assistant/writingAssistant';

describe('On-Device Writing Assistant Engine', () => {
  it('detects wordiness, redundancies, and nominalizations', () => {
    const text = 'In order to succeed, due to the fact that we have future plans, we must take into consideration all true facts at this point in time.';
    const analysis = analyzeWriting(text);

    expect(analysis.suggestions.length).toBeGreaterThanOrEqual(4);
    const wordinessSuggestions = analysis.suggestions.filter((s) => s.category === 'wordiness');
    expect(wordinessSuggestions.some((s) => s.original.toLowerCase() === 'in order to')).toBe(true);
    expect(wordinessSuggestions.some((s) => s.original.toLowerCase() === 'due to the fact that')).toBe(true);
    expect(wordinessSuggestions.some((s) => s.original.toLowerCase() === 'at this point in time')).toBe(true);
  });

  it('detects grammar confusions and weak modifiers', () => {
    const text = 'We could of won because their going to bring a very unique solution.';
    const analysis = analyzeWriting(text);

    const grammarSuggestions = analysis.suggestions.filter((s) => s.category === 'grammar');
    expect(grammarSuggestions.some((s) => s.original.toLowerCase() === 'could of')).toBe(true);
    expect(grammarSuggestions.some((s) => s.original.toLowerCase() === 'very unique')).toBe(true);
  });

  it('detects AI clichés and synthetic phrasing', () => {
    const text = 'We must delve into the intricate tapestry of this ever-evolving landscape as a testament to our progress.';
    const analysis = analyzeWriting(text);

    const cliches = analysis.suggestions.filter((s) => s.category === 'ai_cliche');
    expect(cliches.length).toBeGreaterThanOrEqual(3);
    expect(analysis.aiProbability).toBeGreaterThan(0.60);
  });

  it('detects run-on sentences and proposes clean splits', () => {
    const runOnText = 'This is an exceedingly long and drawn-out sentence designed specifically to test whether our linguistic parser can correctly identify when a sentence exceeds thirty-four words in length, and it should offer a clean split point for the author to review.';
    const analysis = analyzeWriting(runOnText);

    const splitSug = analysis.suggestions.find((s) => s.category === 'split_sentence');
    expect(splitSug).toBeDefined();
    expect(splitSug?.replacement).toContain('.');
  });

  it('computes Flesch-Kincaid readability metrics and tone', () => {
    const text = 'The results were analyzed. Furthermore, the systematic inquiry established empirical benchmarks for subsequent evaluation.';
    const analysis = analyzeWriting(text);

    expect(analysis.readability.wordCount).toBeGreaterThan(10);
    expect(analysis.readability.fleschKincaidScore).toBeGreaterThanOrEqual(0);
    expect(analysis.readability.fleschKincaidScore).toBeLessThanOrEqual(100);
    expect(analysis.readability.tone).toBeDefined();
  });

  it('correctly applies single and batch suggestions', () => {
    const original = 'In order to proceed, we must act at this point in time.';
    const analysis = analyzeWriting(original);

    const singleFixed = applySingleSuggestion(original, analysis.suggestions[0]);
    expect(singleFixed).not.toBe(original);

    const fixedBatch = applyAllApplicableSuggestions(original, analysis.suggestions);
    expect(fixedBatch).not.toContain('In order to');
    expect(fixedBatch).not.toContain('at this point in time');
    expect(fixedBatch).toContain('To proceed');
  });

  it('detects context-aware homophones and grammatical agreement', () => {
    const text = 'The team has lead the initiative, which had a positive affect on productivity. The list of items were verified by the principle architect.';
    const analysis = analyzeWriting(text);

    const grammarSuggestions = analysis.suggestions.filter((s) => s.category === 'grammar');
    expect(grammarSuggestions.some((s) => s.original.includes('has lead'))).toBe(true);
    expect(grammarSuggestions.some((s) => s.original.includes('affect'))).toBe(true);
    expect(grammarSuggestions.some((s) => s.original.includes('list of items were'))).toBe(true);
    expect(grammarSuggestions.some((s) => s.original.includes('principle architect'))).toBe(true);
  });

  it('streamlines wordy preambles into concise editorial formulations', () => {
    const text = 'It should be noted that the system has the ability to scale, and there is no doubt that latency drops at the present time.';
    const analysis = analyzeWriting(text);

    const wordinessSuggestions = analysis.suggestions.filter((s) => s.category === 'wordiness');
    expect(wordinessSuggestions.some((s) => s.original.toLowerCase().includes('it should be noted that'))).toBe(true);
    expect(wordinessSuggestions.some((s) => s.original.toLowerCase().includes('has the ability to'))).toBe(true);
    expect(wordinessSuggestions.some((s) => s.original.toLowerCase().includes('there is no doubt that'))).toBe(true);
    expect(wordinessSuggestions.some((s) => s.original.toLowerCase().includes('at the present time'))).toBe(true);
  });

  it('preserves technical terminology without triggering false repetitive alarms', () => {
    const technicalText = 'The server allocated socket buffers for each network socket. When the socket closed, the server freed the socket buffer and reset the process ulimit.';
    const analysis = analyzeWriting(technicalText);

    // Exempt technical terms (socket, buffer, server) should not trigger repetitive warnings
    const repSuggestions = analysis.suggestions.filter((s) => s.category === 'repetitive_words');
    expect(repSuggestions.some((s) => s.original === 'socket')).toBe(false);
    expect(repSuggestions.some((s) => s.original === 'buffer')).toBe(false);
  });
});
