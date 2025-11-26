class LRUCache {
  private capacity: number
  private cache = new Map<number, number>()

  constructor(capacity: number) {
    if (capacity <= 0) {
      throw new Error('Capacity must be a positive integer');
    }
    this.capacity = capacity
  }

  get(key: number): number {
    if (!this.cache.has(key)) {
      return -1
    }

    const value = this.cache.get(key)!;
    // Map 的神奇特性：delete + set 会把该键值对移到最后（最近使用）
    this.cache.delete(key)
    this.cache.set(key, value)

    return value
  }

  put(key: number, value: number) {
    // 如果已经存在，先删除（等会儿重新插入到最后）
    if (this.cache.has(key)) {
      this.cache.delete(key)
    }
    // 插入新值（会放在 Map 的最后）
    this.cache.set(key, value)

    // 超出容量，删除最久未使用的（Map 的第一个元素）
    if (this.cache.size > this.capacity) {
      // keys().next().value 就是最老的 key
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey)
    }
  }
}