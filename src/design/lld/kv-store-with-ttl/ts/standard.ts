/** What an entry stores. expiresAt is an integer second, or Infinity for "never". */
export interface Entry {
  value: string
  expiresAt: number
}

/** Decides who leaves when the store is full. The store only tells it what happened. */
export interface EvictionPolicy {
  touch(key: string): void // the key was just written or read
  remove(key: string): void // the key left the store for any reason
  victim(): string | undefined // the key to evict next, if any
}

/** Least recently used: the first key in the Set is the one used longest ago. */
export class LruPolicy implements EvictionPolicy {
  protected keys = new Set<string>() // a Set keeps insertion order; delete then add moves a key to the end

  touch(key: string): void {
    this.keys.delete(key)
    this.keys.add(key)
  }

  remove(key: string): void {
    this.keys.delete(key)
  }

  victim(): string | undefined {
    return this.keys.values().next().value
  }
}

/**
 * Time is an integer second passed in by the caller, so there is no clock to fake.
 * An entry is alive while now < expiresAt, so at exactly expiresAt it is already gone.
 */
export class TtlStore {
  readonly entries = new Map<string, Entry>()

  constructor(private cap: number, private policy: EvictionPolicy) {} // cap 0 means no limit

  /** ttl in seconds, null for never. ttl 0 or less means already expired. Returns the keys evicted to make room. */
  put(key: string, value: string, now: number, ttl: number | null = null): string[] {
    const evicted: string[] = []
    if (ttl !== null && ttl <= 0) {
      this.drop(key) // [1] an overwrite that is born expired still replaces the old value
      return evicted
    }
    if (!this.entries.has(key) && this.cap > 0 && this.entries.size >= this.cap) {
      this.sweep(now) // [4] dead entries leave before any live one is evicted
      while (this.entries.size >= this.cap) {
        const k = this.policy.victim() // [4] then the policy picks who goes
        if (k === undefined) break
        this.drop(k)
        evicted.push(k)
      }
    }
    this.entries.set(key, { value, expiresAt: ttl === null ? Infinity : now + ttl }) // [1] a new write always resets the clock
    this.policy.touch(key)
    return evicted
  }

  get(key: string, now: number): string | null {
    const e = this.entries.get(key)
    if (!e) return null
    if (now >= e.expiresAt) {
      this.drop(key) // [3] lazy expiry: found dead on read, removed now
      return null
    }
    this.policy.touch(key) // [2] a read counts as use, but never extends the TTL
    return e.value
  }

  delete(key: string): boolean {
    return this.drop(key) // [3] same removal path as expiry
  }

  /** Removes every expired entry and returns their keys, sorted. Live entries are never touched. */
  sweep(now: number): string[] {
    const dead = [...this.entries].filter(([, e]) => now >= e.expiresAt).map(([k]) => k).sort() // [5] one pass over everything
    for (const k of dead) this.drop(k)
    return dead
  }

  private drop(key: string): boolean {
    this.policy.remove(key)
    return this.entries.delete(key)
  }
}
