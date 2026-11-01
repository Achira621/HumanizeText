import { describe, it, expect } from 'vitest';
import { analyzeHierarchicalContent } from '../../src/lib/detector/v2_6/hierarchicalDetector';
import { executeDetectorEngine } from '../../src/lib/detector/candidateIntegrationBoundary';

describe('HUMANIZETEXT DETECTOR V2.6: Hierarchical & Domain Regression Suite', () => {
  // 1. Permanent Known-Human 72-word Conversational Instruction
  // Exactly 72 words of authentic, natural human instructional prose
  const KNOWN_HUMAN_72_WORD_INSTRUCTION =
    "When you get into the office tomorrow morning, please make sure you check the front door lock before turning off the security alarm. Last week someone forgot and the alarm went off right as the cleaning crew was leaving. After that, boot up the main server in room 204, log into the admin console, and check if the overnight backup job finished cleanly. Shoot me a quick text message once that's done.";

  it('correctly classifies the 72-word known-human conversational instruction', () => {
    const words = KNOWN_HUMAN_72_WORD_INSTRUCTION.trim().split(/\s+/).filter(Boolean);
    expect(words.length).toBe(72);

    const result = analyzeHierarchicalContent(KNOWN_HUMAN_72_WORD_INSTRUCTION);

    expect(result.originClassification).toBe('likely-human');
    expect(result.calibratedAiProbability).toBeLessThan(0.35);
    expect(result.humanStyleScore).toBeGreaterThan(60);
    expect(result.aiSignatureScore).toBeLessThan(40);
    expect(['medium', 'high']).toContain(result.confidence);
  });

  // 2. Technical RFC Specification False-Alarm Immunity Test
  // RFC 2616 (HTTP/1.1) Section 9.3 GET - formal specification prose with zero contractions and dense nouns
  const RFC_TECHNICAL_SPEC =
    "The GET method means retrieve whatever information (in the form of an entity) is identified by the Request-URI. If the Request-URI refers to a data-producing process, it is the produced data which shall be returned as the entity in the response and not the source text of the process, unless that text happens to be the output of the process. The semantics of the GET method change to a conditional GET if the request message includes an If-Modified-Since, If-Unmodified-Since, If-Match, If-None-Match, or If-Range header field. A conditional GET method requests that the entity be transferred only under the circumstances described by the conditional header field(s). The conditional GET method is intended to reduce unnecessary network usage by allowing cached entities to be refreshed without requiring multiple requests or transferring data already held by the client.";

  it('protects technical specifications (RFCs) from false-alarm classification', () => {
    const result = analyzeHierarchicalContent(RFC_TECHNICAL_SPEC);

    expect(result.genre).toBe('technical');
    expect(result.styleMetrics.clicheMarkerCount).toBe(0);
    expect(result.originClassification).toBe('likely-human');
    expect(result.calibratedAiProbability).toBeLessThan(0.35);
    expect(result.humanStyleScore).toBeGreaterThan(60);
  });

  // 3. Known AI Generative Academic Passage
  // Classic synthetic phrasing with hallmark markers ('delve', 'tapestry', 'testament', etc.)
  const GENERATIVE_AI_SAMPLE =
    "In today's rapidly evolving digital landscape, it is crucial to delve into the multifaceted implications of artificial intelligence across contemporary society. The integration of neural frameworks stands as a testament to human ingenuity, seamlessly bridging theoretical paradigms and practical applications. Moreover, harnessing these computational architectures plays a pivotal role in fostering interdisciplinary collaboration. Consequently, understanding the nuanced tapestry of modern machine learning is paramount for future innovation.";

  it('correctly identifies generative AI text with high confidence', () => {
    const result = analyzeHierarchicalContent(GENERATIVE_AI_SAMPLE);

    expect(result.originClassification).toBe('likely-ai');
    expect(result.calibratedAiProbability).toBeGreaterThan(0.65);
    expect(result.aiSignatureScore).toBeGreaterThan(65);
    expect(result.humanStyleScore).toBeLessThan(40);
    expect(result.styleMetrics.clicheMarkerCount).toBeGreaterThan(3);
  });

  // 4. Hierarchical Multi-Section Mixed Content Detection
  // Document with Section 1 (Human RFC technical) + Section 2 (Synthetic AI filler)
  const MULTI_SECTION_MIXED_DOCUMENT = `
### Section 1: Network Protocol Architecture

The transmission control protocol provides reliable, ordered, and error-checked delivery of a stream of octets between applications running on hosts communicating via an IP network. The protocol relies on sequence numbers, acknowledgment packets, and retransmission timers to maintain connection integrity across unreliable network topologies. Each socket endpoint manages window sizes and congestion control parameters dynamically in accordance with packet drop indicators.

### Section 2: Technological Synthesis and Perspectives

In today's fast-paced digital era, it is important to delve into the multifaceted tapestry of modern networking. The synergy between distributed applications serves as a testament to technological progress, seamlessly bridging gaps between remote teams. Furthermore, harnessing these robust protocols plays a pivotal role in fostering global digital transformation and empowering developers worldwide.
`;

  it('detects mixed human and AI content across multi-section documents', () => {
    const result = analyzeHierarchicalContent(MULTI_SECTION_MIXED_DOCUMENT);

    expect(result.isDocumentLevel).toBe(true);
    expect(result.totalSections).toBe(2);
    expect(result.sectionBreakdown).toBeDefined();
    expect(result.sectionBreakdown?.length).toBe(2);

    // Section 1 should be likely-human
    expect(result.sectionBreakdown?.[0].originClassification).toBe('likely-human');
    // Section 2 should be likely-ai
    expect(result.sectionBreakdown?.[1].originClassification).toBe('likely-ai');

    // Document-level verdict must be mixed
    expect(result.originClassification).toBe('mixed');
  });

  // 5. Short Input Abstention / Inconclusive Guard
  it('abstains with inconclusive result when word count is below minimum', () => {
    const shortInput = "This is a quick sentence that is far too short to reliably analyze.";
    const result = analyzeHierarchicalContent(shortInput);

    expect(result.originClassification).toBe('inconclusive');
    expect(result.abstentionReason).toBe('length_below_minimum');
    expect(result.confidence).toBe('low');
  });

  // 6. Candidate Integration Boundary Routing Parity
  it('executes seamlessly via candidate integration boundary', () => {
    const response = executeDetectorEngine(KNOWN_HUMAN_72_WORD_INSTRUCTION, {
      engineId: 'v2_6_hierarchical',
    });

    expect(response.engineId).toBe('v2_6_hierarchical');
    expect(response.verdict).toBe('human');
    expect(response.score).toBeLessThan(0.35);
    expect(response.isAbstained).toBe(false);
  });
});
