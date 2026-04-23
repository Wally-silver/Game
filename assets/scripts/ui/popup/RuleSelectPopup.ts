import { _decorator, Component, Label, Node } from 'cc';
import { RuleModel } from '../../models/RuleModel';

const { ccclass, property } = _decorator;

/**
 * 规则选择弹窗：显示3条候选规则并回调选择结果。
 */
@ccclass('RuleSelectPopup')
export class RuleSelectPopup extends Component {
  @property(Node)
  public root: Node | null = null;

  @property(Label)
  public titleLabel: Label | null = null;

  @property([Label])
  public optionLabels: Label[] = [];

  private candidates: RuleModel[] = [];
  private onPicked: ((ruleId: string) => void) | null = null;

  public open(candidates: RuleModel[], onPicked: (ruleId: string) => void): void {
    this.candidates = candidates;
    this.onPicked = onPicked;
    if (this.root) {
      this.root.active = true;
    } else {
      this.node.active = true;
    }

    if (this.titleLabel) {
      this.titleLabel.string = '请选择今日生效镇规（3选1）';
    }

    this.optionLabels.forEach((label, index) => {
      const item = this.candidates[index];
      if (!label) {
        return;
      }
      label.string = item ? `${item.name}\n${item.desc}` : '未配置';
    });
  }

  public close(): void {
    if (this.root) {
      this.root.active = false;
    } else {
      this.node.active = false;
    }
  }

  public onTapOption1(): void {
    this.pick(0);
  }

  public onTapOption2(): void {
    this.pick(1);
  }

  public onTapOption3(): void {
    this.pick(2);
  }

  private pick(index: number): void {
    const item = this.candidates[index];
    if (!item || !this.onPicked) {
      return;
    }
    this.onPicked(item.id);
    this.close();
  }
}
