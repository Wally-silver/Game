export type RuleEffectTarget =
  | 'building_output'
  | 'resident_speed'
  | 'resident_mood'
  | 'order_change'
  | 'gold_gain'
  | 'joy_change';

export type RuleEffectType = 'add' | 'mul';

export interface RuleEffect {
  target: RuleEffectTarget;
  type: RuleEffectType;
  value: number;
}

export interface RuleModel {
  id: string;
  name: string;
  desc: string;
  category: string;
  risk_score: number;
  fun_score: number;
  tags: string[];
  effects: RuleEffect[];
}
