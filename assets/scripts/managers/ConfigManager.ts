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
      this.applyFallbacks();
      this.validateLoadedTables();
      Logger.info('[ConfigManager] config loaded from json', this.getConfigSummary());
    } catch (error) {
      Logger.error('[ConfigManager] config load failed, using fallback config', error);
      this.applyFallbacks(true);
      this.validateLoadedTables();
      this.eventBus.emit(EVENT_NAME.CONFIG_LOAD_FAILED, error as Error);
    }
  }

  public hasConfig(configKey: string): boolean {
    return Array.isArray(this.cache[configKey]) && this.cache[configKey].length > 0;
  }

  public getAll<T = ConfigRecord>(configKey: string): T[] {
    return (this.cache[configKey] ?? []) as unknown as T[];
  }

  public getById<T extends { id: string } = ConfigRecord>(configKey: string, id: string): T | null {
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

  private applyFallbacks(forceAll = false): void {
    if (forceAll || !this.cache[CONFIG_KEY.RULES]?.length) {
      Logger.error('[ConfigManager] rules missing, injecting fallback rules');
      this.cache[CONFIG_KEY.RULES] = [
        { id: 'fallback_rule_1', name: '稳妥经营', desc: '基础稳态', category: 'balance', risk_score: 3, fun_score: 3, tags: ['safe'], effects: [] },
        { id: 'fallback_rule_2', name: '拼命冲刺', desc: '收益更高风险更高', category: 'rush', risk_score: 8, fun_score: 6, tags: ['rush'], effects: [{ target: 'gold_gain', type: 'mul', value: 1.2 }] },
        { id: 'fallback_rule_3', name: '先稳后快', desc: '秩序优先', category: 'safe', risk_score: 4, fun_score: 4, tags: ['safe'], effects: [{ target: 'order_change', type: 'add', value: 1 }] },
      ];
    }
    if (forceAll || !this.cache[CONFIG_KEY.BUILDINGS]?.length) {
      this.cache[CONFIG_KEY.BUILDINGS] = [
        { id: 'bakery', name: '面包坊', worker_need: 2, base_output: 6, joy_effect: 1, order_effect: 0, risk_factor: 1.1, pressure_limit: 72, display_order: 1 },
        { id: 'office', name: '事务所', worker_need: 3, base_output: 9, joy_effect: -1, order_effect: 1, risk_factor: 1.2, pressure_limit: 70, display_order: 2 },
        { id: 'park', name: '公园', worker_need: 2, base_output: 4, joy_effect: 2, order_effect: 0, risk_factor: 1.0, pressure_limit: 75, display_order: 3 },
      ];
    }
    if (forceAll || !this.cache[CONFIG_KEY.EVENTS]?.length) {
      this.cache[CONFIG_KEY.EVENTS] = [
        { id: 'evt_1', name: '集市热潮', desc: '人流增加，金币提升', chance: 0.35, cooldown: 6, effect_gold: 10, effect_joy: 1 },
        { id: 'evt_2', name: '加班抗议', desc: '过劳导致快乐下降', chance: 0.25, cooldown: 7, trigger_building_state: 'overtime', effect_joy: -4, effect_order: -2 },
        { id: 'evt_3', name: '街道巡查', desc: '秩序回升', chance: 0.2, cooldown: 8, effect_order: 5 },
      ];
    }
    if (forceAll || !this.cache[CONFIG_KEY.RESIDENTS]?.length) {
      this.cache[CONFIG_KEY.RESIDENTS] = [
        { id: 'res_1', name: '阿木', mood: 60, energy: 80 },
        { id: 'res_2', name: '小禾', mood: 55, energy: 75 },
        { id: 'res_3', name: '老周', mood: 58, energy: 78 },
      ];
    }
    if (forceAll || !this.cache[CONFIG_KEY.REPORT_TITLES]?.length) {
      this.cache[CONFIG_KEY.REPORT_TITLES] = [
        { id: 'rp_1', title: '稳住基本盘' },
        { id: 'rp_2', title: '惊险冲线' },
        { id: 'rp_3', title: '今日小镇纪要' },
      ];
    }
  }
}
