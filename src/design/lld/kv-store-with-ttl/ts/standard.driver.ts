import type { Tracer } from '../../../../core/tracer'
import { noop } from '../../../../core/tracer'
import { arr, buckets, seq, type Panel, type SeqMessage } from '../../../../core/panels'
import { LruPolicy, TtlStore } from './standard'

// Replays operations against a real TtlStore. The eviction policy is wrapped in a spy, so the sequence
// diagram shows the calls the store really made, in order.
const ACTORS = ['Caller', 'TtlStore', 'EvictionPolicy']

export function run(ops: string[], args: unknown[][], t: Tracer = noop): unknown[] {
  const log: SeqMessage[] = []
  const out: unknown[] = []
  let store!: TtlStore
  let cap = 0
  let now = 0 // the last second the caller told us about, only for drawing

  class SpyLru extends LruPolicy {
    touch(key: string) {
      log.push({ from: 'TtlStore', to: 'EvictionPolicy', label: `touch(${key})` })
      super.touch(key)
    }
    remove(key: string) {
      log.push({ from: 'TtlStore', to: 'EvictionPolicy', label: `remove(${key})` })
      super.remove(key)
    }
    victim() {
      log.push({ from: 'TtlStore', to: 'EvictionPolicy', label: 'victim()' })
      const v = super.victim()
      log.push({ from: 'EvictionPolicy', to: 'TtlStore', label: v ?? 'none', dashed: true, tone: v ? 'focus' : 'miss' })
      return v
    }
    order() {
      return [...this.keys]
    }
  }
  const policy = new SpyLru()

  const diagram = (upTo = log.length): Panel => seq(ACTORS, log.slice(0, upTo), { label: 'calls in this request' })
  const entriesPanel = (hot?: string): Panel =>
    buckets([...store.entries].map(([k, e]) => ({
      key: k,
      items: [e.value, e.expiresAt === Infinity ? 'never expires' : `expires at ${e.expiresAt}`],
      tone: now >= e.expiresAt ? ('miss' as const) : k === hot ? ('focus' as const) : undefined,
    })), { label: `entries at t=${now} (red = already expired, not yet removed)`, keyLabel: 'key', empty: 'no entries' })
  const recency = (): Panel => {
    const o = policy.order()
    return arr(o, { label: 'recency, next to evict first', tones: o.map((_, i) => (i === 0 ? ('focus' as const) : null)) })
  }
  const reply = (label: string, tone: 'hit' | 'miss' | 'focus') => log.push({ from: 'TtlStore', to: 'Caller', label, dashed: true, tone })

  ops.forEach((op, i) => {
    const a = args[i]
    log.length = 0
    if (op === 'TtlStore') {
      cap = a[0] as number
      store = new TtlStore(cap, policy)
      t.step(1, cap > 0 ? `An empty store that holds at most ${cap} entr${cap === 1 ? 'y' : 'ies'}. It owns the data. Who to evict is delegated to a policy.` : 'An empty store with no size limit, so the policy is never asked for a victim.', [entriesPanel(), recency()])
      out.push(null)
    } else if (op === 'put') {
      const [key, value, at, ttl] = a as [string, string, number, number | null]
      now = at
      const full = cap > 0 && store.entries.size >= cap && !store.entries.has(key)
      log.push({ from: 'Caller', to: 'TtlStore', label: ttl === null ? `put(${key})` : `put(${key}, ttl ${ttl})` })
      const evicted = store.put(key, value, at, ttl)
      reply(evicted.length ? `evicted ${evicted.join(', ')}` : 'stored', evicted.length ? 'miss' : 'hit')
      if (ttl !== null && ttl <= 0) {
        log[log.length - 1].label = 'not stored'
        t.step(1, `ttl ${ttl} means "already expired at second ${at}". The store removes any old ${key} and keeps nothing, so a later get cannot see it.`, [diagram(), entriesPanel()])
      } else {
        if (full) t.step(4, `The store is full (${cap}). It first sweeps entries that are dead at second ${at}, then asks the policy for a victim until there is room.${evicted.length ? ` Evicted: ${evicted.join(', ')}.` : ' The sweep alone made room, so no live entry was evicted.'}`, [diagram(log.length - 2), recency()])
        t.step(1, `${key} is stored with ${ttl === null ? 'no expiry' : `expiry ${at} + ${ttl} = ${at + ttl}`}. Writing a key again replaces its entry, so the clock starts over.`, [diagram(), entriesPanel(key)])
      }
      out.push(evicted)
    } else if (op === 'get') {
      const [key, at] = a as [string, number]
      now = at
      const e = store.entries.get(key)
      const dead = !!e && at >= e.expiresAt
      log.push({ from: 'Caller', to: 'TtlStore', label: `get(${key})` })
      const v = store.get(key, at)
      reply(v ?? 'miss', v === null ? 'miss' : 'hit')
      if (dead) t.step(3, `At second ${at} the entry's expiry ${e!.expiresAt} has been reached (alive only while now < expiry). The store removes it now, on read, and answers miss.`, [diagram(), entriesPanel()])
      else if (v === null) t.step(2, `There is no entry for ${key}, so the answer is a miss and the policy is not told anything.`, [diagram(), entriesPanel()])
      else t.step(2, `${key} is alive at second ${at}. The read counts as use, so the policy moves it to the most recent end. Its expiry stays ${e!.expiresAt === Infinity ? 'never' : e!.expiresAt}.`, [diagram(), recency()])
      out.push(v)
    } else if (op === 'delete') {
      const key = a[0] as string
      log.push({ from: 'Caller', to: 'TtlStore', label: `delete(${key})` })
      const ok = store.delete(key)
      reply(ok ? 'removed' : 'not there', ok ? 'hit' : 'miss')
      t.step(3, ok ? `${key} is removed from the entries and from the policy, through the same path expiry uses.` : `There was no ${key}, so nothing changes.`, [diagram(), entriesPanel()])
      out.push(ok ? 1 : 0)
    } else if (op === 'sweep') {
      now = a[0] as number
      log.push({ from: 'Caller', to: 'TtlStore', label: `sweep(${now})` })
      const dead = store.entries.size
      const removed = store.sweep(now)
      reply(removed.length ? `removed ${removed.join(', ')}` : 'nothing expired', removed.length ? 'hit' : 'miss')
      t.step(5, removed.length ? `One pass at second ${now} looked at all ${dead} entries and removed the expired ones: ${removed.join(', ')}. Live entries were not touched.` : `One pass at second ${now} looked at all ${dead} entries and found nothing expired.`, [diagram(), entriesPanel()])
      out.push(removed)
    } else if (op === 'size') {
      const n = store.entries.size
      t.step(5, `The map holds ${n} entr${n === 1 ? 'y' : 'ies'}. This counts dead ones that nobody has read or swept yet.`, [entriesPanel(), recency()])
      out.push(n)
    }
  })
  return out
}
