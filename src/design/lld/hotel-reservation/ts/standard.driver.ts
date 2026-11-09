import type { Tracer } from '../../../../core/tracer'
import { noop } from '../../../../core/tracer'
import { grid, seq, type Panel, type SeqMessage, type Tones } from '../../../../core/panels'
import { FlatRates, Hotel, Room, WeekendSurcharge, overlaps, type Booking, type Pricing } from './standard'

// Replays operations against a real Hotel. Rooms and Pricing are wrapped in spies, so the sequence
// diagram shows the calls that really happened. The grid is the calendar: one row per room, one column
// per night, so an overlap is something you can see.
const ACTORS = ['Client', 'Hotel', 'Room', 'Pricing']
const WHY: Record<number, string> = { [-1]: 'no room free', [-2]: 'bad date range', [-3]: 'unknown room type' }
const MAX_DAYS = 14

export function run(ops: string[], args: unknown[][], t: Tracer = noop): unknown[] {
  const log: SeqMessage[] = []
  let hotel!: Hotel
  const out: unknown[] = []

  class SpyRoom extends Room {
    isFree(from: number, to: number) {
      log.push({ from: 'Hotel', to: 'Room', label: `${this.id}.isFree(${from}, ${to})` })
      const free = super.isFree(from, to)
      log.push({ from: 'Room', to: 'Hotel', label: free ? 'free' : 'busy', dashed: true, tone: free ? 'hit' : 'miss' })
      return free
    }
    add(b: Booking) {
      log.push({ from: 'Hotel', to: 'Room', label: `${this.id}.add(#${b.id}, ${b.from}..${b.to})` })
      super.add(b)
    }
    remove(id: number) {
      log.push({ from: 'Hotel', to: 'Room', label: `${this.id}.remove(#${id})` })
      super.remove(id)
    }
  }
  const pricingSpy = (inner: Pricing): Pricing => ({
    nightly(type, day) {
      log.push({ from: 'Hotel', to: 'Pricing', label: `nightly(${type}, day ${day})` })
      const p = inner.nightly(type, day)
      log.push({ from: 'Pricing', to: 'Hotel', label: `${p}`, dashed: true, tone: 'focus' })
      return p
    },
  })

  const diagram = (upTo = log.length): Panel => seq(ACTORS, log.slice(0, upTo), { label: 'calls in this request' })
  const days = (extra = 0): number => {
    let end = 8
    for (const r of hotel.rooms) for (const b of r.bookings()) end = Math.max(end, b.to)
    return Math.min(MAX_DAYS, Math.max(end, extra))
  }
  /** The calendar. Booked nights show the booking id. A request overlays the rooms of its type: green = free night, red = clash. */
  const calendar = (req?: { type: string; from: number; to: number }, hot?: number): Panel => {
    const n = days(req?.to ?? 0)
    const cells: (string | number)[][] = [['room', ...Array.from({ length: n }, (_, d) => d)]]
    const tones: Tones[] = [Array(n + 1).fill(null)]
    for (const r of hotel.rooms) {
      const row: (string | number)[] = [`${r.id} ${r.type}`]
      const tr: Tones = [null]
      for (let d = 0; d < n; d++) {
        const b = r.bookings().find((x) => x.from <= d && d < x.to)
        row.push(b ? `#${b.id}` : '')
        const asked = req && r.type === req.type && d >= req.from && d < req.to
        tr.push(b ? (b.id === hot ? 'focus' : asked ? 'miss' : 'keep') : asked ? 'hit' : null)
      }
      cells.push(row)
      tones.push(tr)
    }
    return grid(cells, { label: 'calendar: nights (check-in included, check-out day not). Blue = booked, green = asked and free, red = asked but taken', tones })
  }

  ops.forEach((op, i) => {
    const a = args[i]
    log.length = 0
    if (op === 'Hotel') {
      const [rows, rates, mode, pct] = a as [[string, string][], [string, number][], string, number]
      const flat = new FlatRates(Object.fromEntries(rates))
      hotel = new Hotel(rows.map(([id, type]) => new SpyRoom(id, type)), pricingSpy(mode === 'weekend' ? new WeekendSurcharge(flat, pct) : flat))
      t.step(1, `A hotel with ${rows.length} room${rows.length === 1 ? '' : 's'} in a fixed order, and a pricing rule handed in from outside: ${mode === 'weekend' ? `flat rates plus ${pct} percent on Saturday and Sunday nights` : 'one flat rate per night'}.`, [calendar()])
      out.push(null)
    } else if (op === 'quote') {
      const [type, from, to] = a as [string, number, number]
      log.push({ from: 'Client', to: 'Hotel', label: `quote(${type}, ${from}..${to})` })
      const p = hotel.quote(type, from, to)
      log.push({ from: 'Hotel', to: 'Client', label: p >= 0 ? `${p}` : WHY[p], dashed: true, tone: p >= 0 ? 'hit' : 'miss' })
      t.step(4, p >= 0 ? `The hotel asks Pricing once per night, ${from} to ${to - 1}, and adds them up: ${p}. The check-out day is not a night.` : `${WHY[p]}. The hotel refuses before it asks Pricing.`, [diagram(), calendar()])
      out.push(p)
    } else if (op === 'search') {
      const [type, from, to] = a as [string, number, number]
      log.push({ from: 'Client', to: 'Hotel', label: `search(${type}, ${from}..${to})` })
      const found = hotel.search(type, from, to).map((r) => r.id)
      log.push({ from: 'Hotel', to: 'Client', label: found.length ? found.join(', ') : 'none', dashed: true, tone: found.length ? 'hit' : 'miss' })
      t.step(3, from < 0 || from >= to ? 'An empty or backwards range is never free. The hotel answers none without asking a room.' : found.length ? `The hotel asks every ${type} room whether nights ${from} to ${to - 1} are free. Free: ${found.join(', ')}.` : `Every ${type} room has a stay that overlaps nights ${from} to ${to - 1}, or there is no such type.`, [diagram(), calendar({ type, from, to })])
      out.push(found)
    } else if (op === 'book') {
      const [guest, type, from, to] = a as [string, string, number, number]
      const snap = hotel.rooms.filter((r) => r.type === type).map((r) => ({ id: r.id, stays: r.bookings() }))
      const asked = { type, from, to }
      const beforeGrid = from >= 0 && to > from ? calendar(asked) : calendar()
      log.push({ from: 'Client', to: 'Hotel', label: `book(${guest}, ${type}, ${from}..${to})` })
      const id = hotel.book(guest, type, from, to)
      log.push({ from: 'Hotel', to: 'Client', label: id > 0 ? `booking #${id}` : WHY[id], dashed: true, tone: id > 0 ? 'hit' : 'miss' })
      if (id === -2 || id === -3) {
        t.step(3, id === -2 ? `Nights ${from} to ${to}: the range is empty, backwards or starts before day 0. The hotel refuses before asking any room.` : `There is no room type "${type}". Nothing changes.`, [diagram(), calendar()])
      } else {
        const first = snap[0]
        const clash = first.stays.find((b) => overlaps(b.from, b.to, from, to))
        const touch = first.stays.find((b) => b.to === from || b.from === to)
        const why = clash
          ? `${first.id} holds ${clash.from}..${clash.to}. Overlap needs ${clash.from} < ${to} and ${from} < ${clash.to}. Both are true, so ${first.id} is busy.`
          : touch
            ? `${first.id} holds ${touch.from}..${touch.to}. It touches ${from}..${to} at day ${touch.to === from ? from : to}, but a stay ends on the morning of its check-out day, so ${touch.to === from ? `${from} < ${touch.to}` : `${touch.from} < ${to}`} is false. Not an overlap: ${first.id} is free.`
            : `${first.id} has no stay that overlaps ${from}..${to}, so it is free.`
        const roomReplies = log.map((m, k) => (m.label === 'free' || m.label === 'busy' ? k : -1)).filter((k) => k >= 0)
        t.step(2, why, [diagram(3), beforeGrid])
        if (roomReplies.length > 1 || id === -1) {
          t.step(3, id === -1 ? `All ${roomReplies.length} ${type} rooms are busy for these nights. The hotel answers "no room" and changes nothing.` : `The hotel keeps asking in room order and takes the first free room, ${hotel.roomOf(id)}.`, [diagram(roomReplies[roomReplies.length - 1] + 1), beforeGrid])
        }
        if (id > 0) {
          const priced = log.filter((m) => m.from === 'Pricing').reduce((sum, m) => sum + Number(m.label), 0)
          const lastPrice = log.map((m) => m.from).lastIndexOf('Pricing')
          t.step(4, `Pricing is asked for each of the ${to - from} night${to - from === 1 ? '' : 's'}. The stay costs ${priced}.`, [diagram(lastPrice + 1), calendar({ type, from, to })])
          t.step(5, `The room records the stay, so these nights are blocked for everyone else. The guest gets booking #${id} in ${hotel.roomOf(id)}.`, [diagram(), calendar(undefined, id)])
        }
      }
      out.push(id)
    } else if (op === 'cancel') {
      const id = a[0] as number
      const room = hotel.roomOf(id)
      log.push({ from: 'Client', to: 'Hotel', label: `cancel(#${id})` })
      const refund = hotel.cancel(id)
      log.push({ from: 'Hotel', to: 'Client', label: refund >= 0 ? `refund ${refund}` : 'unknown booking', dashed: true, tone: refund >= 0 ? 'hit' : 'miss' })
      t.step(6, refund >= 0 ? `The booking is removed from ${room}. Its nights are free again and the guest gets the full price back: ${refund}.` : `There is no booking #${id}. It never existed or was already cancelled.`, [diagram(), calendar()])
      out.push(refund)
    } else if (op === 'roomOf') {
      const room = hotel.roomOf(a[0] as number)
      t.step(5, room ? `Booking #${a[0]} is in room ${room}.` : `There is no booking #${a[0]}.`, [calendar(undefined, a[0] as number)])
      out.push(room ?? -1)
    }
  })
  return out
}
