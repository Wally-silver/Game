import { CONFIG_KEY } from '../core/Constants';
import { ConfigManager } from '../managers/ConfigManager';
import { ReportModel } from '../models/ReportModel';

interface ReportTitleRow {
  id: string;
  title: string;
  success_bias?: boolean;
}

export interface BuildReportInput {
  ruleName: string;
  success: boolean;
  finalOrder: number;
  finalJoy: number;
  finalGold: number;
  eventCount: number;
}

/**
 * 日报系统：将结算数据转成展示对象。
 */
export class ReportSystem {
  constructor(private readonly configManager: ConfigManager) {}

  public buildReport(input: BuildReportInput): ReportModel {
    const titles = this.configManager.getAll<ReportTitleRow>(CONFIG_KEY.REPORT_TITLES);
    const filtered = titles.filter((item) => item.success_bias === undefined || item.success_bias === input.success);
    const pool = filtered.length > 0 ? filtered : titles;
    const picked = pool[Math.floor(Math.random() * pool.length)];

    return {
      ruleName: input.ruleName,
      reportTitle: picked?.title ?? '今日小镇纪要',
      success: input.success,
      finalOrder: input.finalOrder,
      finalJoy: input.finalJoy,
      finalGold: input.finalGold,
      eventCount: input.eventCount,
    };
  }
}
