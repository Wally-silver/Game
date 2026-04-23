export interface EventModel {
  id: string;
  name: string;
  desc: string;
  trigger_rule_tag?: string;
  trigger_building_state?: 'normal' | 'paused' | 'overtime';
  trigger_resident_state?: 'normal' | 'tired' | 'happy' | 'complaining';
  min_order?: number;
  max_joy?: number;
  chance: number;
  cooldown: number;
  effect_order?: number;
  effect_joy?: number;
  effect_gold?: number;
  effect_goal?: number;
}

export interface TriggeredEvent {
  id: string;
  name: string;
  desc: string;
  effect_order: number;
  effect_joy: number;
  effect_gold: number;
  effect_goal: number;
}
