import { _decorator, Component, Label } from 'cc';
import { App } from '../../core/App';
import { EVENT_NAME, SCENE_NAME } from '../../core/Constants';
import { BattleRuntimeState } from '../../models/BattleModel';
import { TriggeredEvent } from '../../models/EventModel';
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
  @property(Label) public buildingLabel: Label | null = null;
  @property(Label) public eventFeedLabel: Label | null = null;
  @property(Label) public hintLabel: Label | null = null;
  @property(RuleSelectPopup) public rulePopup: RuleSelectPopup | null = null;

  private eventLogs: string[] = [];
  private unsubscribers: Array<() => void> = [];
  private latestHint = '请选择规则开始战局';

  protected start(): void {
    const app = App.instance; if (!app) return;
    const candidates = app.battleManager.setupNewBattle();
    this.rulePopup?.open(candidates, (ruleId) => {
      const ok = app.battleManager.selectRuleAndStart(ruleId);
      this.latestHint = ok ? '战局开始！' : '规则选择失败';
      this.refreshView();
    });
    this.unsubscribers.push(app.eventBus.on<TriggeredEvent>(EVENT_NAME.BATTLE_EVENT_TRIGGERED, (payload) => {
      if (!payload) return;
      this.eventLogs.unshift(`【事件】${payload.name}: ${payload.desc}`);
      this.eventLogs = this.eventLogs.slice(0, 6);
      this.refreshEvents();
    }));
    this.unsubscribers.push(app.eventBus.on(EVENT_NAME.BATTLE_ENDED, async () => {
      this.latestHint = '战局结束，正在进入结算...';
      this.refreshHint();
      await app.sceneRouter.load(SCENE_NAME.RESULT);
    }));
    this.refreshView();
  }

  protected update(dt: number): void { const app = App.instance; if (!app) return; app.battleManager.update(dt); this.refreshView(); }
  protected onDestroy(): void { this.unsubscribers.forEach((off) => off()); }

  public onTapBuildingOvertime(buildingId: string): void { App.instance?.battleManager.toggleBuildingOvertime(buildingId); this.latestHint = `${buildingId} 已切换加班状态`; this.refreshView(); }
  public onTapBuildingPause(buildingId: string): void { App.instance?.battleManager.toggleBuildingPause(buildingId); this.latestHint = `${buildingId} 已切换暂停状态`; this.refreshView(); }
  public onTapBackHome(): void { void App.instance?.sceneRouter.goHome(); }

  private refreshView(): void {
    const snapshot = App.instance?.battleManager.getRuntimeState();
    if (!snapshot) return;
    this.refreshTopBar(snapshot);
    this.refreshBuildings(snapshot);
    this.refreshEvents();
    this.refreshHint();
  }

  private refreshTopBar(snapshot: BattleRuntimeState): void {
    this.timerLabel && (this.timerLabel.string = `时间: ${Math.ceil(snapshot.timer)}s`);
    this.orderLabel && (this.orderLabel.string = `秩序: ${Math.round(snapshot.order)}`);
    this.joyLabel && (this.joyLabel.string = `快乐: ${Math.round(snapshot.joy)}`);
    this.goldLabel && (this.goldLabel.string = `金币: ${Math.round(snapshot.gold)}`);
    this.ruleLabel && (this.ruleLabel.string = `规则: ${snapshot.currentRuleName}`);
    this.goalLabel && (this.goalLabel.string = `目标进度: ${Math.round(snapshot.goalProgress)}%`);
  }

  private refreshBuildings(snapshot: BattleRuntimeState): void {
    if (!this.buildingLabel) return;
    const actionGuide = snapshot.buildings.map((item)=>`${item.id}: 加班 onTapBuildingOvertime('${item.id}') / 暂停 onTapBuildingPause('${item.id}')`).join('\n');
    const lines = snapshot.buildings.map((item)=>`${item.name} | 状态:${item.state} | 人力:${item.current_workers}/${item.worker_need} | 压力:${Math.round(item.pressure)} | 风险:${Math.round(item.risk)} | 产出:${item.current_output}`);
    this.buildingLabel.string = `${lines.join('\n')}\n---\n${actionGuide}`;
  }

  private refreshEvents(): void { if (this.eventFeedLabel) this.eventFeedLabel.string = this.eventLogs.length ? this.eventLogs.join('\n') : '暂无事件'; }
  private refreshHint(): void { if (this.hintLabel) this.hintLabel.string = this.latestHint; }
}
