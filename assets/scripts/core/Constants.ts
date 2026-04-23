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
