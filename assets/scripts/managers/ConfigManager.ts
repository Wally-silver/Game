import { CONFIG_KEYS, EVENT_KEYS } from '../core/Constants';
import { EventBus } from '../core/EventBus';
import { Logger } from '../utils/Logger';

export type ConfigMap = Record<string, unknown[]>;

/**
 * Loads and caches table-driven config data.
 */
export class ConfigManager {
  private cache: ConfigMap = {};

  constructor(private readonly eventBus: EventBus) {}

  public async loadAll(): Promise<void> {
    const keys = Object.values(CONFIG_KEYS);
    await Promise.all(keys.map((key) => this.loadConfig(key)));
  }

  public async loadConfig(configKey: string): Promise<void> {
    try {
      const config = await this.readConfigFile(configKey);
      this.cache[configKey] = config;
      this.eventBus.emit(EVENT_KEYS.CONFIG_LOADED, { key: configKey, count: config.length });
    } catch (error) {
      Logger.error(`Failed to load config: ${configKey}`, error);
      this.cache[configKey] = [];
      this.eventBus.emit(EVENT_KEYS.CONFIG_LOAD_FAILED, { key: configKey });
    }
  }

  public getConfig<T>(configKey: string): T[] {
    return (this.cache[configKey] ?? []) as T[];
  }

  private async readConfigFile(configKey: string): Promise<unknown[]> {
    const filePath = `assets/scripts/config/${configKey}.json`;
    const text = await (await fetch(filePath)).text();
    return JSON.parse(text) as unknown[];
  }
}
