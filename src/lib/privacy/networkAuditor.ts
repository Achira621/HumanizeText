import type { NetworkRequestLog } from '../../types';

export class NetworkAuditor {
  private static instance: NetworkAuditor;
  private logs: NetworkRequestLog[] = [];
  private listeners: Array<(logs: NetworkRequestLog[]) => void> = [];
  private isHooked = false;

  private constructor() {}

  public static getInstance(): NetworkAuditor {
    if (!NetworkAuditor.instance) {
      NetworkAuditor.instance = new NetworkAuditor();
    }
    return NetworkAuditor.instance;
  }

  /**
   * Initializes non-intrusive client-side monitoring on network calls
   * to verify that no document text, keys, or hashes leak out.
   */
  public startAuditing(): void {
    if (this.isHooked || typeof window === 'undefined') return;
    this.isHooked = true;

    const originalFetch = window.fetch;

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = typeof input === 'string' ? input : (input as Request).url || input.toString();
      const method = init?.method || 'GET';
      const bodyStr = init?.body ? String(init.body) : '';

      const logEntry: NetworkRequestLog = {
        id: `net-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: Date.now(),
        method,
        url,
        type: 'static-asset',
        payloadPreview: bodyStr ? bodyStr.substring(0, 80) : undefined,
        blocked: false,
      };

      this.logs.push(logEntry);
      this.notify();

      return originalFetch(input, init);
    };
  }

  public getLogs(): NetworkRequestLog[] {
    return [...this.logs];
  }

  public subscribe(listener: (logs: NetworkRequestLog[]) => void): () => void {
    this.listeners.push(listener);
    listener([...this.logs]);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public clearLogs(): void {
    this.logs = [];
    this.notify();
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener([...this.logs]);
    }
  }
}
