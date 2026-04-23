import { GameState } from '../core/GameState';

/**
 * Placeholder battle coordinator for later stages.
 */
export class BattleManager {
  constructor(private readonly gameState: GameState) {}

  public startRound(durationSeconds: number): void {
    this.gameState.setRoundState({
      remainingSeconds: durationSeconds,
      targetProgress: 0,
    });
  }
}
