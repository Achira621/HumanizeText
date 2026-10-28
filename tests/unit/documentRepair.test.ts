import { describe, it, expect } from 'vitest';
import {
  parseDocumentToBlocks,
  validateDocumentStructure,
  repairCollapsedOutput,
} from '../../src/lib/pipeline/documentModel';

describe('Document Collapse Repair & Invariant Correctness (Phase 2 Task 2)', () => {
  const sampleFourParas = [
    'Solar photovoltaic modules convert incident sunlight into electrical direct current with silicon semiconductor cells.',
    'Atmospheric carbon capture systems extract ambient carbon dioxide through solid amine-functionalized sorbent contactors.',
    'Geothermal heat pumps circulate closed-loop fluid through borehole heat exchangers to maintain thermal equilibrium.',
    'Municipal electrical grids synchronize decentralized renewable resources utilizing automated battery storage reserves.',
  ].join('\n\n');

  // 1. A valid multi-paragraph output
  it('Case 1: Valid multi-paragraph output validates as valid with 0 anomalies', () => {
    const inputDoc = parseDocumentToBlocks(sampleFourParas);
    const validOutput = [
      'Photovoltaic arrays generate direct current electricity as light strikes silicon semiconductor layers.',
      'Direct air capture plants filter carbon dioxide from surrounding air utilizing specialized solid amine filters.',
      'Geothermal systems pump circulating fluid through underground loops to preserve stable heating and cooling.',
      'Modern utility grids balance distributed solar and wind power with intelligent grid-scale battery storage.',
    ].join('\n\n');

    const validation = validateDocumentStructure(inputDoc, validOutput);
    expect(validation.isValid).toBe(true);
    expect(validation.hasCollapseAnomaly).toBe(false);
    expect(validation.hasOrderingAnomaly).toBe(false);
    expect(validation.hasOmissionAnomaly).toBe(false);
    expect(validation.hasFactualAnomaly).toBe(false);
    expect(validation.hasDuplicateAnomaly).toBe(false);
    expect(validation.warnings).toHaveLength(0);
    expect(validation.outputBlockCount).toBe(4);
  });

  // 2. A model response that merges four paragraphs into one
  it('Case 2: Correctly detects paragraph collapse and repairs it using content anchors', () => {
    const inputDoc = parseDocumentToBlocks(sampleFourParas);
    const mergedOutput =
      'Photovoltaic arrays generate direct current electricity as light strikes silicon semiconductor layers. ' +
      'Direct air capture plants filter carbon dioxide from surrounding air utilizing specialized solid amine filters. ' +
      'Geothermal systems pump circulating fluid through underground loops to preserve stable heating and cooling. ' +
      'Modern utility grids balance distributed solar and wind power with intelligent grid-scale battery storage.';

    const validation = validateDocumentStructure(inputDoc, mergedOutput);
    expect(validation.isValid).toBe(false);
    expect(validation.hasCollapseAnomaly).toBe(true);
    expect(validation.warnings.length).toBeGreaterThan(0);

    const repaired = repairCollapsedOutput(inputDoc, mergedOutput);
    const repairedDoc = parseDocumentToBlocks(repaired);

    // Repaired output must have exactly 4 paragraphs separated by \n\n
    expect(repairedDoc.blocks).toHaveLength(4);
    expect(repaired.split(/\n\s*\n/)).toHaveLength(4);
    expect(repairedDoc.blocks[0].rawText).toContain('Photovoltaic');
    expect(repairedDoc.blocks[1].rawText).toContain('Direct air capture');
    expect(repairedDoc.blocks[2].rawText).toContain('Geothermal');
    expect(repairedDoc.blocks[3].rawText).toContain('Modern utility grids');
  });

  // 3. A response that omits a paragraph
  it('Case 3: Detects omitted paragraph and preserves original affected block with warning', () => {
    const inputDoc = parseDocumentToBlocks(sampleFourParas);
    // Response omits paragraph 3 (geothermal) completely
    const omittedOutput = [
      'Photovoltaic arrays generate direct current electricity as light strikes silicon semiconductor layers.',
      'Direct air capture plants filter carbon dioxide from surrounding air utilizing specialized solid amine filters.',
      'Modern utility grids balance distributed solar and wind power with intelligent grid-scale battery storage.',
    ].join('\n\n');

    const validation = validateDocumentStructure(inputDoc, omittedOutput);
    expect(validation.isValid).toBe(false);
    expect(validation.hasOmissionAnomaly).toBe(true);
    expect(validation.warnings.some((w) => w.includes('Structural block reduction'))).toBe(true);

    // Reconstructed document preserves 4 blocks and safely retains original omitted paragraph
    expect(validation.repairedBlocks).toBeDefined();
    expect(validation.repairedBlocks).toHaveLength(4);
    expect(validation.repairedBlocks![2].rawText).toContain('Geothermal');
    expect(validation.repairedBlocks![2].status).toBe('fallback');
    expect(validation.repairedText).toContain('Geothermal');
  });

  // 4. A response that duplicates a paragraph
  it('Case 4: Detects duplicated paragraph in model response', () => {
    const inputDoc = parseDocumentToBlocks(sampleFourParas);
    const duplicatedOutput = [
      'Photovoltaic arrays generate direct current electricity as light strikes silicon semiconductor layers.',
      'Direct air capture plants filter carbon dioxide from surrounding air utilizing specialized solid amine filters.',
      'Direct air capture plants filter carbon dioxide from surrounding air utilizing specialized solid amine filters.',
      'Modern utility grids balance distributed solar and wind power with intelligent grid-scale battery storage.',
    ].join('\n\n');

    const validation = validateDocumentStructure(inputDoc, duplicatedOutput);
    expect(validation.isValid).toBe(false);
    expect(validation.hasDuplicateAnomaly).toBe(true);
    expect(validation.warnings.some((w) => w.includes('Duplicate content detected'))).toBe(true);
  });

  // 5. A response that changes the order of sections
  it('Case 5: Detects scrambled section order and preserves original document structure', () => {
    const inputDoc = parseDocumentToBlocks(sampleFourParas);
    // Scrambled order: grid (paragraph 4) appears before solar (paragraph 1)
    const scrambledOutput = [
      'Modern utility grids balance distributed solar and wind power with intelligent grid-scale battery storage.',
      'Photovoltaic arrays generate direct current electricity as light strikes silicon semiconductor layers.',
      'Direct air capture plants filter carbon dioxide from surrounding air utilizing specialized solid amine filters.',
      'Geothermal systems pump circulating fluid through underground loops to preserve stable heating and cooling.',
    ].join('\n\n');

    const validation = validateDocumentStructure(inputDoc, scrambledOutput);
    expect(validation.isValid).toBe(false);
    expect(validation.hasOrderingAnomaly).toBe(true);
    expect(validation.warnings.some((w) => w.includes('Section reordering anomaly'))).toBe(true);

    // Collapsed repair with scrambled content safely preserves original text rather than inventing incorrect mapping
    const repaired = repairCollapsedOutput(inputDoc, scrambledOutput.replace(/\n\n/g, ' '));
    expect(repaired).toBe(inputDoc.originalText);
  });

  // 6. A response that removes citations or numerical data
  it('Case 6: Detects removed citations and numerical data, falling back to preserve facts', () => {
    const dataDocText = [
      'Baseline throughput achieves 25,000 requests per second with p99 latency capped at 14.8ms.',
      'Prior benchmark methodologies followed established protocols as outlined by (Vaswani et al., 2017) and [4].',
    ].join('\n\n');

    const inputDoc = parseDocumentToBlocks(dataDocText);

    // Output stripped "25,000", "14.8ms", and the citation "[4]"
    const strippedOutput = [
      'The cluster reaches very high request volumes with minimal latency delay.',
      'The testing approach adhered to classical empirical guidelines from previous machine learning work.',
    ].join('\n\n');

    const validation = validateDocumentStructure(inputDoc, strippedOutput);
    expect(validation.isValid).toBe(false);
    expect(validation.hasFactualAnomaly).toBe(true);
    expect(validation.warnings.some((w) => w.includes('Numerical data omitted'))).toBe(true);
    expect(validation.warnings.some((w) => w.includes('Citations omitted'))).toBe(true);

    // Safe fallback protects original blocks containing factual data
    expect(validation.repairedBlocks).toBeDefined();
    expect(validation.repairedBlocks![0].status).toBe('fallback');
    expect(validation.repairedBlocks![0].rawText).toContain('25,000');
    expect(validation.repairedBlocks![1].status).toBe('fallback');
    expect(validation.repairedBlocks![1].rawText).toContain('(Vaswani et al., 2017)');
  });

  // 7. A response that changes meaning while retaining the same number of blocks
  it('Case 7: Flags semantic drift and negation inversion when block count matches', () => {
    const qualifiedDoc = [
      'The distributed consensus cluster must not accept uncommitted log entries during split-brain partitions.',
      'Replication safety guarantees are preserved under Byzantine failure models.',
    ].join('\n\n');

    const inputDoc = parseDocumentToBlocks(qualifiedDoc);

    // Block count is 2 (identical to input), but meaning of first block was inverted ("accepts" instead of "must not accept")
    const invertedOutput = [
      'The distributed consensus cluster accepts uncommitted log entries during split-brain partitions.',
      'Replication safety guarantees are preserved under Byzantine failure models.',
    ].join('\n\n');

    const validation = validateDocumentStructure(inputDoc, invertedOutput);
    expect(validation.outputBlockCount).toBe(2);
    expect(validation.inputBlockCount).toBe(2);
    // Must flag warning for negation polarity inversion
    expect(validation.warnings.some((w) => w.includes('negative qualification'))).toBe(true);
  });
});
