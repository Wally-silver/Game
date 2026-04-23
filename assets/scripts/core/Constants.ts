/**
 * Shared constants for scene names, config keys, and event channels.
 */
export const SCENE_NAMES = {
  LAUNCH: 'Launch',
  HOME: 'Home',
  BATTLE: 'Battle',
  RESULT: 'Result',
} as const;

export const CONFIG_KEYS = {
  RULES: 'rules',
  BUILDINGS: 'buildings',
  RESIDENTS: 'residents',
  EVENTS: 'events',
  REPORT_TITLES: 'report_titles',
} as const;

export const EVENT_KEYS = {
  SCENE_WILL_CHANGE: 'scene:will_change',
  SCENE_DID_CHANGE: 'scene:did_change',
  CONFIG_LOADED: 'config:loaded',
  CONFIG_LOAD_FAILED: 'config:load_failed',
  GAME_STATE_UPDATED: 'game_state:updated',
} as const;

export const DEFAULT_BATTLE_SECONDS = 150;
