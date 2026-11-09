/** One algorithm, for one key. now is whole seconds and must not go backwards. */
export interface Limiter {
  allow(now: number): boolean
}

/** Makes a fresh limiter. Called once per key, the first time that key is seen. */
export type NewLimiter = () => Limiter

/** Keeps one limiter per key, so keys never share state. Which algorithm runs is decided by the factory. */
export class RateLimiter {
  private byKey = new Map<string, Limiter>()

  constructor(private make: NewLimiter) {}

  allow(key: string, now: number): boolean {
    let limiter = this.byKey.get(key)
    if (!limiter) this.byKey.set(key, (limiter = this.make())) // [1] each key gets its own limiter, made on first use
    return limiter.allow(now)
  }
}

/** Holds up to `capacity` tokens and earns one more every `every` seconds. A request spends one. Allows bursts, then a steady rate. */
export class TokenBucket implements Limiter {
  tokens: number
  private last: number | null = null // when the next token's clock started

  constructor(
    private capacity: number,
    private every: number,
  ) {
    this.tokens = capacity
  }

  allow(now: number): boolean {
    if (this.last === null) this.last = now
    const earned = Math.max(0, Math.floor((now - this.last) / this.every))
    this.tokens = Math.min(this.capacity, this.tokens + earned)
    this.last = this.tokens === this.capacity ? now : this.last + earned * this.every // [2] keep the part of an interval not yet earned
    if (this.tokens === 0) return false
    this.tokens--
    return true
  }
}

/** Counts requests in fixed slots [0, size), [size, 2*size) and so on. The count resets when a new slot starts. */
export class FixedWindow implements Limiter {
  start = -1
  count = 0

  constructor(
    private limit: number,
    private size: number,
  ) {}

  allow(now: number): boolean {
    const start = Math.floor(now / this.size) * this.size
    if (start !== this.start) {
      this.start = start // [3] a new slot forgets the old count, even a second after a full one
      this.count = 0
    }
    if (this.count >= this.limit) return false
    this.count++
    return true
  }
}

/** Remembers the time of every allowed request and counts those in the last `size` seconds, so the window slides with now. */
export class SlidingWindowLog implements Limiter {
  log: number[] = []

  constructor(
    private limit: number,
    private size: number,
  ) {}

  allow(now: number): boolean {
    while (this.log.length > 0 && this.log[0] <= now - this.size) this.log.shift() // [4] forget requests that left the window
    if (this.log.length >= this.limit) return false
    this.log.push(now)
    return true
  }
}
