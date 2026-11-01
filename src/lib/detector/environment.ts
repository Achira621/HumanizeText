/**
 * ============================================================================
 * HUMANIZETEXT DETECTOR: ENVIRONMENT GUARDS & ENGINE ISOLATION
 * 
 * Ensures candidate/experimental detector engines (V2.5, V2.6, V2.3) remain strictly
 * internal and cannot be accessed in production builds, public query params,
 * or persistent client state.
 * ============================================================================
 */

export function isInternalDevMode(): boolean {
  // 1. Strict Node environment check (unit tests, local test runners)
  if (typeof process !== 'undefined' && process.env) {
    if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') {
      return true;
    }
    if (process.env.NODE_ENV === 'production') {
      return false;
    }
  }

  // 2. Vite import.meta.env check
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      if (import.meta.env.PROD) {
        return false;
      }
      // @ts-ignore
      if (import.meta.env.DEV) {
        return true;
      }
    }
  } catch {
    // Ignore environment meta errors
  }

  // Fallback to strict production-safe default
  return false;
}

export function sanitizeEngineId<T extends string = 'production_default' | 'v2_5_public_beta' | 'v2_6_hierarchical'>(
  engineId?: string
): T {
  // If not in internal dev mode, FORCE production_default regardless of input
  if (!isInternalDevMode()) {
    return 'production_default' as T;
  }

  return (engineId as T) || ('production_default' as T);
}
