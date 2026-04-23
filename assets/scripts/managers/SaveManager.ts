/**
 * 本地存档管理（阶段 A 版本）。
 */
export class SaveManager {
  public save<T>(key: string, value: T): void {
    localStorage.setItem(key, JSON.stringify(value));
  }

  public load<T>(key: string, fallback: T): T {
    const raw = localStorage.getItem(key);
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
    localStorage.removeItem(key);
  }
}
