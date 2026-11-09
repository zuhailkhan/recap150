package lld_rate_limiter_lld

// Limiter is one algorithm, for one key. now is whole seconds and must not go backwards.
type Limiter interface {
	Allow(now int) bool
}

// NewLimiter makes a fresh limiter. It is called once per key, the first time that key is seen.
type NewLimiter func() Limiter

// RateLimiter keeps one limiter per key, so keys never share state. Which algorithm runs is decided by the factory.
type RateLimiter struct {
	byKey   map[string]Limiter
	factory NewLimiter
}

func NewRateLimiter(factory NewLimiter) *RateLimiter {
	return &RateLimiter{byKey: map[string]Limiter{}, factory: factory}
}

func (r *RateLimiter) Allow(key string, now int) bool {
	l, ok := r.byKey[key]
	if !ok {
		l = r.factory() // [1] each key gets its own limiter, made on first use
		r.byKey[key] = l
	}
	return l.Allow(now)
}

// TokenBucket holds up to capacity tokens and earns one more every `every` seconds. A request spends one.
// It allows bursts, then a steady rate.
type TokenBucket struct {
	capacity, every int
	tokens          int
	last            int // when the next token's clock started
	started         bool
}

func NewTokenBucket(capacity, every int) *TokenBucket {
	return &TokenBucket{capacity: capacity, every: every, tokens: capacity}
}

func (b *TokenBucket) Allow(now int) bool {
	if !b.started {
		b.started, b.last = true, now
	}
	earned := max(0, (now-b.last)/b.every)
	b.tokens = min(b.capacity, b.tokens+earned)
	if b.tokens == b.capacity {
		b.last = now
	} else {
		b.last += earned * b.every // [2] keep the part of an interval not yet earned
	}
	if b.tokens == 0 {
		return false
	}
	b.tokens--
	return true
}

// FixedWindow counts requests in fixed slots [0, size), [size, 2*size) and so on. The count resets when a new slot starts.
type FixedWindow struct {
	limit, size  int
	start, count int
	started      bool
}

func NewFixedWindow(limit, size int) *FixedWindow { return &FixedWindow{limit: limit, size: size} }

func (w *FixedWindow) Allow(now int) bool {
	start := now / w.size * w.size
	if !w.started || start != w.start {
		w.started, w.start, w.count = true, start, 0 // [3] a new slot forgets the old count, even a second after a full one
	}
	if w.count >= w.limit {
		return false
	}
	w.count++
	return true
}

// SlidingWindowLog remembers the time of every allowed request and counts those in the last size seconds,
// so the window slides with now.
type SlidingWindowLog struct {
	limit, size int
	log         []int
}

func NewSlidingWindowLog(limit, size int) *SlidingWindowLog {
	return &SlidingWindowLog{limit: limit, size: size}
}

func (w *SlidingWindowLog) Allow(now int) bool {
	for len(w.log) > 0 && w.log[0] <= now-w.size { // [4] forget requests that left the window
		w.log = w.log[1:]
	}
	if len(w.log) >= w.limit {
		return false
	}
	w.log = append(w.log, now)
	return true
}
