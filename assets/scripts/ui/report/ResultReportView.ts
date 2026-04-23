import { _decorator, Component, Label } from 'cc';
import { App } from '../../core/App';

const { ccclass, property } = _decorator;

/**
 * Result.scene：展示最简镇规日报。
 */
@ccclass('ResultReportView')
export class ResultReportView extends Component {
  @property(Label)
  public ruleNameLabel: Label | null = null;

  @property(Label)
  public titleLabel: Label | null = null;

  @property(Label)
  public successLabel: Label | null = null;

  @property(Label)
  public orderLabel: Label | null = null;

  @property(Label)
  public joyLabel: Label | null = null;

  @property(Label)
  public goldLabel: Label | null = null;

  @property(Label)
  public eventCountLabel: Label | null = null;

  protected start(): void {
    const report = App.instance?.battleManager.getLastReport();
    if (!report) {
      this.titleLabel && (this.titleLabel.string = '暂无结算数据');
      return;
    }

    this.ruleNameLabel && (this.ruleNameLabel.string = `今日规则：${report.ruleName}`);
    this.titleLabel && (this.titleLabel.string = `标题：${report.reportTitle}`);
    this.successLabel && (this.successLabel.string = `结果：${report.success ? '成功' : '失败'}`);
    this.orderLabel && (this.orderLabel.string = `最终秩序：${report.finalOrder}`);
    this.joyLabel && (this.joyLabel.string = `最终快乐：${report.finalJoy}`);
    this.goldLabel && (this.goldLabel.string = `最终金币：${report.finalGold}`);
    this.eventCountLabel && (this.eventCountLabel.string = `关键事件数：${report.eventCount}`);
  }

  public onTapBackHome(): void {
    void App.instance?.sceneRouter.goHome();
  }

  public onTapReplay(): void {
    void App.instance?.sceneRouter.goBattle();
  }
}
