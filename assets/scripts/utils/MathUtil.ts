/**
 * 通用数值工具。
 */
export class MathUtil {
  public static clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }

  public static randomInt(min: number, max: number): number {
    const low = Math.ceil(min);
    const high = Math.floor(max);
    return Math.floor(Math.random() * (high - low + 1)) + low;
  }
}
