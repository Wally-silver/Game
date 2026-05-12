/**
 * 加权随机工具。
 */
export class WeightedRandom {
  public static pick<T>(entries: Array<{ value: T; weight: number }>): T {
    if (entries.length === 0) {
      throw new Error('WeightedRandom.pick entries cannot be empty.');
    }

    const totalWeight = entries.reduce((sum, item) => sum + Math.max(0, item.weight), 0);
    if (totalWeight <= 0) {
      return entries[0].value;
    }

    let cursor = Math.random() * totalWeight;
    for (const item of entries) {
      cursor -= Math.max(0, item.weight);
      if (cursor <= 0) {
        return item.value;
      }
    }
    return entries[entries.length - 1].value;
  }
}
