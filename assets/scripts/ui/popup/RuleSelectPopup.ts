import { _decorator, Component, Label, Node } from 'cc';
import { RuleModel } from '../../models/RuleModel';
import { RuleOptionItem } from './RuleOptionItem';

const { ccclass, property } = _decorator;

@ccclass('RuleSelectPopup')
export class RuleSelectPopup extends Component {
  @property(Node) public root: Node | null = null;
  @property(Label) public titleLabel: Label | null = null;
  @property([RuleOptionItem]) public optionItems: RuleOptionItem[] = [];

  private onPicked: ((ruleId: string) => void) | null = null;

  public open(candidates: RuleModel[], onPicked: (ruleId: string) => void): void {
    this.onPicked = onPicked;
    (this.root ?? this.node).active = true;
    if (this.titleLabel) this.titleLabel.string = '请选择今日生效镇规（3选1）';
    this.optionItems.forEach((item, index) => {
      const rule = candidates[index];
      item.node.active = !!rule;
      if (rule) item.bind(rule, (ruleId) => this.pick(ruleId));
    });
  }

  public close(): void {
    (this.root ?? this.node).active = false;
  }

  private pick(ruleId: string): void {
    if (!this.onPicked) return;
    this.onPicked(ruleId);
    this.close();
  }
}
