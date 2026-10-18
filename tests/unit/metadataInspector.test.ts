import { describe, it, expect } from 'vitest';
import { MetadataInspector } from '../../src/lib/metadata/inspector';

describe('Metadata & Signature Inspector — Client-Side Sanitization', () => {
  const inspector = new MetadataInspector();

  it('inspects PNG buffer and detects embedded generation parameter markers', async () => {
    // Construct dummy PNG-like blob with prompt chunk
    const content = 'prompt: a photo of a cozy cabin, parameters: Steps: 20, Sampler: Euler, Seed: 12345';
    const blob = new Blob([content], { type: 'image/png' });

    const report = await inspector.inspectFile(blob);
    expect(report.fileName).toBeDefined();
    expect(report.aiSignaturesFound.length).toBeGreaterThanOrEqual(1);
    expect(report.tags.some((t) => t.category === 'software')).toBe(true);
    expect(report.cleaningNotice).toContain('Notice: Removing metadata strips EXIF');
  });

  it('provides safe clean fallback and handles clean report generation', async () => {
    const content = 'plain-mock-image-bytes';
    const blob = new Blob([content], { type: 'image/jpeg' });

    const report = await inspector.inspectFile(blob);
    expect(report.hasExif).toBe(false);
    expect(report.hasGps).toBe(false);
  });
});
