import { _decorator, Button, Component, Label } from 'cc';
import { ReportModel } from '../../models/ReportModel';
import { SceneUIFactory } from '../../utils/SceneUIFactory';

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
  @property(Label) public starsLabel: Label | null = null;
  @property(Label) public keyEventLabel: Label | null = null;
  @property(Label) public commentLabel: Label | null = null;
  @property(Label) public unlockLabel: Label | null = null;
  @property(Button) public backButton: Button | null = null;
  @property(Button) public retryButton: Button | null = null;

  protected onLoad(): void { this.ensureUI(); }

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
    this.starsLabel && (this.starsLabel.string = `评级：${'★'.repeat(report.stars)}${'☆'.repeat(5 - report.stars)}`);
    this.keyEventLabel && (this.keyEventLabel.string = `关键事件：${report.keyEventTitle}`);
    this.commentLabel && (this.commentLabel.string = report.mayorComment);
    this.unlockLabel && (this.unlockLabel.string = report.unlockedRuleId ? `新解锁镇规：${report.unlockedRuleId}` : '本局未解锁新镇规');
  }

  private ensureUI(): void {
    const root = SceneUIFactory.ensurePanel(this.node, 'ResultViewRoot');
    const col = SceneUIFactory.ensureVerticalGroup(root, 'ResultColumn', 10);
    this.ruleNameLabel = this.ruleNameLabel ?? SceneUIFactory.ensureLabel(col, 'Rule', '今日规则：-');
    this.titleLabel = this.titleLabel ?? SceneUIFactory.ensureLabel(col, 'Title', '标题：-');
    this.successLabel = this.successLabel ?? SceneUIFactory.ensureLabel(col, 'Success', '结果：-');
    this.orderLabel = this.orderLabel ?? SceneUIFactory.ensureLabel(col, 'Order', '最终秩序：-');
    this.joyLabel = this.joyLabel ?? SceneUIFactory.ensureLabel(col, 'Joy', '最终快乐：-');
    this.goldLabel = this.goldLabel ?? SceneUIFactory.ensureLabel(col, 'Gold', '最终金币：-');
    this.eventCountLabel = this.eventCountLabel ?? SceneUIFactory.ensureLabel(col, 'EventCount', '关键事件数：-');
    this.starsLabel = this.starsLabel ?? SceneUIFactory.ensureLabel(col, 'Stars', '评级：-');
    this.keyEventLabel = this.keyEventLabel ?? SceneUIFactory.ensureLabel(col, 'KeyEvent', '关键事件：-');
    this.commentLabel = this.commentLabel ?? SceneUIFactory.ensureLabel(col, 'Comment', '镇长点评：-', 20);
    this.unlockLabel = this.unlockLabel ?? SceneUIFactory.ensureLabel(col, 'Unlock', '本局未解锁新镇规', 20);
    this.backButton = this.backButton ?? SceneUIFactory.ensureButton(col, 'BackBtn', '返回主页').button;
    this.retryButton = this.retryButton ?? SceneUIFactory.ensureButton(col, 'RetryBtn', '再来一局').button;
  }
}
