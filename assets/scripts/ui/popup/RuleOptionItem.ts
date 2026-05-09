import { _decorator, Component, Label } from 'cc';
import { RuleModel } from '../../models/RuleModel';

const { ccclass, property } = _decorator;

@ccclass('RuleOptionItem')
export class RuleOptionItem extends Component {
  @property(Label) public contentLabel: Label | null = null;

  private rule: RuleModel | null = null;
  private onPicked: ((rule: RuleModel) => void) | null = null;

  public bind(rule: RuleModel, onPicked: (rule: RuleModel) => void): void {
    this.rule = rule;
    this.onPicked = onPicked;
    if (this.contentLabel) {
      this.contentLabel.string = `${rule.name}\n${rule.desc}\n风险:${rule.risk_score} 趣味:${rule.fun_score}`;
    }
  }

  public onTapSelect(): void {
    if (!this.rule || !this.onPicked) return;
    this.onPicked(this.rule);
  }
}
