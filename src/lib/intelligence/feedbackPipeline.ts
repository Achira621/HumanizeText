// ============================================================================
// ADAPTIVE INTELLIGENCE LAYER — CONSENTED FEEDBACK PIPELINE
// Private, optional user accuracy reporting stored strictly locally in IndexedDB/localStorage/memory
// User feedback is evidence to inspect, never automatic ground-truth
// ============================================================================

import type { ConsentedFeedbackItem } from './types';

const STORAGE_KEY = 'humanizetext_consented_feedback';
const MAX_FEEDBACK_ITEMS = 50;

export class FeedbackPipeline {
  private memoryStore: ConsentedFeedbackItem[] = [];

  /**
   * Submit voluntary user feedback on a detection result.
   * Keeps raw user text out of storage; stores only cryptographic hash snippet and label.
   */
  public async submitFeedback(
    textSnippet: string,
    predictedAiScore: number,
    predictedClassification: string,
    userPerceivedLabel: 'human' | 'ai' | 'mixed',
    options?: {
      userNotes?: string;
      modelId?: string;
      modelVersion?: string;
      consentedToAnonymousResearch?: boolean;
    }
  ): Promise<ConsentedFeedbackItem> {
    const textHash = await this.hashSnippet(textSnippet.slice(0, 200));

    const item: ConsentedFeedbackItem = {
      id: `fb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      textSnippetHash: textHash,
      predictedAiScore,
      predictedClassification,
      userPerceivedLabel,
      userNotes: options?.userNotes?.slice(0, 300),
      modelId: options?.modelId || 'tmr-ai-text-detector-v1',
      modelVersion: options?.modelVersion || '1.0.4',
      consentedToAnonymousResearch: !!options?.consentedToAnonymousResearch,
    };

    this.saveItem(item);
    return item;
  }

  public getFeedbackHistory(): ConsentedFeedbackItem[] {
    if (typeof localStorage !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          return JSON.parse(stored);
        }
      } catch (e) {
        console.warn('Failed to parse feedback history:', e);
      }
    }
    return [...this.memoryStore];
  }

  public clearFeedbackHistory(): void {
    this.memoryStore = [];
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {}
    }
  }

  private saveItem(item: ConsentedFeedbackItem): void {
    this.memoryStore = [item, ...this.memoryStore].slice(0, MAX_FEEDBACK_ITEMS);
    if (typeof localStorage !== 'undefined') {
      try {
        const current = this.getFeedbackHistory();
        const next = [item, ...current.filter((c) => c.id !== item.id)].slice(0, MAX_FEEDBACK_ITEMS);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.warn('Could not save feedback item:', e);
      }
    }
  }

  private async hashSnippet(snippet: string): Promise<string> {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      try {
        const enc = new TextEncoder().encode(snippet);
        const buf = await crypto.subtle.digest('SHA-256', enc);
        return Array.from(new Uint8Array(buf))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('')
          .slice(0, 16);
      } catch {}
    }
    // Fallback simple hash
    let hash = 0;
    for (let i = 0; i < snippet.length; i++) {
      hash = (hash << 5) - hash + snippet.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }
}

export const defaultFeedbackPipeline = new FeedbackPipeline();
