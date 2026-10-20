import type {
  HumanizerOptions,
  HumanizerResult,
} from '../../types';
import { OptionalBrowserAIEngine } from './browserAiEngine';
import { RuleBasedHumanizerEngine } from './ruleEngine';
import { defaultWorkerApiClient, WorkerApiClient } from '../workerApi/client';

export type HumanizerEngineId = 'deterministic-rules' | 'browser-ai-local' | 'cloudflare-workers-ai';

export class HumanizerManager {
  private ruleEngine: RuleBasedHumanizerEngine;
  private browserAiEngine: OptionalBrowserAIEngine;
  private workerApiClient: WorkerApiClient;
  private activeEngineId: HumanizerEngineId = 'cloudflare-workers-ai';

  constructor() {
    this.ruleEngine = new RuleBasedHumanizerEngine();
    this.browserAiEngine = new OptionalBrowserAIEngine();
    this.workerApiClient = defaultWorkerApiClient;
  }

  public getRuleEngine(): RuleBasedHumanizerEngine {
    return this.ruleEngine;
  }

  public getBrowserAiEngine(): OptionalBrowserAIEngine {
    return this.browserAiEngine;
  }

  public getWorkerApiClient(): WorkerApiClient {
    return this.workerApiClient;
  }

  public getActiveEngineId(): HumanizerEngineId {
    return this.activeEngineId;
  }

  public setActiveEngine(engineId: HumanizerEngineId) {
    this.activeEngineId = engineId;
  }

  public async humanize(
    text: string,
    options: HumanizerOptions,
    overrideEngineId?: HumanizerEngineId
  ): Promise<HumanizerResult> {
    const targetEngine = overrideEngineId || this.activeEngineId;

    if (targetEngine === 'cloudflare-workers-ai') {
      return await this.workerApiClient.humanize(text, options);
    }

    if (targetEngine === 'browser-ai-local') {
      return await this.browserAiEngine.process(text, options);
    }

    // Default: deterministic offline rule engine
    return await this.ruleEngine.process(text, options);
  }
}

export const defaultHumanizerManager = new HumanizerManager();
