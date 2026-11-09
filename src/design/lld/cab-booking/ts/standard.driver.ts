import type { Tracer } from '../../../../core/tracer'
import { noop } from '../../../../core/tracer'
import { buckets, grid, mark2, seq, type Cell, type Panel, type SeqMessage, type Tone } from '../../../../core/panels'
import {
  CabService, DistanceFare, FirstFree, NearestDriver, Trip, manhattan,
  type Driver, type FareStrategy, type MatchingStrategy, type Point, type TripState,
} from './standard'

// Replays operations against a real CabService. The strategies are wrapped in spies and Trip.move is patched,
// so the sequence diagram shows calls that really happened, in the order they happened.
const ACTORS = ['Caller', 'CabService', 'Matching', 'Trip', 'Fare']
const MAX_GRID = 12
const pt = (p: Point): string => `${p.x},${p.y}`

export function run(ops: string[], args: unknown[][], t: Tracer = noop): unknown[] {
  const log: SeqMessage[] = []
  const pickEnds: number[] = [] // log length after each Matching reply, to cut the diagram there
  const info = new Map<number, { rider: string; from: Point; to: Point; surge: number }>()
  let svc!: CabService
  let matcherName = 'nearest'
  const out: unknown[] = []

  const matchingSpy = (inner: MatchingStrategy): MatchingStrategy => ({
    pick(drivers, from) {
      log.push({ from: 'CabService', to: 'Matching', label: `pick(from ${pt(from)})` })
      const d = inner.pick(drivers, from)
      log.push({ from: 'Matching', to: 'CabService', label: d ? `${d.id}, ${manhattan(d.at, from)} away` : 'nobody free', dashed: true, tone: d ? 'focus' : 'miss' })
      pickEnds.push(log.length)
      return d
    },
  })
  const fareSpy = (inner: FareStrategy): FareStrategy => ({
    fare(distance, surge) {
      log.push({ from: 'CabService', to: 'Fare', label: `fare(${distance} units, ${surge}%)` })
      const f = inner.fare(distance, surge)
      log.push({ from: 'Fare', to: 'CabService', label: `${f} cents`, dashed: true, tone: 'focus' })
      return f
    },
  })

  const roster = (): Driver[] => [...svc['drivers'].values()] // read-only peek at the service's own drivers
  const statusOf = (id: number): string => svc.status(id)
  const ids = (): number[] => [...info.keys()]
  const driverOf = (id: number): string => statusOf(id).split(':')[1] ?? ''

  // A small map: rows are y, columns are x. Drivers show their id, pickups show R plus the trip id.
  const board = (): Panel => {
    const drivers = roster()
    const open = ids().filter((id) => /^(Requested|Matched)/.test(statusOf(id)))
    const going = ids().filter((id) => statusOf(id).startsWith('InProgress'))
    const xs = [...drivers.map((d) => d.at.x), ...open.map((id) => info.get(id)!.from.x), ...going.map((id) => info.get(id)!.to.x)]
    const ys = [...drivers.map((d) => d.at.y), ...open.map((id) => info.get(id)!.from.y), ...going.map((id) => info.get(id)!.to.y)]
    const w = Math.max(3, ...xs.map((x) => x + 1))
    const h = Math.max(3, ...ys.map((y) => y + 1))
    if (w > MAX_GRID || h > MAX_GRID) {
      return buckets(drivers.map((d) => ({ key: d.id, items: [pt(d.at), d.busy ? 'on a trip' : d.online ? 'free' : 'offline'], tone: (d.busy ? 'keep' : d.online ? 'hit' : 'dim') as Tone })), { label: 'drivers (map too large to draw)', keyLabel: 'driver', empty: 'no drivers yet' })
    }
    const cells: string[][] = Array.from({ length: h }, () => Array<string>(w).fill(''))
    const sets: [number, number, Tone][] = []
    const put = (p: Point, text: string, tone: Tone) => {
      cells[p.y][p.x] = cells[p.y][p.x] ? `${cells[p.y][p.x]} ${text}` : text
      sets.push([p.y, p.x, tone])
    }
    for (const d of drivers) put(d.at, d.id, d.busy ? 'keep' : d.online ? 'hit' : 'dim')
    for (const id of open) put(info.get(id)!.from, `R${id}`, 'focus')
    for (const id of going) put(info.get(id)!.to, `to${id}`, 'focus')
    return grid(cells as Cell[][], { label: 'map (x across, y down): green free driver, blue on a trip, grey offline, amber pickup R or drop-off to', tones: mark2(h, w, sets) })
  }
  const tripsPanel = (hot?: number): Panel =>
    buckets(ids().map((id) => {
      const i = info.get(id)!
      const s = statusOf(id)
      const tone: Tone | undefined = id === hot ? 'focus' : s.startsWith('Cancelled') ? 'miss' : s.startsWith('Completed') ? 'dim' : s.startsWith('Requested') ? undefined : 'keep'
      return { key: `trip ${id}`, items: [i.rider, `${pt(i.from)} to ${pt(i.to)}`, `${i.surge}%`, s], tone }
    }), { label: 'trips: rider, route, surge, state', keyLabel: 'trip', empty: 'no trips yet' })
  const diagram = (upTo = log.length): Panel => seq(ACTORS, log.slice(0, upTo), { label: 'calls in this request' })

  const snapshot = (): Map<number, string> => new Map(ids().map((id) => [id, statusOf(id)]))
  /** Stages 2 and 3 for any matching that happened during this operation. */
  const dispatchSteps = (before: Map<number, string>): void => {
    if (!pickEnds.length) return
    const newly = ids().filter((id) => (before.get(id) ?? 'Requested') === 'Requested' && statusOf(id).startsWith('Matched'))
    const waiting = ids().filter((id) => statusOf(id) === 'Requested')
    if (newly.length) {
      const who = newly.map((id) => `trip ${id} gets ${driverOf(id)}`).join(' and ')
      t.step(2, `The service asks the ${matcherName} strategy for each waiting trip, oldest first: ${who}. It only calls pick. It never compares distances itself.`, [diagram(pickEnds[pickEnds.length - 1]), board()])
      t.step(3, `Each matched trip goes Requested to Matched through Trip.move, and its driver is marked busy.`, [diagram(), tripsPanel(newly[0])])
    } else {
      t.step(2, `The strategy says nobody is free, so ${waiting.length > 1 ? 'the waiting trips stay' : `trip ${waiting[0]} stays`} Requested. The service stops there: a later trip could not do better.`, [diagram(), board()])
    }
  }
  const firstCut = (): number => (pickEnds.length ? 1 : log.length)
  const reply = (label: string, ok: boolean) => log.push({ from: 'CabService', to: 'Caller', label, dashed: true, tone: ok ? 'hit' : 'miss' })

  const realMove = Trip.prototype.move
  Trip.prototype.move = function (this: Trip, next: TripState) {
    log.push({ from: 'CabService', to: 'Trip', label: `move(${next})` })
    const from = this.state
    const ok = realMove.call(this, next)
    log.push({ from: 'Trip', to: 'CabService', label: ok ? `${from} to ${next}` : `refused from ${from}`, dashed: true, tone: ok ? 'hit' : 'miss' })
    return ok
  }

  try {
    ops.forEach((op, i) => {
      const a = args[i]
      log.length = 0
      pickEnds.length = 0
      const before = snapshot()
      if (op === 'CabService') {
        matcherName = a[0] === 'first' ? 'first-free' : 'nearest'
        info.clear()
        svc = new CabService(matchingSpy(a[0] === 'first' ? new FirstFree() : new NearestDriver()), fareSpy(new DistanceFare(a[1] as number, a[2] as number)))
        t.step(1, `The service is built with the ${matcherName} matching strategy and a fare of ${a[1]} cents plus ${a[2]} per unit. It holds no drivers and no trips yet.`, [board(), tripsPanel()])
        out.push(null)
      } else if (op === 'addDriver') {
        const [id, x, y] = a as [string, number, number]
        log.push({ from: 'Caller', to: 'CabService', label: `addDriver(${id})` })
        const ok = svc.addDriver(id, { x, y })
        reply(ok ? 'added' : 'duplicate id', ok)
        t.step(1, ok ? `${id} joins at (${x},${y}) and is free. Any waiting trip is tried against the new driver.` : `There is already a driver ${id}, so nothing changes.`, [diagram(ok ? firstCut() : log.length), board()])
        if (ok) dispatchSteps(before)
        out.push(ok ? 1 : 0)
      } else if (op === 'setAvailable') {
        const [id, flag] = a as [string, number]
        log.push({ from: 'Caller', to: 'CabService', label: `setAvailable(${id}, ${flag === 1})` })
        const ok = svc.setAvailable(id, flag === 1)
        reply(ok ? 'done' : 'refused', ok)
        t.step(1, ok ? `${id} goes ${flag === 1 ? 'online' : 'offline'}.${flag === 1 ? ' Waiting trips are tried against them.' : ' The strategy will skip them.'}` : `${id} is unknown or on a trip, so the service refuses.`, [diagram(ok && flag === 1 ? firstCut() : log.length), board()])
        if (ok && flag === 1) dispatchSteps(before)
        out.push(ok ? 1 : 0)
      } else if (op === 'requestRide') {
        const [rider, fx, fy, tx, ty, surge] = a as [string, number, number, number, number, number]
        log.push({ from: 'Caller', to: 'CabService', label: `requestRide(${rider})` })
        const id = svc.requestRide(rider, { x: fx, y: fy }, { x: tx, y: ty }, surge)
        info.set(id, { rider, from: { x: fx, y: fy }, to: { x: tx, y: ty }, surge })
        reply(`trip ${id}`, true)
        t.step(1, `${rider} asks for a ride from (${fx},${fy}) to (${tx},${ty}). Trip ${id} is created as Requested with surge ${surge}% locked in.`, [diagram(firstCut()), tripsPanel(id)])
        dispatchSteps(before)
        out.push(id)
      } else if (op === 'startTrip') {
        const id = a[0] as number
        log.push({ from: 'Caller', to: 'CabService', label: `startTrip(${id})` })
        const ok = svc.startTrip(id)
        reply(ok ? 'started' : 'refused', ok)
        t.step(3, ok ? `Trip.move(InProgress) is allowed from Matched. The ride is under way.` : before.has(id) ? `Trip ${id} is ${before.get(id)!.split(':')[0]}. The table only allows InProgress from Matched, so the move is refused.` : `There is no trip ${id}.`, [diagram(), tripsPanel(id)])
        out.push(ok ? 1 : 0)
      } else if (op === 'endTrip') {
        const id = a[0] as number
        log.push({ from: 'Caller', to: 'CabService', label: `endTrip(${id})` })
        const fare = svc.endTrip(id)
        reply(fare < 0 ? 'refused' : `${fare} cents`, fare >= 0)
        if (fare < 0) {
          t.step(3, before.has(id) ? `Trip ${id} is ${before.get(id)!.split(':')[0]}. Completed is only reachable from InProgress, so the move is refused and nothing is charged.` : `There is no trip ${id}.`, [diagram(), tripsPanel(id)])
        } else {
          const i = info.get(id)!
          t.step(3, `Trip.move(Completed) is allowed from InProgress.`, [diagram(3), tripsPanel(id)])
          t.step(4, `The service asks the fare strategy: ${manhattan(i.from, i.to)} units at surge ${i.surge}% costs ${fare} cents. The formula is not in the service.`, [diagram(5), tripsPanel(id)])
          t.step(5, `The driver is freed at the drop-off (${pt(i.to)}), so the next match starts from there.`, [pickEnds.length ? diagram(5) : diagram(), board()])
          dispatchSteps(before)
        }
        out.push(fare)
      } else if (op === 'cancel') {
        const id = a[0] as number
        const had = driverOf(id)
        log.push({ from: 'Caller', to: 'CabService', label: `cancel(${id})` })
        const ok = svc.cancel(id)
        reply(ok ? 'cancelled' : 'refused', ok)
        t.step(3, ok ? `Trip.move(Cancelled) is allowed from ${before.get(id)!.split(':')[0]}.` : before.has(id) ? `Trip ${id} is ${before.get(id)!.split(':')[0]}. Cancelled is not allowed from there, so nothing changes.` : `There is no trip ${id}.`, [diagram(ok && had ? 3 : log.length), tripsPanel(id)])
        if (ok && had) {
          t.step(5, `${had} never moved, so it is free again where it stands. Waiting trips are tried next.`, [diagram(pickEnds.length ? 3 : log.length), board()])
          dispatchSteps(before)
        }
        out.push(ok ? 1 : 0)
      } else if (op === 'status') {
        const id = a[0] as number
        log.push({ from: 'Caller', to: 'CabService', label: `status(${id})` })
        const s = statusOf(id)
        reply(s, s !== 'none')
        t.step(3, s === 'none' ? `There is no trip ${id}.` : `Trip ${id} reports ${s}. The state lives in the Trip, so the service has nothing to look up but the trip.`, [diagram(), tripsPanel(id)])
        out.push(s)
      }
    })
  } finally {
    Trip.prototype.move = realMove
  }
  return out
}
