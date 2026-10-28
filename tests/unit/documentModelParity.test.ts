import { describe, it, expect } from 'vitest';
import * as ClientDocModel from '../../src/lib/pipeline/documentModel';
import * as WorkerDocModel from '../../workers/api/src/pipeline/documentModel';

describe('Document Model Parity: Client vs Cloudflare Worker Pipeline (Phase 2 Task 3)', () => {
  const diverseTestFixtures = [
    {
      name: 'Plain Multi-Paragraph Document',
      text: [
        'First paragraph explaining distributed databases.',
        'Second paragraph evaluating replication lag and consensus protocols.',
        'Third paragraph discussing write amplification on SSDs.',
        'Fourth paragraph offering practical recommendations for tuning.',
      ].join('\n\n'),
    },
    {
      name: 'Structured Markdown with Headings, Lists, Code, and Equations',
      text: [
        '# System Architecture',
        'This overview defines the primary ingestion tier.',
        '## Transport Layer',
        '```typescript\nconst client = new WorkerApiClient();\nawait client.humanize(text, { mode: "natural" });\n```',
        'Key properties include:',
        '- Zero data leakage to third-party endpoints',
        '- Client-side PBKDF2 vault key derivation',
        '- Deterministic shingle winnowing',
        '1. Step one: parse AST blocks',
        '2. Step two: evaluate invariants',
        '3. Step three: project diff tokens',
        '$$E = mc^2$$',
        '| Metric | Baseline | Phase 2 |',
        '| --- | --- | --- |',
        '| Invariant Pass Rate | 35.7% | 100.0% |',
      ].join('\n\n'),
    },
    {
      name: 'Academic Text with In-Text Citations and Numbers',
      text: [
        'Previous empirical literature emphasizes stylometric variance (Vaswani et al., 2017).',
        'We observe that 25,000 requests per second are processed under 14.8ms p99 latency [2].',
      ].join('\n\n'),
    },
  ];

  it('maintains 100% parity across block parsing rules and structural invariants', () => {
    for (const fixture of diverseTestFixtures) {
      const clientDoc = ClientDocModel.parseDocumentToBlocks(fixture.text);
      const workerDoc = WorkerDocModel.parseDocumentToBlocks(fixture.text);

      expect(clientDoc.blocks.length).toBe(workerDoc.blocks.length);
      expect(clientDoc.format).toBe(workerDoc.format);

      for (let i = 0; i < clientDoc.blocks.length; i++) {
        const cBlock = clientDoc.blocks[i];
        const wBlock = workerDoc.blocks[i];

        expect(cBlock.type).toBe(wBlock.type);
        expect(cBlock.rawText).toBe(wBlock.rawText);
        expect(cBlock.isProtected).toBe(wBlock.isProtected);
        expect(cBlock.order).toBe(wBlock.order);
        expect(cBlock.level).toBe(wBlock.level);
        expect(cBlock.listType).toBe(wBlock.listType);
        expect(cBlock.listMarker).toBe(wBlock.listMarker);
      }
    }
  });

  it('maintains 100% parity across plain text projection behavior', () => {
    for (const fixture of diverseTestFixtures) {
      const clientDoc = ClientDocModel.parseDocumentToBlocks(fixture.text);
      const workerDoc = WorkerDocModel.parseDocumentToBlocks(fixture.text);

      const clientProjection = ClientDocModel.projectBlocksToPlainText(clientDoc.blocks, false);
      const workerProjection = WorkerDocModel.projectBlocksToPlainText(workerDoc.blocks, false);

      expect(clientProjection).toBe(workerProjection);
    }
  });

  it('maintains 100% parity across structural validation and anomaly detection', () => {
    const fixture = diverseTestFixtures[0];
    const clientDoc = ClientDocModel.parseDocumentToBlocks(fixture.text);
    const workerDoc = WorkerDocModel.parseDocumentToBlocks(fixture.text);

    // Test A: Collapsed monolithic paragraph
    const collapsedText = fixture.text.replace(/\n\n/g, ' ');
    const clientValA = ClientDocModel.validateDocumentStructure(clientDoc, collapsedText);
    const workerValA = WorkerDocModel.validateDocumentStructure(workerDoc, collapsedText);

    expect(clientValA.hasCollapseAnomaly).toBe(workerValA.hasCollapseAnomaly);
    expect(clientValA.isValid).toBe(workerValA.isValid);
    expect(clientValA.inputBlockCount).toBe(workerValA.inputBlockCount);
    expect(clientValA.outputBlockCount).toBe(workerValA.outputBlockCount);

    // Test B: Duplicate blocks
    const dupText = [
      'First paragraph explaining distributed databases.',
      'Second paragraph evaluating replication lag and consensus protocols.',
      'Second paragraph evaluating replication lag and consensus protocols.',
    ].join('\n\n');
    const clientValB = ClientDocModel.validateDocumentStructure(clientDoc, dupText);
    const workerValB = WorkerDocModel.validateDocumentStructure(workerDoc, dupText);

    expect(clientValB.hasDuplicateAnomaly).toBe(workerValB.hasDuplicateAnomaly);
    expect(clientValB.isValid).toBe(workerValB.isValid);

    // Test C: Citation and number drop
    const acadFixture = diverseTestFixtures[2];
    const clientAcadDoc = ClientDocModel.parseDocumentToBlocks(acadFixture.text);
    const workerAcadDoc = WorkerDocModel.parseDocumentToBlocks(acadFixture.text);
    const strippedText = 'Previous empirical work was reported. We observe high throughput at low latency.';

    const clientValC = ClientDocModel.validateDocumentStructure(clientAcadDoc, strippedText);
    const workerValC = WorkerDocModel.validateDocumentStructure(workerAcadDoc, strippedText);

    expect(clientValC.hasFactualAnomaly).toBe(workerValC.hasFactualAnomaly);
    expect(clientValC.isValid).toBe(workerValC.isValid);
  });

  it('maintains 100% parity across collapsed output reconstruction and repair', () => {
    const fixture = diverseTestFixtures[0];
    const clientDoc = ClientDocModel.parseDocumentToBlocks(fixture.text);
    const workerDoc = WorkerDocModel.parseDocumentToBlocks(fixture.text);

    const collapsedText = fixture.text.replace(/\n\n/g, ' ');
    const clientRepaired = ClientDocModel.repairCollapsedOutput(clientDoc, collapsedText);
    const workerRepaired = WorkerDocModel.repairCollapsedOutput(workerDoc, collapsedText);

    expect(clientRepaired).toBe(workerRepaired);
    expect(clientRepaired.split(/\n\s*\n/)).toHaveLength(4);
  });
});
