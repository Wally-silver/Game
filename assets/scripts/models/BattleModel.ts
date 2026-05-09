import { BuildingRuntime } from './BuildingModel';
import { TriggeredEvent } from './EventModel';
import { ResidentModel } from './ResidentModel';

export interface BattleRuntimeState {
  timer: number;
  order: number;
  joy: number;
  gold: number;
  goalProgress: number;
  running: boolean;
  ended: boolean;
  success: boolean;
  currentRuleName: string;
  currentRuleCategory: string;
  buildings: BuildingRuntime[];
  residents: ResidentModel[];
  triggeredEvents: TriggeredEvent[];
}

export interface BattleSettlementData {
  success: boolean;
  timerUsed: number;
  finalOrder: number;
  finalJoy: number;
  finalGold: number;
  finalGoalProgress: number;
  currentRuleName: string;
  currentRuleCategory: string;
  buildings: BuildingRuntime[];
  residents: ResidentModel[];
  triggeredEvents: TriggeredEvent[];
}
