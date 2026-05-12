import { BuildingState } from './BuildingModel';
import { ResidentState } from './ResidentModel';

export interface EventModel {
  id: string;
  name: string;
  desc: string;
  trigger_rule_tag?: string;
  trigger_building_state?: BuildingState;
  trigger_resident_state?: ResidentState;
  min_order?: number;
  max_joy?: number;
  min_gold?: number;
  max_gold?: number;
  min_goal_progress?: number;
  building_id?: string;
  rule_category?: string;
  min_event_count?: number;
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
