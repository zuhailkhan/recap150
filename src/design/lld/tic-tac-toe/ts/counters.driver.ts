import type { Tracer } from '../../../../core/tracer'
import { noop } from '../../../../core/tracer'
import { buckets, dp, seq, type Panel, type SeqMessage, type Tone } from '../../../../core/panels'
import { Game, type Move } from './counters'

// Replays operations against a real Game. The board and the tally are patched with small spies, so the
// sequence diagram shows calls that really happened. The board is a table whose edge labels are the counters.
const ACTORS = ['Caller', 'Game', 'Board', 'Tally']
type Obj = Record<string, (...a: unknown[]) => unknown>

export function run(ops: string[], args: unknown[][], t: Tracer = noop): unknown[] {
  const log: SeqMessage[] = []
  let g!: Game
  const out: unknown[] = []

  const signed = (v: number): string => (v > 0 ? `+${v}` : `${v}`)
  const winLine = (): [number, number][] => {
    const { n, tally: k } = g
    const pts: [number, number][] = []
    for (let r = 0; r < n; r++) if (Math.abs(k.rows[r]) === n) for (let c = 0; c < n; c++) pts.push([r, c])
    for (let c = 0; c < n; c++) if (Math.abs(k.cols[c]) === n) for (let r = 0; r < n; r++) pts.push([r, c])
    if (Math.abs(k.diag) === n) for (let i = 0; i < n; i++) pts.push([i, i])
    if (Math.abs(k.anti) === n) for (let i = 0; i < n; i++) pts.push([i, n - 1 - i])
    return pts
  }
  const views = (last?: Move): Panel[] => {
    const n = g.n
    const tones: (Tone | null)[][] = Array.from({ length: n }, () => Array<Tone | null>(n).fill(null))
    if (last) tones[last.r][last.c] = 'focus'
    if (g.winner) for (const [r, c] of winLine()) tones[r][c] = 'hit'
    const hot = (v: number): Tone | undefined => (Math.abs(v) === n ? 'hit' : v !== 0 ? 'keep' : undefined)
    return [
      dp(g.board.cells.map((row) => row.map((m) => m ?? '')), {
        label: 'board (numbers on the edges are the counters: X adds 1, O subtracts 1)',
        rowLabels: g.tally.rows.map(signed),
        colLabels: g.tally.cols.map(signed),
        tones,
      }),
      buckets(
        [
          { key: 'diagonal', items: [signed(g.tally.diag)], tone: hot(g.tally.diag) },
          { key: 'anti-diagonal', items: [signed(g.tally.anti)], tone: hot(g.tally.anti) },
          { key: 'status', items: [g.status()], tone: g.winner ? 'hit' : undefined },
        ],
        { label: 'the two diagonal counters and the game', keyLabel: '' },
      ),
    ]
  }
  const diagram = (upTo = log.length): Panel => seq(ACTORS, log.slice(0, upTo), { label: 'calls in this move' })

  const patch = (o: object, to: string, methods: string[], reply: (m: string, r: unknown, a: unknown[]) => string | null): void => {
    const obj = o as Obj
    for (const m of methods) {
      const orig = obj[m].bind(o)
      obj[m] = (...a: unknown[]) => {
        log.push({ from: 'Game', to, label: `${m}(${a.map((x) => (x === null ? 'empty' : String(x))).join(', ')})` })
        const r = orig(...a)
        const txt = reply(m, r, a)
        if (txt !== null) log.push({ from: to, to: 'Game', label: txt, dashed: true, tone: r === true && m === 'add' ? 'hit' : undefined })
        return r
      }
    }
  }

  ops.forEach((op, i) => {
    const a = args[i]
    log.length = 0
    if (op === 'Game') {
      g = new Game(a[0] as number)
      patch(g.board, 'Board', ['has', 'at', 'set'], (m, r) => (m === 'set' ? null : m === 'at' ? String(r ?? 'empty') : String(r)))
      patch(g.tally, 'Tally', ['add', 'remove'], (m, r) => (m === 'add' ? (r ? 'line complete' : 'no line yet') : null))
      t.step(1, `An empty ${g.n} by ${g.n} board and one counter per row (${g.n}), column (${g.n}) and diagonal (2). All are 0. X moves first.`, [diagram(), ...views()])
      out.push(null)
    } else if (op === 'play') {
      const [r, c] = a as number[]
      const before = views()
      const who = g.turn
      log.push({ from: 'Caller', to: 'Game', label: `play(${r}, ${c})` })
      const res = g.play(r, c)
      const ok = res === 'ok' || res === 'win' || res === 'draw'
      log.push({ from: 'Game', to: 'Caller', label: res, dashed: true, tone: ok ? 'hit' : 'miss' })
      out.push(res)
      const tallyAt = log.findIndex((x) => x.to === 'Tally')
      if (!ok) {
        const why = res === 'over' ? 'The game is already over, so no move is accepted.' : res === 'out' ? `(${r}, ${c}) is not on the board.` : `(${r}, ${c}) already holds a mark.`
        t.step(2, `${why} Nothing changes and it is still ${who}'s turn.`, [diagram(), ...before])
        return
      }
      t.step(2, `${who} plays (${r}, ${c}). The game asks the board: on the board, and empty. Both checks pass before anything changes.`, [diagram(tallyAt), ...before])
      const move: Move = { r, c, mark: who }
      const k = g.tally
      const diagNote = [r === c ? 'the diagonal' : '', r + c === g.n - 1 ? 'the anti-diagonal' : ''].filter(Boolean)
      t.step(3, `The mark goes in and the tally changes ${2 + diagNote.length} counters: row ${r} is now ${signed(k.rows[r])}, column ${c} is ${signed(k.cols[c])}${diagNote.length ? `, and ${diagNote.join(' and ')} too` : ''}. No scan of the board.`, [diagram(), ...views(move)])
      if (res === 'win') t.step(4, `A counter reached ${g.n} (all ${who}), so that line is complete. ${who} wins, found by checking ${2 + diagNote.length} numbers.`, [diagram(), ...views(move)])
      else if (res === 'draw') t.step(5, 'The board is full and no counter reached its size. It is a draw, known from the move count alone.', [diagram(), ...views(move)])
      else t.step(5, `No counter has reached ${g.n} yet. The turn passes to ${g.turn}.`, [diagram(), ...views(move)])
    } else if (op === 'undo') {
      log.push({ from: 'Caller', to: 'Game', label: 'undo()' })
      const last = g.history[g.history.length - 1]
      const r = g.undo()
      log.push({ from: 'Game', to: 'Caller', label: String(r), dashed: true, tone: r ? 'hit' : 'miss' })
      out.push(r)
      t.step(6, r ? `The last move (${last.r}, ${last.c}) comes off the history. The cell empties, the counters go back by one and it is ${last.mark}'s turn again. Constant work, whatever the board size.` : 'There is no move to take back.', [diagram(), ...views()])
    } else if (op === 'status') {
      out.push(g.status())
    } else if (op === 'show') {
      out.push(g.board.cells.map((row) => row.map((m) => m ?? '.').join('')).join('/'))
    }
  })
  return out
}
