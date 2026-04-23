import { BuildingModel } from '../models/BuildingModel';

/**
 * 建筑系统骨架：提供基础产出计算接口。
 */
export class BuildingSystem {
  public calcOutput(building: BuildingModel, workerCount: number): number {
    const efficiency = Math.max(0, Math.min(1, workerCount / Math.max(1, building.capacity ?? 1)));
    return Math.round(building.base_output * efficiency);
  }
}
