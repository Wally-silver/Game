/**
 * 统一日志出口，方便后续接入埋点或按环境开关。
 */
export class Logger {
  private static debugEnabled = true;

  public static setDebugEnabled(enabled: boolean): void {
    Logger.debugEnabled = enabled;
  }

  public static info(message: string, ...args: unknown[]): void {
    if (Logger.debugEnabled) {
      console.log(`[INFO] ${message}`, ...args);
    }
  }

  public static warn(message: string, ...args: unknown[]): void {
    console.warn(`[WARN] ${message}`, ...args);
  }

  public static error(message: string, ...args: unknown[]): void {
    console.error(`[ERROR] ${message}`, ...args);
  }
}
