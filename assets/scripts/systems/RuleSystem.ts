import { CONFIG_KEY } from '../core/Constants';
import { ConfigManager } from '../managers/ConfigManager';
import { RuleModel } from '../models/RuleModel';
import { WeightedRandom } from '../utils/WeightedRandom';

/**
 * 规则系统骨架：提供候选规则抽取能力，后续扩展规则生效逻辑。
 */
export class RuleSystem {
  constructor(private readonly configManager: ConfigManager) {}

  public drawRuleCandidates(count = 3): RuleModel[] {
    const all = this.configManager.getAll<RuleModel>(CONFIG_KEY.RULES);
    if (all.length <= count) {
      return [...all];
    }

    const picked = new Set<string>();
    const result: RuleModel[] = [];
    while (result.length < count) {
      const rule = WeightedRandom.pick(all.map((item) => ({ value: item, weight: 1 })));
      if (picked.has(rule.id)) {
        continue;
      }
      picked.add(rule.id);
      result.push(rule);
    }
    return result;
  }
}
