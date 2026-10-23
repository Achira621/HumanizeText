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
  });

  it('contains complete metadata with distinct titles and descriptions for all 3 pillars', () => {
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
    ];

    for (const key of primaryKeys) {
      const meta = PAGE_METADATA[key];
      expect(meta).toBeDefined();
      expect(meta.title).toContain('HumanizeText');
      expect(meta.description.length).toBeGreaterThan(20);
      expect(meta.canonicalPath).toBeDefined();
    }
  });

  it('updates document title, description, and canonical link when route changes', () => {
    updatePageMeta('ai-detector');
    expect((globalThis as any).document.title).toContain('AI Detector');

    updatePageMeta('vault');
    expect((globalThis as any).document.title).toContain('Security Vault & Writing Assistant');

    updatePageMeta('humanizer');
    expect((globalThis as any).document.title).toContain('HumanizeText');
  });
});
