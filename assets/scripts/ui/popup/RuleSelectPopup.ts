import { _decorator, Component, instantiate, Label, Node } from 'cc';
import { RuleModel } from '../../models/RuleModel';
import { SceneUIFactory } from '../../utils/SceneUIFactory';
import { RuleOptionItem } from './RuleOptionItem';

const { ccclass, property } = _decorator;

@ccclass('RuleSelectPopup')
export class RuleSelectPopup extends Component {
  @property(Node) public root: Node | null = null;
  @property(Label) public titleLabel: Label | null = null;
  @property(Node) public optionListRoot: Node | null = null;
  @property(Node) public optionTemplate: Node | null = null;

  private onPicked: ((ruleId: string) => void) | null = null;
  private optionNodes: Node[] = [];

  protected onLoad(): void {
    this.ensureUI();
  }

  public open(candidates: RuleModel[], onPicked: (ruleId: string) => void): void {
    this.onPicked = onPicked;
    (this.root ?? this.node).active = true;
    this.titleLabel && (this.titleLabel.string = '请选择今日生效镇规（3选1）');
    this.renderCandidates(candidates);
  }

  public close(): void { (this.root ?? this.node).active = false; }

  private ensureUI(): void {
    if (!this.root) {
      this.root = SceneUIFactory.createPanel(this.node, 'RulePopupRoot', 680, 800);
    }
    if (!this.titleLabel) {
      this.titleLabel = SceneUIFactory.createLabel(this.root, 'PopupTitle', '请选择规则', 26);
    }
    if (!this.optionListRoot) {
      this.optionListRoot = SceneUIFactory.createVerticalLayout(this.root, 'OptionList', 10);
    }
    if (!this.optionTemplate) {
      this.optionTemplate = new Node('RuleOptionTemplate');
      this.optionTemplate.parent = this.optionListRoot;
      this.optionTemplate.addComponent(RuleOptionItem);
      this.optionTemplate.active = false;
    }
    this.root.active = false;
  }

  private renderCandidates(candidates: RuleModel[]): void {
    if (!this.optionListRoot || !this.optionTemplate) return;
    while (this.optionNodes.length < candidates.length) {
      const node = instantiate(this.optionTemplate);
      node.parent = this.optionListRoot;
      node.active = true;
      this.optionNodes.push(node);
    }
    this.optionNodes.forEach((node, index) => {
      const rule = candidates[index];
      node.active = !!rule;
      if (!rule) return;
      const item = node.getComponent(RuleOptionItem) ?? node.addComponent(RuleOptionItem);
      item.bind(rule, (selectedRule) => this.pick(selectedRule.id));
    });
  }

  private pick(ruleId: string): void {
    if (!this.onPicked) return;
    this.onPicked(ruleId);
    this.close();
  }
}
