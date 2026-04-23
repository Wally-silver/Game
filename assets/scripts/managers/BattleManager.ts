import { GameState } from '../core/GameState';

/**
 * 战局管理器占位：阶段 A 仅提供可挂载的生命周期入口。
 */
export class BattleManager {
  constructor(private readonly gameState: GameState) {}

  public prepareBattle(): void {
    this.gameState.setCurrentRunData({
      elapsedSeconds: 0,
      order: 50,
      happiness: 50,
      coinsEarned: 0,
    });
  }

  public finishBattle(): void {
    this.gameState.setCurrentRunData(null);
  }
}
