import type { Tracer } from '../../../../core/tracer'
import { noop } from '../../../../core/tracer'
import { arr, grid, seq, type Panel, type SeqMessage, type Tone } from '../../../../core/panels'
import { Board, Game, Player, ScriptedDice, type Dice } from './standard'

// Replays operations against a real Game. The dice and the board are wrapped in spies, so the
// sequence diagram shows calls that really happened. Game args: size, [head, tail] pairs, players, rolls.
const ACTORS = ['Caller', 'Game', 'Dice', 'Board']
const LETTERS = 'ABCDEF'

export function run(ops: string[], args: unknown[][], t: Tracer = noop): unknown[] {
  const log: SeqMessage[] = []
  let game!: Game
  let jumps = new Map<number, number>()
  let lastRoll = 0
  const out: unknown[] = []

  const diagram = (upTo = log.length): Panel => seq(ACTORS, log.slice(0, upTo), { label: 'calls in this turn' })
  const name = (p: Player): string => LETTERS[game.players.indexOf(p)]

  // Squares are numbered from the bottom row, left to right, then right to left on the next row up.
  const boardPanel = (): Panel => {
    const size = game.board.size
    const cols = Math.ceil(Math.sqrt(size))
    const rows = Math.ceil(size / cols)
    const cells: string[][] = []
    const tones: (Tone | null)[][] = []
    for (let r = 0; r < rows; r++) {
      const line: string[] = []
      const tl: (Tone | null)[] = []
      for (let c = 0; c < cols; c++) {
        const n = r * cols + (r % 2 === 0 ? c : cols - 1 - c) + 1
        if (n > size) { line.push(''); tl.push(null); continue }
        const tail = n === size ? undefined : jumps.get(n)
        const here = game.players.filter((p) => p.pos === n).map(name).join('')
        line.push(`${n}${tail === undefined ? '' : tail > n ? `↑${tail}` : `↓${tail}`}${here ? ' ' + here : ''}`)
        tl.push(here ? 'focus' : tail === undefined ? null : tail > n ? 'hit' : 'miss')
      }
      cells.unshift(line)
      tones.unshift(tl)
    }
    return grid(cells, { label: 'board: ↑ ladder to, ↓ snake to, letters are players', tones })
  }
  const playersPanel = (hot?: Player): Panel =>
    arr(game.players.map((p) => `${name(p)} on ${p.pos === 0 ? 'start' : p.pos}`), { label: 'players (blue = whose turn)', tones: game.players.map((p) => (p === hot ? ('focus' as const) : null)) })

  const diceSpy = (inner: Dice): Dice => ({
    roll() {
      log.push({ from: 'Game', to: 'Dice', label: 'roll()' })
      lastRoll = inner.roll()
      log.push({ from: 'Dice', to: 'Game', label: `${lastRoll}`, dashed: true, tone: 'focus' })
      return lastRoll
    },
  })
  class SpyBoard extends Board {
    settle(square: number): number {
      log.push({ from: 'Game', to: 'Board', label: `settle(${square})` })
      const to = super.settle(square)
      log.push({ from: 'Board', to: 'Game', label: to === square ? 'no jump' : `jump to ${to}`, dashed: true, tone: to === square ? undefined : to > square ? 'hit' : 'miss' })
      return to
    }
  }

  ops.forEach((op, i) => {
    const a = args[i]
    log.length = 0
    if (op === 'Game') {
      const [size, pairs, count, rolls] = a as [number, [number, number][], number, number[]]
      jumps = new Map(pairs)
      const players = Array.from({ length: count }, (_, k) => new Player(LETTERS[k]))
      game = new Game(new SpyBoard(size, jumps), players, diceSpy(new ScriptedDice(rolls)))
      t.step(1, `A game on ${size} squares with ${jumps.size} snakes and ladders in all and ${count} player${count === 1 ? '' : 's'}. It is handed a dice with ${rolls.length} scripted rolls and rolls none itself.`, [boardPanel(), playersPanel(players[0])])
      out.push(null)
    } else if (op === 'play') {
      const turn = game['turn']
      const mover = game.players[turn]
      const from = mover.pos
      log.push({ from: 'Caller', to: 'Game', label: 'play()' })
      const pos = game.play()
      if (pos === null) {
        log.push({ from: 'Game', to: 'Caller', label: 'game over', dashed: true, tone: 'miss' })
        t.step(4, `${name(game.winner!)} already won, so the game refuses the turn and does not touch the dice.`, [diagram(), boardPanel()])
        out.push(-1)
        return
      }
      log.push({ from: 'Game', to: 'Caller', label: `${name(mover)} on ${pos}`, dashed: true, tone: 'hit' })
      const target = from + lastRoll
      const size = game.board.size
      const settled = log.some((m) => m.label.startsWith('settle'))
      const before = (): Panel => {
        mover.pos = from
        const p = boardPanel()
        mover.pos = pos
        return p
      }
      t.step(2, `${name(mover)} asks the dice and gets ${lastRoll}. ${from === 0 ? 'Start' : from} + ${lastRoll} = ${target}.`, [diagram(3), before()])
      if (!settled) {
        t.step(3, `${target} is past square ${size}, and a win needs an exact landing. ${name(mover)} stays on ${from === 0 ? 'start' : from}, and the turn passes on.`, [diagram(), boardPanel(), playersPanel(game.players[game['turn']])])
      } else {
        const tail = log.find((m) => m.from === 'Board')!.label
        t.step(3, tail === 'no jump' ? `The board has no snake or ladder on ${target}. ${name(mover)} stands on ${pos}.` : `The board finds a ${pos > target ? 'ladder' : 'snake'} on ${target} and sends ${name(mover)} to ${pos}. That is the only jump, even if ${pos} has one too.`, [diagram(), boardPanel(), playersPanel(game.players[game['turn']])])
      }
      if (game.winner) t.step(4, `${name(mover)} stands on the last square, ${size}. The game records the winner and takes no more turns.`, [diagram(), boardPanel()])
      out.push(pos)
    } else if (op === 'positions') {
      out.push(game.players.map((p) => p.pos))
    } else if (op === 'winner') {
      out.push(game.winner ? game.players.indexOf(game.winner) : -1)
    }
  })
  return out
}
