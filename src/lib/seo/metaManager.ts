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
    title: 'AI Humanizer & Writing Assistant — Improve Clarity, Flow & Invariants | HumanizeText',
    description:
      'Improve sentence rhythm, burstiness, and natural human flow while preserving facts, citations, and numbers. Choose between 100% private on-device processing or ephemeral Cloudflare Workers AI.',
    canonicalPath: '/',
    ogType: 'website',
    schema: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          '@id': `${SITE_DOMAIN}/#organization`,
          name: 'HumanizeText',
          url: `${SITE_DOMAIN}/`,
          logo: {
            '@type': 'ImageObject',
            url: `${SITE_DOMAIN}/logo.png`,
            width: 512,
            height: 512,
          },
          image: `${SITE_DOMAIN}/logo.png`,
          sameAs: ['https://github.com/Achira621/HumanizeText'],
        },
        {
          '@type': 'WebSite',
          '@id': `${SITE_DOMAIN}/#website`,
          url: `${SITE_DOMAIN}/`,
          name: 'HumanizeText — Privacy-Focused Writing Quality Suite',
          description:
            'A privacy-conscious writing suite offering AI text humanization, burstiness analysis, local document similarity comparison, and zero-egress cryptographic tools.',
          inLanguage: 'en-US',
          publisher: { '@id': `${SITE_DOMAIN}/#organization` },
          sameAs: ['https://github.com/Achira621/HumanizeText'],
          potentialAction: {
            '@type': 'SearchAction',
            target: {
              '@type': 'EntryPoint',
              urlTemplate: `${SITE_DOMAIN}/?q={search_term_string}`,
            },
            'query-input': 'required name=search_term_string',
          },
        },
        {
          '@type': 'SoftwareApplication',
          '@id': `${SITE_DOMAIN}/#software`,
          name: 'HumanizeText Writing Suite & Humanizer',
          applicationCategory: 'ProductivityApplication',
          applicationSubCategory: 'Writing Assistant & Privacy Utility',
          operatingSystem: 'Any (Web Browser)',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
            availability: 'https://schema.org/InStock',
          },
          featureList: [
            'On-Device Local AI Text Humanizer (zero network egress)',
            'Ephemeral Cloudflare Workers AI with Bounded Concurrency',
            'Factual Invariant Preservation (Citations, Numbers, Negations)',
            'Perplexity & Burstiness Diagnostic Metrics',
            'Schleimer et al. Winnowing Document Similarity Checker',
            'IndexedDB AES-256-GCM Encrypted Security Vault',
          ],
          description:
            'Free, open-source writing assistant providing on-device text humanization, stylistic refinement, probabilistic AI detection diagnostics, and cryptographic document similarity.',
          sameAs: ['https://github.com/Achira621/HumanizeText'],
          keywords:
            'ai humanizer, text humanizer, sentence burstiness, writing assistant, privacy-first writing tool, document similarity, factual invariant preservation',
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
          ],
        },
        {
          '@type': 'HowTo',
          '@id': `${SITE_DOMAIN}/#howto`,
          name: 'How to Improve AI-Assisted Writing Clarity & Flow for Free',
          description:
            'Step-by-step tutorial on refining AI drafts into clear, authentic, and naturally flowing human prose with invariant preservation.',
          step: [
            {
              '@type': 'HowToStep',
              position: 1,
              name: 'Paste your draft text',
              text: 'Paste your draft into the HumanizeText editor. In Local mode, text never leaves your browser.',
            },
            {
              '@type': 'HowToStep',
              position: 2,
              name: 'Choose processing mode and style',
              text: 'Select on-device local heuristics or cloud AI inference, then configure your target tone (Natural, Academic, Creative, or Executive).',
            },
            {
              '@type': 'HowToStep',
              position: 3,
              name: 'Review sentence flow and factual integrity',
              text: 'Inspect side-by-side diffs to verify that key facts, statistics, citations, and terminology remain completely intact while sentence rhythm is improved.',
            },
          ],
        },
        {
          '@type': 'FAQPage',
          '@id': `${SITE_DOMAIN}/#faq`,
          mainEntity: [
            {
              '@type': 'Question',
              name: 'What does HumanizeText do and how does it improve writing?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'HumanizeText is an editorial and writing assistant designed to address mechanical, repetitive AI phrasing. It varies sentence length (burstiness), introduces natural stylistic transitions, and replaces generic AI cliches while enforcing strict preservation of factual invariants such as numbers, names, citations, and bracketed references.',
              },
            },
            {
              '@type': 'Question',
              name: 'Does HumanizeText guarantee that text will bypass all AI detectors?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'No tool can honestly guarantee a 100% bypass rate. AI detectors operate on statistical heuristics (perplexity and burstiness) that produce frequent false positives and false negatives. HumanizeText focuses on genuine stylistic improvement, clarity, and readability rather than deceptive evasion.',
              },
            },
            {
              '@type': 'Question',
              name: 'Is HumanizeText free to use?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Yes. HumanizeText is completely free and open-source under the Apache 2.0 license. There are no paid tiers, no forced account signups, and no artificial paywalls.',
              },
            },
            {
              '@type': 'Question',
              name: 'Does HumanizeText store or upload my text to remote servers?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'It depends strictly on the mode you select: In Local Engine mode (and for all plagiarism checking, metadata inspection, and vault storage), your text never leaves your device (0 bytes transmitted). When you select Cloud AI mode, submitted text is transmitted over HTTPS to our Cloudflare Workers AI edge endpoint for neural processing in volatile worker memory. Our worker application configures no database bindings and does not store or log your text.',
              },
            },
            {
              '@type': 'Question',
              name: 'How does the document similarity checker work?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'HumanizeText uses client-side cryptographic Winnowing (Schleimer et al.) with ephemeral HMAC-SHA-256 fingerprints to compare two documents locally. Documents are never uploaded to an external database or shared with third parties.',
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
  resources: {
    title: 'Writing & Research Resources Hub — Guides, Methodologies & Analysis | HumanizeText',
    description:
      'In-depth editorial guides on meaning preservation, probabilistic AI detector limitations, local vs cloud data boundaries, and cryptographic text similarity.',
    canonicalPath: '/resources',
    ogType: 'website',
    schema: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'CollectionPage',
          name: 'HumanizeText Research & Editorial Hub',
          description:
            'Original articles and technical guides exploring algorithmic text analysis, stylometry, privacy-preserving cryptography, and responsible writing workflows.',
          url: `${SITE_DOMAIN}/resources`,
        },
      ],
    },
  },
  about: {
    title: 'About HumanizeText — Open-Source Mission, Maintainers & Architecture',
    description:
      'Learn about HumanizeText, an independent open-source writing utility built for genuine privacy, transparent stylometric analysis, and cryptographic document protection.',
    canonicalPath: '/about',
    ogType: 'website',
    schema: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'AboutPage',
          '@id': `${SITE_DOMAIN}/about`,
          name: 'About HumanizeText',
          url: `${SITE_DOMAIN}/about`,
          description:
            'Open-source, privacy-first software project created to give writers, students, researchers, and professionals transparent control over their digital drafts.',
          publisher: { '@id': `${SITE_DOMAIN}/#organization` },
        },
      ],
    },
  },
  contact: {
    title: 'Contact & Support — Maintainer Communications & Issue Tracker | HumanizeText',
    description:
      'Reach the maintainer of HumanizeText for inquiries, technical support, bug reports, and security vulnerability disclosures.',
    canonicalPath: '/contact',
    ogType: 'website',
    schema: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'ContactPage',
          '@id': `${SITE_DOMAIN}/contact`,
          name: 'Contact & Technical Support',
          url: `${SITE_DOMAIN}/contact`,
          description: 'Direct maintainer communication and vulnerability disclosures for HumanizeText.',
          mainEntity: {
            '@type': 'Person',
            name: 'Achira621',
            email: 'varaddalvi10@gmail.com',
          },
        },
      ],
    },
  },
  'privacy-policy': {
    title: 'Privacy Policy & Cookie Disclosures — Local vs Cloud Data Flow | HumanizeText',
    description:
      'Comprehensive privacy policy detailing on-device execution, ephemeral Cloudflare Workers AI processing, local IndexedDB encryption, and Google AdSense cookie disclosures.',
    canonicalPath: '/privacy-policy',
    ogType: 'website',
    schema: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebPage',
          '@id': `${SITE_DOMAIN}/privacy-policy`,
          name: 'Privacy Policy & Data Disclosures',
          url: `${SITE_DOMAIN}/privacy-policy`,
          description:
            'Comprehensive disclosure of local on-device execution, ephemeral Cloudflare Workers AI processing, and third-party advertising cookies.',
        },
      ],
    },
  },
  terms: {
    title: 'Terms of Service & Acceptable Use — Apache 2.0 Open Source | HumanizeText',
    description:
      'Terms of service, academic integrity guidance, probabilistic disclaimers, and open-source licensing terms for HumanizeText.',
    canonicalPath: '/terms',
    ogType: 'website',
    schema: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebPage',
          '@id': `${SITE_DOMAIN}/terms`,
          name: 'Terms of Service & Acceptable Use',
          url: `${SITE_DOMAIN}/terms`,
          description:
            'Open-source licensing, acceptable use policies, and ethical authorship guidelines for HumanizeText.',
        },
      ],
    },
  },
  methodology: {
    title: 'Editorial & Testing Methodology — Invariant Verification & Benchmarks | HumanizeText',
    description:
      'How HumanizeText verifies factual invariants, evaluates burstiness variance, implements Schleimer et al. Winnowing, and prevents text degradation.',
    canonicalPath: '/methodology',
    ogType: 'article',
    schema: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'TechArticle',
          '@id': `${SITE_DOMAIN}/methodology`,
          headline: 'Editorial & Testing Methodology: Invariant Verification, Burstiness Math, and Winnowing',
          url: `${SITE_DOMAIN}/methodology`,
          description:
            'Transparent documentation of the HumanizeText invariant validation pipeline, sentence length variance calculations, and regression test suites.',
          author: {
            '@type': 'Organization',
            name: 'HumanizeText Research Team',
          },
          publisher: { '@id': `${SITE_DOMAIN}/#organization` },
        },
      ],
    },
  },
  'detector-limitations': {
    title: 'AI Detector Limitations & Scientific Evaluation — Why Classifiers Fail | HumanizeText',
    description:
      'Technical critique of AI text detectors: perplexity biases, non-native English false positives, false negatives, and responsible interpretation of similarity metrics.',
    canonicalPath: '/detector-limitations',
    ogType: 'article',
    schema: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'TechArticle',
          '@id': `${SITE_DOMAIN}/detector-limitations`,
          headline: 'AI Detector Limitations & Scientific Evaluation: Why Classifiers Fail',
          url: `${SITE_DOMAIN}/detector-limitations`,
          description:
            'Scientific evaluation of why statistical AI detectors produce high false positive rates on non-native English writing and technical standards.',
          author: {
            '@type': 'Organization',
            name: 'HumanizeText Research Team',
          },
          publisher: { '@id': `${SITE_DOMAIN}/#organization` },
        },
      ],
    },
  },
};

export function updatePageMeta(tab: string): void {
  const meta = PAGE_METADATA[tab] || PAGE_METADATA.humanizer;
  const canonicalUrl = `${SITE_DOMAIN}${meta.canonicalPath === '/' ? '/' : meta.canonicalPath}`;
  const socialImage = `${SITE_DOMAIN}/logo.png`;

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

  // Check standard clean pathname first (e.g. /ai-detector, /plagiarism-checker, /resources, /about)
  const pathname = window.location.pathname.replace(/^\/+|\/+$/g, '').trim().toLowerCase();
  if (pathname === 'ai-detector' || pathname === 'detector') return 'ai-detector';
  if (pathname === 'metadata-inspector' || pathname === 'metadata') return 'metadata-inspector';
  if (pathname === 'plagiarism-checker' || pathname === 'similarity') return 'plagiarism-checker';
  if (pathname === 'paraphrase' || pathname === 'paraphrasing-tool') return 'paraphrase';
  if (pathname === 'how-to-humanize' || pathname === 'guide') return 'how-to-humanize';
  if (pathname === 'privacy-lab') return 'privacy-lab';
  if (pathname === 'vault') return 'vault';
  if (pathname === 'docs' || pathname === 'threat-model') return 'docs';
  if (pathname === 'resources' || pathname === 'editorial' || pathname === 'guides') return 'resources';
  if (pathname === 'about') return 'about';
  if (pathname === 'contact' || pathname === 'support') return 'contact';
  if (pathname === 'privacy-policy' || pathname === 'privacy') return 'privacy-policy';
  if (pathname === 'terms' || pathname === 'terms-of-service') return 'terms';
  if (pathname === 'methodology') return 'methodology';
  if (pathname === 'detector-limitations') return 'detector-limitations';

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
  if (rawHash === 'resources' || rawHash === 'editorial' || rawHash === 'guides') return 'resources';
  if (rawHash === 'about') return 'about';
  if (rawHash === 'contact' || rawHash === 'support') return 'contact';
  if (rawHash === 'privacy-policy' || rawHash === 'privacy') return 'privacy-policy';
  if (rawHash === 'terms' || rawHash === 'terms-of-service') return 'terms';
  if (rawHash === 'methodology') return 'methodology';
  if (rawHash === 'detector-limitations') return 'detector-limitations';

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
  if (tab === 'resources') return '/resources';
  if (tab === 'about') return '/about';
  if (tab === 'contact') return '/contact';
  if (tab === 'privacy-policy') return '/privacy-policy';
  if (tab === 'terms') return '/terms';
  if (tab === 'methodology') return '/methodology';
  if (tab === 'detector-limitations') return '/detector-limitations';
  return '/';
}
