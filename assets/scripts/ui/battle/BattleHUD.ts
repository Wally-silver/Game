import { _decorator, Component, instantiate, Label, Node } from 'cc';
import { BattleRuntimeState } from '../../models/BattleModel';
import { BuildingActionItem } from './BuildingActionItem';

const { ccclass, property } = _decorator;

interface BattleHudCallbacks {
  onTapBuildingOvertime: (buildingId: string) => void;
  onTapBuildingPause: (buildingId: string) => void;
  onTapBackHome: () => void;
}

@ccclass('BattleHUD')
export class BattleHUD extends Component {
  @property(Label) public timerLabel: Label | null = null;
  @property(Label) public orderLabel: Label | null = null;
  @property(Label) public joyLabel: Label | null = null;
  @property(Label) public goldLabel: Label | null = null;
  @property(Label) public ruleLabel: Label | null = null;
  @property(Label) public goalLabel: Label | null = null;
  @property(Label) public eventFeedLabel: Label | null = null;
  @property(Label) public hintLabel: Label | null = null;
  @property(Node) public buildingListRoot: Node | null = null;
  @property(Node) public buildingItemTemplate: Node | null = null;

  private callbacks: BattleHudCallbacks | null = null;
  private eventLogs: string[] = [];
  private latestHint = '';
  private buildingItems = new Map<string, BuildingActionItem>();

  public bindCallbacks(callbacks: BattleHudCallbacks): void {
    this.callbacks = callbacks;
  }

  public refreshFromRuntimeState(snapshot: BattleRuntimeState): void {
    this.refreshTopBar(snapshot);
    this.refreshRuleInfo(snapshot);
    this.refreshGoal(snapshot);
    this.refreshBuildings(snapshot);
    this.refreshEvents();
    this.refreshHint();
  }

  public refreshTopState(snapshot: BattleRuntimeState): void {
    this.refreshTopBar(snapshot);
    this.refreshGoal(snapshot);
  }

  public refreshRuleState(snapshot: BattleRuntimeState): void {
    this.refreshRuleInfo(snapshot);
  }

  public refreshBuildingState(snapshot: BattleRuntimeState): void {
    this.refreshBuildings(snapshot);
  }

  public appendEventLog(message: string): void {
    this.eventLogs.unshift(message);
    this.eventLogs = this.eventLogs.slice(0, 8);
    this.refreshEvents();
  }

  public setHint(message: string): void {
    this.latestHint = message;
    this.refreshHint();
  }

  public onTapBuildingOvertime(buildingId: string): void {
    this.callbacks?.onTapBuildingOvertime(buildingId);
  }

  public onTapBuildingPause(buildingId: string): void {
    this.callbacks?.onTapBuildingPause(buildingId);
  }

  public onTapBackHome(): void {
    this.callbacks?.onTapBackHome();
  }

  private refreshTopBar(snapshot: BattleRuntimeState): void {
    this.timerLabel && (this.timerLabel.string = `时间: ${Math.ceil(snapshot.timer)}s`);
    this.orderLabel && (this.orderLabel.string = `秩序: ${Math.round(snapshot.order)}`);
    this.joyLabel && (this.joyLabel.string = `快乐: ${Math.round(snapshot.joy)}`);
    this.goldLabel && (this.goldLabel.string = `金币: ${Math.round(snapshot.gold)}`);
  }

  private refreshRuleInfo(snapshot: BattleRuntimeState): void {
    if (!this.ruleLabel) return;
    this.ruleLabel.string = `规则: ${snapshot.currentRuleName}`;
  }

  private refreshGoal(snapshot: BattleRuntimeState): void {
    if (!this.goalLabel) return;
    this.goalLabel.string = `目标进度: ${Math.round(snapshot.goalProgress)}%`;
  }

  private refreshBuildings(snapshot: BattleRuntimeState): void {
    if (!this.buildingListRoot || !this.buildingItemTemplate) return;
    const used = new Set<string>();

    snapshot.buildings.forEach((building) => {
      let item = this.buildingItems.get(building.id);
      if (!item) {
        const node = instantiate(this.buildingItemTemplate);
        node.parent = this.buildingListRoot;
        node.active = true;
        item = node.getComponent(BuildingActionItem) ?? node.addComponent(BuildingActionItem);
        item.bind(building, {
          onOvertime: (id) => this.onTapBuildingOvertime(id),
          onPause: (id) => this.onTapBuildingPause(id),
        });
        this.buildingItems.set(building.id, item);
      } else {
        item.node.active = true;
        item.refresh(building);
      }
      used.add(building.id);
    });

    this.buildingItems.forEach((item, id) => {
      if (!used.has(id)) item.node.active = false;
    });

    this.buildingItemTemplate.active = false;
  }

  private refreshEvents(): void {
    if (!this.eventFeedLabel) return;
    this.eventFeedLabel.string = this.eventLogs.length > 0 ? this.eventLogs.join('\n') : '暂无事件';
  }

  private refreshHint(): void {
    if (this.hintLabel) this.hintLabel.string = this.latestHint;
  }
}
