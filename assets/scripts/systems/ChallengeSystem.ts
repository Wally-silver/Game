/**
 * Daily challenge placeholder.
 */
export class ChallengeSystem {
  public getTodayChallengeId(dateKey: string): string {
    return `challenge_${dateKey}`;
  }
}
