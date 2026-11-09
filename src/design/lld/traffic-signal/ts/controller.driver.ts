import type { Tracer } from '../../../../core/tracer'
import { noop } from '../../../../core/tracer'
import { dp, seq, type Panel, type SeqMessage, type Tone } from '../../../../core/panels'
import { Crossing, Junction, Signal, type Color } from './controller'

// Replays operations against a real Junction. The signals and the crossing are patched with small spies, so
// the sequence diagram shows calls that really happened. The junction is drawn as a 3 by 3 table (dp panel: tones colour its cells): the
// N and S cells share the NS signal, the W and E cells share the EW signal, the middle is the pedestrian crossing.
const ACTORS = ['Caller', 'Junction', 'Signal', 'Crossing']
const TONE: Record<Color, Tone> = { green: 'hit', yellow: 'focus', red: 'miss' }
type Obj = Record<string, (...a: unknown[]) => unknown>

export function run(ops: string[], args: unknown[][], t: Tracer = noop): unknown[] {
  const log: SeqMessage[] = []
  let j!: Junction
  let ns!: Signal
  let ew!: Signal
  let cr!: Crossing
  let now = 0
  let bad = 0
  const out: unknown[] = []

  const lamp = (s: Signal): string => (s.color === 'red' ? 'R' : `${s.color[0].toUpperCase()} ${s.left}`)
  const junction = (): Panel => {
    const mid = cr.walking ? `WALK ${cr.left}` : cr.waiting ? 'req' : '+'
    const midTone: Tone | null = cr.walking ? 'hit' : cr.waiting ? 'keep' : null
    const t3: (Tone | null)[][] = [
      [null, TONE[ns.color], null],
      [TONE[ew.color], midTone, TONE[ew.color]],
      [null, TONE[ns.color], null],
    ]
    return dp(
      [
        ['', `N ${lamp(ns)}`, ''],
        [`W ${lamp(ew)}`, mid, `E ${lamp(ew)}`],
        ['', `S ${lamp(ns)}`, ''],
      ],
      { label: `junction at tick ${now}: green, yellow, red, and the middle is the pedestrian crossing (blue = request waiting)`, tones: t3 },
    )
  }
  const diagram = (upTo = log.length): Panel => seq(ACTORS, log.slice(0, upTo), { label: 'calls in this tick' })

  const patch = (o: object, to: string, methods: string[], reply: (m: string, r: unknown) => string, who: string): void => {
    const obj = o as Obj
    for (const m of methods) {
      const orig = obj[m].bind(o)
      obj[m] = (...a: unknown[]) => {
        log.push({ from: 'Junction', to, label: `${who}${m}()` })
        const r = orig(...a)
        log.push({ from: to, to: 'Junction', label: reply(m, r), dashed: true, tone: r === true ? 'focus' : undefined })
        return r
      }
    }
  }
  const spySignal = (s: Signal): void => patch(s, 'Signal', ['go', 'tick'], (m, r) => (m === 'go' ? `green ${s.left}` : r ? 'turned red' : `${s.color} ${s.left}`), `${s.name}.`)
  const spyCrossing = (): void => patch(cr, 'Crossing', ['open', 'tick'], (m, r) => (m === 'open' ? (r ? `walk ${cr.left}` : 'no request') : r ? 'walk over' : `walk ${cr.left}`), '')

  ops.forEach((op, i) => {
    const a = args[i]
    log.length = 0
    if (op === 'Junction') {
      const [ng, ny, eg, ey, walk] = a as number[]
      ns = new Signal('NS', ng, ny)
      ew = new Signal('EW', eg, ey)
      cr = new Crossing(walk)
      spySignal(ns)
      spySignal(ew)
      spyCrossing()
      j = new Junction([ns, ew], cr)
      now = 0
      t.step(1, `One signal head per axis (north with south, east with west) and a pedestrian crossing, all owned by the junction. NS starts green for ${ng} ticks, every other signal is red.`, [diagram(), junction()])
      out.push(null)
    } else if (op === 'tick') {
      for (let k = 0; k < (a[0] as number); k++) {
        log.length = 0
        log.push({ from: 'Caller', to: 'Junction', label: 'tick()' })
        const walkingBefore = cr.walking
        const waitingBefore = cr.waiting
        const before = junction()
        j.tick()
        now++
        if (!j.safe()) bad++
        const handover = log.some((x) => x.label.startsWith('open'))
        if (k === 0) t.step(2, walkingBefore ? 'The junction gets the tick. A walk is on, so it passes the tick to the crossing. The signals are not asked at all.' : 'The junction gets the tick and passes it to the one active signal only. The other axis is red, so it has nothing to count.', [diagram(2), before])
        let what: string
        let stage = 3
        if (walkingBefore) {
          stage = 4
          what = cr.walking ? `Pedestrians are crossing, ${cr.left} tick${cr.left === 1 ? '' : 's'} left. Every signal stays red.` : 'The walk is over. The crossing tells the junction, which starts the next axis.'
        } else if (handover) {
          stage = 4
          what = waitingBefore ? `The active signal turned red, so this is the safe moment. Someone pressed the button, so the crossing opens a ${cr.walk}-tick walk and the next axis waits.` : 'The active signal turned red, so this is the safe moment. Nobody is waiting, so the junction starts the next axis.'
        } else {
          const act = ns.color !== 'red' ? ns : ew
          what = `${act.name} is ${act.color} with ${act.left} tick${act.left === 1 ? '' : 's'} left. Only this signal counted.`
        }
        t.step(stage, what, [diagram(), junction()])
      }
      out.push(j.look())
    } else if (op === 'press') {
      log.push({ from: 'Caller', to: 'Junction', label: 'press()' })
      log.push({ from: 'Junction', to: 'Crossing', label: 'press()' })
      const r = j.press()
      log.push({ from: 'Crossing', to: 'Junction', label: r ? 'queued' : 'ignored', dashed: true, tone: r ? 'hit' : 'miss' })
      t.step(5, r ? 'The button only records a request. The road does not change: the walk waits for the next safe moment.' : 'Ignored. A request is already waiting, or the walk is on, or this crossing has no walk time.', [diagram(), junction()])
      out.push(r)
    } else if (op === 'look') {
      out.push(j.look())
    } else if (op === 'violations') {
      out.push(bad)
    }
  })
  return out
}
