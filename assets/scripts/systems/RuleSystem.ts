import { CONFIG_KEY } from '../core/Constants';
import { ConfigManager } from '../managers/ConfigManager';
import { RuleEffectTarget, RuleModel } from '../models/RuleModel';

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


  public generateCandidatesFromPool(ruleIds: string[], count = 3): RuleModel[] {
    const pool = this.configManager.getAll<RuleModel>(CONFIG_KEY.RULES).filter((r) => ruleIds.includes(r.id));
    const source = pool.length > 0 ? pool : this.configManager.getAll<RuleModel>(CONFIG_KEY.RULES);
    const shuffled = [...source].sort(() => Math.random() - 0.5);
    this.candidates = shuffled.slice(0, Math.max(1, count));
    this.activeRule = null;
    return this.candidates;
  }

  public applyRule(ruleId: string): RuleModel | null {
    const picked = this.candidates.find((rule) => rule.id === ruleId) ?? null;
    this.activeRule = picked;
    return picked;
  }

  public getActiveRule(): RuleModel | null {
    return this.activeRule;
  }

  public getActiveRuleCategory(): string {
    return this.activeRule?.category ?? 'none';
  }

  public getMultiplier(target: RuleEffectTarget): number {
    if (!this.activeRule) return 1;
    return this.activeRule.effects.filter((e) => e.target === target && e.type === 'mul').reduce((a, e) => a * e.value, 1);
  }

  public getAdditive(target: RuleEffectTarget): number {
    if (!this.activeRule) return 0;
    return this.activeRule.effects.filter((e) => e.target === target && e.type === 'add').reduce((a, e) => a + e.value, 0);
  }

  public hasTag(tag: string): boolean {
    return this.activeRule?.tags.includes(tag) ?? false;
  }
}
