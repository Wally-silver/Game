import { _decorator, Component, Node } from 'cc';
import { App } from '../../core/App';
import { EVENT_NAME, SCENE_NAME } from '../../core/Constants';
import { TriggeredEvent } from '../../models/EventModel';
import { SceneUIFactory } from '../../utils/SceneUIFactory';
import { BattleHUD } from './BattleHUD';
import { RuleSelectPopup } from '../popup/RuleSelectPopup';

const { ccclass, property } = _decorator;

@ccclass('BattleSceneController')
export class BattleSceneController extends Component {
  @property(BattleHUD) public hud: BattleHUD | null = null;
  @property(RuleSelectPopup) public rulePopup: RuleSelectPopup | null = null;

  private unsubscribers: Array<() => void> = [];

  protected start(): void {
    this.ensureRuntimeUI();

    const app = App.instance;
    if (!app || !this.hud) return;

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

  protected update(dt: number): void { const app = App.instance; if (app) app.battleManager.update(dt); }
  protected onDestroy(): void { this.unsubscribers.forEach((off) => off()); }

  private ensureRuntimeUI(): void {
    if (!this.hud) {
      const hudNode = new Node('BattleHUDRoot');
      hudNode.parent = this.node;
      this.hud = hudNode.addComponent(BattleHUD);
    }
    if (!this.rulePopup) {
      const popupNode = new Node('RuleSelectPopupRoot');
      popupNode.parent = this.node;
      this.rulePopup = popupNode.addComponent(RuleSelectPopup);
    }

    // ensure minimal roots exist so components can build children safely
    const root = SceneUIFactory.createPanel(this.node, 'BattleUIRoot');
    if (!this.hud!.buildingListRoot) {
      this.hud!.buildingListRoot = SceneUIFactory.createVerticalLayout(root, 'BuildingListRoot', 8);
    }
    if (!this.hud!.buildingItemTemplate) {
      const t = new Node('BuildingItemTemplate');
      t.parent = this.hud!.buildingListRoot;
      this.hud!.buildingItemTemplate = t;
      t.active = false;
    }
    if (!this.rulePopup!.optionListRoot) {
      this.rulePopup!.optionListRoot = SceneUIFactory.createVerticalLayout(root, 'RuleOptionList', 10);
    }
    if (!this.rulePopup!.optionTemplate) {
      const t = new Node('RuleOptionTemplate');
      t.parent = this.rulePopup!.optionListRoot;
      this.rulePopup!.optionTemplate = t;
      t.active = false;
    }
  }

  private bindEvents(): void {
    const app = App.instance;
    if (!app || !this.hud) return;

    this.unsubscribers.push(app.eventBus.on(EVENT_NAME.BATTLE_RESOURCE_CHANGED, () => this.hud?.refreshTopState(app.battleManager.getRuntimeState())));
    this.unsubscribers.push(app.eventBus.on(EVENT_NAME.BATTLE_BUILDINGS_CHANGED, () => this.hud?.refreshBuildingState(app.battleManager.getRuntimeState())));
    this.unsubscribers.push(app.eventBus.on(EVENT_NAME.BATTLE_RULE_SELECTED, () => this.hud?.refreshRuleState(app.battleManager.getRuntimeState())));
    this.unsubscribers.push(app.eventBus.on<TriggeredEvent>(EVENT_NAME.BATTLE_EVENT_TRIGGERED, (payload) => payload && this.hud?.appendEventLog(`【事件】${payload.name}: ${payload.desc}`)));
    this.unsubscribers.push(app.eventBus.on(EVENT_NAME.BATTLE_SETTLEMENT_READY, async () => { this.hud?.setHint('战局结束，正在进入结算...'); await app.sceneRouter.load(SCENE_NAME.RESULT); }));
  }
}
