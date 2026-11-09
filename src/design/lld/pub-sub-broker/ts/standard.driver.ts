import type { Tracer } from '../../../../core/tracer'
import { noop } from '../../../../core/tracer'
import { arr, seq, type Panel, type SeqMessage, type Tones } from '../../../../core/panels'
import { Broker, MemoryLog, Offsets, type Log } from './standard'

// Replays operations against a real Broker. The logs and the offset table are wrapped in spies, so the
// sequence diagram shows the calls that really happened. The state panel is the log itself, with one
// pointer per consumer group showing its committed offset.
const ACTORS = ['Caller', 'Broker', 'Log', 'Offsets']

export function run(ops: string[], args: unknown[][], t: Tracer = noop): unknown[] {
  const log: SeqMessage[] = []
  const real = new Map<string, MemoryLog>()
  const groups: string[] = [] // groups seen so far, in first-use order, for the pointers
  let broker!: Broker
  const out: unknown[] = []

  // Offsets that logs each call. peek reads without logging, for the state panel.
  class SpyOffsets extends Offsets {
    get(group: string, topic: string) {
      const v = super.get(group, topic)
      log.push({ from: 'Broker', to: 'Offsets', label: `get(${group})` })
      log.push({ from: 'Offsets', to: 'Broker', label: `${v}`, dashed: true, tone: 'focus' })
      return v
    }
    set(group: string, topic: string, offset: number) {
      log.push({ from: 'Broker', to: 'Offsets', label: `set(${group}, ${offset})` })
      super.set(group, topic, offset)
    }
    peek(group: string, topic: string) {
      return super.get(group, topic)
    }
  }
  const offsets = new SpyOffsets()

  const spy = (inner: MemoryLog): Log => ({
    append(value) {
      log.push({ from: 'Broker', to: 'Log', label: `append(${value})` })
      const o = inner.append(value)
      log.push({ from: 'Log', to: 'Broker', label: `offset ${o}`, dashed: true, tone: 'hit' })
      return o
    },
    read(from, max) {
      log.push({ from: 'Broker', to: 'Log', label: `read(${from}, ${max})` })
      const msgs = inner.read(from, max)
      log.push({ from: 'Log', to: 'Broker', label: msgs.length ? `${msgs.length} message${msgs.length === 1 ? '' : 's'}` : 'nothing', dashed: true, tone: msgs.length ? 'focus' : 'miss' })
      return msgs
    },
    size() {
      log.push({ from: 'Broker', to: 'Log', label: 'size()' })
      const n = inner.size()
      log.push({ from: 'Log', to: 'Broker', label: `${n}`, dashed: true, tone: 'focus' })
      return n
    },
  })

  const diagram = (upTo = log.length): Panel => seq(ACTORS, log.slice(0, upTo), { label: 'calls in this request' })
  // The log as an array, plus one extra "next" cell so a group that is caught up has a place to point.
  const logPanel = (topic: string, hot?: { group: string; from: number; to: number }): Panel => {
    const msgs = real.get(topic)!.read(0, 1e9)
    const tones: Tones = msgs.map((m) => (hot && m.offset >= hot.from && m.offset < hot.to ? ('focus' as const) : null))
    tones.push('dim')
    return arr([...msgs.map((m) => `${m.value}`), 'next'], {
      label: `topic ${topic}: the log, one pointer per group (its committed offset)`,
      tones,
      pointers: groups.map((g) => ({ name: g, at: offsets.peek(g, topic), tone: hot?.group === g ? ('focus' as const) : ('keep' as const) })),
    })
  }
  const note = (g: string) => {
    if (!groups.includes(g)) groups.push(g)
  }

  ops.forEach((op, i) => {
    const a = args[i]
    log.length = 0
    if (op === 'Broker') {
      real.clear()
      groups.length = 0
      const names = a[0] as string[]
      const logs = new Map<string, Log>()
      for (const n of names) {
        const m = new MemoryLog()
        real.set(n, m)
        logs.set(n, spy(m))
      }
      broker = new Broker(logs, offsets)
      t.step(1, `A broker with ${names.length} topic${names.length === 1 ? '' : 's'}: ${names.join(', ') || 'none'}. Each topic is an empty log, and no group has a place in it yet.`, names.length ? [logPanel(names[0])] : [])
      out.push(null)
    } else if (op === 'publish') {
      const [topic, value] = a as [string, string]
      log.push({ from: 'Caller', to: 'Broker', label: `publish(${topic}, ${value})` })
      const o = broker.publish(topic, value)
      log.push({ from: 'Broker', to: 'Caller', label: o < 0 ? 'unknown topic' : `offset ${o}`, dashed: true, tone: o < 0 ? 'miss' : 'hit' })
      t.step(1, o < 0 ? `There is no topic ${topic}, so nothing is appended.` : `${value} goes on the end of ${topic} and gets offset ${o}. Existing messages and every group's pointer stay where they are.`, o < 0 ? [diagram()] : [diagram(), logPanel(topic)])
      out.push(o)
    } else if (op === 'poll') {
      const [group, topic, max] = a as [string, string, number]
      note(group)
      log.push({ from: 'Caller', to: 'Broker', label: `poll(${group}, ${max})` })
      const msgs = broker.poll(group, topic, max)
      log.push({ from: 'Broker', to: 'Caller', label: msgs === null ? 'unknown topic' : `${msgs.length} message${msgs.length === 1 ? '' : 's'}`, dashed: true, tone: msgs === null ? 'miss' : msgs.length ? 'hit' : 'focus' })
      if (msgs === null) {
        t.step(2, `There is no topic ${topic}, so the broker answers "unknown" without asking anyone.`, [diagram()])
        out.push(-1)
      } else {
        const from = offsets.peek(group, topic)
        t.step(2, `The broker asks Offsets where group ${group} is. The answer is ${from}: the group's own place, not shared with other groups.`, [diagram(3), logPanel(topic)])
        t.step(3, msgs.length ? `The log returns ${msgs.map((m) => m.offset).join(', ')} and nothing is removed. ${group}'s pointer has not moved, so without a commit the same messages come again.` : `The log has nothing at or after offset ${from}${max <= 0 ? ' within a batch of 0' : ''}. The poll comes back empty.`, [diagram(), logPanel(topic, { group, from, to: from + msgs.length })])
        out.push(msgs.map((m) => `${m.offset}:${m.value}`))
      }
    } else if (op === 'commit') {
      const [group, topic, offset] = a as [string, string, number]
      note(group)
      const before = real.has(topic) ? offsets.peek(group, topic) : 0
      log.push({ from: 'Caller', to: 'Broker', label: `commit(${group}, ${offset})` })
      const r = broker.commit(group, topic, offset)
      log.push({ from: 'Broker', to: 'Caller', label: r < 0 ? 'refused' : `at ${r}`, dashed: true, tone: r < 0 ? 'miss' : 'hit' })
      const why = !real.has(topic) ? `There is no topic ${topic}.` : offset < before ? `${offset} is behind the committed offset ${before}. Committing backwards would replay finished work, so it is refused.` : `${offset} is past the end of the log (${real.get(topic)!.size()} messages). The group cannot be ahead of data that does not exist, so it is refused.`
      t.step(4, r < 0 ? `${why} The pointer stays put.` : `Offsets now says group ${group} is at ${r}. Everything before ${r} is done and will not be redelivered to ${group}. Other groups are unaffected.`, r < 0 && !real.has(topic) ? [diagram()] : [diagram(), logPanel(topic, r < 0 ? undefined : { group, from: before, to: r })])
      out.push(r)
    } else if (op === 'lag') {
      const [group, topic] = a as [string, string]
      note(group)
      log.push({ from: 'Caller', to: 'Broker', label: `lag(${group})` })
      const n = broker.lag(group, topic)
      log.push({ from: 'Broker', to: 'Caller', label: n < 0 ? 'unknown topic' : `${n}`, dashed: true, tone: n < 0 ? 'miss' : n ? 'focus' : 'hit' })
      t.step(4, n < 0 ? `There is no topic ${topic}.` : `Lag is log size minus the group's offset: ${n} message${n === 1 ? '' : 's'} not yet committed by ${group}.`, n < 0 ? [diagram()] : [diagram(), logPanel(topic)])
      out.push(n)
    }
  })
  return out
}
