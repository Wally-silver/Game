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
    this.settlementData = null;
    this.buildingTickAccumulator = 0;
    this.eventTickAccumulator = 0;
    this.lastTopState = null;
    this.lastBuildingSignature = '';

    const buildings = this.buildingSystem.initialize();
    this.residentSystem.initialize(buildings);
    this.eventSystem.initialize();
    this.candidates = this.ruleSystem.generateCandidates(3);
    this.runtime.buildings = this.buildingSystem.getRuntimeBuildings();
    this.runtime.residents = this.residentSystem.getResidents();

    this.gameState.setCurrentRunData({ selectedRuleId: null, selectedRuleName: '未选择', order: this.runtime.order, joy: this.runtime.joy, gold: this.runtime.gold, timer: this.runtime.timer, goalProgress: this.runtime.goalProgress, started: false, ended: false });

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
    this.eventBus.emit(EVENT_NAME.BATTLE_RULE_SELECTED, { ruleId: rule.id, ruleName: rule.name });
    return true;
  }

  public update(deltaTime: number): void {
    if (!this.runtime.running || this.runtime.ended) return;

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

    this.gameState.patchCurrentRunData({ order: this.runtime.order, joy: this.runtime.joy, gold: this.runtime.gold, timer: Math.ceil(this.runtime.timer), goalProgress: this.runtime.goalProgress });

    if (dirtyResource || this.runtime.timer !== (this.lastTopState?.timer ?? -1)) {
      this.emitResourceIfChanged();
    }
    if (dirtyBuilding) {
      this.emitBuildingsIfChanged();
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
    this.runtime.running = false;
    this.runtime.ended = true;
    this.runtime.success = success;

    this.settlementData = {
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

    this.lastReport = this.reportSystem.buildReport(this.settlementData);
    if (App.instance) {
      App.instance.latestBattleReport = this.lastReport;
    }
    this.gameState.patchCurrentRunData({ ended: true });
    this.eventBus.emit(EVENT_NAME.BATTLE_SETTLEMENT_READY, this.lastReport);
    this.eventBus.emit(EVENT_NAME.BATTLE_ENDED, this.lastReport);
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
