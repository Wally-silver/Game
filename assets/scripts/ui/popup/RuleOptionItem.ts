import { _decorator, Button, Component, Label, Node } from 'cc';
import { RuleModel } from '../../models/RuleModel';
import { SceneUIFactory } from '../../utils/SceneUIFactory';

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

  protected onLoad(): void {
    if (!this.ruleNameLabel) {
      this.ruleNameLabel = SceneUIFactory.createLabel(this.node, 'RuleName', '规则名');
      this.ruleDescLabel = SceneUIFactory.createLabel(this.node, 'RuleDesc', '规则描述', 18);
      this.riskLabel = SceneUIFactory.createLabel(this.node, 'Risk', '风险: 0', 18);
      this.funLabel = SceneUIFactory.createLabel(this.node, 'Fun', '趣味: 0', 18);
      this.selectButton = SceneUIFactory.createButton(this.node, 'SelectBtn', '选择').button;
      this.selectButton.node.on(Button.EventType.CLICK, () => this.onTapSelect());
      this.detailButtonPlaceholder = new Node('DetailPlaceholder'); this.detailButtonPlaceholder.parent = this.node;
      this.spiritTagPlaceholder = new Node('SpiritTagPlaceholder'); this.spiritTagPlaceholder.parent = this.node;
      this.riskIconPlaceholder = new Node('RiskIconPlaceholder'); this.riskIconPlaceholder.parent = this.node;
    }
  }

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
