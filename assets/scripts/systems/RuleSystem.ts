import { CONFIG_KEY } from '../core/Constants';
import { ConfigManager } from '../managers/ConfigManager';
import { RuleEffectTarget, RuleModel } from '../models/RuleModel';

/**
 * 规则系统：3选1候选 + 规则生效查询。
 */
export class RuleSystem {
  private activeRule: RuleModel | null = null;
  private candidates: RuleModel[] = [];

  constructor(private readonly configManager: ConfigManager) {}

  public generateCandidates(count = 3): RuleModel[] {
    const allRules = [...this.configManager.getAll<RuleModel>(CONFIG_KEY.RULES)];
    const shuffled = allRules.sort(() => Math.random() - 0.5);
    this.candidates = shuffled.slice(0, Math.max(1, count));
    this.activeRule = null;
    return this.candidates;
  }

  public getCandidates(): RuleModel[] {
    return [...this.candidates];
  }

  public applyRule(ruleId: string): RuleModel | null {
    const picked = this.candidates.find((rule) => rule.id === ruleId) ?? null;
    this.activeRule = picked;
    return picked;
  }

  public getActiveRule(): RuleModel | null {
    return this.activeRule;
  }

  public getMultiplier(target: RuleEffectTarget): number {
    if (!this.activeRule) {
      return 1;
    }
    const mulEffects = this.activeRule.effects.filter((effect) => effect.target === target && effect.type === 'mul');
    return mulEffects.reduce((acc, effect) => acc * effect.value, 1);
  }

  public getAdditive(target: RuleEffectTarget): number {
    if (!this.activeRule) {
      return 0;
    }
    const addEffects = this.activeRule.effects.filter((effect) => effect.target === target && effect.type === 'add');
    return addEffects.reduce((acc, effect) => acc + effect.value, 0);
  }

  public hasTag(tag: string): boolean {
    return this.activeRule?.tags.includes(tag) ?? false;
  }
}
