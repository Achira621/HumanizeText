import type {
  HumanizerOptions,
  HumanizerResult,
  LocalHumanizerEngine,
} from '../../types';
import { OptionalBrowserAIEngine } from './browserAiEngine';
import { RuleBasedHumanizerEngine } from './ruleEngine';

export class HumanizerManager {
  private ruleEngine: RuleBasedHumanizerEngine;
  private browserAiEngine: OptionalBrowserAIEngine;
  private activeEngineId: 'deterministic-rules' | 'browser-ai-local' = 'deterministic-rules';

  constructor() {
    this.ruleEngine = new RuleBasedHumanizerEngine();
    this.browserAiEngine = new OptionalBrowserAIEngine();
  }

  public getRuleEngine(): RuleBasedHumanizerEngine {
    return this.ruleEngine;
  }

  public getBrowserAiEngine(): OptionalBrowserAIEngine {
    return this.browserAiEngine;
  }

  public getActiveEngine(): LocalHumanizerEngine {
    if (this.activeEngineId === 'browser-ai-local') {
      return this.browserAiEngine;
    }
    return this.ruleEngine;
  }

  public setActiveEngine(engineId: 'deterministic-rules' | 'browser-ai-local') {
    this.activeEngineId = engineId;
  }

  public async humanize(text: string, options: HumanizerOptions): Promise<HumanizerResult> {
    const engine = this.getActiveEngine();
    return await engine.process(text, options);
  }
}

export const defaultHumanizerManager = new HumanizerManager();
