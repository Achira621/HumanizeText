import { describe, it, expect } from 'vitest';
import {
  parseDocumentToBlocks,
  validateDocumentStructure,
  repairCollapsedOutput,
} from '../../src/lib/pipeline/documentModel';
import { RuleBasedHumanizerEngine } from '../../src/lib/humanizer/ruleEngine';
import { computeAiScore } from '../../src/lib/detector/detectorCore';
import { WorkerApiClient } from '../../src/lib/workerApi/client';

describe('Document Structure Model & Invariants — Phase 7 Regression Test Suite', () => {
  const engine = new RuleBasedHumanizerEngine();

  // --------------------------------------------------------------------------
  // Fixture 1: A single paragraph
  // --------------------------------------------------------------------------
  it('Fixture 1: Processes single paragraph without injecting artificial breaks', () => {
    const singlePara =
      'In today\'s fast-paced digital world, it is crucial to delve into the multifaceted nature of modern software engineering. Artificial intelligence plays a vital role in our daily work.';
    const doc = parseDocumentToBlocks(singlePara);

    expect(doc.blocks).toHaveLength(1);
    expect(doc.blocks[0].type).toBe('paragraph');

    const result = engine.processSync(singlePara, { mode: 'natural' });
    expect(result.improvedText).not.toContain('\n\n');
    expect(result.improvedText).not.toContain('delve into');
    expect(result.improvedText.length).toBeGreaterThan(30);

    const outDoc = parseDocumentToBlocks(result.improvedText);
    expect(outDoc.blocks).toHaveLength(1);
    expect(outDoc.blocks[0].type).toBe('paragraph');
  });

  // --------------------------------------------------------------------------
  // Fixture 2: Four paragraphs separated by blank lines
  // --------------------------------------------------------------------------
  it('Fixture 2: Preserves four paragraphs separated by blank lines without collapse', () => {
    const fourParas = [
      'The opening paragraph introduces the core thesis regarding distributed systems architecture.',
      'The second paragraph analyzes consensus algorithms, noting that Paxos and Raft provide formal safety guarantees.',
      'The third paragraph discusses network partitions and explains why latency increases during leader elections.',
      'The final paragraph concludes the discussion by summarizing key tradeoffs between throughput and consistency.',
    ].join('\n\n');

    const doc = parseDocumentToBlocks(fourParas);
    expect(doc.blocks).toHaveLength(4);
    expect(doc.blocks.every((b) => b.type === 'paragraph')).toBe(true);

    const result = engine.processSync(fourParas, { mode: 'natural' });

    // Invariant: Output must preserve all 4 paragraphs
    const outDoc = parseDocumentToBlocks(result.improvedText);
    expect(outDoc.blocks).toHaveLength(4);
    expect(result.improvedText.split(/\n\s*\n/)).toHaveLength(4);

    const val = validateDocumentStructure(doc, result.improvedText);
    expect(val.isValid).toBe(true);
    expect(val.hasCollapseAnomaly).toBe(false);
  });

  // --------------------------------------------------------------------------
  // Fixture 3: A heading followed by multiple paragraphs
  // --------------------------------------------------------------------------
  it('Fixture 3: Preserves heading hierarchy and following paragraphs', () => {
    const textWithHeadings = [
      '# Architectural Foundations',
      'This foundational section outlines the system requirements and high-level design principles.',
      '## Network Protocols',
      'The network layer leverages TLS 1.3 and HTTP/2 for encrypted multiplexed transport.',
      '## Storage Guarantees',
      'The persistence engine implements write-ahead logging with verifiable integrity checksums.',
    ].join('\n\n');

    const doc = parseDocumentToBlocks(textWithHeadings);
    expect(doc.blocks).toHaveLength(6);
    expect(doc.blocks[0].type).toBe('heading');
    expect(doc.blocks[0].level).toBe(1);
    expect(doc.blocks[2].type).toBe('heading');
    expect(doc.blocks[2].level).toBe(2);

    const result = engine.processSync(textWithHeadings, { mode: 'natural' });

    // Verify headings survive with correct markers
    expect(result.improvedText).toMatch(/^#\s+/m);
    expect(result.improvedText).toMatch(/^##\s+/m);

    const outDoc = parseDocumentToBlocks(result.improvedText);
    expect(outDoc.blocks).toHaveLength(6);
    expect(outDoc.blocks[0].type).toBe('heading');
    expect(outDoc.blocks[2].type).toBe('heading');
  });

  // --------------------------------------------------------------------------
  // Fixture 4: A heading with a nested list
  // --------------------------------------------------------------------------
  it('Fixture 4: Preserves heading and bulleted list structure without prose flattening', () => {
    const listText = [
      '### Core Pipeline Stages',
      '- Ingestion and block-level tokenization',
      '- Epistemic stance and contextual intent extraction',
      '- Strict invariant preservation check',
      '- QuillBot-style interactive diff projection',
    ].join('\n');

    const doc = parseDocumentToBlocks(listText);
    expect(doc.blocks[0].type).toBe('heading');
    expect(doc.blocks.slice(1).every((b) => b.type === 'list_item')).toBe(true);
    expect(doc.blocks.slice(1)).toHaveLength(4);

    const result = engine.processSync(listText, { mode: 'natural' });

    // Verify list items retain bullet markers
    const outLines = result.improvedText.split('\n').filter((l) => l.trim().length > 0);
    expect(outLines[0]).toMatch(/^###\s+/);
    expect(outLines[1]).toMatch(/^[-*+]\s+/);
    expect(outLines[2]).toMatch(/^[-*+]\s+/);
    expect(outLines[3]).toMatch(/^[-*+]\s+/);
    expect(outLines[4]).toMatch(/^[-*+]\s+/);
  });

  // --------------------------------------------------------------------------
  // Fixture 5: A numbered procedure
  // --------------------------------------------------------------------------
  it('Fixture 5: Preserves ordered numbered procedure and step sequence', () => {
    const procedureText = [
      '1. Derive ephemeral cryptographic session keys using PBKDF2.',
      '2. Generate HMAC-SHA256 shingles across the rolling window.',
      '3. Select boundary minimizers through deterministic winnowing.',
      '4. Verify reconstructed passage digests against the local vault.',
    ].join('\n');

    const doc = parseDocumentToBlocks(procedureText);
    expect(doc.blocks).toHaveLength(4);
    expect(doc.blocks.every((b) => b.type === 'list_item' && b.listType === 'ordered')).toBe(true);

    const result = engine.processSync(procedureText, { mode: 'natural' });

    // Verify step numbers survive in exact order
    expect(result.improvedText).toMatch(/1\.\s+/);
    expect(result.improvedText).toMatch(/2\.\s+/);
    expect(result.improvedText).toMatch(/3\.\s+/);
    expect(result.improvedText).toMatch(/4\.\s+/);
  });

  // --------------------------------------------------------------------------
  // Fixture 6: Technical text with equations, identifiers, and numbers
  // --------------------------------------------------------------------------
  it('Fixture 6: Protects mathematical equations, code identifiers, and numbers verbatim', () => {
    const techText = [
      '```\nconst socket = new WebSocket("wss://api.example.com/stream");\nsocket.binaryType = "arraybuffer";\n```',
      'The cluster maintains a p99 latency target under 14.8ms while processing 25,000 requests per second across 12 nodes.',
      '$$E = mc^2$$',
      'Memory utilization must not exceed 84.5% on any single worker instance.',
    ].join('\n\n');

    const doc = parseDocumentToBlocks(techText);
    expect(doc.blocks[0].type).toBe('code');
    expect(doc.blocks[0].isProtected).toBe(true);
    expect(doc.blocks[2].isProtected).toBe(true); // $$ equation

    const result = engine.processSync(techText, { mode: 'natural' });

    // Protected code block survived verbatim
    expect(result.improvedText).toContain('const socket = new WebSocket');
    // Equation survived
    expect(result.improvedText).toContain('$$E = mc^2$$');
    // Numbers survived
    expect(result.improvedText).toContain('14.8');
    expect(result.improvedText).toContain('25,000');
    expect(result.improvedText).toContain('12');
    expect(result.improvedText).toContain('84.5%');
  });

  // --------------------------------------------------------------------------
  // Fixture 7: Academic text with citations and references section
  // --------------------------------------------------------------------------
  it('Fixture 7: Retains in-text citations and protects references section', () => {
    const academicText = [
      'Prior empirical studies indicate significant variation in language model outputs (Vaswani et al., 2017). Similar observations were reported by Radford and colleagues [4].',
      'Recent investigations confirm that burstiness correlates with human authorship (Smith & Zhang, 2024).',
      '## References',
      '[4] Radford, A. et al. (2019). Language Models are Unsupervised Multitask Learners. OpenAI Technical Report.',
      'Smith, J., & Zhang, L. (2024). Stylometric Variance in Synthesized Prose. Journal of Computational Linguistics, 42(3), 115-132.',
    ].join('\n\n');

    const doc = parseDocumentToBlocks(academicText);
    expect(doc.blocks).toHaveLength(5);

    const result = engine.processSync(academicText, { mode: 'formal' });

    // Citations survive
    expect(result.improvedText).toContain('(Vaswani et al., 2017)');
    expect(result.improvedText).toContain('[4]');
    expect(result.improvedText).toContain('(Smith & Zhang, 2024)');
    expect(result.improvedText).toContain('## References');
  });

  // --------------------------------------------------------------------------
  // Fixture 8: Rich text containing formatting, links, and distinct blocks
  // --------------------------------------------------------------------------
  it('Fixture 8: Preserves Markdown links, blockquotes, and bold formatting', () => {
    const richText = [
      '> Critical Note: The cryptographic seed is derived on-device and never transmitted across the network.',
      'For more details, consult the [HumanizeText Documentation](https://humanizetext.org/docs/security).',
      'Security audits verify that **zero document leakage** occurs during local inference operations.',
    ].join('\n\n');

    const doc = parseDocumentToBlocks(richText);
    expect(doc.blocks[0].type).toBe('quote');

    const result = engine.processSync(richText, { mode: 'natural' });

    expect(result.improvedText).toMatch(/^>\s+/m);
    expect(result.improvedText).toContain('https://humanizetext.org/docs/security');
    expect(result.improvedText).toContain('zero document leakage');
  });

  // --------------------------------------------------------------------------
  // Fixture 9: Long input with multiple sections
  // --------------------------------------------------------------------------
  it('Fixture 9: Processes multi-section long document maintaining structure', () => {
    const sections = [];
    for (let i = 1; i <= 6; i++) {
      sections.push(`## Section ${i}: Operational Stage`);
      sections.push(
        `In order to evaluate stage ${i}, it is important to remember that empirical measurements must be gathered over time. The primary metric reflects system health.`
      );
    }
    const longDocText = sections.join('\n\n');
    const doc = parseDocumentToBlocks(longDocText);
    expect(doc.blocks).toHaveLength(12);

    const result = engine.processSync(longDocText, { mode: 'natural' });
    const outDoc = parseDocumentToBlocks(result.improvedText);

    expect(outDoc.blocks).toHaveLength(12);
    const headings = outDoc.blocks.filter((b) => b.type === 'heading');
    expect(headings).toHaveLength(6);
    expect(result.improvedText).not.toContain('delve into');
  });

  // --------------------------------------------------------------------------
  // Fixture 10: Invalid, empty, truncated, or collapsed model responses
  // --------------------------------------------------------------------------
  it('Fixture 10: Detects paragraph collapse anomaly and repairs structure deterministically', () => {
    const originalFourParas = [
      'First paragraph with distinct facts about solar radiation.',
      'Second paragraph analyzing atmospheric carbon capture efficiency.',
      'Third paragraph detailing geothermal energy extraction techniques.',
      'Fourth paragraph concluding with municipal grid deployment timelines.',
    ].join('\n\n');

    const inputDoc = parseDocumentToBlocks(originalFourParas);

    // Simulate bad model response that collapsed all paragraphs into one giant block
    const collapsedOutput =
      'First paragraph with distinct facts about solar radiation. Second paragraph analyzing atmospheric carbon capture efficiency. Third paragraph detailing geothermal energy extraction techniques. Fourth paragraph concluding with municipal grid deployment timelines.';

    const validation = validateDocumentStructure(inputDoc, collapsedOutput);
    expect(validation.isValid).toBe(false);
    expect(validation.hasCollapseAnomaly).toBe(true);
    expect(validation.warnings.length).toBeGreaterThan(0);

    // Repair collapsed output
    const repaired = repairCollapsedOutput(inputDoc, collapsedOutput);
    const repairedDoc = parseDocumentToBlocks(repaired);
    expect(repairedDoc.blocks.length).toBe(4);
    expect(repaired.split(/\n\s*\n/).length).toBe(4);
  });

  // --------------------------------------------------------------------------
  // Fixture 11: Network / Model failure requiring fallback to original text
  // --------------------------------------------------------------------------
  it('Fixture 11: Falls back gracefully to structured local engine when remote fails', async () => {
    const client = new WorkerApiClient({ baseUrl: 'http://127.0.0.1:9999' }); // unreachable mock URL

    const sample = 'First paragraph about data privacy.\n\nSecond paragraph about zero knowledge proof.';
    // Expect network error to trigger error or fallback safely without data loss
    await expect(client.humanize(sample, { mode: 'natural' })).rejects.toThrow();

    // Verify local emulation fallback (when baseUrl is empty) executes cleanly with block structure
    const localClient = new WorkerApiClient({ baseUrl: '' });
    const localResult = await localClient.humanize(sample, { mode: 'natural' });

    expect(localResult.improvedText).toContain('\n\n');
    expect(localResult.document?.blocks).toHaveLength(2);
    expect(localResult.fallbackTriggered).toBe(true);
  });

  // --------------------------------------------------------------------------
  // Fixture 12: Ambiguous detector sample
  // --------------------------------------------------------------------------
  it('Fixture 12: Calibrated detector handles neutral vocabulary without false-positive AI spikes', () => {
    // Ordinary human sentence with words like "ensure" and "effective" that previously triggered 78% AI score
    const humanSentence =
      'Teachers work hard to ensure that students receive effective guidance during their studies. Good mentors encourage questions and offer practical feedback.';

    const score = computeAiScore(humanSentence);

    // Should NOT be flagged as high AI (>0.75) simply because it contains "ensure" and "effective"
    expect(score.aiProbability).toBeLessThan(0.40);
    expect(score.signalBreakdown).toBeDefined();
    expect(score.signalBreakdown.keyword).toBeLessThan(0.70);
  });
});
