import { _decorator, Component, instantiate, Label, Node } from 'cc';
import { App } from '../../core/App';
import { EVENT_NAME, SCENE_NAME } from '../../core/Constants';
import { BattleRuntimeState } from '../../models/BattleModel';
import { TriggeredEvent } from '../../models/EventModel';
import { BuildingActionItem } from './BuildingActionItem';
import { RuleSelectPopup } from '../popup/RuleSelectPopup';

const { ccclass, property } = _decorator;

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
  @property(RuleSelectPopup) public rulePopup: RuleSelectPopup | null = null;

  @property(Node) public buildingListRoot: Node | null = null;
  @property(Node) public buildingItemTemplate: Node | null = null;

  private eventLogs: string[] = [];
  private unsubscribers: Array<() => void> = [];
  private latestHint = '请选择规则开始战局';
  private buildingItems = new Map<string, BuildingActionItem>();
  private elapsedRefresh = 0;

  protected start(): void {
    const app = App.instance; if (!app) return;

    this.setupEventSubscriptions();

    const candidates = app.battleManager.setupNewBattle();
    this.rulePopup?.open(candidates, (ruleId) => {
      const ok = app.battleManager.selectRuleAndStart(ruleId);
      this.latestHint = ok ? '战局开始！' : '规则选择失败';
      this.refreshRuleInfo();
      this.refreshHint();
    });

    this.refreshAll();
  }

  protected update(dt: number): void {
    const app = App.instance; if (!app) return;
    app.battleManager.update(dt);
    this.elapsedRefresh += dt;
    if (this.elapsedRefresh >= 1) {
      this.elapsedRefresh = 0;
      this.refreshTopBar();
      this.refreshGoal();
    }
  }

  protected onDestroy(): void { this.unsubscribers.forEach((off) => off()); }

  public onTapBuildingOvertime(buildingId: string): void {
    App.instance?.battleManager.toggleBuildingOvertime(buildingId);
    this.latestHint = `${buildingId} 已切换加班状态`;
    this.refreshHint();
  }

  public onTapBuildingPause(buildingId: string): void {
    App.instance?.battleManager.toggleBuildingPause(buildingId);
    this.latestHint = `${buildingId} 已切换暂停状态`;
    this.refreshHint();
  }

  public onTapBackHome(): void { void App.instance?.sceneRouter.goHome(); }

  private setupEventSubscriptions(): void {
    const app = App.instance; if (!app) return;

    this.unsubscribers.push(app.eventBus.on(EVENT_NAME.BATTLE_RESOURCE_CHANGED, () => { this.refreshTopBar(); this.refreshGoal(); }));
    this.unsubscribers.push(app.eventBus.on(EVENT_NAME.BATTLE_BUILDINGS_CHANGED, () => this.refreshBuildings()));
    this.unsubscribers.push(app.eventBus.on(EVENT_NAME.BATTLE_RULE_SELECTED, () => this.refreshRuleInfo()));

    this.unsubscribers.push(app.eventBus.on<TriggeredEvent>(EVENT_NAME.BATTLE_EVENT_TRIGGERED, (payload) => {
      if (!payload) return;
      this.eventLogs.unshift(`【事件】${payload.name}: ${payload.desc}`);
      this.eventLogs = this.eventLogs.slice(0, 6);
      this.refreshEvents();
    }));

    this.unsubscribers.push(app.eventBus.on(EVENT_NAME.BATTLE_SETTLEMENT_READY, async () => {
      this.latestHint = '战局结束，正在进入结算...';
      this.refreshHint();
      await app.sceneRouter.load(SCENE_NAME.RESULT);
    }));
  }

  private refreshAll(): void {
    this.refreshTopBar();
    this.refreshGoal();
    this.refreshRuleInfo();
    this.refreshBuildings();
    this.refreshEvents();
    this.refreshHint();
  }

  private refreshTopBar(): void {
    const snapshot = App.instance?.battleManager.getRuntimeState();
    if (!snapshot) return;
    this.timerLabel && (this.timerLabel.string = `时间: ${Math.ceil(snapshot.timer)}s`);
    this.orderLabel && (this.orderLabel.string = `秩序: ${Math.round(snapshot.order)}`);
    this.joyLabel && (this.joyLabel.string = `快乐: ${Math.round(snapshot.joy)}`);
    this.goldLabel && (this.goldLabel.string = `金币: ${Math.round(snapshot.gold)}`);
  }

  private refreshRuleInfo(): void {
    const snapshot = App.instance?.battleManager.getRuntimeState();
    if (!snapshot || !this.ruleLabel) return;
    this.ruleLabel.string = `规则: ${snapshot.currentRuleName}`;
  }

  private refreshGoal(): void {
    const snapshot = App.instance?.battleManager.getRuntimeState();
    if (!snapshot || !this.goalLabel) return;
    this.goalLabel.string = `目标进度: ${Math.round(snapshot.goalProgress)}%`;
  }

  private refreshBuildings(): void {
    const snapshot = App.instance?.battleManager.getRuntimeState();
    if (!snapshot || !this.buildingListRoot || !this.buildingItemTemplate) return;

    const usedIds = new Set<string>();
    snapshot.buildings.forEach((building) => {
      let item = this.buildingItems.get(building.id);
      if (!item) {
        const node = instantiate(this.buildingItemTemplate);
        node.active = true;
        node.parent = this.buildingListRoot;
        item = node.getComponent(BuildingActionItem) ?? node.addComponent(BuildingActionItem);
        item.bind(building, { onOvertime: (id) => this.onTapBuildingOvertime(id), onPause: (id) => this.onTapBuildingPause(id) });
        this.buildingItems.set(building.id, item);
      } else {
        item.node.active = true;
        item.refresh(building);
      }
      usedIds.add(building.id);
    });

    this.buildingItems.forEach((item, id) => {
      if (!usedIds.has(id)) item.node.active = false;
    });

    this.buildingItemTemplate.active = false;
  }

  private refreshEvents(): void {
    if (!this.eventFeedLabel) return;
    this.eventFeedLabel.string = this.eventLogs.length ? this.eventLogs.join('\n') : '暂无事件';
  }

  private refreshHint(): void {
    if (this.hintLabel) this.hintLabel.string = this.latestHint;
  }
}
