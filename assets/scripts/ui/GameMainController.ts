import { _decorator, Component, Node } from 'cc';
import { App } from '../core/App';
import { EVENT_NAME } from '../core/Constants';
import { SceneUIFactory } from '../utils/SceneUIFactory';
import { BattleHUD } from './battle/BattleHUD';
import { RuleSelectPopup } from './popup/RuleSelectPopup';
import { ResultReportView } from './report/ResultReportView';

const { ccclass } = _decorator;

@ccclass('GameMainController')
export class GameMainController extends Component {
  private homeRoot: Node | null = null;
  private battleRoot: Node | null = null;
  private resultRoot: Node | null = null;
  private hud: BattleHUD | null = null;
  private popup: RuleSelectPopup | null = null;
  private resultView: ResultReportView | null = null;
  private unsubscribers: Array<() => void> = [];

  protected async start(): Promise<void> {
    console.log('[GameMainController] start');
    SceneUIFactory.ensureFullScreenRoot(this.node);

    if (!App.instance) {
      const appRoot = new Node('AppRoot');
      appRoot.parent = this.node.scene;
      appRoot.addComponent(App);
      await Promise.resolve();
    }

    try {
      await App.instance?.bootstrap();
      console.log('[GameMainController] bootstrap completed');
      this.showHome();
    } catch (error) {
      console.error('[GameMainController] bootstrap failed', error);
      SceneUIFactory.ensureLabel(this.node, 'FatalError', '启动失败，请查看Console', 24);
    }
  }

  protected update(dt: number): void {
    if (this.battleRoot?.active) {
      try { App.getServices().battleManager.update(dt); } catch {}
    }
  }

  private showHome(): void {
    this.clearFlow();
    this.homeRoot = this.homeRoot ?? SceneUIFactory.ensureSafePanel(this.node, 'HomePage');
    this.homeRoot.active = true;
    const col = SceneUIFactory.ensureVerticalGroup(this.homeRoot, 'HomeColumn', 12);
    SceneUIFactory.ensureLabel(col, 'Title', '《怪话小镇》', 34);
    let gold = 0; let insp = 0;
    try { const s = App.getServices().gameState.getSnapshot(); gold = s.gold; insp = s.inspiration; } catch {}
    SceneUIFactory.ensureLabel(col, 'Gold', `金币: ${gold}`);
    SceneUIFactory.ensureLabel(col, 'Inspiration', `灵感: ${insp}`);
    const start = SceneUIFactory.ensureButton(col, 'StartBattle', '开始战局');
    SceneUIFactory.bindSingleClick(start.node, () => {
      console.log('[GameMainController] start battle clicked');
      this.showBattle();
    });
    console.log('[GameMainController] show home');
  }

  private showBattle(): void {
    this.clearFlow();
    this.battleRoot = this.battleRoot ?? SceneUIFactory.ensureSafePanel(this.node, 'BattlePage');
    this.battleRoot.active = true;
    const app = App.getServices();

    if (!this.hud) {
      const n = new Node('BattleHUD');
      n.parent = this.battleRoot;
      this.hud = n.addComponent(BattleHUD);
    }
    if (!this.popup) {
      const n = new Node('RulePopup');
      n.parent = this.battleRoot;
      this.popup = n.addComponent(RuleSelectPopup);
    }
    this.hud.ensureRuntimeNodes();
    this.popup.ensureRuntimeNodes();

    this.hud.bindCallbacks({
      onTapBuildingOvertime: (id) => { app.battleManager.toggleBuildingOvertime(id); this.hud?.appendEventLog(`【操作】${id} 加班切换`); this.hud?.refreshBuildingState(app.battleManager.getRuntimeState()); },
      onTapBuildingPause: (id) => { app.battleManager.toggleBuildingPause(id); this.hud?.appendEventLog(`【操作】${id} 暂停切换`); this.hud?.refreshBuildingState(app.battleManager.getRuntimeState()); },
      onTapBuildingReassign: (id) => { const r = app.battleManager.reassignSupport(id); this.hud?.appendEventLog(r.message); this.hud?.refreshBuildingState(app.battleManager.getRuntimeState()); },
      onTapStabilize: () => { const r = app.battleManager.stabilizeTown(); this.hud?.appendEventLog(r.message); this.hud?.refreshTopState(app.battleManager.getRuntimeState()); },
      onTapBackHome: () => this.showHome(),
    });

    const candidates = app.battleManager.setupNewBattle();
    this.hud.refreshFromRuntimeState(app.battleManager.getRuntimeState());
    this.popup.open(candidates, (ruleId) => {
      app.battleManager.selectRuleAndStart(ruleId);
      this.hud?.refreshFromRuntimeState(app.battleManager.getRuntimeState());
    });

    this.unsubscribers.push(app.eventBus.on(EVENT_NAME.BATTLE_RESOURCE_CHANGED, () => this.hud?.refreshTopState(app.battleManager.getRuntimeState())));
    this.unsubscribers.push(app.eventBus.on(EVENT_NAME.BATTLE_BUILDINGS_CHANGED, () => this.hud?.refreshBuildingState(app.battleManager.getRuntimeState())));
    this.unsubscribers.push(app.eventBus.on(EVENT_NAME.BATTLE_RULE_SELECTED, () => this.hud?.refreshRuleState(app.battleManager.getRuntimeState())));
    this.unsubscribers.push(app.eventBus.on<any>(EVENT_NAME.BATTLE_EVENT_TRIGGERED, (evt) => this.hud?.appendEventLog(`${evt?.name ?? '事件'} ${evt?.desc ?? ''}`)));
    this.unsubscribers.push(app.eventBus.on(EVENT_NAME.BATTLE_SETTLEMENT_READY, () => this.showResult()));
    console.log('[GameMainController] show battle');
  }

  private showResult(): void {
    this.clearFlow();
    this.resultRoot = this.resultRoot ?? SceneUIFactory.ensureSafePanel(this.node, 'ResultPage');
    this.resultRoot.active = true;

    if (!this.resultView) {
      const n = new Node('ResultView');
      n.parent = this.resultRoot;
      this.resultView = n.addComponent(ResultReportView);
    }

    const app = App.getServices();
    this.resultView.bindReport(app.getLatestBattleReport() ?? app.battleManager.getLastReport());
    if (this.resultView.backButton) SceneUIFactory.bindSingleClick(this.resultView.backButton, () => this.showHome());
    if (this.resultView.retryButton) SceneUIFactory.bindSingleClick(this.resultView.retryButton, () => this.showBattle());

    console.log('[GameMainController] show result');
  }

  private clearFlow(): void {
    this.unsubscribers.forEach((off) => off());
    this.unsubscribers = [];
    if (this.homeRoot) this.homeRoot.active = false;
    if (this.battleRoot) this.battleRoot.active = false;
    if (this.resultRoot) this.resultRoot.active = false;
  }
}
