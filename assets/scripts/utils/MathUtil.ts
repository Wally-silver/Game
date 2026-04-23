/**
 * Utility helpers for numeric operations.
 */
export class MathUtil {
  public static clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }
}
