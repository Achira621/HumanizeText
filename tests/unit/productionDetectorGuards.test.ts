import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { AiDetectorPage } from '../../src/components/detector/AiDetectorPage';
import { FreeAiHumanizerPage } from '../../src/components/humanizer/FreeAiHumanizerPage';
import { PAGE_METADATA } from '../../src/lib/seo/metaManager';
import { isInternalDevMode, sanitizeEngineId } from '../../src/lib/detector/environment';
import { executeDetectorEngine } from '../../src/lib/detector/candidateIntegrationBoundary';
import { defaultAdaptiveCoordinator } from '../../src/lib/intelligence/coordinator';

describe('Production Detector UI and Routing Guards Regression Suite', () => {
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalEnv = process.env.NODE_ENV;
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    vi.restoreAllMocks();
  });

  describe('1. Public UI Presentation Guard', () => {
    it('renders the unified production detector without exposing engine selectors or candidate buttons', () => {
      const html = renderToString(React.createElement(AiDetectorPage));

      // 1. Must NOT contain experimental engine selectors or candidate controls
      expect(html).not.toContain('V2.6 Hierarchical (Premier)');
      expect(html).not.toContain('V2.6');
      expect(html).not.toContain('V2.5 Public Beta');
      expect(html).not.toContain('Production Baseline');
      expect(html).not.toContain('Hierarchical Stylometric Assessment');
      expect(html).not.toContain('Diagnostic Engine Telemetry');

      // 2. Must NOT contain candidate or beta badges in hero or model version disclosures
      expect(html).not.toContain('Candidate');
      expect(html).not.toContain('Premier');
      expect(html).not.toContain('Active Detector');
      expect(html).not.toContain('Linguistic Stylometry Engine');
      expect(html).not.toContain('v2.4.0');
      expect(html).not.toContain('privacy guaranteed');
      expect(html).not.toContain('Public Beta');

      // 3. Must contain clean authentic branding and unified entry point
      expect(html).toContain('Local-First Intelligent AI Detector');
      expect(html).toContain('AI Text &amp; Image');
      expect(html).toContain('Detection Platform');
      expect(html).toContain('AI Text Detector');
      expect(html).toContain('AI Image Detector');
      expect(html).toContain('zero raw text logging');
    });
  });

  describe('1b. Marketing and Metadata Presentation Guard', () => {
    it('ensures FreeAiHumanizerPage and SEO metadata contain zero candidate or beta claims', () => {
      const homeHtml = renderToString(React.createElement(FreeAiHumanizerPage, {
        currentText: '',
        setCurrentText: () => {},
        setActiveTab: () => {},
      } as any));

      expect(homeHtml).not.toContain('Public Beta');
      expect(homeHtml).not.toContain('V2.5');
      expect(homeHtml).not.toContain('V2.6');
      expect(homeHtml).not.toContain('Stylometric AI Detector');

      // SEO Metadata Check
      const detectorMeta = PAGE_METADATA['ai-detector'];
      expect(detectorMeta.title).not.toContain('Public Beta');
      expect(detectorMeta.title).not.toContain('V2.5');
      expect(detectorMeta.description).not.toContain('Public Beta');
      expect(detectorMeta.description).not.toContain('stylometric classifier');
      expect(JSON.stringify(detectorMeta.schema)).not.toContain('Public Beta');
    });
  });

  describe('2. Routing Isolation and Sanitization in Production Mode', () => {
    it('identifies production environment and denies dev-only privileges', () => {
      process.env.NODE_ENV = 'production';
      expect(isInternalDevMode()).toBe(false);
    });

    it('sanitizes any candidate engine selection to production_default in production', () => {
      process.env.NODE_ENV = 'production';

      expect(sanitizeEngineId('v2_6_hierarchical')).toBe('production_default');
      expect(sanitizeEngineId('v2_5_public_beta')).toBe('production_default');
      expect(sanitizeEngineId(undefined)).toBe('production_default');
      expect(sanitizeEngineId('production_default')).toBe('production_default');
      expect(sanitizeEngineId('arbitrary_injected_engine' as any)).toBe('production_default');
    });

    it('forces candidate execution boundary to redirect v2_6 to production_default in production', async () => {
      process.env.NODE_ENV = 'production';

      const sample = 'The implementation coordinates cryptographic operations across independent nodes.';
      const result = await executeDetectorEngine(sample, { engineId: 'v2_6_hierarchical' });

      // In production mode, the candidate boundary strictly diverts to production_default
      expect(result.engineId).toBe('production_default');
      expect(result.isProductionDefault).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(1);
    });

    it('forces candidate execution boundary to redirect v2_5 to production_default in production', async () => {
      process.env.NODE_ENV = 'production';

      const sample = 'The implementation coordinates cryptographic operations across independent nodes.';
      const result = await executeDetectorEngine(sample, { engineId: 'v2_5_public_beta' });

      expect(result.engineId).toBe('production_default');
      expect(result.isProductionDefault).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(1);
    });
  });

  describe('3. Internal Dev Mode Capability', () => {
    it('allows dev execution when in test or dev environment', async () => {
      process.env.NODE_ENV = 'test';
      expect(isInternalDevMode()).toBe(true);

      const sample = 'This is an internal development test document verifying diagnostic routing.';
      const result = await executeDetectorEngine(sample, { engineId: 'v2_6_hierarchical' });

      expect(result.engineId).toBe('v2_6_hierarchical');
      expect(result.isProductionDefault).toBe(false);
      expect(result.rawCandidateResult).toBeDefined();
    });
  });

  describe('4. Coordinator Production Default Invariance', () => {
    it('coordinator analyzeText executes production default when no engineId is specified', async () => {
      const text = 'The distributed consensus algorithm guarantees consistency under network partition conditions.';
      const res = await defaultAdaptiveCoordinator.analyzeText(text, {
        allowServerFallback: true,
        userConsentedToServer: true,
      });

      expect(['humanizetext-linguistic-core-v2', 'tmr-ai-text-detector-v1']).toContain(res.modelId);
      expect(res.score.confidence).toBeDefined();
      expect(res.score.classification).toBeDefined();
      expect(['likely-human', 'likely-ai', 'inconclusive', 'mixed']).toContain(res.score.classification);
    });

    it('coordinator analyzeText sanitizes candidate engineId in production mode', async () => {
      process.env.NODE_ENV = 'production';
      const text = 'The distributed consensus algorithm guarantees consistency under network partition conditions.';
      const res = await defaultAdaptiveCoordinator.analyzeText(text, {
        allowServerFallback: true,
        userConsentedToServer: true,
        engineId: 'v2_6_hierarchical' as any,
      });

      // Must sanitize to production baseline
      expect(res.adaptiveMetadata?.activeProviderId).toBe('tmr-ai-text-detector-v1');
      expect(res.adaptiveMetadata?.registryVersion).toBe('1.0.4');
    });
  });
});
