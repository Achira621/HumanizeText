// ============================================================================
// ADAPTIVE INTELLIGENCE LAYER — FEATURE FLAGS & CONFIGURATION
// Local-first, controllable, and fully reversible feature gates
// ============================================================================

import type { IntelligenceFeatureFlags } from './types';

const STORAGE_KEY = 'humanizetext_intelligence_flags';

export const DEFAULT_FEATURE_FLAGS: IntelligenceFeatureFlags = {
  enableExperimentalSignals: false,       // Keep experimental secondary models disabled by default in prod
  enableConsentedFeedback: true,           // Allow user to provide voluntary accuracy feedback
  enableSemanticSimilarity: true,          // Offer semantic breakdown alongside exact winnowing
  enablePlagiarismSourceRetrieval: true,   // Display verified source reference records
  enableDeveloperModelAudit: false,        // Internal development inspect flags
};

export class FeatureFlagsManager {
  private flags: IntelligenceFeatureFlags;

  constructor() {
    this.flags = this.loadFlags();
  }

  private loadFlags(): IntelligenceFeatureFlags {
    if (typeof window === 'undefined') return { ...DEFAULT_FEATURE_FLAGS };
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_FEATURE_FLAGS, ...JSON.parse(stored) };
      }
    } catch {
      // Fallback on parse failure
    }
    return { ...DEFAULT_FEATURE_FLAGS };
  }

  public getFlags(): IntelligenceFeatureFlags {
    return { ...this.flags };
  }

  public isEnabled(flag: keyof IntelligenceFeatureFlags): boolean {
    return !!this.flags[flag];
  }

  public updateFlags(partial: Partial<IntelligenceFeatureFlags>): void {
    this.flags = { ...this.flags, ...partial };
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.flags));
      } catch (e) {
        console.warn('Failed to persist intelligence feature flags:', e);
      }
    }
  }

  public resetToDefaults(): void {
    this.flags = { ...DEFAULT_FEATURE_FLAGS };
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
}

export const defaultFeatureFlags = new FeatureFlagsManager();
