import { CONFIG_KEY } from '../core/Constants';
import { ConfigManager } from '../managers/ConfigManager';
import { ResidentModel, ResidentState } from '../models/ResidentModel';
import { BuildingRuntime } from '../models/BuildingModel';
import { RuleSystem } from './RuleSystem';

/**
 * 居民系统：初始化居民、分配建筑、维护基础状态变化。
 */
export class ResidentSystem {
  private residents: ResidentModel[] = [];

  constructor(private readonly configManager: ConfigManager) {}

  public initialize(buildings: BuildingRuntime[]): ResidentModel[] {
    const templates = this.configManager.getAll<ResidentModel>(CONFIG_KEY.RESIDENTS).slice(0, 8);
    this.residents = templates.map((item, index) => ({
      ...item,
      currentBuilding: buildings[index % buildings.length].id,
      currentState: 'normal' as ResidentState,
    }));
    return this.getResidents();
  }

  public getResidents(): ResidentModel[] {
    return this.residents.map((item) => ({ ...item }));
  }

  public getStateCounts(): Record<ResidentState, number> {
    return this.residents.reduce<Record<ResidentState, number>>(
      (acc, resident) => {
        acc[resident.currentState] += 1;
        return acc;
      },
      { normal: 0, tired: 0, happy: 0, complaining: 0 },
    );
  }

  public tick(ruleSystem: RuleSystem): void {
    const moodDelta = ruleSystem.getAdditive('resident_mood');
    const speedMul = ruleSystem.getMultiplier('resident_speed');

    this.residents = this.residents.map((resident) => {
      const energyLoss = Math.max(2, Math.round(4 * speedMul));
      const nextEnergy = Math.max(0, resident.energy - energyLoss);
      const nextMood = Math.max(0, Math.min(100, resident.mood + moodDelta + (nextEnergy < 30 ? -2 : 1)));

      let nextState: ResidentState = 'normal';
      if (nextEnergy < 25) {
        nextState = 'tired';
      } else if (nextMood > 75) {
        nextState = 'happy';
      } else if (nextMood < 35) {
        nextState = 'complaining';
      }

      return {
        ...resident,
        energy: nextEnergy,
        mood: nextMood,
        currentState: nextState,
      };
    });
  }

  public getBuildingWorkforce(buildingId: string): number {
    const assigned = this.residents.filter((item) => item.currentBuilding === buildingId);
    const workforce = assigned.reduce((sum, item) => {
      const efficiency = item.currentState === 'tired' ? 0.7 : item.currentState === 'complaining' ? 0.8 : 1;
      return sum + efficiency;
    }, 0);
    return Math.round(workforce * 10) / 10;
  }

  public hasState(state: ResidentState): boolean {
    return this.residents.some((item) => item.currentState === state);
  }

  public reassignSupport(targetBuildingId: string, allBuildingIds: string[]): { ok: boolean; from?: string; resident?: string } {
    const fromGroups = allBuildingIds
      .filter((id) => id !== targetBuildingId)
      .map((id) => ({ id, count: this.residents.filter((r) => r.currentBuilding === id).length }))
      .sort((a, b) => b.count - a.count);
    const from = fromGroups.find((g) => g.count >= 2);
    if (!from) return { ok: false };
    const picked = this.residents.find((r) => r.currentBuilding === from.id && r.currentState !== 'tired') ?? this.residents.find((r) => r.currentBuilding === from.id);
    if (!picked) return { ok: false };
    picked.currentBuilding = targetBuildingId;
    return { ok: true, from: from.id, resident: picked.name };
  }
}
