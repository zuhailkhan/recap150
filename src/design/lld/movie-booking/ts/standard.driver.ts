import type { Tracer } from '../../../../core/tracer'
import { noop } from '../../../../core/tracer'
import { arr, seq, type Panel, type SeqMessage } from '../../../../core/panels'
import { BookingService, ByCategory, PeakSurcharge, Show, type Category, type Pricing, type Seat } from './standard'

// Replays operations against a real BookingService. The shows, their seats and the pricing rule are wrapped
// in spies, so the sequence diagram shows calls that really happened, in the order they happened.
const ACTORS = ['Client', 'BookingService', 'Show', 'Seat', 'Pricing']
const CAT: Record<string, Category> = { R: 'regular', P: 'premium' }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function spy(o: any, method: string, onCall: (a: any[]) => void, onReturn?: (r: any, a: any[]) => void): void {
  const orig = o[method].bind(o)
  o[method] = (...a: any[]) => {
    onCall(a)
    const r = orig(...a)
    onReturn?.(r, a)
    return r
  }
}

export function run(ops: string[], args: unknown[][], t: Tracer = noop): unknown[] {
  const log: SeqMessage[] = []
  const shows = new Map<number, Show>()
  let svc!: BookingService
  let sweepEnd = 0 // log length right after the last sweep call
  let swept = 0 // how many seats that sweep freed
  let afterSweep: Panel[] = []
  let showEnd = 0 // log length right after the last Show.hold / Show.book call
  let touchedShow = false
  let holdFor = 0
  const out: unknown[] = []

  const board = (): Panel[] =>
    [...shows.values()].map((sh) =>
      arr(sh.seats.map((s) => `${s.id} ${s.category === 'premium' ? 'P' : 'R'}${s.state === 'held' ? ` held #${s.holdId} till ${s.until}` : s.state === 'booked' ? ' booked' : ''}`), {
        label: `show ${sh.id}, seats (R regular, P premium). amber = held, blue = booked`,
        tones: sh.seats.map((s) => (s.state === 'held' ? ('focus' as const) : s.state === 'booked' ? ('keep' as const) : null)),
      }),
    )
  const diagram = (upTo = log.length): Panel => seq(ACTORS, log.slice(0, upTo), { label: 'calls in this request' })
  const list = (ids: number[]): string => `[${ids.join(', ')}]`

  const instrument = (show: Show): void => {
    for (const s of show.seats as Seat[]) {
      spy(s, 'hold', () => log.push({ from: 'Show', to: 'Seat', label: `hold(${s.id})` }))
      spy(s, 'book', () => log.push({ from: 'Show', to: 'Seat', label: `book(${s.id})` }))
      spy(s, 'free', () => log.push({ from: 'Show', to: 'Seat', label: `free(${s.id})`, tone: 'focus' }))
    }
    let start = 0
    spy(show, 'sweep', (a) => { start = log.length; log.push({ from: 'BookingService', to: 'Show', label: `sweep(t=${a[0]})` }) }, () => {
      sweepEnd = log.length
      swept = log.length - start - 1
      afterSweep = board()
    })
    spy(show, 'hold', (a) => log.push({ from: 'BookingService', to: 'Show', label: `hold(${list(a[0])})` }), (r) => {
      touchedShow = true
      log.push({ from: 'Show', to: 'BookingService', label: r ? `held ${r.length} seat${r.length === 1 ? '' : 's'}` : 'refused', dashed: true, tone: r ? 'hit' : 'miss' })
      showEnd = log.length
    })
    spy(show, 'book', (a) => log.push({ from: 'BookingService', to: 'Show', label: `book(${list(a[0])})` }), (r) => {
      touchedShow = true
      log.push({ from: 'Show', to: 'BookingService', label: r ? 'booked' : 'refused', dashed: true, tone: r ? 'hit' : 'miss' })
      showEnd = log.length
    })
    spy(show, 'release', (a) => log.push({ from: 'BookingService', to: 'Show', label: `release(${list(a[0])})` }))
    spy(show, 'cancel', (a) => log.push({ from: 'BookingService', to: 'Show', label: `cancel(${list(a[0])})` }))
  }

  const spyPricing = (inner: Pricing): Pricing => ({
    price(c) {
      const p = inner.price(c)
      log.push({ from: 'BookingService', to: 'Pricing', label: `price(${c}) = ${p}` })
      return p
    },
  })

  ops.forEach((op, i) => {
    const a = args[i]
    log.length = 0
    swept = 0
    sweepEnd = 0
    showEnd = 0
    touchedShow = false
    afterSweep = []
    const sweepStep = (when: number): void => {
      if (swept > 0) t.step(2, `Before looking at any seat, the show sweeps lapsed holds at t=${when}. ${swept} held seat${swept === 1 ? '' : 's'} ran out of time, so ${swept === 1 ? 'it goes' : 'they go'} back to Available.`, [diagram(sweepEnd), ...afterSweep])
    }

    if (op === 'BookingService') {
      const [layouts, ttl, rule] = a as [string[], number, string]
      holdFor = ttl
      shows.clear()
      layouts.forEach((l, k) => {
        const show = new Show(k + 1, `Movie ${k + 1}`, { name: `Screen ${k + 1}`, layout: [...l].map((c) => CAT[c]) })
        instrument(show)
        shows.set(show.id, show)
      })
      const base = new ByCategory({ regular: 100, premium: 200 })
      svc = new BookingService(shows, spyPricing(rule === 'peak' ? new PeakSurcharge(base, 50) : base), holdFor)
      t.step(1, `The service owns ${shows.size} show${shows.size === 1 ? '' : 's'}, each with its own fresh seats. It is handed the "${rule}" price rule and told a hold lasts ${holdFor} minutes.`, board())
      out.push(null)
    } else if (op === 'hold') {
      const [showId, user, seats, now] = a as [number, string, number[], number]
      log.push({ from: 'Client', to: 'BookingService', label: `hold(show ${showId}, ${user}, ${list(seats)}, t=${now})` })
      const id = svc.hold(showId, user, seats, now)
      log.push({ from: 'BookingService', to: 'Client', label: id < 0 ? 'refused' : `hold ${id}`, dashed: true, tone: id < 0 ? 'miss' : 'hit' })
      sweepStep(now)
      const show = shows.get(showId)
      if (id < 0) {
        const taken = seats.filter((s) => show?.seats[s - 1] && show.seats[s - 1].state !== 'available')
        const why = !show ? `There is no show ${showId}.` : taken.length ? `Seat${taken.length === 1 ? '' : 's'} ${taken.join(' and ')} ${taken.length === 1 ? 'is' : 'are'} not available, so the show refuses the whole request and touches no seat.` : `${list(seats)} is not a valid list of distinct seats of this show.`
        t.step(3, `${user} asks for ${list(seats)}. ${why}`, [diagram(), ...board()])
      } else {
        t.step(3, `${user} asks for ${list(seats)}. The show checks every seat is Available, then moves each to Held until t=${now + holdFor}. Nobody else can take them now.`, [diagram(showEnd), ...board()])
        t.step(4, `The service asks the Pricing strategy for each seat by category and locks the total into hold ${id}. A later price change will not touch it.`, [diagram(), ...board()])
      }
      out.push(id)
    } else if (op === 'confirm') {
      const [holdId, user, now] = a as [number, string, number]
      log.push({ from: 'Client', to: 'BookingService', label: `confirm(hold ${holdId}, ${user}, t=${now})` })
      const b = svc.confirm(holdId, user, now)
      log.push({ from: 'BookingService', to: 'Client', label: b ? `booking ${b.id}, total ${b.total}` : 'refused', dashed: true, tone: b ? 'hit' : 'miss' })
      sweepStep(now)
      const why = touchedShow ? `The seats of hold ${holdId} are no longer held by it: the hold lapsed, so the booking is refused.` : `There is no hold ${holdId} that belongs to ${user}, so nothing changes.`
      t.step(5, b ? `${user} confirms hold ${holdId} at t=${now}. The hold is still live, so every seat goes Held to Booked. Total ${b.total}.` : why, [diagram(), ...board()])
      out.push(b ? b.total : -1)
    } else if (op === 'release') {
      const [holdId, user] = a as [number, string]
      log.push({ from: 'Client', to: 'BookingService', label: `release(hold ${holdId}, ${user})` })
      const ok = svc.release(holdId, user)
      log.push({ from: 'BookingService', to: 'Client', label: ok ? 'released' : 'refused', dashed: true, tone: ok ? 'hit' : 'miss' })
      t.step(6, ok ? `${user} gives up hold ${holdId}. Each seat it still owns goes Held to Available at once, without waiting for the timer.` : `There is no hold ${holdId} that belongs to ${user}, so nothing changes.`, [diagram(), ...board()])
      out.push(ok ? 1 : 0)
    } else if (op === 'cancel') {
      const [bookingId, user] = a as [number, string]
      log.push({ from: 'Client', to: 'BookingService', label: `cancel(booking ${bookingId}, ${user})` })
      const refund = svc.cancel(bookingId, user)
      log.push({ from: 'BookingService', to: 'Client', label: refund < 0 ? 'refused' : `refund ${refund}`, dashed: true, tone: refund < 0 ? 'miss' : 'hit' })
      t.step(6, refund < 0 ? `There is no booking ${bookingId} that belongs to ${user}, so nothing changes.` : `${user} cancels booking ${bookingId}. Its seats go Booked to Available and ${refund} is refunded.`, [diagram(), ...board()])
      out.push(refund)
    } else if (op === 'available') {
      const [showId, now] = a as [number, number]
      log.push({ from: 'Client', to: 'BookingService', label: `available(show ${showId}, t=${now})` })
      const free = svc.available(showId, now)
      log.push({ from: 'BookingService', to: 'Client', label: list(free), dashed: true, tone: free.length ? 'hit' : 'miss' })
      t.step(2, `Even a read sweeps lapsed holds first, so the answer is true for t=${now}. Free seats: ${list(free)}.`, [diagram(), ...board()])
      out.push(free)
    } else if (op === 'state') {
      const [showId, seatId, now] = a as [number, number, number]
      log.push({ from: 'Client', to: 'BookingService', label: `state(show ${showId}, seat ${seatId}, t=${now})` })
      const st = svc.stateOf(showId, seatId, now)
      log.push({ from: 'BookingService', to: 'Client', label: st, dashed: true, tone: st === 'available' ? 'hit' : st === 'none' ? 'miss' : 'focus' })
      t.step(2, `A sweep at t=${now} runs first, then the seat is read: it is ${st}.`, [diagram(), ...board()])
      out.push(st)
    }
  })
  return out
}
