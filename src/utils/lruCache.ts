/**
 * LRU cache with max size. Oldest entry (by insertion order) is evicted when over capacity.
 */
export class LRUCache<K, V> {
  private map = new Map<K, V>();
  private order: K[] = [];

  constructor(private readonly maxSize: number) {
    if (maxSize < 1) throw new Error("LRUCache maxSize must be >= 1");
  }

  get(key: K): V | undefined {
    const value = this.map.get(key);
    if (value === undefined) return undefined;
    this.touch(key);
    return value;
  }

  set(key: K, value: V): void {
    if (this.map.has(key)) {
      this.map.set(key, value);
      this.touch(key);
      return;
    }
    while (this.order.length >= this.maxSize && this.order.length > 0) {
      const oldest = this.order.shift()!;
      this.map.delete(oldest);
    }
    this.map.set(key, value);
    this.order.push(key);
  }

  private touch(key: K): void {
    const idx = this.order.indexOf(key);
    if (idx >= 0) {
      this.order.splice(idx, 1);
      this.order.push(key);
    }
  }

  has(key: K): boolean {
    return this.map.has(key);
  }
}
