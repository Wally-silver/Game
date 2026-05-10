import { CONFIG_KEY } from '../core/Constants';
import { ConfigManager } from '../managers/ConfigManager';
import { BattleSettlementData } from '../models/BattleModel';
import { ReportModel } from '../models/ReportModel';

interface ReportTitleRow { id: string; title: string; success_bias?: boolean; }

export class ReportSystem {
  constructor(private readonly configManager: ConfigManager) {}

  public buildReport(settlement: BattleSettlementData, unlockedRuleId?: string): ReportModel {
    const titles = this.configManager.getAll<ReportTitleRow>(CONFIG_KEY.REPORT_TITLES);
    const pool = titles.filter((i) => i.success_bias === undefined || i.success_bias === settlement.success);
    const picked = (pool.length ? pool : titles)[Math.floor(Math.random() * Math.max(1, (pool.length ? pool : titles).length))];
    const eventCount = settlement.triggeredEvents.length;
    const score = (settlement.success ? 40 : 0) + settlement.finalOrder * 0.2 + settlement.finalJoy * 0.2 + settlement.finalGold * 0.08 + settlement.finalGoalProgress * 0.25 + eventCount * 1.5;
    const stars = Math.max(1, Math.min(5, Math.round(score / 35)));
    const keyEventTitle = settlement.triggeredEvents[0]?.name ?? '平稳收官';
    const mayorComment = settlement.success ? (stars >= 4 ? '镇长点评：今天的怪话执行得漂亮，建议下局冲五星！' : '镇长点评：守住了底线，但还能更离谱一点。') : '镇长点评：小镇失序，建议下局优先稳住秩序与快乐。';
    return {
      reportTitle: picked?.title ?? '今日小镇纪要',
      stars,
      mayorComment,
      keyEventTitle,
      unlockedRuleId,
      settlement,
    };
  }
}
