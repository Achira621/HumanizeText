import type { DetectionResult } from '../../types/detector';

export class DetectorWorkerClient {
  private worker: Worker | null = null;
  private pendingRequests = new Map<
    string,
    { resolve: (res: DetectionResult) => void; reject: (err: any) => void; timer: any }
  >();

  private getWorker(): Worker {
    if (!this.worker) {
      this.worker = new Worker(new URL('../../workers/detector.worker.ts', import.meta.url), {
        type: 'module',
      });

      this.worker.onmessage = (e: MessageEvent) => {
        const { type, id, result, error } = e.data;
        if (type === 'DETECT_TEXT_RESULT') {
          const req = this.pendingRequests.get(id);
          if (req) {
            clearTimeout(req.timer);
            this.pendingRequests.delete(id);
            if (error) {
              req.reject(new Error(error));
            } else {
              req.resolve(result);
            }
          }
        }
      };

      this.worker.onerror = (err) => {
        console.error('Detector Worker encountered error:', err);
      };
    }
    return this.worker;
  }

  public async detectText(text: string, timeoutMs = 8000): Promise<DetectionResult> {
    const worker = this.getWorker();
    const id = `req_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    return new Promise<DetectionResult>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`Local on-device inference timed out after ${timeoutMs}ms.`));
      }, timeoutMs);

      this.pendingRequests.set(id, { resolve, reject, timer });
      worker.postMessage({ type: 'DETECT_TEXT', id, text });
    });
  }

  public terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}

export const defaultDetectorWorker = new DetectorWorkerClient();
