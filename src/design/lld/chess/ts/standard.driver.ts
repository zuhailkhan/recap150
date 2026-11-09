import type { Tracer } from '../../../../core/tracer'
import { noop } from '../../../../core/tracer'
import { arr, grid, seq, type Panel, type SeqMessage, type Tone } from '../../../../core/panels'
import { Board, Game, type Kind, type MoveRule, type Sq } from './standard'

// Replays operations against a real Game. Every piece's rule and the board's move and undo are wrapped
// in spies, so the sequence diagram shows calls that really happened. The spies log only the calls
// that matter for the move being played, and stay quiet while the game scans all legal moves.
// Game arg: piece placement in FEN, a space and the side to move, or "start".
const ACTORS = ['Caller', 'Game', 'MoveRule', 'Board']
const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w'
const KIND_NAME: Record<Kind, string> = { P: 'pawn', N: 'knight', B: 'bishop', R: 'rook', Q: 'queen', K: 'king' }
const RULE_NAME: Record<Kind, string> = { P: 'PawnRule', N: 'Jump', B: 'Slide', R: 'Slide', Q: 'Slide', K: 'Jump' }
const nm = (s: Sq): string => 'abcdefgh'[s.c] + (s.r + 1)
const at = (s: Sq | null): string => (s ? nm(s) : '?')
const sqOf = (text: string): Sq => ({ r: Number(text[1]) - 1, c: text.charCodeAt(0) - 97 })

/** A 9 x 9 grid: the board with file letters and rank numbers around it. Capitals are white pieces. */
function boardGrid(fen: string, marks: Record<string, Tone>, label: string): Panel {
  const cells: string[][] = []
  const tones: (Tone | null)[][] = []
  const rows = fen.split('/')
  rows.forEach((row, i) => {
    const line: string[] = [String(8 - i)]
    const tl: (Tone | null)[] = ['dim']
    for (const ch of row) {
      const n = ch >= '1' && ch <= '8' ? Number(ch) : 0
      for (let k = 0; k < Math.max(n, 1); k++) {
        const key = 'abcdefgh'[line.length - 1] + (8 - i)
        line.push(n ? '' : ch)
        tl.push(marks[key] ?? null)
      }
    }
    cells.push(line)
    tones.push(tl)
  })
  cells.push(['', ...'abcdefgh'])
  tones.push(Array<Tone | null>(9).fill('dim'))
  return grid(cells, { label, tones })
}

export function run(ops: string[], args: unknown[][], t: Tracer = noop): unknown[] {
  const log: SeqMessage[] = []
  let game!: Game
  let board!: Board
  let quiet = true
  let attempt: { from: string; to: string } | null = null
  let moveCalls = 0
  let undoCalls = 0
  let reachAt = 0
  let undoAt = 0
  let reachLogged = false
  let trialFen = ''
  let attacker: Sq | null = null
  let attacked: Sq | null = null
  let checker: Sq | null = null
  let checked: Sq | null = null
  const out: unknown[] = []

  const diagram = (upTo = log.length): Panel => seq(ACTORS, log.slice(0, upTo), { label: 'calls in this move' })
  const real = (marks: Record<string, Tone> = {}, label = 'board (capitals are white, lowercase are black)'): Panel => boardGrid(board.toFen(), marks, label)
  const who = (c: string): string => (c === 'w' ? 'White' : 'Black')

  const patch = (): void => {
    for (const color of ['w', 'b'] as const) {
      for (const [, p] of board.pieces(color)) {
        const inner = p.rule
        ;(p as unknown as { rule: MoveRule }).rule = {
          reaches(b, from, to) {
            const ok = inner.reaches(b, from, to)
            if (quiet || !attempt) return ok
            if (moveCalls === 0 && !reachLogged && nm(from) === attempt.from && nm(to) === attempt.to) {
              reachLogged = true
              log.push({ from: 'Game', to: 'MoveRule', label: `reaches(${nm(from)}, ${nm(to)})` })
              log.push({ from: 'MoveRule', to: 'Game', label: `${RULE_NAME[p.kind]}: ${ok ? 'yes' : 'no'}`, dashed: true, tone: ok ? 'hit' : 'miss' })
              reachAt = log.length
            } else if (ok && p.color !== game.turn && moveCalls === 1 && undoCalls === 0 && !attacker) {
              attacker = from
              attacked = to
              log.push({ from: 'Game', to: 'MoveRule', label: `${KIND_NAME[p.kind]} ${nm(from)} reaches ${nm(to)}?` })
              log.push({ from: 'MoveRule', to: 'Game', label: 'yes: king attacked', dashed: true, tone: 'miss' })
            } else if (ok && p.color !== game.turn && moveCalls === 2 && undoCalls === 1 && !checker) {
              checker = from
              checked = to
              log.push({ from: 'Game', to: 'MoveRule', label: `${KIND_NAME[p.kind]} ${nm(from)} reaches ${nm(to)}?` })
              log.push({ from: 'MoveRule', to: 'Game', label: 'yes: check', dashed: true, tone: 'focus' })
            }
            return ok
          },
        }
      }
    }
    const origMove = board.move.bind(board)
    const origUndo = board.undo.bind(board)
    board.move = (from, to) => {
      moveCalls++
      const r = origMove(from, to)
      if (!quiet && attempt) {
        if (moveCalls === 1) {
          trialFen = board.toFen()
          log.push({ from: 'Game', to: 'Board', label: `move ${nm(from)}-${nm(to)} (a try)` })
        } else if (moveCalls === 2) log.push({ from: 'Game', to: 'Board', label: `move ${nm(from)}-${nm(to)} (for real)` })
      }
      return r
    }
    board.undo = (from, to, taken) => {
      undoCalls++
      origUndo(from, to, taken)
      if (!quiet && attempt && undoCalls === 1) {
        log.push({ from: 'Game', to: 'Board', label: 'undo the try' })
        undoAt = log.length
      }
    }
  }

  ops.forEach((op, i) => {
    const a = args[i]
    log.length = 0
    if (op === 'Game') {
      const text = (a[0] as string) === 'start' ? START : (a[0] as string)
      const [placement, side = 'w'] = text.split(' ')
      board = Board.fromFen(placement)
      game = new Game(board, side as 'w' | 'b')
      patch()
      const count = (c: 'w' | 'b'): number => board.pieces(c).length
      t.step(1, `A game with ${count('w')} white and ${count('b')} black pieces, ${who(side)} to move. Every piece carries its own movement rule, so the game never asks what kind a piece is.`, [
        real(),
        arr(['pawn: PawnRule', 'knight: Jump', 'bishop: Slide', 'rook: Slide', 'queen: Slide', 'king: Jump'], { label: 'which rule object each kind holds' }),
      ])
      out.push(null)
    } else if (op === 'move') {
      const text = a[0] as string
      const m = /^([a-h][1-8])([a-h][1-8])$/.exec(text)
      attempt = m ? { from: m[1], to: m[2] } : { from: '', to: '' }
      moveCalls = undoCalls = reachAt = undoAt = 0
      reachLogged = false
      attacker = attacked = checker = checked = null
      quiet = false
      const piece = m ? board.at(sqOf(m[1])) : null
      const mover = game.turn
      log.push({ from: 'Caller', to: 'Game', label: `move("${text}")` })
      const result = game.move(text)
      quiet = true
      const ok = !result.startsWith('rejected')
      log.push({ from: 'Game', to: 'Caller', label: result, dashed: true, tone: ok ? (result === 'ok' ? 'hit' : 'focus') : 'miss' })
      const from = m?.[1] ?? ''
      const to = m?.[2] ?? ''
      const what = piece ? `${who(piece.color)} ${KIND_NAME[piece.kind]} on ${from}` : from
      const lastFen = board.toFen()
      // Stage 2: is it a real piece, and does it belong to the side to move?
      if (['rejected: game over', 'rejected: bad input', 'rejected: no piece', 'rejected: not your turn'].includes(result)) {
        const why: Record<string, string> = {
          'rejected: game over': 'The game is already over, so no move is accepted.',
          'rejected: bad input': `"${text}" is not a move like e2e4: file a to h, rank 1 to 8, twice.`,
          'rejected: no piece': `There is no piece on ${from}.`,
          'rejected: not your turn': `${what} is not the side to move. It is ${who(mover)}'s turn.`,
        }
        t.step(2, `${why[result]} The game says no before any piece or the board is asked.`, [diagram(), real(from ? { [from]: 'miss' } : {})])
        out.push(result)
        return
      }
      t.step(2, `${what} belongs to ${who(mover)}, the side to move. So far so good.`, [diagram(1), real({ [from]: 'keep' })])
      // Stage 3: the piece's own rule.
      const ruleOk = result !== 'rejected: illegal move'
      t.step(3, ruleOk ? `The game asks the piece's rule ${RULE_NAME[piece!.kind]}: can a ${KIND_NAME[piece!.kind]} go ${from} to ${to}? Yes: the shape fits, the path is clear and ${to} is empty or an enemy.` : `The ${RULE_NAME[piece!.kind]} rule says no. Either a ${KIND_NAME[piece!.kind]} cannot move that way, something is in the path, or ${to} holds a piece of the same colour.`, [diagram(reachAt || log.length), real({ [from]: 'keep', [to]: ruleOk ? 'focus' : 'miss' })])
      if (!ruleOk) {
        out.push(result)
        return
      }
      // Stage 4: would the mover's own king be attacked afterwards?
      const exposed = result === 'rejected: king in check'
      const marks: Record<string, Tone> = { [from]: 'dim', [to]: 'focus' }
      if (attacker && attacked) {
        marks[nm(attacker)] = 'miss'
        marks[nm(attacked)] = 'miss'
      }
      t.step(4, exposed ? `The game plays the move on the board as a try and looks for an attacker of ${who(mover)}'s king. The piece on ${at(attacker)} can reach it, so the move is undone and rejected.` : `The game plays the move as a try, finds no enemy piece that can reach ${who(mover)}'s king, and undoes the try.`, [diagram(undoAt), boardGrid(trialFen, marks, 'the trial board, before the move is undone')])
      if (exposed) {
        out.push(result)
        return
      }
      // Stage 5: play it for real, then look at the other side.
      const marks5: Record<string, Tone> = { [from]: 'keep', [to]: 'hit' }
      if (checked) marks5[nm(checked)] = 'miss'
      const tail: Record<string, string> = {
        ok: `The move is played and the turn passes to ${who(game.turn)}. ${who(game.turn)} is not in check and has legal moves.`,
        check: `The move is played. ${who(game.turn)}'s king is attacked from ${at(checker)}, so it is check. ${who(game.turn)} still has a legal reply.`,
        checkmate: `The move is played and ${who(game.turn)}'s king is attacked from ${at(checker)}. The game scans every ${who(game.turn)} move and none gets out of check: checkmate.`,
        stalemate: `The move is played. ${who(game.turn)} is not in check, but the scan of every ${who(game.turn)} move finds none that is legal: stalemate, a draw.`,
      }
      t.step(5, tail[result], [diagram(), boardGrid(lastFen, marks5, 'board after the move')])
      out.push(result)
    } else if (op === 'board') {
      out.push(board.toFen())
    } else if (op === 'turn') {
      out.push(game.turn)
    } else if (op === 'count') {
      const n = game.legal(game.turn).length
      t.step(4, `${who(game.turn)} has ${n} legal move${n === 1 ? '' : 's'}. Each one passed the piece's rule and the king-safety test.`, [real()])
      out.push(n)
    } else if (op === 'moves') {
      const sq = a[0] as string
      const list = game.legal(game.turn, sq)
      const marks: Record<string, Tone> = { [sq]: 'keep' }
      for (const mv of list) marks[mv.slice(2)] = 'hit'
      t.step(3, list.length ? `${sq} has ${list.length} legal move${list.length === 1 ? '' : 's'}: ${list.map((s) => s.slice(2)).join(', ')}.` : `The piece on ${sq} has no legal move.`, [real(marks, `legal moves from ${sq} (green)`)])
      out.push(list)
    }
  })
  return out
}
