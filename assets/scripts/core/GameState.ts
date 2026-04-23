import { DEFAULT_PLAYER_STATE, EVENT_NAME } from './Constants';
import { EventBus } from './EventBus';

export interface CurrentRunData {
  selectedRuleId?: string;
  elapsedSeconds?: number;
  order?: number;
  happiness?: number;
  coinsEarned?: number;
}

export interface GameStateSnapshot {
  playerLevel: number;
  gold: number;
  inspiration: number;
  unlockedRules: string[];
  encyclopediaProgress: Record<string, boolean>;
  currentRunData: CurrentRunData | null;
}

/**
 * 全局状态模型：对外只暴露受控读写接口。
 */
export class GameState {
  private state: GameStateSnapshot = {
    playerLevel: DEFAULT_PLAYER_STATE.playerLevel,
    gold: DEFAULT_PLAYER_STATE.gold,
    inspiration: DEFAULT_PLAYER_STATE.inspiration,
    unlockedRules: [],
    encyclopediaProgress: {},
    currentRunData: null,
  };

  constructor(private readonly eventBus: EventBus) {}

  public getSnapshot(): Readonly<GameStateSnapshot> {
    return JSON.parse(JSON.stringify(this.state)) as GameStateSnapshot;
  }

  public setPlayerLevel(level: number): void {
    this.state.playerLevel = Math.max(1, Math.floor(level));
    this.broadcast();
  }

  public addGold(delta: number): void {
    this.state.gold = Math.max(0, this.state.gold + delta);
    this.broadcast();
  }

  public addInspiration(delta: number): void {
    this.state.inspiration = Math.max(0, this.state.inspiration + delta);
    this.broadcast();
  }

  public unlockRule(ruleId: string): void {
    if (!this.state.unlockedRules.includes(ruleId)) {
      this.state.unlockedRules.push(ruleId);
      this.broadcast();
    }
  }

  public setEncyclopediaProgress(entryId: string, unlocked: boolean): void {
    this.state.encyclopediaProgress[entryId] = unlocked;
    this.broadcast();
  }

  public setCurrentRunData(data: CurrentRunData | null): void {
    this.state.currentRunData = data;
    this.broadcast();
  }

  private broadcast(): void {
    this.eventBus.emit(EVENT_NAME.GAME_STATE_CHANGED, this.getSnapshot());
  }
}
