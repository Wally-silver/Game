import { _decorator, Button, Component, Label, Node } from 'cc';
import { RuleModel } from '../../models/RuleModel';

const { ccclass, property } = _decorator;

@ccclass('RuleOptionItem')
export class RuleOptionItem extends Component {
  @property(Label) public ruleNameLabel: Label | null = null;
  @property(Label) public ruleDescLabel: Label | null = null;
  @property(Label) public riskLabel: Label | null = null;
  @property(Label) public funLabel: Label | null = null;
  @property(Button) public selectButton: Button | null = null;
  @property(Node) public detailButtonPlaceholder: Node | null = null;
  @property(Node) public spiritTagPlaceholder: Node | null = null;
  @property(Node) public riskIconPlaceholder: Node | null = null;

  private rule: RuleModel | null = null;
  private onPicked: ((rule: RuleModel) => void) | null = null;

  public bind(rule: RuleModel, onPicked: (rule: RuleModel) => void): void {
    this.rule = rule;
    this.onPicked = onPicked;
    this.ruleNameLabel && (this.ruleNameLabel.string = rule.name);
    this.ruleDescLabel && (this.ruleDescLabel.string = rule.desc);
    this.riskLabel && (this.riskLabel.string = `风险: ${rule.risk_score}`);
    this.funLabel && (this.funLabel.string = `趣味: ${rule.fun_score}`);
  }

  public onTapSelect(): void { if (this.rule && this.onPicked) this.onPicked(this.rule); }
}
