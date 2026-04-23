import { EVENT_KEYS } from './Constants';
import { EventBus } from './EventBus';

export interface PlayerResources {
  level: number;
  gold: number;
  inspiration: number;
}

export interface RoundState {
  currentRuleId: string | null;
  order: number;
  happiness: number;
  targetProgress: number;
  remainingSeconds: number;
}

export interface StateSnapshot {
  player: PlayerResources;
  round: RoundState;
}

/**
 * Central state container for long-lived and in-round values.
 */
export class GameState {
  private state: StateSnapshot;

  constructor(private readonly eventBus: EventBus) {
    this.state = {
      player: {
        level: 1,
        gold: 100,
        inspiration: 0,
      },
      round: {
        currentRuleId: null,
        order: 50,
        happiness: 50,
        targetProgress: 0,
        remainingSeconds: 0,
      },
    };
  }

  public getSnapshot(): StateSnapshot {
    return JSON.parse(JSON.stringify(this.state)) as StateSnapshot;
  }

  public setRoundState(partial: Partial<RoundState>): void {
    this.state.round = { ...this.state.round, ...partial };
    this.eventBus.emit(EVENT_KEYS.GAME_STATE_UPDATED, this.getSnapshot());
  }

  public setPlayerResources(partial: Partial<PlayerResources>): void {
    this.state.player = { ...this.state.player, ...partial };
    this.eventBus.emit(EVENT_KEYS.GAME_STATE_UPDATED, this.getSnapshot());
  }

  public resetRound(): void {
    this.state.round = {
      currentRuleId: null,
      order: 50,
      happiness: 50,
      targetProgress: 0,
      remainingSeconds: 0,
    };
    this.eventBus.emit(EVENT_KEYS.GAME_STATE_UPDATED, this.getSnapshot());
  }
}
