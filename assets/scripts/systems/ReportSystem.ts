import { ReportModel } from '../models/ReportModel';

/**
 * 日报系统骨架：组装最小日报对象。
 */
export class ReportSystem {
  public buildReport(input: ReportModel): ReportModel {
    return {
      ...input,
      title: input.title || '今日镇务平稳',
    };
  }
}
