import { CONFIG_KEY } from '../core/Constants';
import { ConfigManager } from '../managers/ConfigManager';
import { BuildingModel, BuildingRuntime } from '../models/BuildingModel';
import { RuleSystem } from './RuleSystem';

export interface BuildingTickResult {
  gold: number;
  joy: number;
  order: number;
  goalProgress: number;
}

/**
 * 建筑系统：维护建筑状态并进行周期收益结算。
 */
export class BuildingSystem {
  private buildings: BuildingModel[] = [];
  private runtime = new Map<string, BuildingRuntime>();

  constructor(private readonly configManager: ConfigManager) {}

  public initialize(): BuildingRuntime[] {
    this.buildings = this.configManager.getAll<BuildingModel>(CONFIG_KEY.BUILDINGS).slice(0, 3);
    this.runtime.clear();
    this.buildings.forEach((item) => {
      this.runtime.set(item.id, {
        id: item.id,
        name: item.name,
        state: 'normal',
        paused: false,
        overtime: false,
        current_output: 0,
        current_workers: 0,
        worker_need: item.worker_need,
      });
    });
    return this.getRuntimeBuildings();
  }

  public setWorkers(buildingId: string, workers: number): void {
    const data = this.runtime.get(buildingId);
    if (!data) {
      return;
    }
    data.current_workers = workers;
  }

  public toggleOvertime(buildingId: string): void {
    const data = this.runtime.get(buildingId);
    if (!data || data.paused) {
      return;
    }
    data.overtime = !data.overtime;
    data.state = data.overtime ? 'overtime' : 'normal';
  }

  public togglePause(buildingId: string): void {
    const data = this.runtime.get(buildingId);
    if (!data) {
      return;
    }
    data.paused = !data.paused;
    if (data.paused) {
      data.overtime = false;
      data.state = 'paused';
    } else {
      data.state = 'normal';
    }
  }

  public getRuntimeBuildings(): BuildingRuntime[] {
    return [...this.runtime.values()].map((item) => ({ ...item }));
  }

  public tick(ruleSystem: RuleSystem): BuildingTickResult {
    let gold = 0;
    let joy = 0;
    let order = 0;
    let goalProgress = 0;

    this.buildings.forEach((config) => {
      const run = this.runtime.get(config.id);
      if (!run || run.paused) {
        if (run?.state === 'paused') {
          order += 1;
        }
        return;
      }

      const workerRatio = Math.min(1.2, run.current_workers / Math.max(1, config.worker_need));
      const overtimeMul = run.overtime ? 1.4 : 1;
      const ruleMul = ruleSystem.getMultiplier('building_output') * ruleSystem.getMultiplier('gold_gain');
      const rawOutput = config.base_output * workerRatio * overtimeMul * ruleMul;
      run.current_output = Math.max(0, Math.round(rawOutput));

      gold += run.current_output;
      joy += config.joy_effect + ruleSystem.getAdditive('joy_change');
      order += config.order_effect + ruleSystem.getAdditive('order_change');
      goalProgress += Math.max(1, Math.round(run.current_output / 4));

      if (run.overtime) {
        joy -= 3;
        order -= 1;
      }
    });

    return { gold, joy, order, goalProgress };
  }
}
