import type { ActiveTab } from '../../components/common/Header';

export interface PageMeta {
  title: string;
  description: string;
  canonicalPath: string;
  ogType?: string;
  schema?: Record<string, any>;
}

export const SITE_DOMAIN = 'https://humanizetext-nine.vercel.app';

export const PAGE_METADATA: Record<string, PageMeta> = {
  humanizer: {
    title: 'HumanizeText | Free AI Text Detector & Text Humanizer',
    description:
      'Check text for AI-like writing patterns and make your writing sound more natural with HumanizeText. Explore privacy-focused text tools online.',
    canonicalPath: '/',
    ogType: 'website',
    schema: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebSite',
          '@id': `${SITE_DOMAIN}/#website`,
          url: `${SITE_DOMAIN}/`,
          name: 'HumanizeText',
          description:
            'Privacy-first platform for making writing sound natural, checking AI-generated patterns, and comparing document similarity.',
          inLanguage: 'en-US',
        },
        {
          '@type': 'SoftwareApplication',
          '@id': `${SITE_DOMAIN}/#software`,
          name: 'HumanizeText Free AI Humanizer & Detector',
          applicationCategory: 'ProductivityApplication',
          operatingSystem: 'Any (Web Browser)',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
          },
          description:
            'Free privacy-first AI text humanizer, AI detector, and similarity scanner with local in-browser heuristics and ephemeral zero-log Cloudflare edge inference.',
        },
        {
          '@type': 'FAQPage',
          '@id': `${SITE_DOMAIN}/#faq`,
          mainEntity: [
            {
              '@type': 'Question',
              name: 'Does HumanizeText store or upload my text to remote servers?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'No. HumanizeText provides a 100% on-device local engine (zero bytes transmitted) alongside an ephemeral, zero-retention Cloudflare Workers AI edge model. Under neither mode is your text stored, logged to disk, or used for model training.',
              },
            },
            {
              '@type': 'Question',
              name: 'How does the AI text humanizer make writing sound natural?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'The engine analyzes sentence length variance (burstiness), vocabulary entropy (perplexity), repetitive transitions, and robotic AI clichés. It restructures sentences with natural human cadence, active voice, and diverse vocabulary.',
              },
            },
            {
              '@type': 'Question',
              name: 'Is HumanizeText free to use?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Yes. All core writing tools—including the AI Humanizer, Plagiarism Checker, AI Detector, and Paraphraser—are 100% free with no account creation or subscription required.',
              },
            },
          ],
        },
      ],
    },
  },
  'ai-detector': {
    title: 'AI Detector — Free AI Text & Image Detection | HumanizeText',
    description:
      'Scan text and images for ChatGPT, Claude, and synthetic generation patterns using hybrid on-device neural analysis, stylistic heuristics, and image forensics.',
    canonicalPath: '/ai-detector',
    ogType: 'website',
    schema: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'SoftwareApplication',
          name: 'HumanizeText AI Detector',
          applicationCategory: 'UtilityApplication',
          operatingSystem: 'Any (Web Browser)',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
          },
          description:
            'Hybrid AI detection engine analyzing vocabulary uniformity, burstiness, repetitive phraseology, and high-frequency Fourier image artifacts.',
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Home',
              item: `${SITE_DOMAIN}/`,
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'AI Detector',
              item: `${SITE_DOMAIN}/ai-detector`,
            },
          ],
        },
      ],
    },
  },
  'plagiarism-checker': {
    title: 'Free Online Plagiarism Checker — Zero-Upload Document Comparison | HumanizeText',
    description:
      'Compare PDF, DOCX, and text documents locally using cryptographic Winnowing and ephemeral HMAC-SHA-256. Zero file uploads, zero server databases, zero data leakage.',
    canonicalPath: '/plagiarism-checker',
    ogType: 'website',
    schema: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'SoftwareApplication',
          name: 'HumanizeText Cryptographic Plagiarism Checker',
          applicationCategory: 'EducationalApplication',
          operatingSystem: 'Any (Web Browser)',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
          },
          description:
            'Cryptographic document similarity checker executing Schleimer et al. Winnowing with ephemeral HMAC-SHA-256 session keys locally in your browser.',
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Home',
              item: `${SITE_DOMAIN}/`,
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Plagiarism Checker',
              item: `${SITE_DOMAIN}/plagiarism-checker`,
            },
          ],
        },
      ],
    },
  },
  paraphrase: {
    title: 'Free Paraphrasing Tool — Rephrase Clearly with Citation Protection | HumanizeText',
    description:
      'Free online paraphrasing tool. Restructure sentences for academic rigor, conciseness, or natural flow while protecting in-text citations and preventing unintentional mosaic plagiarism.',
    canonicalPath: '/paraphrase',
    ogType: 'website',
    schema: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'SoftwareApplication',
          name: 'HumanizeText Free Paraphrasing Tool',
          applicationCategory: 'EducationalApplication',
          operatingSystem: 'Any (Web Browser)',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
          },
          description:
            'Private paraphrasing engine with academic, concise, and natural modes that preserves in-text citations and defends against mosaic plagiarism.',
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Home',
              item: `${SITE_DOMAIN}/`,
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Paraphrasing Tool',
              item: `${SITE_DOMAIN}/paraphrase`,
            },
          ],
        },
      ],
    },
  },
  'how-to-humanize': {
    title: 'How to Humanize AI-Assisted Writing — Practical Editorial Guide | HumanizeText',
    description:
      'Comprehensive editorial guide on humanizing AI-generated text. Master sentence burstiness, purge AI cliches, inject personal voice, verify citations, and protect data privacy.',
    canonicalPath: '/how-to-humanize',
    ogType: 'article',
    schema: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Article',
          headline: 'How to Humanize AI-Assisted Writing: A Practical Guide to Rhythm, Clarity & Voice',
          description:
            'A comprehensive editorial guide to transforming mechanical AI-generated prose into nuanced, authentic writing while maintaining factual and intellectual integrity.',
          author: {
            '@type': 'Organization',
            name: 'HumanizeText Research Team',
          },
          publisher: {
            '@type': 'Organization',
            name: 'HumanizeText',
            url: SITE_DOMAIN,
          },
          mainEntityOfPage: `${SITE_DOMAIN}/how-to-humanize`,
          inLanguage: 'en-US',
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Home',
              item: `${SITE_DOMAIN}/`,
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Writing Guide',
              item: `${SITE_DOMAIN}/how-to-humanize`,
            },
          ],
        },
      ],
    },
  },
  'metadata-inspector': {
    title: 'Metadata & Signature Inspector — Client-Side EXIF & GPS Scrubber | HumanizeText',
    description:
      'Inspect and sanitize EXIF, GPS location coordinates, camera models, and AI generator parameter chunks locally inside your browser before sharing images.',
    canonicalPath: '/metadata-inspector',
    ogType: 'website',
    schema: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'SoftwareApplication',
          name: 'HumanizeText Metadata & Signature Inspector',
          applicationCategory: 'SecurityApplication',
          operatingSystem: 'Any (Web Browser)',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
          },
          description:
            'Client-side image metadata inspector and EXIF/GPS cleaner for privacy-conscious creators and journalists.',
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Home',
              item: `${SITE_DOMAIN}/`,
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Metadata Inspector',
              item: `${SITE_DOMAIN}/metadata-inspector`,
            },
          ],
        },
      ],
    },
  },
  'privacy-lab': {
    title: 'Interactive Privacy Lab — Cryptographic Proof & Egress Auditor | HumanizeText',
    description:
      'Interactive cryptography laboratory: verify SHA-256 document fingerprints, test keyed vs unkeyed hashes, probe AES-256-GCM authenticated tamper resistance, and run the live zero-egress auditor.',
    canonicalPath: '/privacy-lab',
    ogType: 'website',
    schema: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'SoftwareApplication',
          name: 'HumanizeText Interactive Privacy Lab',
          applicationCategory: 'SecurityApplication',
          operatingSystem: 'Any (Web Browser)',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
          },
          description:
            'Cryptographic verification environment proving client-side security, zero network egress, and AES-256-GCM tamper resistance.',
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Home',
              item: `${SITE_DOMAIN}/`,
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Privacy Lab',
              item: `${SITE_DOMAIN}/privacy-lab`,
            },
          ],
        },
      ],
    },
  },
  vault: {
    title: 'Security Vault & Writing Assistant — Zero-Knowledge AES-256-GCM Storage | HumanizeText',
    description:
      'Store confidential manuscripts securely in browser IndexedDB with AES-256-GCM encryption and on-device writing analysis. Zero cloud storage, zero password transmission.',
    canonicalPath: '/vault',
    ogType: 'website',
    schema: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'SoftwareApplication',
          name: 'HumanizeText Security Vault & Writing Assistant',
          applicationCategory: 'SecurityApplication',
          operatingSystem: 'Any (Web Browser)',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
          },
          description:
            'Zero-knowledge client-side encrypted document store and writing assistant utilizing AES-256-GCM and PBKDF2 key derivation within browser IndexedDB.',
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Home',
              item: `${SITE_DOMAIN}/`,
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Security Vault & Writing Assistant',
              item: `${SITE_DOMAIN}/vault`,
            },
          ],
        },
      ],
    },
  },
  docs: {
    title: 'Security Architecture, Threat Model & Cryptographic Research | HumanizeText',
    description:
      'Read HumanizeText’s formal threat model, architecture decision records, paper citations (Schleimer et al., Bellare et al.), and cryptographic limitations.',
    canonicalPath: '/docs',
    ogType: 'article',
    schema: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Article',
          headline: 'HumanizeText Security Architecture, Formal Threat Model & Cryptographic Foundation',
          author: {
            '@type': 'Organization',
            name: 'HumanizeText Security Research',
          },
          publisher: {
            '@type': 'Organization',
            name: 'HumanizeText',
            url: SITE_DOMAIN,
          },
          mainEntityOfPage: `${SITE_DOMAIN}/docs`,
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Home',
              item: `${SITE_DOMAIN}/`,
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Documentation',
              item: `${SITE_DOMAIN}/docs`,
            },
          ],
        },
      ],
    },
  },
};

export function updatePageMeta(tab: string): void {
  const meta = PAGE_METADATA[tab] || PAGE_METADATA.humanizer;
  const canonicalUrl = `${SITE_DOMAIN}${meta.canonicalPath === '/' ? '/' : meta.canonicalPath}`;
  const socialImage = `${SITE_DOMAIN}/favicon.svg`;

  // Update Title
  document.title = meta.title;

  // Update Meta Description
  let descTag = document.querySelector<HTMLMetaElement>('meta[name="description"]');
  if (!descTag) {
    descTag = document.createElement('meta');
    descTag.setAttribute('name', 'description');
    document.head.appendChild(descTag);
  }
  descTag.setAttribute('content', meta.description);

  // Remove obsolete/harmful meta keywords tag if present
  const kwTag = document.querySelector<HTMLMetaElement>('meta[name="keywords"]');
  if (kwTag) {
    kwTag.remove();
  }

  // Update Canonical Link tag (CRITICAL for indexing)
  let canonicalTag = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonicalTag) {
    canonicalTag = document.createElement('link');
    canonicalTag.setAttribute('rel', 'canonical');
    document.head.appendChild(canonicalTag);
  }
  canonicalTag.setAttribute('href', canonicalUrl);

  // Helper for OpenGraph / Twitter tags
  const setMetaTag = (attr: 'name' | 'property', key: string, value: string) => {
    let tag = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute(attr, key);
      document.head.appendChild(tag);
    }
    tag.setAttribute('content', value);
  };

  // OpenGraph Tags
  setMetaTag('property', 'og:title', meta.title);
  setMetaTag('property', 'og:description', meta.description);
  setMetaTag('property', 'og:url', canonicalUrl);
  setMetaTag('property', 'og:type', meta.ogType || 'website');
  setMetaTag('property', 'og:site_name', 'HumanizeText');
  setMetaTag('property', 'og:image', socialImage);

  // Twitter / X Card Tags
  setMetaTag('name', 'twitter:card', 'summary_large_image');
  setMetaTag('name', 'twitter:title', meta.title);
  setMetaTag('name', 'twitter:description', meta.description);
  setMetaTag('name', 'twitter:image', socialImage);

  // Update JSON-LD Script tag
  const existingScript = document.getElementById('page-schema-jsonld');
  if (existingScript) {
    existingScript.remove();
  }

  if (meta.schema) {
    const script = document.createElement('script');
    script.id = 'page-schema-jsonld';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(meta.schema);
    document.head.appendChild(script);
  }
}

export function getTabFromLocation(): ActiveTab {
  if (typeof window === 'undefined') return 'humanizer';

  // Check standard clean pathname first (e.g. /ai-detector, /plagiarism-checker)
  const pathname = window.location.pathname.replace(/^\/+|\/+$/g, '').trim().toLowerCase();
  if (pathname === 'ai-detector' || pathname === 'detector') return 'ai-detector';
  if (pathname === 'metadata-inspector' || pathname === 'metadata') return 'metadata-inspector';
  if (pathname === 'plagiarism-checker' || pathname === 'similarity') return 'plagiarism-checker';
  if (pathname === 'paraphrase' || pathname === 'paraphrasing-tool') return 'paraphrase';
  if (pathname === 'how-to-humanize' || pathname === 'guide') return 'how-to-humanize';
  if (pathname === 'privacy-lab') return 'privacy-lab';
  if (pathname === 'vault') return 'vault';
  if (pathname === 'docs' || pathname === 'threat-model') return 'docs';

  // Fallback to checking hash for backwards compatibility (e.g. #/ai-detector)
  const rawHash = window.location.hash.replace(/^#\/?/, '').trim().toLowerCase();
  if (rawHash === 'ai-detector' || rawHash === 'detector') return 'ai-detector';
  if (rawHash === 'metadata-inspector' || rawHash === 'metadata') return 'metadata-inspector';
  if (rawHash === 'plagiarism-checker' || rawHash === 'similarity') return 'plagiarism-checker';
  if (rawHash === 'paraphrase' || rawHash === 'paraphrasing-tool') return 'paraphrase';
  if (rawHash === 'how-to-humanize' || rawHash === 'guide') return 'how-to-humanize';
  if (rawHash === 'privacy-lab') return 'privacy-lab';
  if (rawHash === 'vault') return 'vault';
  if (rawHash === 'docs' || rawHash === 'threat-model') return 'docs';

  return 'humanizer';
}

export function getPathFromTab(tab: ActiveTab): string {
  if (tab === 'humanizer' || tab === 'editor') return '/';
  if (tab === 'ai-detector') return '/ai-detector';
  if (tab === 'metadata-inspector') return '/metadata-inspector';
  if (tab === 'plagiarism-checker' || tab === 'similarity') return '/plagiarism-checker';
  if (tab === 'paraphrase') return '/paraphrase';
  if (tab === 'how-to-humanize') return '/how-to-humanize';
  if (tab === 'privacy-lab') return '/privacy-lab';
  if (tab === 'vault') return '/vault';
  if (tab === 'docs') return '/docs';
  return '/';
}
