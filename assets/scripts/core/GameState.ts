import { DEFAULT_PLAYER_STATE, EVENT_NAME } from './Constants';
import { EventBus } from './EventBus';

export interface CurrentRunData {
  selectedRuleId: string | null;
  selectedRuleName: string;
  order: number;
  joy: number;
  gold: number;
  timer: number;
  goalProgress: number;
  started: boolean;
  ended: boolean;
}

export interface GameStateSnapshot {
  playerLevel: number;
  gold: number;
  inspiration: number;
  unlockedRules: string[];
  encyclopediaProgress: Record<string, boolean>;
  seenEvents: string[];
  runCount: number;
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
    seenEvents: [],
    runCount: 0,
    currentRunData: null,
  };

  constructor(private readonly eventBus: EventBus) {}

  public getSnapshot(): Readonly<GameStateSnapshot> {
    return JSON.parse(JSON.stringify(this.state)) as GameStateSnapshot;
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

  public setCurrentRunData(data: CurrentRunData | null): void {
    this.state.currentRunData = data;
    this.broadcast();
  }

  public addSeenEvent(eventId: string): void {
    if (!this.state.seenEvents.includes(eventId)) {
      this.state.seenEvents.push(eventId);
      this.broadcast();
    }
  }

  public incrementRunCount(): void {
    this.state.runCount += 1;
    this.broadcast();
  }

  public patchCurrentRunData(patch: Partial<CurrentRunData>): void {
    if (!this.state.currentRunData) {
      return;
    }
    this.state.currentRunData = { ...this.state.currentRunData, ...patch };
    this.broadcast();
  }

  private broadcast(): void {
    this.eventBus.emit(EVENT_NAME.GAME_STATE_CHANGED, this.getSnapshot());
  }
}
