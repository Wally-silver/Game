import { CONFIG_KEY } from '../core/Constants';
import { ConfigManager } from '../managers/ConfigManager';
import { BattleSettlementData } from '../models/BattleModel';
import { ReportModel } from '../models/ReportModel';

interface ReportTitleRow { id: string; title: string; success_bias?: boolean; }

export class ReportSystem {
  constructor(private readonly configManager: ConfigManager) {}

  public buildReport(settlement: BattleSettlementData): ReportModel {
    const titles = this.configManager.getAll<ReportTitleRow>(CONFIG_KEY.REPORT_TITLES);
    const pool = titles.filter((i) => i.success_bias === undefined || i.success_bias === settlement.success);
    const picked = (pool.length ? pool : titles)[Math.floor(Math.random() * Math.max(1, (pool.length ? pool : titles).length))];
    return {
      reportTitle: picked?.title ?? '今日小镇纪要',
      settlement,
    };
  }
}
