/**
 * 全局常量统一定义，避免魔法字符串散落。
 */
export const SCENE_NAME = {
  LAUNCH: 'Launch',
  HOME: 'Home',
  BATTLE: 'Battle',
  RESULT: 'Result',
} as const;

export const EVENT_NAME = {
  GAME_STATE_CHANGED: 'game_state_changed',
  CONFIG_LOADED: 'config_loaded',
  CONFIG_LOAD_FAILED: 'config_load_failed',
  SCENE_LOADING: 'scene_loading',
  BATTLE_EVENT_TRIGGERED: 'battle_event_triggered',
  BATTLE_ENDED: 'battle_ended',
  BATTLE_RESOURCE_CHANGED: 'battle_resource_changed',
  BATTLE_BUILDINGS_CHANGED: 'battle_buildings_changed',
  BATTLE_RULE_SELECTED: 'battle_rule_selected',
  BATTLE_SETTLEMENT_READY: 'battle_settlement_ready',
} as const;

export const CONFIG_KEY = {
  RULES: 'rules',
  BUILDINGS: 'buildings',
  RESIDENTS: 'residents',
  EVENTS: 'events',
  REPORT_TITLES: 'report_titles',
} as const;

export const DEFAULT_PLAYER_STATE = {
  playerLevel: 1,
  gold: 100,
  inspiration: 20,
};

export const BATTLE_DEFAULTS = {
  durationSeconds: 105,
  startOrder: 65,
  startJoy: 58,
  startGold: 90,
  targetGold: 190,
  targetProgress: 110,
  buildingTickInterval: 1,
  eventTickInterval: 4,
};
