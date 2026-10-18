export interface PageMeta {
  title: string;
  description: string;
  keywords: string;
  canonicalPath: string;
  ogType?: string;
  schema?: Record<string, any>;
}

export const PAGE_METADATA: Record<string, PageMeta> = {
  humanizer: {
    title: 'Free AI Humanizer — Make AI Text Sound Human & Natural (100% Private) | HumanizeText',
    description:
      'Free online AI text humanizer. Improve sentence flow, vary rhythm, and eliminate AI cliches with zero cloud data transmission. 100% on-device processing via browser engine and optional WebGPU.',
    keywords:
      'free ai humanizer, humanize ai text, bypass ai detection, make ai text sound human, private text humanizer, on-device ai, ai to human text converter, natural writing editor',
    canonicalPath: '#/',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'HumanizeText Free AI Humanizer',
      applicationCategory: 'ProductivityApplication',
      operatingSystem: 'Any (Web Browser)',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      description:
        'Zero-server AI text humanizer and sentence flow optimizer running 100% locally in the browser with cryptographic privacy.',
    },
  },
  'plagiarism-checker': {
    title: 'Free Online Plagiarism Checker — Zero-Upload Document Comparison | HumanizeText',
    description:
      'Free private plagiarism checker. Compare PDF, DOCX, and text documents locally using cryptographic Winnowing and ephemeral HMAC-SHA-256. Zero file uploads, zero server databases, zero data leakage.',
    keywords:
      'free online plagiarism checker, private plagiarism checker, local document comparison, winnowing algorithm, check similarity without uploading, turnitin alternative private, cryptographic similarity',
    canonicalPath: '#/plagiarism-checker',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'HumanizeText Free Online Plagiarism Checker',
      applicationCategory: 'UtilityApplication',
      operatingSystem: 'Any (Web Browser)',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      description:
        'Cryptographic document similarity checker executing Schleimer et al. Winnowing with ephemeral HMAC-SHA-256 session keys locally in your browser.',
    },
  },
  paraphrase: {
    title: 'Free Paraphrasing Tool — Rephrase Clearly with Citation Protection | HumanizeText',
    description:
      'Free online paraphrasing tool. Restructure sentences for academic rigor, conciseness, or natural flow while protecting in-text citations and preventing unintentional mosaic plagiarism.',
    keywords:
      'free paraphrasing tool, rephrase text online, academic paraphraser, avoid mosaic plagiarism, sentence rewriter private, citation-safe paraphrasing, rewrite text free',
    canonicalPath: '#/paraphrase',
    schema: {
      '@context': 'https://schema.org',
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
  },
  'how-to-humanize': {
    title: 'How to Humanize AI-Assisted Writing — Practical Editorial Guide | HumanizeText',
    description:
      'Comprehensive editorial guide on humanizing AI-generated text. Master sentence burstiness, purge AI cliches, inject personal voice, verify citations, and protect data privacy.',
    keywords:
      'how to humanize ai writing, make ai writing sound natural, ai sentence burstiness, remove ai cliches, edit chatgpt text, academic writing ai editing, data privacy in writing',
    canonicalPath: '#/how-to-humanize',
    schema: {
      '@context': 'https://schema.org',
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
      },
    },
  },
  'privacy-lab': {
    title: 'Interactive Privacy Lab — Cryptographic Proof & Egress Auditor | HumanizeText',
    description:
      'Interactive cryptography laboratory: verify SHA-256 document fingerprints, test keyed vs unkeyed hashes, probe AES-256-GCM authenticated tamper resistance, and run the live zero-egress auditor.',
    keywords:
      'browser cryptography, sha256 integrity, aes256 gcm tamper test, pbkdf2 benchmark, network egress auditor, web crypto api demo',
    canonicalPath: '#/privacy-lab',
  },
  vault: {
    title: 'Encrypted Local Vault — Zero-Knowledge AES-256-GCM Storage | HumanizeText',
    description:
      'Store confidential manuscripts securely in browser IndexedDB with AES-256-GCM encryption and 600,000 PBKDF2 iterations. Zero cloud storage, zero password transmission.',
    keywords:
      'encrypted document vault, zero knowledge local storage, aes256 gcm indexeddb, pbkdf2 browser encryption, secure draft storage',
    canonicalPath: '#/vault',
  },
  docs: {
    title: 'Security Architecture, Threat Model & Cryptographic Research | HumanizeText',
    description:
      'Read HumanizeText’s formal threat model, architecture decision records, paper citations (Schleimer et al., Bellare et al.), and cryptographic limitations.',
    keywords:
      'cryptographic plagiarism architecture, threat model, winnowing paper, web crypto security, zero server design',
    canonicalPath: '#/docs',
  },
  'ai-detector': {
    title: 'Hybrid AI Detector — On-Device Neural & Secure Server Classification | HumanizeText',
    description:
      'Check text and images for synthetic AI generation patterns using a hybrid inference router. Runs locally via cached ONNX models or securely via server fallback.',
    keywords:
      'ai detector, hybrid ai detection, on device ai detector, detect chatgpt text, detect ai image, roberta onnx text classifier',
    canonicalPath: '#/ai-detector',
  },
  'metadata-inspector': {
    title: 'Metadata & Signature Inspector — Client-Side EXIF & GPS Scrubber | HumanizeText',
    description:
      'Inspect and sanitize EXIF, GPS location coordinates, camera models, and AI generator parameter chunks locally inside your browser before sharing images.',
    keywords:
      'exif metadata inspector, remove gps from photo, scrub image metadata, clean ai prompt chunk, photo privacy scrubber',
    canonicalPath: '#/metadata-inspector',
  },
};

export function updatePageMeta(tab: string): void {
  const meta = PAGE_METADATA[tab] || PAGE_METADATA.humanizer;

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

  // Update Meta Keywords
  let kwTag = document.querySelector<HTMLMetaElement>('meta[name="keywords"]');
  if (!kwTag) {
    kwTag = document.createElement('meta');
    kwTag.setAttribute('name', 'keywords');
    document.head.appendChild(kwTag);
  }
  kwTag.setAttribute('content', meta.keywords);

  // Update OpenGraph Title
  let ogTitle = document.querySelector<HTMLMetaElement>('meta[property="og:title"]');
  if (ogTitle) {
    ogTitle.setAttribute('content', meta.title);
  }

  // Update OpenGraph Description
  let ogDesc = document.querySelector<HTMLMetaElement>('meta[property="og:description"]');
  if (ogDesc) {
    ogDesc.setAttribute('content', meta.description);
  }

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
