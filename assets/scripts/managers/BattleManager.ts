import { BATTLE_DEFAULTS, EVENT_NAME } from '../core/Constants';
import { EventBus } from '../core/EventBus';
import { GameState } from '../core/GameState';
import { ConfigManager } from './ConfigManager';
import { BuildingRuntime } from '../models/BuildingModel';
import { ReportModel } from '../models/ReportModel';
import { ResidentModel } from '../models/ResidentModel';
import { RuleModel } from '../models/RuleModel';
import { TriggeredEvent } from '../models/EventModel';
import { BuildingSystem } from '../systems/BuildingSystem';
import { EventSystem } from '../systems/EventSystem';
import { ReportSystem } from '../systems/ReportSystem';
import { ResidentSystem } from '../systems/ResidentSystem';
import { RuleSystem } from '../systems/RuleSystem';
import { MathUtil } from '../utils/MathUtil';

export interface BattleSnapshot {
  timer: number;
  order: number;
  joy: number;
  gold: number;
  goalProgress: number;
  running: boolean;
  ended: boolean;
  success: boolean;
  currentRuleName: string;
  buildings: BuildingRuntime[];
  residents: ResidentModel[];
  events: TriggeredEvent[];
}

/**
 * 单局战斗管理器：负责生命周期、结算、胜负判定。
 */
export class BattleManager {
  private readonly ruleSystem: RuleSystem;
  private readonly buildingSystem: BuildingSystem;
  private readonly residentSystem: ResidentSystem;
  private readonly eventSystem: EventSystem;
  private readonly reportSystem: ReportSystem;

  private snapshot: BattleSnapshot;
  private candidates: RuleModel[] = [];
  private lastReport: ReportModel | null = null;

  private buildingTickAccumulator = 0;
  private eventTickAccumulator = 0;

  constructor(
    private readonly gameState: GameState,
    private readonly configManager: ConfigManager,
    private readonly eventBus: EventBus,
  ) {
    this.ruleSystem = new RuleSystem(this.configManager);
    this.buildingSystem = new BuildingSystem(this.configManager);
    this.residentSystem = new ResidentSystem(this.configManager);
    this.eventSystem = new EventSystem(this.configManager, this.eventBus);
    this.reportSystem = new ReportSystem(this.configManager);

    this.snapshot = this.createInitialSnapshot();
  }

  public setupNewBattle(): RuleModel[] {
    this.snapshot = this.createInitialSnapshot();
    this.lastReport = null;
    this.buildingTickAccumulator = 0;
    this.eventTickAccumulator = 0;

    const buildings = this.buildingSystem.initialize();
    this.residentSystem.initialize(buildings);
    this.eventSystem.initialize();
    this.candidates = this.ruleSystem.generateCandidates(3);
    this.snapshot.buildings = this.buildingSystem.getRuntimeBuildings();
    this.snapshot.residents = this.residentSystem.getResidents();

    this.gameState.setCurrentRunData({
      selectedRuleId: null,
      selectedRuleName: '未选择',
      order: this.snapshot.order,
      joy: this.snapshot.joy,
      gold: this.snapshot.gold,
      timer: this.snapshot.timer,
      goalProgress: this.snapshot.goalProgress,
      started: false,
      ended: false,
    });

    return this.candidates;
  }

  public getRuleCandidates(): RuleModel[] {
    return [...this.candidates];
  }

  public selectRuleAndStart(ruleId: string): boolean {
    const rule = this.ruleSystem.applyRule(ruleId);
    if (!rule) {
      return false;
    }
    this.snapshot.currentRuleName = rule.name;
    this.snapshot.running = true;
    this.gameState.patchCurrentRunData({
      selectedRuleId: rule.id,
      selectedRuleName: rule.name,
      started: true,
    });
    return true;
  }

  public update(deltaTime: number): void {
    if (!this.snapshot.running || this.snapshot.ended) {
      return;
    }

    this.snapshot.timer = Math.max(0, this.snapshot.timer - deltaTime);
    this.buildingTickAccumulator += deltaTime;
    this.eventTickAccumulator += deltaTime;

    if (this.buildingTickAccumulator >= BATTLE_DEFAULTS.buildingTickInterval) {
      this.buildingTickAccumulator = 0;
      this.tickBuildingAndResidents();
    }

    if (this.eventTickAccumulator >= BATTLE_DEFAULTS.eventTickInterval) {
      this.eventTickAccumulator = 0;
      this.tickEvents();
    }

    this.snapshot.order = MathUtil.clamp(this.snapshot.order, -100, 100);
    this.snapshot.joy = MathUtil.clamp(this.snapshot.joy, -100, 100);
    this.snapshot.goalProgress = MathUtil.clamp(this.snapshot.goalProgress, 0, 100);

    this.gameState.patchCurrentRunData({
      order: this.snapshot.order,
      joy: this.snapshot.joy,
      gold: this.snapshot.gold,
      timer: Math.ceil(this.snapshot.timer),
      goalProgress: this.snapshot.goalProgress,
    });

    this.checkEndConditions();
  }

  public toggleBuildingOvertime(buildingId: string): void {
    this.buildingSystem.toggleOvertime(buildingId);
    this.snapshot.buildings = this.buildingSystem.getRuntimeBuildings();
  }

  public toggleBuildingPause(buildingId: string): void {
    this.buildingSystem.togglePause(buildingId);
    this.snapshot.buildings = this.buildingSystem.getRuntimeBuildings();
  }

  public getSnapshot(): BattleSnapshot {
    return JSON.parse(JSON.stringify(this.snapshot)) as BattleSnapshot;
  }

  public getLastReport(): ReportModel | null {
    return this.lastReport ? { ...this.lastReport } : null;
  }

  private tickBuildingAndResidents(): void {
    this.residentSystem.tick(this.ruleSystem);

    this.buildingSystem.getRuntimeBuildings().forEach((building) => {
      const workers = this.residentSystem.getBuildingWorkforce(building.id);
      this.buildingSystem.setWorkers(building.id, workers);
    });

    const result = this.buildingSystem.tick(this.ruleSystem);
    this.snapshot.gold += result.gold;
    this.snapshot.joy += result.joy;
    this.snapshot.order += result.order;
    this.snapshot.goalProgress += result.goalProgress;

    this.snapshot.buildings = this.buildingSystem.getRuntimeBuildings();
    this.snapshot.residents = this.residentSystem.getResidents();
  }

  private tickEvents(): void {
    const elapsed = BATTLE_DEFAULTS.durationSeconds - this.snapshot.timer;
    const event = this.eventSystem.checkAndTrigger(
      elapsed,
      {
        order: this.snapshot.order,
        joy: this.snapshot.joy,
        buildings: this.snapshot.buildings,
      },
      this.ruleSystem,
      this.residentSystem,
    );

    if (!event) {
      return;
    }

    this.snapshot.order += event.effect_order;
    this.snapshot.joy += event.effect_joy;
    this.snapshot.gold += event.effect_gold;
    this.snapshot.goalProgress += event.effect_goal;
    this.snapshot.events.unshift(event);
    this.snapshot.events = this.snapshot.events.slice(0, 12);
  }

  private checkEndConditions(): void {
    if (this.snapshot.order <= 0 || this.snapshot.joy <= 0) {
      this.endBattle(false);
      return;
    }

    if (this.snapshot.timer > 0) {
      return;
    }

    const reachedGoal = this.snapshot.goalProgress >= BATTLE_DEFAULTS.targetProgress;
    const reachedGold = this.snapshot.gold >= BATTLE_DEFAULTS.targetGold;
    const success = this.snapshot.order > 0 && (reachedGoal || reachedGold);
    this.endBattle(success);
  }

  private endBattle(success: boolean): void {
    this.snapshot.running = false;
    this.snapshot.ended = true;
    this.snapshot.success = success;

    const report = this.reportSystem.buildReport({
      ruleName: this.snapshot.currentRuleName,
      success,
      finalOrder: Math.round(this.snapshot.order),
      finalJoy: Math.round(this.snapshot.joy),
      finalGold: Math.round(this.snapshot.gold),
      eventCount: this.snapshot.events.length,
    });
    this.lastReport = report;

    this.gameState.patchCurrentRunData({ ended: true });
    this.eventBus.emit(EVENT_NAME.BATTLE_ENDED, report);
  }

  private createInitialSnapshot(): BattleSnapshot {
    return {
      timer: BATTLE_DEFAULTS.durationSeconds,
      order: BATTLE_DEFAULTS.startOrder,
      joy: BATTLE_DEFAULTS.startJoy,
      gold: BATTLE_DEFAULTS.startGold,
      goalProgress: 0,
      running: false,
      ended: false,
      success: false,
      currentRuleName: '未选择',
      buildings: [],
      residents: [],
      events: [],
    };
  }
}
