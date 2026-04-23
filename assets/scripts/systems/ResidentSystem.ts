import { ResidentModel } from '../models/ResidentModel';

/**
 * 居民系统骨架：维护居民模板并支持按职业筛选。
 */
export class ResidentSystem {
  public filterByJob(residents: ResidentModel[], job: string): ResidentModel[] {
    return residents.filter((item) => item.job === job);
  }
}
