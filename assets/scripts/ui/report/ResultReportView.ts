import { _decorator, Component, Label } from 'cc';
import { ReportModel } from '../../models/ReportModel';

const { ccclass, property } = _decorator;

@ccclass('ResultReportView')
export class ResultReportView extends Component {
  @property(Label) public ruleNameLabel: Label | null = null;
  @property(Label) public titleLabel: Label | null = null;
  @property(Label) public successLabel: Label | null = null;
  @property(Label) public orderLabel: Label | null = null;
  @property(Label) public joyLabel: Label | null = null;
  @property(Label) public goldLabel: Label | null = null;
  @property(Label) public eventCountLabel: Label | null = null;

  public bindReport(report: ReportModel | null): void {
    if (!report) {
      this.titleLabel && (this.titleLabel.string = '暂无结算数据');
      return;
    }
    const s = report.settlement;
    this.ruleNameLabel && (this.ruleNameLabel.string = `今日规则：${s.currentRuleName}`);
    this.titleLabel && (this.titleLabel.string = `标题：${report.reportTitle}`);
    this.successLabel && (this.successLabel.string = `结果：${s.success ? '成功' : '失败'}`);
    this.orderLabel && (this.orderLabel.string = `最终秩序：${s.finalOrder}`);
    this.joyLabel && (this.joyLabel.string = `最终快乐：${s.finalJoy}`);
    this.goldLabel && (this.goldLabel.string = `最终金币：${s.finalGold}`);
    this.eventCountLabel && (this.eventCountLabel.string = `关键事件数：${s.triggeredEvents.length}`);
  }
}
