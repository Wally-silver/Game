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
  winCount: number;
  highestStars: number;
  settings: { musicOn: boolean; sfxOn: boolean; };
  unlockedBuildings: string[];
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
    winCount: 0,
    highestStars: 0,
    settings: { musicOn: true, sfxOn: true },
    unlockedBuildings: ['bakery', 'office', 'park'],
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

  public incrementWinCount(): void { this.state.winCount += 1; this.broadcast(); }
  public updateHighestStars(stars: number): void { if (stars > this.state.highestStars) { this.state.highestStars = stars; this.broadcast(); } }
  public updateSettings(patch: Partial<{ musicOn: boolean; sfxOn: boolean; }>): void { this.state.settings = { ...this.state.settings, ...patch }; this.broadcast(); }
  public unlockBuilding(buildingId: string): void { if (!this.state.unlockedBuildings.includes(buildingId)) { this.state.unlockedBuildings.push(buildingId); this.broadcast(); } }

  public importProgression(data: { playerGold: number; inspiration: number; highestStars: number; unlockedRules: string[]; seenEvents: string[]; totalRuns: number; totalWins: number; settings: { musicOn: boolean; sfxOn: boolean; }; unlockedBuildings: string[]; }): void {
    const mapBuildingId = (id: string): string => ({
      Bakery: 'bakery', Office: 'office', Park: 'park',
      RepairShop: 'repair_shop', ConvenienceStore: 'convenience_store', PostOffice: 'post_office',
    }[id] ?? id);
    const validBuildings = new Set(['bakery', 'office', 'park', 'repair_shop', 'convenience_store', 'post_office']);
    const migrated = [...new Set((data.unlockedBuildings ?? []).map(mapBuildingId).filter((id) => validBuildings.has(id)))];
    const fallbackBuildings = ['bakery', 'office', 'park'];
    this.state.gold = Math.max(0, data.playerGold);
    this.state.inspiration = Math.max(0, data.inspiration);
    this.state.highestStars = Math.max(0, data.highestStars);
    this.state.unlockedRules = [...new Set(data.unlockedRules)];
    this.state.seenEvents = [...new Set(data.seenEvents)];
    this.state.runCount = Math.max(0, data.totalRuns);
    this.state.winCount = Math.max(0, data.totalWins);
    this.state.settings = { ...data.settings };
    this.state.unlockedBuildings = migrated.length > 0 ? migrated : fallbackBuildings;
    this.broadcast();
  }

  public exportProgression(): { playerGold: number; inspiration: number; highestStars: number; unlockedRules: string[]; seenEvents: string[]; totalRuns: number; totalWins: number; settings: { musicOn: boolean; sfxOn: boolean; }; unlockedBuildings: string[]; } {
    return {
      playerGold: this.state.gold,
      inspiration: this.state.inspiration,
      highestStars: this.state.highestStars,
      unlockedRules: [...this.state.unlockedRules],
      seenEvents: [...this.state.seenEvents],
      totalRuns: this.state.runCount,
      totalWins: this.state.winCount,
      settings: { ...this.state.settings },
      unlockedBuildings: [...this.state.unlockedBuildings],
    };
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
