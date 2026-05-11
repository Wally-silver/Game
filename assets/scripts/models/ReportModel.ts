import { BattleSettlementData } from './BattleModel';

export interface ReportModel {
  reportTitle: string;
  stars: number;
  mayorComment: string;
  keyEventTitle: string;
  unlockedRuleId?: string;
  scoreBreakdown: { order: number; joy: number; gold: number; eventControl: number; goal: number };
  decisionHighlight: string;
  newlySeenEventCount: number;
  settlement: BattleSettlementData;
}
