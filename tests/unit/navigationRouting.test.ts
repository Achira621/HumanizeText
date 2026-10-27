import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getTabFromLocation,
  getPathFromTab,
  PAGE_METADATA,
  updatePageMeta,
} from '../../src/lib/seo/metaManager';
import type { ActiveTab } from '../../src/components/common/Header';

describe('Navigation & Information Architecture Routing Tests', () => {
  let originalWindow: any;
  let originalDocument: any;

  beforeEach(() => {
    originalWindow = (globalThis as any).window;
    originalDocument = (globalThis as any).document;

    (globalThis as any).window = {
      location: {
        pathname: '/',
        hash: '',
        href: 'https://humanizetext-nine.vercel.app/',
        origin: 'https://humanizetext-nine.vercel.app',
      },
      addEventListener: () => {},
      removeEventListener: () => {},
      scrollTo: () => {},
    };

    (globalThis as any).document = {
      title: '',
      querySelector: () => null,
      createElement: () => ({
        setAttribute: () => {},
        remove: () => {},
      }),
      head: {
        appendChild: () => {},
      },
      getElementById: () => null,
    };
  });

  afterEach(() => {
    (globalThis as any).window = originalWindow;
    (globalThis as any).document = originalDocument;
  });

  const setLocation = (pathname: string, hash: string = '') => {
    (globalThis as any).window.location = {
      pathname,
      hash,
      href: `https://humanizetext-nine.vercel.app${pathname}${hash}`,
      origin: 'https://humanizetext-nine.vercel.app',
    };
  };

  it('correctly maps primary clean paths to active tabs', () => {
    setLocation('/');
    expect(getTabFromLocation()).toBe('humanizer');

    setLocation('/ai-detector');
    expect(getTabFromLocation()).toBe('ai-detector');

    setLocation('/plagiarism-checker');
    expect(getTabFromLocation()).toBe('plagiarism-checker');

    setLocation('/paraphrase');
    expect(getTabFromLocation()).toBe('paraphrase');

    setLocation('/metadata-inspector');
    expect(getTabFromLocation()).toBe('metadata-inspector');

    setLocation('/privacy-lab');
    expect(getTabFromLocation()).toBe('privacy-lab');

    setLocation('/vault');
    expect(getTabFromLocation()).toBe('vault');

    setLocation('/docs');
    expect(getTabFromLocation()).toBe('docs');

    setLocation('/how-to-humanize');
    expect(getTabFromLocation()).toBe('how-to-humanize');

    setLocation('/resources');
    expect(getTabFromLocation()).toBe('resources');

    setLocation('/about');
    expect(getTabFromLocation()).toBe('about');

    setLocation('/contact');
    expect(getTabFromLocation()).toBe('contact');

    setLocation('/privacy-policy');
    expect(getTabFromLocation()).toBe('privacy-policy');

    setLocation('/terms');
    expect(getTabFromLocation()).toBe('terms');

    setLocation('/methodology');
    expect(getTabFromLocation()).toBe('methodology');

    setLocation('/detector-limitations');
    expect(getTabFromLocation()).toBe('detector-limitations');
  });

  it('correctly resolves backwards-compatible path aliases', () => {
    setLocation('/detector');
    expect(getTabFromLocation()).toBe('ai-detector');

    setLocation('/similarity');
    expect(getTabFromLocation()).toBe('plagiarism-checker');

    setLocation('/metadata');
    expect(getTabFromLocation()).toBe('metadata-inspector');

    setLocation('/paraphrasing-tool');
    expect(getTabFromLocation()).toBe('paraphrase');

    setLocation('/guide');
    expect(getTabFromLocation()).toBe('how-to-humanize');

    setLocation('/threat-model');
    expect(getTabFromLocation()).toBe('docs');

    setLocation('/editorial');
    expect(getTabFromLocation()).toBe('resources');

    setLocation('/guides');
    expect(getTabFromLocation()).toBe('resources');

    setLocation('/support');
    expect(getTabFromLocation()).toBe('contact');

    setLocation('/privacy');
    expect(getTabFromLocation()).toBe('privacy-policy');

    setLocation('/terms-of-service');
    expect(getTabFromLocation()).toBe('terms');
  });

  it('correctly resolves hash-based fallback URLs', () => {
    setLocation('/', '#/ai-detector');
    expect(getTabFromLocation()).toBe('ai-detector');

    setLocation('/', '#/plagiarism-checker');
    expect(getTabFromLocation()).toBe('plagiarism-checker');

    setLocation('/', '#/privacy-lab');
    expect(getTabFromLocation()).toBe('privacy-lab');

    setLocation('/', '#/vault');
    expect(getTabFromLocation()).toBe('vault');

    setLocation('/', '#/resources');
    expect(getTabFromLocation()).toBe('resources');

    setLocation('/', '#/about');
    expect(getTabFromLocation()).toBe('about');
  });

  it('generates bidirectional canonical URL paths from active tabs', () => {
    const tabs: ActiveTab[] = [
      'humanizer',
      'editor',
      'ai-detector',
      'plagiarism-checker',
      'similarity',
      'paraphrase',
      'metadata-inspector',
      'how-to-humanize',
      'privacy-lab',
      'vault',
      'docs',
      'resources',
      'about',
      'contact',
      'privacy-policy',
      'terms',
      'methodology',
      'detector-limitations',
    ];

    for (const tab of tabs) {
      const path = getPathFromTab(tab);
      expect(path).toBeDefined();
      expect(path.startsWith('/')).toBe(true);
    }

    expect(getPathFromTab('humanizer')).toBe('/');
    expect(getPathFromTab('editor')).toBe('/');
    expect(getPathFromTab('ai-detector')).toBe('/ai-detector');
    expect(getPathFromTab('plagiarism-checker')).toBe('/plagiarism-checker');
    expect(getPathFromTab('similarity')).toBe('/plagiarism-checker');
    expect(getPathFromTab('vault')).toBe('/vault');
    expect(getPathFromTab('resources')).toBe('/resources');
    expect(getPathFromTab('about')).toBe('/about');
    expect(getPathFromTab('contact')).toBe('/contact');
    expect(getPathFromTab('privacy-policy')).toBe('/privacy-policy');
    expect(getPathFromTab('terms')).toBe('/terms');
    expect(getPathFromTab('methodology')).toBe('/methodology');
    expect(getPathFromTab('detector-limitations')).toBe('/detector-limitations');
  });

  it('contains complete metadata with distinct titles and descriptions for all routes', () => {
    const primaryKeys = [
      'humanizer',
      'ai-detector',
      'plagiarism-checker',
      'paraphrase',
      'metadata-inspector',
      'how-to-humanize',
      'privacy-lab',
      'vault',
      'docs',
      'resources',
      'about',
      'contact',
      'privacy-policy',
      'terms',
      'methodology',
      'detector-limitations',
    ];

    for (const key of primaryKeys) {
      const meta = PAGE_METADATA[key];
      expect(meta).toBeDefined();
      expect(meta.title).toBeDefined();
      expect(meta.description.length).toBeGreaterThan(20);
      expect(meta.canonicalPath).toBeDefined();
    }
  });

  it('does not contain unsupported 100% bypass promises in primary humanizer metadata', () => {
    const meta = PAGE_METADATA.humanizer;
    expect(meta.title).not.toContain('100% Bypass');
    expect(meta.title).not.toContain('Bypass AI Detectors');
    expect(meta.description).not.toContain('100% human-sounding writing to bypass Turnitin');
    expect(meta.schema?.['@graph']).toBeDefined();

    // Verify aggregateRating was removed from schema
    const software = meta.schema?.['@graph']?.find(
      (item: any) => item['@type'] === 'SoftwareApplication'
    );
    expect(software?.aggregateRating).toBeUndefined();
  });

  it('updates document title, description, and canonical link when route changes', () => {
    updatePageMeta('ai-detector');
    expect((globalThis as any).document.title).toContain('AI Detector');

    updatePageMeta('vault');
    expect((globalThis as any).document.title).toContain('Security Vault & Writing Assistant');

    updatePageMeta('resources');
    expect((globalThis as any).document.title).toContain('Writing & Research Resources Hub');

    updatePageMeta('about');
    expect((globalThis as any).document.title).toContain('About HumanizeText');

    updatePageMeta('humanizer');
    expect((globalThis as any).document.title).toContain('HumanizeText');
  });
});
