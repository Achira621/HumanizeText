import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PAGE_METADATA, SITE_DOMAIN } from '../../src/lib/seo/metaManager';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../../dist');

describe('Static Pre-rendering & SEO Regression Suite', () => {
  const routesToTest = [
    {
      tab: 'humanizer',
      path: '/',
      expectedH1: 'Refine AI Text & Sentence Rhythm',
      requiredSnippets: [
        'Data Architecture: Local Engine vs. Ephemeral Cloud AI',
        'Frequently Asked Questions',
        'Can any tool guarantee a 100% bypass rate on AI detectors?',
        'Does HumanizeText store or upload my text to remote servers?',
      ],
      forbiddenSnippets: [
        'aggregateRating',
        'ratingValue',
        '100% Bypass',
        'Turnitin Bypass',
        '1,284',
        '4.9/5',
        '100% uploaded to remote databases',
        'Commercial Cloud Humanizers',
      ],
    },
    {
      tab: 'resources',
      path: '/resources',
      expectedH1: 'Writing & Research Resources',
      requiredSnippets: [
        'How HumanizeText Preserves Meaning in Multi-Paragraph Documents',
        'How AI-Text Detection Works and Why Scores Can Be Wrong',
        'Local Processing vs. Cloud AI: What Happens to Your Text?',
        'How to Evaluate Paraphrasing Quality',
        'A Practical Guide to Revising Academic and Technical Writing',
        'How Text Similarity Checking Works: Winnowing & Shingling',
      ],
      forbiddenSnippets: [
        'AI Humanizer & Writing Assistant — Refine Rhythm, Clarity & Invariants',
      ],
    },
    {
      tab: 'about',
      path: '/about',
      expectedH1: 'About HumanizeText',
      requiredSnippets: [
        'Achira621',
        'Apache 2.0',
        'Our Mission & Editorial Philosophy',
        'Project Governance & Authorship',
      ],
      forbiddenSnippets: [],
    },
    {
      tab: 'contact',
      path: '/contact',
      expectedH1: 'Contact & Technical Support',
      requiredSnippets: [
        'varaddalvi10@gmail.com',
        'Achira621',
        'GitHub Issues',
        'vulnerability disclosures',
      ],
      forbiddenSnippets: [],
    },
    {
      tab: 'privacy-policy',
      path: '/privacy-policy',
      expectedH1: 'Privacy Policy & Data Disclosures',
      requiredSnippets: [
        'Dual Architecture: Local Processing vs. Cloud Inference',
        'Cloudflare Workers AI Edge Inference',
        'AES-256-GCM',
        'Google AdSense',
        'pagead2.googlesyndication.com',
        'aboutads.info',
      ],
      forbiddenSnippets: [],
    },
    {
      tab: 'terms',
      path: '/terms',
      expectedH1: 'Terms of Service',
      requiredSnippets: [
        'Apache 2.0',
        'Academic Integrity & Ethical AI Usage',
        'AI Classifier Disclaimer & Limitations',
      ],
      forbiddenSnippets: [],
    },
    {
      tab: 'methodology',
      path: '/methodology',
      expectedH1: 'Editorial & Testing Methodology',
      requiredSnippets: [
        'The Factual Invariant Validation Pipeline',
        'Stylometric Scoring & Sentence Burstiness',
        'Cryptographic Similarity Verification (Winnowing)',
        'Schleimer, Wilkerson, & Aiken',
      ],
      forbiddenSnippets: [],
    },
    {
      tab: 'detector-limitations',
      path: '/detector-limitations',
      expectedH1: 'AI Detector Limitations & Uncertainty',
      requiredSnippets: [
        'How AI Detectors Actually Work',
        'Perplexity',
        'Burstiness',
        'Non-Native English Writers (ESL / EFL)',
        'Guidelines for Responsible Interpretation',
      ],
      forbiddenSnippets: [],
    },
  ];

  beforeAll(async () => {
    // Confirm dist/ exists before running tests
    const distExists = await fs
      .access(path.join(distDir, 'index.html'))
      .then(() => true)
      .catch(() => false);

    expect(distExists).toBe(true);
  });

  for (const route of routesToTest) {
    describe(`Route: ${route.path} (${route.tab})`, () => {
      let htmlContent: string;
      const expectedCanonical = `${SITE_DOMAIN}${route.path === '/' ? '/' : route.path}`;
      const expectedMeta = PAGE_METADATA[route.tab];

      beforeAll(async () => {
        const filePath =
          route.path === '/'
            ? path.join(distDir, 'index.html')
            : path.join(distDir, route.path.replace(/^\//, ''), 'index.html');

        htmlContent = await fs.readFile(filePath, 'utf-8');
      });

      it('should have a pre-rendered HTML file in dist/', () => {
        expect(htmlContent).toBeDefined();
        expect(htmlContent.length).toBeGreaterThan(10000);
      });

      it('should contain the exact unique title matching PAGE_METADATA', () => {
        const titleMatch = htmlContent.match(/<title>(.*?)<\/title>/i);
        expect(titleMatch).not.toBeNull();
        expect(titleMatch![1]).toBe(expectedMeta.title.replace(/&/g, '&amp;'));
      });

      it('should contain the exact unique canonical URL', () => {
        const canonicalMatch = htmlContent.match(/<link\s+rel="canonical"\s+href="(.*?)"/i);
        expect(canonicalMatch).not.toBeNull();
        expect(canonicalMatch![1]).toBe(expectedCanonical);
      });

      it('should contain the exact OpenGraph and Twitter URLs', () => {
        expect(htmlContent).toContain(`property="og:url" content="${expectedCanonical}"`);
      });

      it('should contain the route-specific primary heading h1', () => {
        const h1Match = htmlContent.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
        expect(h1Match).not.toBeNull();
        const actualH1 = h1Match![1].replace(/&amp;/g, '&').replace(/<[^>]*>/g, '').trim();
        expect(actualH1).toContain(route.expectedH1);
      });

      it('should contain meaningful, route-specific content in initial HTML', () => {
        const normalizedHtml = htmlContent.replace(/&amp;/g, '&');
        for (const snippet of route.requiredSnippets) {
          expect(normalizedHtml, `Missing snippet "${snippet}" in route ${route.path}`).toContain(snippet);
        }
      });

      if (route.forbiddenSnippets.length > 0) {
        it('should NOT contain forbidden bypass claims, fake ratings, or unsupported statements', () => {
          for (const forbidden of route.forbiddenSnippets) {
            expect(htmlContent).not.toContain(forbidden);
          }
        });
      }

      if (expectedMeta.schema) {
        it('should contain route-specific JSON-LD structured data', () => {
          expect(htmlContent).toContain('id="page-schema-jsonld"');
          expect(htmlContent).toContain('application/ld+json');
        });
      }
    });
  }
});
