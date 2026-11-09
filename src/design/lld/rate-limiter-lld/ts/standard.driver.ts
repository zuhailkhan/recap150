import type { Tracer } from '../../../../core/tracer'
import { noop } from '../../../../core/tracer'
import { arr, intervals, seq, type Panel, type SeqMessage, type Span } from '../../../../core/panels'
import { FixedWindow, RateLimiter, SlidingWindowLog, TokenBucket, type Limiter } from './standard'

// Replays operations against a real RateLimiter. The factory wraps each new limiter in a spy, so the
// sequence diagram shows calls that really happened. The state panel reads the algorithm's own fields.
const ACTORS = ['Caller', 'RateLimiter', 'Limiter']
const NAME = { token: 'TokenBucket', fixed: 'FixedWindow', sliding: 'SlidingWindowLog' } as const
const STAGE = { token: 2, fixed: 3, sliding: 4 } as const
type Kind = keyof typeof NAME

export function run(ops: string[], args: unknown[][], t: Tracer = noop): unknown[] {
  const log: SeqMessage[] = []
  const inners = new Map<string, Limiter>() // key -> the real limiter behind the spy
  const allowedAt = new Map<string, number[]>() // key -> times of allowed requests, for the fixed-window picture
  let kind: Kind = 'fixed'
  let p = 0
  let q = 0
  let current = '' // key of the request in flight
  let rl!: RateLimiter
  const out: unknown[] = []

  const make = (): Limiter => (kind === 'token' ? new TokenBucket(p, q) : kind === 'fixed' ? new FixedWindow(p, q) : new SlidingWindowLog(p, q))
  const factory = (): Limiter => {
    const inner = make()
    inners.set(current, inner)
    log.push({ from: 'RateLimiter', to: 'Limiter', label: `new ${NAME[kind]} for ${current}` })
    return {
      allow(now) {
        log.push({ from: 'RateLimiter', to: 'Limiter', label: `allow(t=${now})` })
        const ok = inner.allow(now)
        log.push({ from: 'Limiter', to: 'RateLimiter', label: ok ? 'allowed' : 'denied', dashed: true, tone: ok ? 'hit' : 'miss' })
        return ok
      },
    }
  }

  const diagram = (upTo = log.length): Panel => seq(ACTORS, log.slice(0, upTo), { label: 'calls in this request' })
  const marksOf = (times: number[]) => {
    const n = new Map<number, number>()
    for (const x of times) n.set(x, (n.get(x) ?? 0) + 1)
    return [...n].map(([at, c]) => ({ at, label: c > 1 ? `${at} x${c}` : `${at}` }))
  }
  const state = (key: string, now: number): Panel => {
    const inner = inners.get(key)!
    if (kind === 'token') {
      const tokens = (inner as TokenBucket).tokens
      return arr(p > 0 ? Array.from({ length: p }, (_, i) => (i < tokens ? 'token' : 'empty')) : ['no slots'], {
        label: `${key}: tokens left (blue), capacity ${p}, one earned every ${q}s`,
        tones: p > 0 ? Array.from({ length: p }, (_, i) => (i < tokens ? ('keep' as const) : ('dim' as const))) : ['dim'],
      })
    }
    if (kind === 'fixed') {
      const times = allowedAt.get(key) ?? []
      const w = inner as FixedWindow
      const starts = [...new Set([...times.map((x) => Math.floor(x / q) * q), w.start])].sort((a, b) => a - b)
      const spans: Span[] = starts.map((s) => ({ start: s, end: s + q, label: `slot [${s}, ${s + q}): ${times.filter((x) => x >= s && x < s + q).length}/${p}`, tone: s === w.start ? 'focus' : 'dim' }))
      return intervals(spans, { label: `${key}: fixed slots with allowed requests (dashed lines)`, marks: marksOf(times), min: 0, max: Math.max(now + 1, ...spans.map((s) => s.end)) })
    }
    const w = inner as SlidingWindowLog
    return intervals([{ start: now - q, end: now, label: `window (t-${q}, t]: ${w.log.length}/${p} in it`, tone: 'focus' }], { label: `${key}: the sliding window ending now, with remembered requests (dashed lines)`, marks: marksOf(w.log), min: Math.min(0, now - q), max: Math.max(now + 1, 1) })
  }

  ops.forEach((op, i) => {
    const a = args[i]
    log.length = 0
    if (op === 'RateLimiter') {
      kind = a[0] as Kind
      p = a[1] as number
      q = a[2] as number
      inners.clear()
      allowedAt.clear()
      rl = new RateLimiter(factory)
      t.step(1, `A RateLimiter that makes a ${NAME[kind]} for each key (${kind === 'token' ? `${p} tokens, one earned every ${q}s` : `${p} requests per ${q}s`}). No keys exist yet, so no state exists either.`, [])
      out.push(null)
    } else if (op === 'allow') {
      const [key, now] = a as [string, number]
      const fresh = !inners.has(key)
      current = key
      log.push({ from: 'Caller', to: 'RateLimiter', label: `allow(${key}, t=${now})` })
      const before = inners.has(key) ? snapshot(inners.get(key)!) : null
      const ok = rl.allow(key, now)
      log.push({ from: 'RateLimiter', to: 'Caller', label: ok ? 'allowed' : 'denied', dashed: true, tone: ok ? 'hit' : 'miss' })
      if (ok) allowedAt.set(key, [...(allowedAt.get(key) ?? []), now])
      const inner = inners.get(key)!
      if (fresh) t.step(1, `${key} has not been seen, so the RateLimiter asks the factory for a new ${NAME[kind]}. Keys never share a limiter.`, [diagram(2)])
      let say: string
      if (inner instanceof TokenBucket) {
        const b = before as number | null
        const after = inner.tokens
        const earned = b === null ? 0 : after + (ok ? 1 : 0) - b
        say = ok ? `The bucket first tops up by whole tokens earned since the last refill${earned > 0 ? ` (${earned} here)` : ' (none here)'}, then spends one. ${after} left.` : `The bucket is empty and no whole token has been earned yet, so the request is denied.`
      } else if (inner instanceof FixedWindow) {
        const b = before as { start: number; count: number } | null
        const slotChanged = b !== null && b.start !== inner.start
        say = `${slotChanged ? `t=${now} is in a new slot [${inner.start}, ${inner.start + q}), so the count resets to 0. ` : `t=${now} is in slot [${inner.start}, ${inner.start + q}). `}${ok ? `The request counts: ${inner.count}/${p}.` : `The slot already holds ${inner.count}/${p}, so the request is denied.`}`
      } else {
        const s = inner as SlidingWindowLog
        const b = before as number | null
        const gone = b === null ? 0 : b + (ok ? 1 : 0) - s.log.length
        say = `Requests older than the last ${q}s are forgotten${gone > 0 ? ` (${gone} dropped)` : ' (none dropped)'}. ${ok ? `${s.log.length - 1} remain, so there is room: the request is logged (${s.log.length}/${p}).` : `${s.log.length} remain in the window, already ${p}, so the request is denied. Denied requests are not logged.`}`
      }
      t.step(STAGE[kind], say, [diagram(), state(key, now)])
      out.push(ok ? 1 : 0)
    }
  })
  return out
}

// What each algorithm needs remembered from before the call, to explain what the call changed.
function snapshot(l: Limiter): number | { start: number; count: number } {
  if (l instanceof TokenBucket) return l.tokens
  if (l instanceof FixedWindow) return { start: l.start, count: l.count }
  return (l as SlidingWindowLog).log.length
}
