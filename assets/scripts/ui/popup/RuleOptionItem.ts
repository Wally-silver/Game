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
  @property(Label) public tendencyLabel: Label | null = null;
  @property(Button) public selectButton: Button | null = null;
  @property(Node) public detailButtonPlaceholder: Node | null = null;
  @property(Node) public spiritTagPlaceholder: Node | null = null;
  @property(Node) public riskIconPlaceholder: Node | null = null;

  private rule: RuleModel | null = null;
  private onPicked: ((rule: RuleModel) => void) | null = null;

  protected onLoad(): void {
    this.ruleNameLabel = this.ruleNameLabel ?? SceneUIFactory.ensureLabel(this.node, 'RuleName', '规则名');
    this.ruleDescLabel = this.ruleDescLabel ?? SceneUIFactory.ensureLabel(this.node, 'RuleDesc', '规则描述', 18);
    this.riskLabel = this.riskLabel ?? SceneUIFactory.ensureLabel(this.node, 'Risk', '风险: 0', 18);
    this.funLabel = this.funLabel ?? SceneUIFactory.ensureLabel(this.node, 'Fun', '趣味: 0', 18);
    this.tendencyLabel = this.tendencyLabel ?? SceneUIFactory.ensureLabel(this.node, 'Tendency', '倾向: -', 18);
    const select = SceneUIFactory.ensureButton(this.node, 'SelectBtn', '选择');
    this.selectButton = this.selectButton ?? select.button;
    select.node.off(Button.EventType.CLICK);
    select.node.on(Button.EventType.CLICK, () => this.onTapSelect());
    this.detailButtonPlaceholder = this.detailButtonPlaceholder ?? this.node.getChildByName('DetailPlaceholder') ?? new Node('DetailPlaceholder');
    this.detailButtonPlaceholder.parent = this.node;
    this.spiritTagPlaceholder = this.spiritTagPlaceholder ?? this.node.getChildByName('SpiritTagPlaceholder') ?? new Node('SpiritTagPlaceholder');
    this.spiritTagPlaceholder.parent = this.node;
    this.riskIconPlaceholder = this.riskIconPlaceholder ?? this.node.getChildByName('RiskIconPlaceholder') ?? new Node('RiskIconPlaceholder');
    this.riskIconPlaceholder.parent = this.node;
  }

  public bind(rule: RuleModel, onPicked: (rule: RuleModel) => void): void {
    this.rule = rule;
    this.onPicked = onPicked;
    this.ruleNameLabel && (this.ruleNameLabel.string = rule.name);
    this.ruleDescLabel && (this.ruleDescLabel.string = rule.desc);
    this.riskLabel && (this.riskLabel.string = `风险: ${rule.risk_score}`);
    this.funLabel && (this.funLabel.string = `趣味: ${rule.fun_score}`);
    const tilt = rule.effects.some((e) => e.target === 'gold_gain' && e.value > 1) ? '偏赚钱' : rule.effects.some((e) => e.target === 'order_change' && e.value > 0) ? '偏稳定' : rule.effects.some((e) => e.target === 'joy_change' && e.value > 0) ? '偏快乐' : '偏激进';
    const riskTag = rule.risk_score >= 7 ? '高风险' : rule.risk_score <= 3 ? '低风险' : '中风险';
    this.tendencyLabel && (this.tendencyLabel.string = `${riskTag}｜${tilt}`);
  }

  public onTapSelect(): void { if (this.rule && this.onPicked) this.onPicked(this.rule); }
}
