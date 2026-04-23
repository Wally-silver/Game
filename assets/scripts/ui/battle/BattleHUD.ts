import { _decorator, Component, Label } from 'cc';
import { App } from '../../core/App';
import { EVENT_NAME, SCENE_NAME } from '../../core/Constants';
import { TriggeredEvent } from '../../models/EventModel';
import { RuleSelectPopup } from '../popup/RuleSelectPopup';

const { ccclass, property } = _decorator;

/**
 * Battle.scene HUD 控制器：驱动最小可玩战局交互。
 */
@ccclass('BattleHUD')
export class BattleHUD extends Component {
  @property(Label)
  public timerLabel: Label | null = null;

  @property(Label)
  public orderLabel: Label | null = null;

  @property(Label)
  public joyLabel: Label | null = null;

  @property(Label)
  public goldLabel: Label | null = null;

  @property(Label)
  public ruleLabel: Label | null = null;

  @property(Label)
  public goalLabel: Label | null = null;

  @property(Label)
  public buildingLabel: Label | null = null;

  @property(Label)
  public eventFeedLabel: Label | null = null;

  @property(Label)
  public hintLabel: Label | null = null;

  @property(RuleSelectPopup)
  public rulePopup: RuleSelectPopup | null = null;

  private eventLogs: string[] = [];
  private unsubscribers: Array<() => void> = [];

  protected start(): void {
    const app = App.instance;
    if (!app) {
      return;
    }

    const candidates = app.battleManager.setupNewBattle();
    this.rulePopup?.open(candidates, (ruleId) => {
      const ok = app.battleManager.selectRuleAndStart(ruleId);
      this.hintLabel && (this.hintLabel.string = ok ? '战局开始！' : '规则选择失败');
      this.refreshView();
    });

    this.unsubscribers.push(
      app.eventBus.on<TriggeredEvent>(EVENT_NAME.BATTLE_EVENT_TRIGGERED, (payload) => {
        if (!payload) {
          return;
        }
        this.eventLogs.unshift(`【事件】${payload.name}: ${payload.desc}`);
        this.eventLogs = this.eventLogs.slice(0, 6);
        this.refreshEventFeed();
      }),
    );

    this.unsubscribers.push(
      app.eventBus.on(EVENT_NAME.BATTLE_ENDED, async () => {
        this.hintLabel && (this.hintLabel.string = '战局结束，正在进入结算...');
        await app.sceneRouter.load(SCENE_NAME.RESULT);
      }),
    );

    this.refreshView();
  }

  protected update(dt: number): void {
    const app = App.instance;
    if (!app) {
      return;
    }
    app.battleManager.update(dt);
    this.refreshView();
  }

  protected onDestroy(): void {
    this.unsubscribers.forEach((off) => off());
  }

  public onTapBakeryOvertime(): void {
    this.toggleOvertime('bakery');
  }

  public onTapOfficeOvertime(): void {
    this.toggleOvertime('office');
  }

  public onTapParkOvertime(): void {
    this.toggleOvertime('park');
  }

  public onTapBakeryPause(): void {
    this.togglePause('bakery');
  }

  public onTapOfficePause(): void {
    this.togglePause('office');
  }

  public onTapParkPause(): void {
    this.togglePause('park');
  }

  public onTapBackHome(): void {
    void App.instance?.sceneRouter.goHome();
  }

  private toggleOvertime(buildingId: string): void {
    App.instance?.battleManager.toggleBuildingOvertime(buildingId);
    this.hintLabel && (this.hintLabel.string = `${buildingId} 已切换加班状态`);
    this.refreshView();
  }

  private togglePause(buildingId: string): void {
    App.instance?.battleManager.toggleBuildingPause(buildingId);
    this.hintLabel && (this.hintLabel.string = `${buildingId} 已切换暂停状态`);
    this.refreshView();
  }

  private refreshView(): void {
    const snapshot = App.instance?.battleManager.getSnapshot();
    if (!snapshot) {
      return;
    }

    this.timerLabel && (this.timerLabel.string = `时间: ${Math.ceil(snapshot.timer)}s`);
    this.orderLabel && (this.orderLabel.string = `秩序: ${Math.round(snapshot.order)}`);
    this.joyLabel && (this.joyLabel.string = `快乐: ${Math.round(snapshot.joy)}`);
    this.goldLabel && (this.goldLabel.string = `金币: ${Math.round(snapshot.gold)}`);
    this.ruleLabel && (this.ruleLabel.string = `规则: ${snapshot.currentRuleName}`);
    this.goalLabel && (this.goalLabel.string = `目标进度: ${Math.round(snapshot.goalProgress)}%`);

    if (this.buildingLabel) {
      this.buildingLabel.string = snapshot.buildings
        .map((item) => `${item.name} | 状态:${item.state} | 人力:${item.current_workers}/${item.worker_need} | 产出:${item.current_output}`)
        .join('\n');
    }

    this.refreshEventFeed();
  }

  private refreshEventFeed(): void {
    if (!this.eventFeedLabel) {
      return;
    }
    this.eventFeedLabel.string = this.eventLogs.length > 0 ? this.eventLogs.join('\n') : '暂无事件';
  }
}
