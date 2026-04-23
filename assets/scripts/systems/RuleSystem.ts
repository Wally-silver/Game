/**
 * Rule selection/evaluation placeholder.
 */
export class RuleSystem {
  public getRuleCandidates(count: number): string[] {
    return Array.from({ length: count }, (_, index) => `rule_${index + 1}`);
  }
}
