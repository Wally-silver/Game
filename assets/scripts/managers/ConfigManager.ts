import { CONFIG_KEY, EVENT_NAME } from '../core/Constants';
import { EventBus } from '../core/EventBus';
import { Logger } from '../utils/Logger';

import rules from '../config/rules.json';
import buildings from '../config/buildings.json';
import residents from '../config/residents.json';
import events from '../config/events.json';
import reportTitles from '../config/report_titles.json';

type ConfigRecord = { id: string; [key: string]: unknown };
type ConfigTable = Record<string, ConfigRecord[]>;

/**
 * 配置管理：阶段 A 使用本地 JSON，后续可替换成远程/AssetBundle。
 */
export class ConfigManager {
  private readonly cache: ConfigTable = {};

  constructor(private readonly eventBus: EventBus) {}

  public async loadAllConfigs(): Promise<void> {
    try {
      this.cache[CONFIG_KEY.RULES] = rules as ConfigRecord[];
      this.cache[CONFIG_KEY.BUILDINGS] = buildings as ConfigRecord[];
      this.cache[CONFIG_KEY.RESIDENTS] = residents as ConfigRecord[];
      this.cache[CONFIG_KEY.EVENTS] = events as ConfigRecord[];
      this.cache[CONFIG_KEY.REPORT_TITLES] = reportTitles as ConfigRecord[];
      this.validateLoadedTables();
      Logger.info('ConfigManager loaded all local tables.', this.getConfigSummary());
    } catch (error) {
      Logger.error('ConfigManager load failed.', error);
      this.eventBus.emit(EVENT_NAME.CONFIG_LOAD_FAILED, error as Error);
      throw error;
    }
  }

  public hasConfig(configKey: string): boolean {
    return Array.isArray(this.cache[configKey]) && this.cache[configKey].length > 0;
  }

  public getAll<T extends ConfigRecord>(configKey: string): T[] {
    return (this.cache[configKey] ?? []) as T[];
  }

  public getById<T extends ConfigRecord>(configKey: string, id: string): T | null {
    const rows = this.getAll<T>(configKey);
    return rows.find((row) => row.id === id) ?? null;
  }

  public getConfigSummary(): Record<string, number> {
    return Object.keys(this.cache).reduce<Record<string, number>>((acc, key) => {
      acc[key] = this.cache[key].length;
      return acc;
    }, {});
  }

  private validateLoadedTables(): void {
    Object.entries(this.cache).forEach(([key, rows]) => {
      const ids = new Set<string>();
      rows.forEach((row, idx) => {
        if (!row.id || typeof row.id !== 'string') {
          Logger.error(`Config ${key} row#${idx} missing id`, row);
          return;
        }
        if (ids.has(row.id)) {
          Logger.error(`Config ${key} duplicated id: ${row.id}`);
        }
        ids.add(row.id);
      });
    });
  }
}
