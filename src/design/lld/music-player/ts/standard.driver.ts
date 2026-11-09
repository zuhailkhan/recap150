import type { Tracer } from '../../../../core/tracer'
import { noop } from '../../../../core/tracer'
import { arr, seq, type Panel, type SeqMessage } from '../../../../core/panels'
import { Library, Player, seededShuffle, type Mode, type PlayerState } from './standard'

// Replays operations against a real Player. The state objects, the queue and the repeat strategies are wrapped
// in spies, so the sequence diagram shows calls that really happened, in the order they happened.
const ACTORS = ['Client', 'Player', 'State', 'PlayQueue', 'RepeatMode']
const STATES = ['Stopped', 'Playing', 'Paused']
const TRANSPORT = ['play', 'pause', 'stop', 'next', 'prev', 'ended']
const WHY: Record<string, string> = {
  'Stopped.play': 'the queue is empty, so there is nothing to play',
  'Playing.play': 'it is already playing',
  'Paused.pause': 'it is already paused',
  'Paused.ended': 'a paused song cannot finish',
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any

function spy(o: Any, method: string, onCall: (a: Any[]) => void, onReturn?: (r: Any, a: Any[]) => void): void {
  const orig = o[method].bind(o)
  o[method] = (...a: Any[]) => {
    onCall(a)
    const r = orig(...a)
    onReturn?.(r, a)
    return r
  }
}

export function run(ops: string[], args: unknown[][], t: Tracer = noop): unknown[] {
  const log: SeqMessage[] = []
  let player!: Player
  let titles: string[] = []
  let repeatName: Mode = 'off'
  let shuffleOn = false
  let lastRepeat = { pos: 0, len: 0, ended: false, ans: 0 }
  const out: unknown[] = []

  const title = (id: number): string => (id > 0 ? titles[id - 1] : '-')
  const nowTone = (st: string): 'focus' | 'keep' | null => (st === 'Playing' ? 'focus' : st === 'Paused' ? 'keep' : null)
  const board = (st = player.state.name): Panel[] => {
    const ids = player.queue.playOrder()
    return [
      arr(STATES, { label: 'player state (amber = active)', tones: STATES.map((s) => (s === st ? ('focus' as const) : null)) }),
      arr(ids.map(title), {
        label: `queue in play order. repeat ${repeatName}, shuffle ${shuffleOn ? 'on' : 'off'}`,
        pointers: ids.length ? [{ name: 'now', at: player.queue.position }] : [],
        tones: ids.map((_, k) => (k === player.queue.position ? nowTone(st) : null)),
      }),
    ]
  }
  const diagram = (upTo = log.length): Panel => seq(ACTORS, log.slice(0, upTo), { label: 'calls in this request' })

  const instrument = (): void => {
    for (const s of [player.stopped, player.playing, player.paused]) {
      for (const m of TRANSPORT) spy(s, m, () => log.push({ from: 'Player', to: 'State', label: `${s.name}.${m}()` }))
    }
    const q = player.queue as Any
    spy(q, 'next', (a) => log.push({ from: 'State', to: 'PlayQueue', label: `next(${a[0] ? 'ended' : 'skip'})` }), (r) => log.push({ from: 'PlayQueue', to: 'State', label: r === null ? 'over' : `${title(r)}`, dashed: true, tone: r === null ? 'miss' : 'hit' }))
    spy(q, 'prev', () => log.push({ from: 'State', to: 'PlayQueue', label: 'prev()' }), (r) => log.push({ from: 'PlayQueue', to: 'State', label: title(r), dashed: true, tone: 'hit' }))
    spy(q, 'rewind', () => log.push({ from: 'Player', to: 'PlayQueue', label: 'rewind()' }))
    spy(q, 'load', (a) => log.push({ from: 'Player', to: 'PlayQueue', label: `load([${a[0].join(', ')}])` }))
    spy(q, 'add', (a) => log.push({ from: 'Player', to: 'PlayQueue', label: `add(${title(a[0])})` }))
    spy(q, 'setShuffle', (a) => log.push({ from: 'Player', to: 'PlayQueue', label: `setShuffle(${a[0]})` }))
    const realShuffle = q.shuffle
    q.shuffle = (xs: number[]) => {
      const r = realShuffle(xs)
      log.push({ from: 'PlayQueue', to: 'PlayQueue', label: `shuffle([${xs.join(',')}]) = [${r.join(',')}]`, tone: 'focus' })
      return r
    }
    for (const [name, mode] of Object.entries(player.modes)) {
      spy(mode, 'next', (a) => { lastRepeat = { pos: a[0], len: a[1], ended: a[2], ans: 0 }; log.push({ from: 'PlayQueue', to: 'RepeatMode', label: `${name}.next(${a[0] + 1} of ${a[1]}, ${a[2] ? 'ended' : 'skip'})` }) }, (r) => { lastRepeat.ans = r; log.push({ from: 'RepeatMode', to: 'PlayQueue', label: r < 0 ? 'over' : `position ${r + 1}`, dashed: true, tone: r < 0 ? 'miss' : 'hit' }) })
      spy(mode, 'prev', (a) => log.push({ from: 'PlayQueue', to: 'RepeatMode', label: `${name}.prev(${a[0] + 1} of ${a[1]})` }), (r) => log.push({ from: 'RepeatMode', to: 'PlayQueue', label: `position ${r + 1}`, dashed: true, tone: 'hit' }))
    }
    spy(player, 'setState', (a) => log.push({ from: 'State', to: 'Player', label: `setState(${(a[0] as PlayerState).name})`, tone: 'focus' }))
    spy(player, 'finish', () => log.push({ from: 'State', to: 'Player', label: 'finish()', tone: 'focus' }))
  }

  ops.forEach((op, i) => {
    const a = args[i]
    log.length = 0
    if (op === 'MusicPlayer') {
      titles = a[0] as string[]
      const lists = new Map(Object.entries(a[1] as Record<string, number[]>))
      repeatName = 'off'
      shuffleOn = false
      player = new Player(new Library(titles, lists), seededShuffle(a[2] as number))
      instrument()
      t.step(1, `The player is built with a library of ${titles.length} songs and a shuffle source with seed ${a[2]}. The queue is empty, repeat is off and the state is Stopped.`, board())
      out.push(null)
    } else if (op === 'load') {
      const [name] = a as [string]
      log.push({ from: 'Client', to: 'Player', label: `load(${name})` })
      const n = player.load(name)
      log.push({ from: 'Player', to: 'Client', label: n < 0 ? 'unknown or empty' : `${n} songs`, dashed: true, tone: n < 0 ? 'miss' : 'hit' })
      if (n >= 0) shuffleOn = false
      t.step(1, n < 0 ? `There is no playlist "${name}" with songs in it, so the queue and the state stay as they were.` : `The queue is replaced by playlist "${name}" in its own order, shuffle goes off, and playback stops.`, [diagram(), ...board()])
      out.push(n)
    } else if (op === 'enqueue') {
      const [id] = a as [number]
      log.push({ from: 'Client', to: 'Player', label: `enqueue(${id})` })
      const n = player.enqueue(id)
      log.push({ from: 'Player', to: 'Client', label: n < 0 ? 'unknown song' : `queue of ${n}`, dashed: true, tone: n < 0 ? 'miss' : 'hit' })
      t.step(1, n < 0 ? `There is no song ${id} in the library. Nothing is added.` : `${title(id)} goes on the end of the queue, which now holds ${n}. Play order keeps its current shape.`, [diagram(), ...board()])
      out.push(n)
    } else if (TRANSPORT.includes(op)) {
      const was = player.state.name
      const before = board()
      log.push({ from: 'Client', to: 'Player', label: `${op}()` })
      const r = (player as Any)[op]() as number
      const finished = log.some((m) => m.label === 'finish()')
      log.push({ from: 'Player', to: 'Client', label: r < 0 ? 'ignored' : title(r), dashed: true, tone: r < 0 ? 'miss' : 'hit' })
      const now = player.state.name
      const qEnd = log.reduce((e, m, k) => (m.to === 'PlayQueue' || m.to === 'RepeatMode' || m.from === 'RepeatMode' || m.from === 'PlayQueue') && m.label !== 'rewind()' ? k + 1 : e, 0)
      t.step(2, `The player does not decide. It forwards ${op}() to the current state object, ${was}.`, [diagram(2), ...before])
      const viaQueue = ['next', 'prev', 'ended'].includes(op) && qEnd > 0
      if (viaQueue) {
        const sk = lastRepeat
        const text = op === 'prev'
          ? `The state asks the queue for the previous song. The queue asks the ${repeatName} strategy to step back, and it answers.`
          : `The state asks the queue for the next song (${sk.ended ? 'the song ended' : 'a skip'}). The queue asks the ${repeatName} strategy: from position ${sk.pos + 1} of ${sk.len} it answers ${sk.ans < 0 ? 'the queue is over' : `position ${sk.ans + 1}`}.`
        t.step(4, text, [diagram(qEnd), ...(finished ? before : board(was))])
      }
      let what: string
      if (r < 0) what = `${was} ignores ${op}(): ${WHY[`${was}.${op}`] ?? 'nothing is playing'}. Nothing changes.`
      else if (finished) what = op === 'stop' ? `${was} stops: the queue goes back to the first song, ${title(r)}.` : `The queue is over, so ${was} calls finish(): back to the first song, ${title(r)}, and Stopped.`
      else if (was !== now) what = `${was} accepts ${op}() and moves the player to ${now}. The current song is ${title(r)}.`
      else what = `${was} accepts ${op}() and stays ${was}. The current song is ${title(r)}.`
      t.step(3, what, [diagram(), ...board()])
      out.push(r)
    } else if (op === 'repeat') {
      const [mode] = a as [Mode]
      log.push({ from: 'Client', to: 'Player', label: `setRepeat(${mode})` })
      player.setRepeat(mode)
      repeatName = mode
      t.step(4, `The player swaps the strategy object the queue uses. Repeat is now ${mode}. Nothing else changes: not the state, not the queue.`, [diagram(), ...board()])
      out.push(null)
    } else if (op === 'shuffle') {
      const [flag] = a as [number]
      const before = player.queue.playOrder().map(title)
      log.push({ from: 'Client', to: 'Player', label: `setShuffle(${flag === 1})` })
      player.setShuffle(flag === 1)
      shuffleOn = flag === 1
      const after = player.queue.playOrder().map(title)
      t.step(5, flag === 1 ? `The queue keeps the song that is playing first, then hands the other positions to the injected shuffle. ${before.join(' ')} becomes ${after.join(' ')}.` : `The queue goes back to the order the songs were added, standing on the same song. ${before.join(' ')} becomes ${after.join(' ')}.`, [diagram(), ...board()])
      out.push(null)
    } else if (op === 'state') {
      log.push({ from: 'Client', to: 'Player', label: 'state' })
      log.push({ from: 'Player', to: 'Client', label: player.state.name, dashed: true, tone: 'focus' })
      t.step(3, `The current state object is ${player.state.name}.`, [diagram(), ...board()])
      out.push(player.state.name)
    } else if (op === 'current') {
      log.push({ from: 'Client', to: 'Player', label: 'current()' })
      const c = player.current()
      log.push({ from: 'Player', to: 'Client', label: title(c), dashed: true, tone: c < 0 ? 'miss' : 'hit' })
      t.step(4, c < 0 ? 'The queue is empty, so there is no current song.' : `The queue stands on ${title(c)}.`, [diagram(), ...board()])
      out.push(c)
    } else if (op === 'queue') {
      log.push({ from: 'Client', to: 'Player', label: 'queue()' })
      const ids = player.queue.playOrder()
      log.push({ from: 'Player', to: 'Client', label: `[${ids.join(', ')}]`, dashed: true, tone: 'hit' })
      t.step(4, `The play order, as song ids: [${ids.join(', ')}].`, [diagram(), ...board()])
      out.push(ids)
    }
  })
  return out
}
