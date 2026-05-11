import { BATTLE_DEFAULTS, EVENT_NAME } from '../core/Constants';
import { EventBus } from '../core/EventBus';
import { GameState } from '../core/GameState';
import { BattleRuntimeState, BattleSettlementData } from '../models/BattleModel';
import { ReportModel } from '../models/ReportModel';
import { RuleModel } from '../models/RuleModel';
import { BuildingSystem } from '../systems/BuildingSystem';
import { EventSystem } from '../systems/EventSystem';
import { ReportSystem } from '../systems/ReportSystem';
import { ResidentSystem } from '../systems/ResidentSystem';
import { RuleSystem } from '../systems/RuleSystem';
import { MathUtil } from '../utils/MathUtil';
import { ConfigManager } from './ConfigManager';
import { App } from '../core/App';

interface BattleTopState { timer: number; order: number; joy: number; gold: number; goalProgress: number; }

export class BattleManager {
  private readonly ruleSystem: RuleSystem;
  private readonly buildingSystem: BuildingSystem;
  private readonly residentSystem: ResidentSystem;
  private readonly eventSystem: EventSystem;
  private readonly reportSystem: ReportSystem;

  private runtime: BattleRuntimeState;
  private candidates: RuleModel[] = [];
  private lastReport: ReportModel | null = null;
  private settlementData: BattleSettlementData | null = null;
  private buildingTickAccumulator = 0;
  private eventTickAccumulator = 0;
  private lastTopState: BattleTopState | null = null;
  private lastBuildingSignature = '';
  private stabilizeCharges = 2;
  private stabilizeCooldown = 0;
  private milestone25Done = false;
  private milestone50Done = false;
  private milestone75Done = false;
  private milestone100Done = false;
  private seenEventsBeforeRun = 0;
  private paused = false;
  private hasSettled = false;

  constructor(private readonly gameState: GameState, private readonly configManager: ConfigManager, private readonly eventBus: EventBus) {
    this.ruleSystem = new RuleSystem(this.configManager);
    this.buildingSystem = new BuildingSystem(this.configManager);
    this.residentSystem = new ResidentSystem(this.configManager);
    this.eventSystem = new EventSystem(this.configManager, this.eventBus);
    this.reportSystem = new ReportSystem(this.configManager);
    this.runtime = this.createInitialRuntime();
  }

  public setupNewBattle(): RuleModel[] {
    this.runtime = this.createInitialRuntime();
    this.lastReport = null;
    if (App.instance) {
      App.instance.latestBattleReport = null;
    }
    this.settlementData = null;
    this.buildingTickAccumulator = 0;
    this.eventTickAccumulator = 0;
    this.lastTopState = null;
    this.lastBuildingSignature = '';
    this.stabilizeCharges = 2;
    this.stabilizeCooldown = 0;
    this.milestone25Done = false;
    this.milestone50Done = false;
    this.milestone75Done = false;
    this.milestone100Done = false;
    this.seenEventsBeforeRun = this.gameState.getSnapshot().seenEvents.length;
    this.paused = false;
    this.hasSettled = false;

    const buildings = this.buildingSystem.initialize(this.gameState.getSnapshot().unlockedBuildings);
    this.residentSystem.initialize(buildings);
    this.eventSystem.initialize();
    const snapshot = this.gameState.getSnapshot();
    if (snapshot.unlockedRules.length === 0) {
      this.configManager.getAll<RuleModel>('rules').slice(0, 10).forEach((r) => this.gameState.unlockRule(r.id));
    }
    const unlocked = this.gameState.getSnapshot().unlockedRules;
    this.candidates = unlocked.length > 0 ? this.ruleSystem.generateCandidatesFromPool(unlocked, 3) : this.ruleSystem.generateCandidates(3);
    if (this.candidates.length < 3) {
      console.error(`[BattleManager] rule candidates not enough (${this.candidates.length}), using fallback pool`);
      this.candidates = this.ruleSystem.generateCandidates(3);
    }
    this.runtime.buildings = this.buildingSystem.getRuntimeBuildings();
    this.runtime.residents = this.residentSystem.getResidents();

    this.gameState.setCurrentRunData({ selectedRuleId: null, selectedRuleName: '未选择', order: this.runtime.order, joy: this.runtime.joy, gold: this.runtime.gold, timer: this.runtime.timer, goalProgress: this.runtime.goalProgress, started: false, ended: false });

    console.log('[BattleManager] new battle initialized', {
      timer: this.runtime.timer,
      order: this.runtime.order,
      joy: this.runtime.joy,
      gold: this.runtime.gold,
      buildings: this.runtime.buildings.length,
      candidates: this.candidates.length,
    });
    this.emitResourceIfChanged();
    this.emitBuildingsIfChanged();
    return this.candidates;
  }

  public selectRuleAndStart(ruleId: string): boolean {
    const rule = this.ruleSystem.applyRule(ruleId);
    if (!rule) return false;
    this.runtime.currentRuleName = rule.name;
    this.runtime.currentRuleCategory = rule.category;
    this.runtime.running = true;
    this.gameState.patchCurrentRunData({ selectedRuleId: rule.id, selectedRuleName: rule.name, started: true });
    this.eventBus.emit(EVENT_NAME.BATTLE_RULE_SELECTED, { ruleId: rule.id, ruleName: rule.name, ruleDesc: rule.desc, risk: rule.risk_score, fun: rule.fun_score });
    console.log(`[BattleManager] battle started with rule: ${rule.name}`);
    return true;
  }

  public update(deltaTime: number): void {
    if (!this.runtime.running || this.runtime.ended || this.paused) return;

    this.runtime.timer = Math.max(0, this.runtime.timer - deltaTime);
    this.buildingTickAccumulator += deltaTime;
    this.eventTickAccumulator += deltaTime;

    let dirtyBuilding = false;
    let dirtyResource = false;

    if (this.buildingTickAccumulator >= BATTLE_DEFAULTS.buildingTickInterval) {
      this.buildingTickAccumulator = 0;
      this.tickBuildingAndResidents();
      dirtyBuilding = true;
      dirtyResource = true;
    }

    if (this.eventTickAccumulator >= BATTLE_DEFAULTS.eventTickInterval) {
      this.eventTickAccumulator = 0;
      if (this.tickEvents()) {
        dirtyResource = true;
      }
    }

    this.runtime.order = MathUtil.clamp(this.runtime.order, -100, 100);
    this.runtime.joy = MathUtil.clamp(this.runtime.joy, -100, 100);
    this.runtime.goalProgress = MathUtil.clamp(this.runtime.goalProgress, 0, 100);

    this.stabilizeCooldown = Math.max(0, this.stabilizeCooldown - deltaTime);
    this.gameState.patchCurrentRunData({ order: this.runtime.order, joy: this.runtime.joy, gold: this.runtime.gold, timer: Math.ceil(this.runtime.timer), goalProgress: this.runtime.goalProgress });

    if (dirtyResource || this.runtime.timer !== (this.lastTopState?.timer ?? -1)) {
      this.emitResourceIfChanged();
      console.log(`[BattleManager] tick: timer=${Math.ceil(this.runtime.timer)} order=${Math.round(this.runtime.order)} joy=${Math.round(this.runtime.joy)} gold=${Math.round(this.runtime.gold)}`);
    }
    if (dirtyBuilding) {
      this.emitBuildingsIfChanged();
    }

    if (!this.milestone25Done && this.runtime.goalProgress >= 25) {
      this.milestone25Done = true;
      this.eventBus.emit(EVENT_NAME.BATTLE_EVENT_TRIGGERED, { id: 'milestone_25', name: '里程碑播报', desc: '【重要】目标进度达到 25%，第一波压力即将到来。', effect_order: 0, effect_joy: 0, effect_gold: 0, effect_goal: 0 });
    }
    if (!this.milestone50Done && this.runtime.goalProgress >= 50) {
      this.milestone50Done = true;
      this.eventBus.emit(EVENT_NAME.BATTLE_EVENT_TRIGGERED, { id: 'milestone_50', name: '里程碑播报', desc: '【重要】目标过半，建议检查缺员建筑并准备干预。', effect_order: 0, effect_joy: 0, effect_gold: 0, effect_goal: 0 });
    }
    if (!this.milestone75Done && this.runtime.goalProgress >= 75) {
      this.milestone75Done = true;
      this.eventBus.emit(EVENT_NAME.BATTLE_EVENT_TRIGGERED, { id: 'milestone_75', name: '冲线播报', desc: '【警报级】已进入冲线阶段，稳住秩序与快乐！', effect_order: 0, effect_joy: 0, effect_gold: 0, effect_goal: 0 });
    }
    if (!this.milestone100Done && this.runtime.goalProgress >= 100) {
      this.milestone100Done = true;
      this.eventBus.emit(EVENT_NAME.BATTLE_EVENT_TRIGGERED, { id: 'milestone_100', name: '冲线播报', desc: '【重要】目标达到 100%，请守住最后局势直到结算。', effect_order: 0, effect_joy: 0, effect_gold: 0, effect_goal: 0 });
    }
    this.checkEndConditions();
  }

  public toggleBuildingOvertime(buildingId: string): void {
    this.buildingSystem.toggleOvertime(buildingId);
    this.runtime.buildings = this.buildingSystem.getRuntimeBuildings();
    this.emitBuildingsIfChanged();
  }

  public toggleBuildingPause(buildingId: string): void {
    this.buildingSystem.togglePause(buildingId);
    this.runtime.buildings = this.buildingSystem.getRuntimeBuildings();
    this.emitBuildingsIfChanged();
  }



  public reassignSupport(buildingId: string): { ok: boolean; message: string } {
    const result = this.residentSystem.reassignSupport(buildingId, this.runtime.buildings.map((b) => b.id));
    if (!result.ok) return { ok: false, message: '暂无可调配人手，调岗失败。' };
    this.runtime.residents = this.residentSystem.getResidents();
    this.runtime.buildings = this.buildingSystem.getRuntimeBuildings();
    this.runtime.buildings.forEach((b) => this.buildingSystem.setWorkers(b.id, this.residentSystem.getBuildingWorkforce(b.id)));
    this.runtime.buildings = this.buildingSystem.getRuntimeBuildings();
    this.emitBuildingsIfChanged();
    return { ok: true, message: `已从${result.from}调岗1人支援${buildingId}。` };
  }

  public stabilizeTown(): { ok: boolean; message: string } {
    if (this.stabilizeCharges <= 0) return { ok: false, message: '安抚次数已用尽。' };
    if (this.stabilizeCooldown > 0) return { ok: false, message: `安抚冷却中（${Math.ceil(this.stabilizeCooldown)}s）` };
    if (this.runtime.gold < 28) return { ok: false, message: '金币不足，无法组织安抚。' };
    this.runtime.gold -= 28;
    this.runtime.joy = Math.min(100, this.runtime.joy + 9);
    this.runtime.order = Math.min(100, this.runtime.order + 7);
    this.stabilizeCharges -= 1;
    this.stabilizeCooldown = 26;
    this.emitResourceIfChanged();
    return { ok: true, message: `已执行全镇安抚，局势回稳（剩余${this.stabilizeCharges}次）` };
  }

  public pauseBattle(): void { this.paused = true; }
  public resumeBattle(): void { this.paused = false; }
  public stopBattle(): void { this.runtime.running = false; this.paused = false; }

  public debugAdjustTopState(patch: Partial<{ order: number; joy: number; gold: number }>): void {
    if (typeof patch.order === "number") this.runtime.order += patch.order;
    if (typeof patch.joy === "number") this.runtime.joy += patch.joy;
    if (typeof patch.gold === "number") this.runtime.gold += patch.gold;
    this.emitResourceIfChanged();
  }
  public debugForceEnd(success: boolean): void { if (this.hasSettled) return; this.runtime.timer = 0; this.endBattle(success); }

  public getRuntimeState(): BattleRuntimeState { return JSON.parse(JSON.stringify(this.runtime)) as BattleRuntimeState; }
  public getLastReport(): ReportModel | null { return this.lastReport ? JSON.parse(JSON.stringify(this.lastReport)) : null; }
  public getSettlementData(): BattleSettlementData | null { return this.settlementData ? JSON.parse(JSON.stringify(this.settlementData)) : null; }

  private tickBuildingAndResidents(): void {
    this.residentSystem.tick(this.ruleSystem);
    this.buildingSystem.getRuntimeBuildings().forEach((b) => this.buildingSystem.setWorkers(b.id, this.residentSystem.getBuildingWorkforce(b.id)));
    const result = this.buildingSystem.tick(this.ruleSystem);
    this.runtime.gold += result.gold;
    this.runtime.joy += result.joy;
    this.runtime.order += result.order;
    this.runtime.goalProgress += result.goalProgress;
    this.runtime.buildings = this.buildingSystem.getRuntimeBuildings();
    this.runtime.residents = this.residentSystem.getResidents();
  }

  private tickEvents(): boolean {
    const elapsed = BATTLE_DEFAULTS.durationSeconds - this.runtime.timer;
    const event = this.eventSystem.checkAndTrigger(elapsed, { order: this.runtime.order, joy: this.runtime.joy, gold: this.runtime.gold, goalProgress: this.runtime.goalProgress, buildings: this.runtime.buildings, triggeredEventCount: this.runtime.triggeredEvents.length }, this.ruleSystem, this.residentSystem);
    if (!event) return false;

    this.runtime.order += event.effect_order;
    this.runtime.joy += event.effect_joy;
    this.runtime.gold += event.effect_gold;
    this.runtime.goalProgress += event.effect_goal;
    this.runtime.triggeredEvents.unshift(event);
    this.runtime.triggeredEvents = this.runtime.triggeredEvents.slice(0, 12);
    this.gameState.addSeenEvent(event.id);
    return true;
  }

  private checkEndConditions(): void {
    if (this.runtime.order <= 0 || this.runtime.joy <= 0) {
      this.endBattle(false);
      return;
    }
    if (this.runtime.timer > 0) return;
    const success = this.runtime.order > 0 && (this.runtime.goalProgress >= BATTLE_DEFAULTS.targetProgress || this.runtime.gold >= BATTLE_DEFAULTS.targetGold);
    this.endBattle(success);
  }

  private endBattle(success: boolean): void {
    if (this.hasSettled) return;
    this.hasSettled = true;
    this.runtime.running = false;
    this.runtime.ended = true;
    this.runtime.success = success;

    const starsEstimate = this.runtime.success ? (this.runtime.goalProgress >= 95 ? 4 : 3) : 1;
    const rewardGold = Math.max(4, 2 + (success ? 8 : 0) + starsEstimate * 2 + Math.floor(this.runtime.gold * 0.06));

    this.settlementData = {
      rewardGold,
      success,
      timerUsed: BATTLE_DEFAULTS.durationSeconds - this.runtime.timer,
      finalOrder: Math.round(this.runtime.order),
      finalJoy: Math.round(this.runtime.joy),
      finalGold: Math.round(this.runtime.gold),
      finalGoalProgress: Math.round(this.runtime.goalProgress),
      currentRuleName: this.runtime.currentRuleName,
      currentRuleCategory: this.runtime.currentRuleCategory,
      buildings: this.runtime.buildings,
      residents: this.runtime.residents,
      triggeredEvents: this.runtime.triggeredEvents,
    };

    let unlockedRuleId: string | undefined;
    if (this.runtime.success && this.runtime.goalProgress >= 80) {
      const allRuleIds = this.configManager.getAll<RuleModel>('rules').map((r) => r.id);
      const unlocked = this.gameState.getSnapshot().unlockedRules;
      const next = allRuleIds.find((id) => !unlocked.includes(id));
      if (next) { this.gameState.unlockRule(next); unlockedRuleId = next; }
    }

    const newlySeenEventCount = Math.max(0, this.gameState.getSnapshot().seenEvents.length - this.seenEventsBeforeRun);
    this.lastReport = this.reportSystem.buildReport(this.settlementData, unlockedRuleId, newlySeenEventCount);
    if (App.instance) {
      App.instance.latestBattleReport = this.lastReport;
    }
    this.gameState.addGold(rewardGold);
    this.gameState.patchCurrentRunData({ ended: true });
    this.gameState.incrementRunCount();
    if (success) this.gameState.incrementWinCount();

    const snap = this.gameState.getSnapshot();
    if (snap.runCount >= 2) this.gameState.unlockBuilding('RepairShop');
    if (snap.winCount >= 1) this.gameState.unlockBuilding('ConvenienceStore');
    if (snap.highestStars >= 4) this.gameState.unlockBuilding('PostOffice');

    this.eventBus.emit(EVENT_NAME.BATTLE_SETTLEMENT_READY, this.lastReport);
    this.eventBus.emit(EVENT_NAME.BATTLE_ENDED, this.lastReport);
    console.log('[BattleManager] battle ended', { success, rewardGold, goal: this.runtime.goalProgress });
  }

  private emitResourceIfChanged(): void {
    const next: BattleTopState = {
      timer: Math.ceil(this.runtime.timer),
      order: Math.round(this.runtime.order),
      joy: Math.round(this.runtime.joy),
      gold: Math.round(this.runtime.gold),
      goalProgress: Math.round(this.runtime.goalProgress),
    };
    if (this.shallowEqualTopState(this.lastTopState, next)) return;
    this.lastTopState = next;
    this.eventBus.emit(EVENT_NAME.BATTLE_RESOURCE_CHANGED, next);
  }

  private emitBuildingsIfChanged(): void {
    const sig = this.runtime.buildings.map((b) => `${b.id}:${b.state}:${b.current_output}:${b.current_workers}:${Math.round(b.pressure)}:${Math.round(b.risk)}`).join('|');
    if (sig === this.lastBuildingSignature) return;
    this.lastBuildingSignature = sig;
    this.eventBus.emit(EVENT_NAME.BATTLE_BUILDINGS_CHANGED, this.runtime.buildings);
  }

  private shallowEqualTopState(a: BattleTopState | null, b: BattleTopState): boolean {
    return !!a && a.timer === b.timer && a.order === b.order && a.joy === b.joy && a.gold === b.gold && a.goalProgress === b.goalProgress;
  }

  private createInitialRuntime(): BattleRuntimeState {
    return { timer: BATTLE_DEFAULTS.durationSeconds, order: BATTLE_DEFAULTS.startOrder, joy: BATTLE_DEFAULTS.startJoy, gold: BATTLE_DEFAULTS.startGold, goalProgress: 0, running: false, ended: false, success: false, currentRuleName: '未选择', currentRuleCategory: 'none', buildings: [], residents: [], triggeredEvents: [] };
  }
}
