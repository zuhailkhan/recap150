import type { Tracer } from '../../../../core/tracer'
import { noop } from '../../../../core/tracer'
import { arr, seq, type Panel, type SeqMessage } from '../../../../core/panels'
import { HourlyBySize, NearestFree, ParkingLot, TightestFit, type Pricing, type Size, type Spot, type SpotStrategy } from './standard'

// Replays a list of operations against a real ParkingLot. The strategy and pricing objects are wrapped
// in spies, so the sequence diagram shows calls that really happened, not a drawing of what should.
const SIZE = { 1: 'S', 2: 'M', 3: 'L' } as const
const KIND = { 1: 'motorcycle', 2: 'car', 3: 'truck' } as const
const ACTORS = ['Client', 'ParkingLot', 'SpotStrategy', 'Pricing']

export function run(ops: string[], args: unknown[][], t: Tracer = noop): unknown[] {
  const log: SeqMessage[] = []
  let spots: Spot[] = []
  let lot!: ParkingLot
  const out: unknown[] = []

  const board = (): Panel => arr(spots.map((s) => `${s.id}:${SIZE[s.size]}`), { label: 'spots (id:size), blue = taken', tones: spots.map((s) => (s.taken ? ('keep' as const) : null)) })
  const diagram = (upTo = log.length): Panel => seq(ACTORS, log.slice(0, upTo), { label: 'calls in this request' })

  const strategySpy = (inner: SpotStrategy): SpotStrategy => ({
    pick(list, v) {
      log.push({ from: 'ParkingLot', to: 'SpotStrategy', label: `pick(${KIND[v.size]})` })
      const s = inner.pick(list, v)
      log.push({ from: 'SpotStrategy', to: 'ParkingLot', label: s ? `spot ${s.id}` : 'no spot', dashed: true, tone: s ? 'focus' : 'miss' })
      return s
    },
  })
  const pricingSpy = (inner: Pricing): Pricing => ({
    fee(tk, now) {
      log.push({ from: 'ParkingLot', to: 'Pricing', label: `fee(ticket ${tk.id})` })
      const f = inner.fee(tk, now)
      log.push({ from: 'Pricing', to: 'ParkingLot', label: `${f}`, dashed: true, tone: 'focus' })
      return f
    },
  })

  ops.forEach((op, i) => {
    const a = args[i]
    log.length = 0
    if (op === 'ParkingLot') {
      const sizes = a[0] as Size[]
      const name = a[1] as string
      spots = sizes.map((size, id) => ({ id, size, taken: false }))
      lot = new ParkingLot(spots, strategySpy(name === 'tightest' ? new TightestFit() : new NearestFree()), pricingSpy(new HourlyBySize({ 1: 1, 2: 2, 3: 4 })))
      t.step(1, `A lot with ${spots.length} spot${spots.length === 1 ? '' : 's'}. It is handed the "${name}" rule for choosing spots and hourly pricing. It decides neither itself.`, [board(), diagram()])
      out.push(null)
    } else if (op === 'park') {
      const [plate, size, now] = a as [string, Size, number]
      const before = board()
      log.push({ from: 'Client', to: 'ParkingLot', label: `park(${KIND[size]})` })
      const ticket = lot.park({ plate, size }, now)
      log.push({ from: 'ParkingLot', to: 'Client', label: ticket ? `ticket ${ticket.id}` : 'lot full', dashed: true, tone: ticket ? 'hit' : 'miss' })
      if (ticket) {
        t.step(2, `The lot asks the strategy. It looked at the free spots and picked spot ${ticket.spotId} for the ${KIND[size]}.`, [diagram(3), before])
        t.step(3, `Spot ${ticket.spotId} is marked taken. Ticket ${ticket.id} remembers the spot, the vehicle and minute ${now}.`, [diagram(), board()])
      } else {
        t.step(2, `The strategy finds no free spot big enough for a ${KIND[size]}. The lot answers "full" and changes nothing.`, [diagram(), before])
      }
      out.push(ticket ? ticket.spotId : -1)
    } else if (op === 'unpark') {
      const [id, now] = a as [number, number]
      log.push({ from: 'Client', to: 'ParkingLot', label: `unpark(ticket ${id})` })
      const fee = lot.unpark(id, now)
      log.push({ from: 'ParkingLot', to: 'Client', label: fee === null ? 'unknown ticket' : `fee ${fee}`, dashed: true, tone: fee === null ? 'miss' : 'hit' })
      t.step(4, fee === null ? `There is no open ticket ${id}, so nothing changes.` : `Pricing charged ${fee}. The spot is free again and ticket ${id} is retired, so it cannot be used twice.`, [diagram(), board()])
      out.push(fee ?? -1)
    }
  })
  return out
}
