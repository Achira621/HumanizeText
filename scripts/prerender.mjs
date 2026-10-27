import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import React from 'react';
import { renderToString } from 'react-dom/server';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.resolve(rootDir, 'dist');

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function prerender() {
  const templatePath = path.join(distDir, 'index.html');
  try {
    await fs.access(templatePath);
  } catch {
    console.error(`[prerender] Error: dist/index.html not found. Run "vite build" first.`);
    process.exit(1);
  }

  const baseHtml = await fs.readFile(templatePath, 'utf-8');

  // Launch Vite SSR runner to execute React components in Node
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
    root: rootDir,
  });

  try {
    const { PAGE_METADATA, SITE_DOMAIN } = await vite.ssrLoadModule('./src/lib/seo/metaManager.ts');
    const { App } = await vite.ssrLoadModule('./src/App.tsx');

    const routes = [
      { tab: 'humanizer', path: '/' },
      { tab: 'resources', path: '/resources' },
      { tab: 'about', path: '/about' },
      { tab: 'contact', path: '/contact' },
      { tab: 'privacy-policy', path: '/privacy-policy' },
      { tab: 'terms', path: '/terms' },
      { tab: 'methodology', path: '/methodology' },
      { tab: 'detector-limitations', path: '/detector-limitations' },
      { tab: 'how-to-humanize', path: '/how-to-humanize' },
      { tab: 'ai-detector', path: '/ai-detector' },
      { tab: 'plagiarism-checker', path: '/plagiarism-checker' },
      { tab: 'paraphrase', path: '/paraphrase' },
      { tab: 'metadata-inspector', path: '/metadata-inspector' },
      { tab: 'privacy-lab', path: '/privacy-lab' },
      { tab: 'vault', path: '/vault' },
      { tab: 'docs', path: '/docs' },
    ];

    console.log(`\n========================================================`);
    console.log(`  HumanizeText Static Pre-rendering Engine`);
    console.log(`  Generating Route-Specific HTML & Canonical Metadata`);
    console.log(`========================================================\n`);

    for (const route of routes) {
      const meta = PAGE_METADATA[route.tab] || PAGE_METADATA.humanizer;
      const canonicalUrl = `${SITE_DOMAIN}${route.path === '/' ? '/' : route.path}`;

      // Render React App with route pre-selected
      const appHtml = renderToString(React.createElement(App, { initialTab: route.tab }));

      let html = baseHtml;

      // 1. Inject rendered React tree inside <div id="root">...</div>
      const rootStartTag = '<div id="root">';
      const rootStartIndex = html.indexOf(rootStartTag);
      const scriptTagIndex = html.lastIndexOf('<script');

      if (rootStartIndex !== -1 && scriptTagIndex !== -1 && scriptTagIndex > rootStartIndex) {
        const closingDivIndex = html.lastIndexOf('</div>', scriptTagIndex);
        if (closingDivIndex !== -1 && closingDivIndex > rootStartIndex) {
          html =
            html.substring(0, rootStartIndex + rootStartTag.length) +
            appHtml +
            html.substring(closingDivIndex);
        } else {
          html = html.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`);
        }
      } else {
        html = html.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`);
      }

      // 2. Replace <title>
      html = html.replace(
        /<title>[\s\S]*?<\/title>/i,
        `<title>${escapeHtml(meta.title)}</title>`
      );

      // 3. Replace <meta name="description" content="..." />
      html = html.replace(
        /<meta\s+name="description"\s+content="[\s\S]*?"\s*\/?>/i,
        `<meta name="description" content="${escapeHtml(meta.description)}" />`
      );

      // 4. Replace <link rel="canonical" href="..." />
      html = html.replace(
        /<link\s+rel="canonical"\s+href="[\s\S]*?"\s*\/?>/i,
        `<link rel="canonical" href="${canonicalUrl}" />`
      );

      // 5. Replace Open Graph tags
      html = html.replace(
        /<meta\s+property="og:title"\s+content="[\s\S]*?"\s*\/?>/i,
        `<meta property="og:title" content="${escapeHtml(meta.title)}" />`
      );
      html = html.replace(
        /<meta\s+property="og:description"\s+content="[\s\S]*?"\s*\/?>/i,
        `<meta property="og:description" content="${escapeHtml(meta.description)}" />`
      );
      html = html.replace(
        /<meta\s+property="og:url"\s+content="[\s\S]*?"\s*\/?>/i,
        `<meta property="og:url" content="${canonicalUrl}" />`
      );
      html = html.replace(
        /<meta\s+property="og:type"\s+content="[\s\S]*?"\s*\/?>/i,
        `<meta property="og:type" content="${meta.ogType || 'website'}" />`
      );

      // 6. Replace Twitter / X card tags
      html = html.replace(
        /<meta\s+name="twitter:title"\s+content="[\s\S]*?"\s*\/?>/i,
        `<meta name="twitter:title" content="${escapeHtml(meta.title)}" />`
      );
      html = html.replace(
        /<meta\s+name="twitter:description"\s+content="[\s\S]*?"\s*\/?>/i,
        `<meta name="twitter:description" content="${escapeHtml(meta.description)}" />`
      );

      // 7. Replace or inject JSON-LD schema
      const schemaTag = meta.schema
        ? `<script type="application/ld+json" id="page-schema-jsonld">\n${JSON.stringify(meta.schema, null, 2)}\n    </script>`
        : '';

      if (html.includes('id="page-schema-jsonld"')) {
        html = html.replace(
          /<script\s+type="application\/ld\+json"\s+id="page-schema-jsonld">[\s\S]*?<\/script>/i,
          schemaTag
        );
      } else if (schemaTag) {
        html = html.replace('</head>', `  ${schemaTag}\n  </head>`);
      }

      // 8. Write to target destination
      let outFilePath;
      if (route.path === '/') {
        outFilePath = path.join(distDir, 'index.html');
      } else {
        const subDir = path.join(distDir, route.path.replace(/^\//, ''));
        await fs.mkdir(subDir, { recursive: true });
        outFilePath = path.join(subDir, 'index.html');
      }

      await fs.writeFile(outFilePath, html, 'utf-8');
      const stat = await fs.stat(outFilePath);
      console.log(`[PASS] ${route.path.padEnd(24)} -> ${outFilePath.replace(rootDir, '').padEnd(36)} (${(stat.size / 1024).toFixed(1)} kB)`);
    }

    console.log(`\n[prerender] Pre-rendering complete for ${routes.length} routes.`);
  } finally {
    await vite.close();
  }
}

prerender().catch((err) => {
  console.error('[prerender] Fatal error:', err);
  process.exit(1);
});
