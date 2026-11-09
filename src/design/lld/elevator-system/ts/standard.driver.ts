import type { Tracer } from '../../../../core/tracer'
import { noop } from '../../../../core/tracer'
import { buckets, grid, seq, type Panel, type SeqMessage, type Tone, type Tones } from '../../../../core/panels'
import { Building, DirectionAware, Elevator, NearestIdle, type Call, type Scheduler, type State } from './standard'

// Replays operations against a real Building. The main picture is the shaft: floors as rows, elevators
// as columns, so you can see where each car is and what it is going to stop at. The scheduler and the
// elevators are wrapped in spies, so the sequence diagram for a request shows calls that really happened.
const ACTORS = ['Client', 'Building', 'Scheduler', 'Elevator']
const LETTER: Record<State, string> = { Idle: 'I', MovingUp: 'U', MovingDown: 'D', DoorsOpen: 'O' }
const GLYPH: Record<State, string> = { Idle: 'idle', MovingUp: '▲', MovingDown: '▼', DoorsOpen: 'open' }
const TONE: Record<State, Tone | null> = { Idle: null, MovingUp: 'focus', MovingDown: 'focus', DoorsOpen: 'hit' }

export function run(ops: string[], args: unknown[][], t: Tracer = noop): unknown[] {
  const log: SeqMessage[] = []
  let b!: Building
  const out: unknown[] = []

  class SpyElevator extends Elevator {
    add(floor: number, kind: 'car' | Call) {
      log.push({ from: 'Building', to: 'Elevator', label: `E${this.id}.add(${floor}, ${kind})` })
      super.add(floor, kind)
    }
  }
  const spy = (inner: Scheduler): Scheduler => ({
    pick(es, floor, call) {
      log.push({ from: 'Building', to: 'Scheduler', label: `pick(floor ${floor}, ${call})` })
      const id = inner.pick(es, floor, call)
      log.push({ from: 'Scheduler', to: 'Building', label: `E${id}`, dashed: true, tone: 'focus' })
      return id
    },
  })

  const view = (): string[] => b.elevators.map((e) => `${e.floor}:${LETTER[e.state]}`)
  const diagram = (upTo = log.length): Panel => seq(ACTORS, log.slice(0, upTo), { label: 'calls in this request' })
  /** Floor 0 at the bottom. In a column: the car (▲ ▼ idle open), or just the stops waiting for it. */
  const shaft = (): Panel => {
    const cells: string[][] = [['floor', ...b.elevators.map((e) => `E${e.id}`)]]
    const tones: Tones[] = [b.elevators.map(() => null).concat(null)]
    for (let f = b.floors - 1; f >= 0; f--) {
      const row = [`${f}`]
      const tr: (Tone | null)[] = [null]
      for (const e of b.elevators) {
        const marks = `${e.car.has(f) ? '•' : ''}${e.up.has(f) ? '↑' : ''}${e.down.has(f) ? '↓' : ''}`
        if (e.floor === f) {
          row.push(`${GLYPH[e.state]}${marks ? ' ' + marks : ''}`)
          tr.push(TONE[e.state])
        } else {
          row.push(marks)
          tr.push(marks ? 'keep' : null)
        }
      }
      cells.push(row)
      tones.push(tr)
    }
    return grid(cells, { label: 'shaft, floor 0 at the bottom. ▲ ▼ moving, open = doors open. • car button, ↑ ↓ hall call waiting for that car', tones })
  }
  const cars = (): Panel =>
    buckets(b.elevators.map((e) => ({ key: `E${e.id}`, items: [e.state, e.pending().length ? `stops ${e.pending().join(', ')}` : 'no stops'], tone: TONE[e.state] ?? undefined })), { label: 'state machine of each elevator', keyLabel: 'car' })

  ops.forEach((op, i) => {
    const a = args[i]
    log.length = 0
    if (op === 'Building') {
      const [floors, starts, rule] = a as [number, number[], string]
      b = new Building(floors, starts.map((f, id) => new SpyElevator(id, f)), spy(rule === 'direction' ? new DirectionAware() : new NearestIdle()))
      t.step(1, `A building with ${floors} floors (0 to ${floors - 1}) and ${starts.length} elevator${starts.length === 1 ? '' : 's'}, all idle. The scheduling rule is "${rule === 'direction' ? 'direction aware' : 'nearest idle'}", handed in from outside.`, [shaft(), cars()])
      out.push(null)
    } else if (op === 'hall') {
      const [floor, call] = a as [number, Call]
      const beforeShaft = shaft()
      log.push({ from: 'Client', to: 'Building', label: `hall(${floor}, ${call})` })
      const id = b.hall(floor, call)
      log.push({ from: 'Building', to: 'Client', label: id >= 0 ? `E${id} will come` : 'refused', dashed: true, tone: id >= 0 ? 'hit' : 'miss' })
      if (id < 0) {
        t.step(2, `Floor ${floor} has no "${call}" button, or does not exist. The building refuses before asking the scheduler.`, [shaft(), diagram()])
      } else {
        t.step(2, `Someone on floor ${floor} pressed ${call}. The building asks the scheduler, which looks at every elevator and answers E${id}.`, [beforeShaft, diagram(3)])
        t.step(3, `E${id} records floor ${floor} as a ${call} call. It will stop there when it is travelling ${call} (or when it is the last stop in its direction).`, [shaft(), diagram()])
      }
      out.push(id)
    } else if (op === 'press') {
      const [id, floor] = a as [number, number]
      log.push({ from: 'Client', to: 'Building', label: `press(E${id}, ${floor})` })
      const ok = b.press(id, floor)
      log.push({ from: 'Building', to: 'Client', label: ok ? 'accepted' : 'refused', dashed: true, tone: ok ? 'hit' : 'miss' })
      t.step(3, ok ? `A rider in E${id} presses ${floor}. The car button is remembered, and E${id} will stop there.` : `There is no elevator ${id} or no floor ${floor}. Nothing changes.`, [shaft(), diagram()])
      out.push(ok ? 1 : 0)
    } else if (op === 'tick') {
      for (let n = 0; n < (a[0] as number); n++) {
        const before = b.elevators.map((e) => ({ floor: e.floor, state: e.state, dir: e.dir }))
        b.tick()
        const notes: string[] = []
        let opens = false
        let closes = false
        b.elevators.forEach((e, k) => {
          const w = before[k]
          const name = `E${e.id}`
          if (w.state === 'DoorsOpen') {
            closes = true
            notes.push(e.state === 'Idle' ? `${name} closes its doors. Nothing is left to do, so it goes idle.` : `${name} closes its doors and heads ${e.state === 'MovingUp' ? 'up' : 'down'}${w.dir === e.dir ? ', the way it was going' : ', turning round because nothing is left ahead'}.`)
          } else if (e.state === 'DoorsOpen' && e.floor === w.floor) {
            opens = true
            notes.push(`${name} is idle but has a call on its own floor ${e.floor}. The doors open.`)
          } else if (e.state === 'DoorsOpen') {
            opens = true
            notes.push(`${name} reaches floor ${e.floor} and the doors open: a rider there wants this direction, or it is the last stop this way.`)
          } else if (e.floor !== w.floor) {
            notes.push(`${name} moves to floor ${e.floor}${e.pending().includes(e.floor) ? ', where a call goes the other way, so it passes' : ''}.`)
          }
        })
        t.step(opens ? 5 : closes ? 6 : 4, `Tick ${b.tickNo}. ${notes.length ? notes.join(' ') : 'Every elevator is idle with no stops, so nothing moves.'}`, [shaft(), cars()])
      }
      out.push(view())
    } else if (op === 'state') {
      t.step(4, 'Where every car is and what state it is in. Letters: I idle, U moving up, D moving down, O doors open.', [shaft(), cars()])
      out.push(view())
    } else if (op === 'log') {
      t.step(5, b.log.length ? `Doors opened at: ${b.log.join(', ')}. Format: tick, elevator, floor.` : 'No door has opened yet.', [shaft(), cars()])
      out.push([...b.log])
    }
  })

  return out
}
