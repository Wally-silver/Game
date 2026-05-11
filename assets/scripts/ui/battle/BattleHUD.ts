import { _decorator, Button, Component, instantiate, Label, Node } from 'cc';
import { BattleRuntimeState } from '../../models/BattleModel';
import { SceneUIFactory } from '../../utils/SceneUIFactory';
import { BuildingActionItem } from './BuildingActionItem';

const { ccclass, property } = _decorator;

interface BattleHudCallbacks {
  onTapBuildingOvertime: (buildingId: string) => void;
  onTapBuildingPause: (buildingId: string) => void;
  onTapBuildingReassign: (buildingId: string) => void;
  onTapStabilize: () => void;
  onTapBackHome: () => void;
}

@ccclass('BattleHUD')
export class BattleHUD extends Component {
  @property(Label) public timerLabel: Label | null = null;
  @property(Label) public orderLabel: Label | null = null;
  @property(Label) public joyLabel: Label | null = null;
  @property(Label) public goldLabel: Label | null = null;
  @property(Label) public ruleLabel: Label | null = null;
  @property(Label) public ruleDetailLabel: Label | null = null;
  @property(Label) public goalLabel: Label | null = null;
  @property(Label) public eventFeedLabel: Label | null = null;
  @property(Label) public hintLabel: Label | null = null;
  @property(Node) public buildingListRoot: Node | null = null;
  @property(Node) public buildingItemTemplate: Node | null = null;

  private callbacks: BattleHudCallbacks | null = null;
  private eventLogs: string[] = [];
  private latestHint = '';
  private latestRuleFlavor = '风险: - | 趣味: - | 说明: 等待选择';
  private buildingItems = new Map<string, BuildingActionItem>();

  protected onLoad(): void { this.ensureUI(); }

  public ensureRuntimeNodes(): void {
    this.ensureUI();
    if (!this.buildingListRoot) {
      const root = this.node.getChildByName('HUDRoot') ?? SceneUIFactory.ensurePanel(this.node, 'HUDRoot');
      const col = root.getChildByName('HUDColumn') ?? SceneUIFactory.ensureVerticalGroup(root, 'HUDColumn', 8);
      this.buildingListRoot = SceneUIFactory.ensureVerticalGroup(col, 'BuildingList', 6);
    }
    if (!this.buildingItemTemplate) {
      this.buildingItemTemplate = new Node('BuildingItemTemplate');
      this.buildingItemTemplate.parent = this.buildingListRoot;
      this.buildingItemTemplate.active = false;
      this.buildingItemTemplate.addComponent(BuildingActionItem);
    }
  }

  public resetView(): void {
    this.callbacks = null;
    this.eventLogs = [];
    this.latestHint = '';
    this.latestRuleFlavor = '风险: - | 趣味: - | 说明: 等待选择';
    this.buildingItems.forEach((item) => item.node.destroy());
    this.buildingItems.clear();
    this.refreshEvents();
    this.refreshHint();
  }

  public bindCallbacks(callbacks: BattleHudCallbacks): void { this.callbacks = callbacks; }
  public refreshFromRuntimeState(snapshot: BattleRuntimeState): void { this.refreshTopBar(snapshot); this.refreshRuleInfo(snapshot); this.refreshGoal(snapshot); this.refreshBuildings(snapshot); this.refreshEvents(); this.refreshHint(); }
  public refreshTopState(snapshot: BattleRuntimeState): void { this.refreshTopBar(snapshot); this.refreshGoal(snapshot); }
  public refreshRuleState(snapshot: BattleRuntimeState): void { this.refreshRuleInfo(snapshot); }
  public refreshBuildingState(snapshot: BattleRuntimeState): void { this.refreshBuildings(snapshot); }
  public appendEventLog(message: string): void { this.eventLogs.unshift(message); this.eventLogs = this.eventLogs.slice(0, 8); this.refreshEvents(); }
  public setHint(message: string): void { this.latestHint = message; this.refreshHint(); }
  public setRuleFlavor(message: string): void { this.latestRuleFlavor = message; this.refreshRuleDetail(); }

  public onTapBuildingOvertime(buildingId: string): void { this.callbacks?.onTapBuildingOvertime(buildingId); }
  public onTapBuildingPause(buildingId: string): void { this.callbacks?.onTapBuildingPause(buildingId); }
  public onTapBuildingReassign(buildingId: string): void { this.callbacks?.onTapBuildingReassign(buildingId); }
  public onTapStabilize(): void { this.callbacks?.onTapStabilize(); }
  public onTapBackHome(): void { this.callbacks?.onTapBackHome(); }

  private ensureUI(): void {
    const root = SceneUIFactory.ensurePanel(this.node, 'HUDRoot');
    const col = SceneUIFactory.ensureVerticalGroup(root, 'HUDColumn', 8);
    this.timerLabel = this.timerLabel ?? SceneUIFactory.ensureLabel(col, 'Timer', '时间: 0');
    this.orderLabel = this.orderLabel ?? SceneUIFactory.ensureLabel(col, 'Order', '秩序: 0');
    this.joyLabel = this.joyLabel ?? SceneUIFactory.ensureLabel(col, 'Joy', '快乐: 0');
    this.goldLabel = this.goldLabel ?? SceneUIFactory.ensureLabel(col, 'Gold', '金币: 0');
    this.ruleLabel = this.ruleLabel ?? SceneUIFactory.ensureLabel(col, 'Rule', '【当前镇规】未选择');
    this.ruleDetailLabel = this.ruleDetailLabel ?? SceneUIFactory.ensureLabel(col, 'RuleDetail', '风险: - | 趣味: - | 说明: -', 18);
    this.goalLabel = this.goalLabel ?? SceneUIFactory.ensureLabel(col, 'Goal', '目标进度: 0%');
    this.eventFeedLabel = this.eventFeedLabel ?? SceneUIFactory.ensureLabel(col, 'Events', '暂无事件');
    this.hintLabel = this.hintLabel ?? SceneUIFactory.ensureLabel(col, 'Hint', '');
    this.buildingListRoot = this.buildingListRoot ?? SceneUIFactory.ensureVerticalGroup(col, 'BuildingList', 6);
    if (!this.buildingItemTemplate) {
      this.buildingItemTemplate = new Node('BuildingItemTemplate');
      this.buildingItemTemplate.parent = this.buildingListRoot;
      this.buildingItemTemplate.active = false;
      this.buildingItemTemplate.addComponent(BuildingActionItem);
    }
    const stabilize = SceneUIFactory.ensureButton(col, 'StabilizeBtn', '全镇安抚(20金币)');
    SceneUIFactory.bindSingleClick(stabilize.node, () => this.onTapStabilize());
    const back = SceneUIFactory.ensureButton(col, 'BackHomeBtn', '返回主页');
    SceneUIFactory.bindSingleClick(back.node, () => this.onTapBackHome());
  }

  private refreshTopBar(snapshot: BattleRuntimeState): void { this.timerLabel && (this.timerLabel.string = `时间: ${Math.ceil(snapshot.timer)}s`); this.orderLabel && (this.orderLabel.string = `秩序: ${Math.round(snapshot.order)}`); this.joyLabel && (this.joyLabel.string = `快乐: ${Math.round(snapshot.joy)}`); this.goldLabel && (this.goldLabel.string = `金币: ${Math.round(snapshot.gold)}`); }
  private refreshRuleInfo(snapshot: BattleRuntimeState): void {
    this.ruleLabel && (this.ruleLabel.string = `【当前镇规】${snapshot.currentRuleName}`);
    this.ruleDetailLabel && (this.ruleDetailLabel.string = snapshot.currentRuleCategory === 'none' ? '风险: - | 趣味: - | 说明: 等待选择' : `类别: ${snapshot.currentRuleCategory} | ${this.latestRuleFlavor}`);
  }
  private refreshGoal(snapshot: BattleRuntimeState): void { this.goalLabel && (this.goalLabel.string = `目标进度: ${Math.round(snapshot.goalProgress)}%`); }

  private refreshBuildings(snapshot: BattleRuntimeState): void {
    if (!this.buildingListRoot || !this.buildingItemTemplate) return;
    const used = new Set<string>();
    snapshot.buildings.forEach((b) => {
      let item = this.buildingItems.get(b.id);
      if (!item) {
        const node = instantiate(this.buildingItemTemplate);
        node.parent = this.buildingListRoot!;
        node.active = true;
        item = node.getComponent(BuildingActionItem) ?? node.addComponent(BuildingActionItem);
        item.bind(b, { onOvertime: (id) => this.onTapBuildingOvertime(id), onPause: (id) => this.onTapBuildingPause(id), onReassign: (id) => this.onTapBuildingReassign(id) });
        this.buildingItems.set(b.id, item);
      } else {
        item.node.active = true;
        item.refresh(b);
      }
      used.add(b.id);
    });
    this.buildingItems.forEach((item, id) => { if (!used.has(id)) item.node.active = false; });
    console.log(`[BattleHUD] buildings rendered: ${used.size}`);
  }

  private refreshEvents(): void { if (this.eventFeedLabel) this.eventFeedLabel.string = this.eventLogs.length > 0 ? this.eventLogs.join('\n') : '暂无事件'; }
  private refreshHint(): void { if (this.hintLabel) this.hintLabel.string = this.latestHint; }
  private refreshRuleDetail(): void { if (this.ruleDetailLabel) this.ruleDetailLabel.string = this.latestRuleFlavor; }
}
