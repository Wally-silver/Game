/**
 * Weighted random selector.
 */
export class WeightedRandom {
  public static pick<T>(entries: Array<{ value: T; weight: number }>): T {
    const total = entries.reduce((sum, item) => sum + item.weight, 0);
    let threshold = Math.random() * total;
    for (const entry of entries) {
      threshold -= entry.weight;
      if (threshold <= 0) {
        return entry.value;
      }
    }
    return entries[entries.length - 1].value;
  }
}
