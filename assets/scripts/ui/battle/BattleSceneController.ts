import { _decorator, Component } from 'cc';
import { App } from '../../core/App';
import { EVENT_NAME, SCENE_NAME } from '../../core/Constants';
import { BattleRuntimeState } from '../../models/BattleModel';
import { TriggeredEvent } from '../../models/EventModel';
import { BattleHUD } from './BattleHUD';
import { RuleSelectPopup } from '../popup/RuleSelectPopup';

const { ccclass, property } = _decorator;

@ccclass('BattleSceneController')
export class BattleSceneController extends Component {
  @property(BattleHUD) public hud: BattleHUD | null = null;
  @property(RuleSelectPopup) public rulePopup: RuleSelectPopup | null = null;

  private unsubscribers: Array<() => void> = [];

  protected start(): void {
    const app = App.instance;
    if (!app || !this.hud) {
      return;
    }

    this.hud.bindCallbacks({
      onTapBuildingOvertime: (id) => app.battleManager.toggleBuildingOvertime(id),
      onTapBuildingPause: (id) => app.battleManager.toggleBuildingPause(id),
      onTapBackHome: () => void app.sceneRouter.goHome(),
    });

    this.bindEvents();

    const candidates = app.battleManager.setupNewBattle();
    this.hud.refreshFromRuntimeState(app.battleManager.getRuntimeState());
    this.hud.setHint('请选择规则开始战局');

    this.rulePopup?.open(candidates, (ruleId) => {
      const ok = app.battleManager.selectRuleAndStart(ruleId);
      this.hud?.setHint(ok ? '战局开始！' : '规则选择失败');
      this.hud?.refreshFromRuntimeState(app.battleManager.getRuntimeState());
    });
  }

  protected update(dt: number): void {
    const app = App.instance;
    if (!app) return;
    app.battleManager.update(dt);
  }

  protected onDestroy(): void {
    this.unsubscribers.forEach((off) => off());
  }

  private bindEvents(): void {
    const app = App.instance;
    if (!app || !this.hud) return;

    this.unsubscribers.push(app.eventBus.on(EVENT_NAME.BATTLE_RESOURCE_CHANGED, () => {
      this.hud?.refreshTopState(app.battleManager.getRuntimeState());
    }));
    this.unsubscribers.push(app.eventBus.on(EVENT_NAME.BATTLE_BUILDINGS_CHANGED, () => {
      this.hud?.refreshBuildingState(app.battleManager.getRuntimeState());
    }));
    this.unsubscribers.push(app.eventBus.on(EVENT_NAME.BATTLE_RULE_SELECTED, () => {
      this.hud?.refreshRuleState(app.battleManager.getRuntimeState());
    }));
    this.unsubscribers.push(app.eventBus.on<TriggeredEvent>(EVENT_NAME.BATTLE_EVENT_TRIGGERED, (payload) => {
      if (!payload) return;
      this.hud?.appendEventLog(`【事件】${payload.name}: ${payload.desc}`);
    }));
    this.unsubscribers.push(app.eventBus.on(EVENT_NAME.BATTLE_SETTLEMENT_READY, async () => {
      this.hud?.setHint('战局结束，正在进入结算...');
      await app.sceneRouter.load(SCENE_NAME.RESULT);
    }));
  }
}
