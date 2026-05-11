export interface ProgressionSaveData {
  version: number;
  playerGold: number;
  inspiration: number;
  highestStars: number;
  unlockedRules: string[];
  seenEvents: string[];
  totalRuns: number;
  totalWins: number;
  settings: { musicOn: boolean; sfxOn: boolean; };
  unlockedBuildings: string[];
}

export class SaveManager {
  private memoryStore = new Map<string, string>();
  public static readonly CURRENT_VERSION = 1;
  public static readonly PROGRESSION_KEY = 'gh_town_progression_v1';

  public save<T>(key: string, value: T): void {
    const raw = JSON.stringify(value);
    try { localStorage.setItem(key, raw); } catch { this.memoryStore.set(key, raw); }
  }

  public load<T>(key: string, fallback: T): T {
    let raw: string | null = null;
    try { raw = localStorage.getItem(key); } catch { raw = this.memoryStore.get(key) ?? null; }
    if (!raw) {
      return fallback;
    }

    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }

  public remove(key: string): void {
    try { localStorage.removeItem(key); } catch { this.memoryStore.delete(key); }
  }

  public loadProgression(fallback: ProgressionSaveData): ProgressionSaveData {
    const raw = this.load<Partial<ProgressionSaveData> | null>(SaveManager.PROGRESSION_KEY, null);
    if (!raw) return fallback;
    return this.migrateProgression(raw, fallback);
  }

  public saveProgression(data: ProgressionSaveData): void {
    this.save(SaveManager.PROGRESSION_KEY, { ...data, version: SaveManager.CURRENT_VERSION });
  }

  private migrateProgression(raw: Partial<ProgressionSaveData>, fallback: ProgressionSaveData): ProgressionSaveData {
    return {
      version: SaveManager.CURRENT_VERSION,
      playerGold: raw.playerGold ?? fallback.playerGold,
      inspiration: raw.inspiration ?? fallback.inspiration,
      highestStars: raw.highestStars ?? fallback.highestStars,
      unlockedRules: raw.unlockedRules ?? fallback.unlockedRules,
      seenEvents: raw.seenEvents ?? fallback.seenEvents,
      totalRuns: raw.totalRuns ?? fallback.totalRuns,
      totalWins: raw.totalWins ?? fallback.totalWins,
      settings: {
        musicOn: raw.settings?.musicOn ?? fallback.settings.musicOn,
        sfxOn: raw.settings?.sfxOn ?? fallback.settings.sfxOn,
      },
      unlockedBuildings: raw.unlockedBuildings ?? fallback.unlockedBuildings,
    };
  }
}
