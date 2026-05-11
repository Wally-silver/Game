import { CONFIG_KEY } from '../core/Constants';
import { ConfigManager } from '../managers/ConfigManager';
import { BattleSettlementData } from '../models/BattleModel';
import { ReportModel } from '../models/ReportModel';

interface ReportTitleRow { id: string; title: string; success_bias?: boolean; }

export class ReportSystem {
  constructor(private readonly configManager: ConfigManager) {}

  public buildReport(settlement: BattleSettlementData, unlockedRuleId?: string, newlySeenEventCount = 0): ReportModel {
    const titles = this.configManager.getAll<ReportTitleRow>(CONFIG_KEY.REPORT_TITLES);
    const pool = titles.filter((i) => i.success_bias === undefined || i.success_bias === settlement.success);
    const picked = (pool.length ? pool : titles)[Math.floor(Math.random() * Math.max(1, (pool.length ? pool : titles).length))];
    const eventCount = settlement.triggeredEvents.length;
    const breakdown = {
      order: Math.max(0, Math.min(100, Math.round(settlement.finalOrder))),
      joy: Math.max(0, Math.min(100, Math.round(settlement.finalJoy))),
      gold: Math.max(0, Math.min(100, Math.round(settlement.finalGold / 2))),
      eventControl: Math.max(0, Math.min(100, Math.round(100 - eventCount * 6))),
      goal: Math.max(0, Math.min(100, Math.round(settlement.finalGoalProgress))),
    };
    const score = (settlement.success ? 40 : 0) + breakdown.order * 0.18 + breakdown.joy * 0.18 + breakdown.gold * 0.14 + breakdown.goal * 0.3 + breakdown.eventControl * 0.1;
    const stars = Math.max(1, Math.min(5, Math.round(score / 36)));
    const keyEventTitle = settlement.triggeredEvents[0]?.name ?? '平稳收官';
    const decisionHighlight = settlement.currentRuleCategory === 'discipline' || settlement.currentRuleCategory === 'safety' ? '关键决策：你选择了偏稳定镇规，靠秩序线控场。' : settlement.currentRuleCategory === 'economy' || settlement.currentRuleCategory === 'service' ? '关键决策：你选择了偏收益镇规，经济推进明显。' : '关键决策：你选择了偏波动镇规，收益与风险并存。';
    const mayorComment = settlement.success ? (stars >= 4 ? '镇长点评：今天的怪话执行得漂亮，建议下局冲五星！' : '镇长点评：守住了底线，但还能更离谱一点。') : '镇长点评：小镇失序，建议下局优先稳住秩序与快乐。';
    return {
      reportTitle: picked?.title ?? '今日小镇纪要',
      stars,
      mayorComment,
      keyEventTitle,
      unlockedRuleId,
      scoreBreakdown: breakdown,
      decisionHighlight,
      newlySeenEventCount,
      settlement,
    };
  }
}
