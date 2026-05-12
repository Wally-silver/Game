import { _decorator, Component, Node } from 'cc';
import { App, AppServices } from '../../core/App';
import { EVENT_NAME, SCENE_NAME } from '../../core/Constants';
import { TriggeredEvent } from '../../models/EventModel';
import { BattleHUD } from './BattleHUD';
import { RuleSelectPopup } from '../popup/RuleSelectPopup';

const { ccclass, property } = _decorator;

@ccclass('BattleSceneController')
export class BattleSceneController extends Component {
  @property(BattleHUD) public hud: BattleHUD | null = null;
  @property(RuleSelectPopup) public rulePopup: RuleSelectPopup | null = null;

  private unsubscribers: Array<() => void> = [];
  private services: AppServices | null = null;

  protected onLoad(): void {
    this.ensureRuntimeUI();
  }

  protected start(): void {
    console.log('[BattleSceneController] scene started');
    this.services = App.getServices();
    this.unsubscribers.forEach((off) => off());
    this.unsubscribers = [];

    const app = this.services;
    if (!app || !this.hud) return;

    this.hud.resetView();

    this.hud.bindCallbacks({
      onTapBuildingOvertime: (id) => {
        app.battleManager.toggleBuildingOvertime(id);
        const snap = app.battleManager.getRuntimeState();
        const b = snap.buildings.find((it) => it.id === id);
        const msg = `【操作】${b?.name ?? id} 已切换加班状态`;
        this.hud?.appendEventLog(msg);
        this.hud?.setHint(msg);
        this.hud?.refreshBuildingState(snap);
      },
      onTapBuildingPause: (id) => {
        app.battleManager.toggleBuildingPause(id);
        const snap = app.battleManager.getRuntimeState();
        const b = snap.buildings.find((it) => it.id === id);
        const msg = `【操作】${b?.name ?? id} 已切换暂停状态`;
        this.hud?.appendEventLog(msg);
        this.hud?.setHint(msg);
        this.hud?.refreshBuildingState(snap);
      },
      onTapBuildingReassign: (id) => { const res = app.battleManager.reassignSupport(id); this.hud?.appendEventLog(`${res.ok ? '【重要】' : '【提示】'} 调岗：${res.message}`); this.hud?.setHint(res.message); this.hud?.refreshBuildingState(app.battleManager.getRuntimeState()); },
      onTapStabilize: () => { const res = app.battleManager.stabilizeTown(); this.hud?.appendEventLog(`${res.ok ? '【警报级】' : '【提示】'} 安抚：${res.message}`); this.hud?.setHint(res.message); this.hud?.refreshTopState(app.battleManager.getRuntimeState()); },
      onTapBackHome: () => void app.sceneRouter.goHome(),
    });

    this.bindEvents();

    console.log('[BattleSceneController] setupNewBattle');
    const candidates = app.battleManager.setupNewBattle();
    this.hud.refreshFromRuntimeState(app.battleManager.getRuntimeState());
    this.hud.setHint('请选择规则开始战局');
    console.log('[BattleSceneController] show rule popup');

    this.rulePopup?.open(candidates, (ruleId) => {
      const ok = app.battleManager.selectRuleAndStart(ruleId);
      this.hud?.setHint(ok ? '镇规生效，全镇请立刻执行！' : '规则选择失败');
      this.hud?.refreshFromRuntimeState(app.battleManager.getRuntimeState());
    });

    if (candidates.length === 0) {
      this.hud.setHint('规则加载失败，使用兜底规则自动开局');
      const fallback = app.configManager.getAll<any>('rules')[0];
      if (fallback?.id) {
        app.battleManager.selectRuleAndStart(fallback.id);
        this.hud.refreshFromRuntimeState(app.battleManager.getRuntimeState());
      }
    }
  }

  protected update(dt: number): void { if (this.services) this.services.battleManager.update(dt); }
  protected onEnable(): void { this.services?.battleManager.resumeBattle(); }
  protected onDisable(): void { this.services?.battleManager.pauseBattle(); }
  protected onDestroy(): void {
    this.unsubscribers.forEach((off) => off());
    this.unsubscribers = [];
    this.hud?.resetView();
    this.services?.battleManager.stopBattle();
  }

  // debug helpers
  public debugForceEnd(success = true): void {
    if (!this.services) return;
    this.hud?.appendEventLog(`【DEBUG】强制结算 success=${success}`);
    this.services.battleManager.debugForceEnd(success);
  }
  public debugAdjustOrder(delta: number): void { if (!this.services) return; this.services.battleManager.debugAdjustTopState({ order: delta }); this.hud?.appendEventLog(`【DEBUG】order ${delta > 0 ? '+' : ''}${delta}`); }
  public debugAdjustJoy(delta: number): void { if (!this.services) return; this.services.battleManager.debugAdjustTopState({ joy: delta }); this.hud?.appendEventLog(`【DEBUG】joy ${delta > 0 ? '+' : ''}${delta}`); }
  public debugAdjustGold(delta: number): void { if (!this.services) return; this.services.battleManager.debugAdjustTopState({ gold: delta }); this.hud?.appendEventLog(`【DEBUG】gold ${delta > 0 ? '+' : ''}${delta}`); }
  public debugPrintBuildings(): void { const s = this.services?.battleManager.getRuntimeState(); if (!s) return; this.hud?.appendEventLog(`【DEBUG】buildings=${JSON.stringify(s.buildings.map((b) => ({ id: b.id, st: b.state, workers: b.current_workers, out: b.current_output })))}`); }

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

    this.hud.ensureRuntimeNodes();
    this.rulePopup!.ensureRuntimeNodes();
  }

  private bindEvents(): void {
    const app = this.services;
    if (!app || !this.hud) return;

    this.unsubscribers.push(app.eventBus.on(EVENT_NAME.BATTLE_RESOURCE_CHANGED, () => { const snap = app.battleManager.getRuntimeState(); this.hud?.refreshTopState(snap); if (snap.order <= 25 || snap.joy <= 25) this.hud?.appendEventLog('【警报级】秩序或快乐过低，建议立刻安抚或暂停高风险建筑！'); if (snap.order <= 20 || snap.joy <= 20) this.hud?.setHint('危险：优先安抚，再调岗补缺员。'); if (snap.goalProgress >= 95 && snap.order > 25 && snap.joy > 25) this.hud?.setHint('即将成功：守住秩序与快乐，避免最后翻车。'); }));
    this.unsubscribers.push(app.eventBus.on(EVENT_NAME.BATTLE_BUILDINGS_CHANGED, () => { const snap = app.battleManager.getRuntimeState(); this.hud?.refreshBuildingState(snap); snap.buildings.filter((b) => b.state === 'understaffed' || b.state === 'overloaded' || b.state === 'abnormal').forEach((b) => this.hud?.appendEventLog(`【警报级】${b.name}进入${b.state}，可考虑调岗或暂停`)); }));
    this.unsubscribers.push(app.eventBus.on<any>(EVENT_NAME.BATTLE_RULE_SELECTED, (payload) => { this.hud?.refreshRuleState(app.battleManager.getRuntimeState()); this.hud?.setRuleFlavor(`风险${payload?.risk ?? '-'} | 趣味${payload?.fun ?? '-'} | ${payload?.ruleDesc ?? ''}`); this.hud?.appendEventLog(`【重要】镇规生效：${payload?.ruleName ?? ''}｜风险${payload?.risk ?? '-'} 趣味${payload?.fun ?? '-'}｜${payload?.ruleDesc ?? ''}`); }));
    this.unsubscribers.push(app.eventBus.on<TriggeredEvent>(EVENT_NAME.BATTLE_EVENT_TRIGGERED, (payload) => {
      if (!payload) return;
      const level = payload.name.includes('播报') || payload.desc.includes('警报级') ? '【警报级】' : payload.desc.includes('重要') ? '【重要】' : '【快讯】';
      this.hud?.appendEventLog(`${level} ${payload.name}｜${payload.desc}`);
    }));
    this.unsubscribers.push(app.eventBus.on(EVENT_NAME.BATTLE_SETTLEMENT_READY, async () => { this.hud?.setHint('战局结束，正在进入结算...'); await app.sceneRouter.load(SCENE_NAME.RESULT); }));
  }
}
