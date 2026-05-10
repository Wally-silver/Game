import { BattleSettlementData } from './BattleModel';

export interface ReportModel {
  reportTitle: string;
  stars: number;
  mayorComment: string;
  keyEventTitle: string;
  unlockedRuleId?: string;
  settlement: BattleSettlementData;
}
