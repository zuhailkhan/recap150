export type Color = 'w' | 'b'
export type Kind = 'P' | 'N' | 'B' | 'R' | 'Q' | 'K'

/** r is the rank (0 = rank 1, 7 = rank 8) and c the file (0 = a, 7 = h). */
export interface Sq {
  r: number
  c: number
}
type Dirs = [number, number][]

/** How one kind of piece moves. It answers geometry, a clear path, and "not onto your own piece". It knows nothing about check. */
export interface MoveRule {
  reaches(b: Board, from: Sq, to: Sq): boolean
}

/** Bishop, rook and queen: go along a direction until something is in the way. */
export class Slide implements MoveRule {
  constructor(private dirs: Dirs) {}

  reaches(b: Board, from: Sq, to: Sq): boolean {
    const me = b.at(from)!
    for (const [dr, dc] of this.dirs) {
      for (let s = { r: from.r + dr, c: from.c + dc }; b.inside(s); s = { r: s.r + dr, c: s.c + dc }) {
        const other = b.at(s)
        if (s.r === to.r && s.c === to.c) return !other || other.color !== me.color
        if (other) break // something blocks the path
      }
    }
    return false
  }
}

/** Knight and king: land on one of a fixed set of offsets. Nothing is in between, so nothing can block. */
export class Jump implements MoveRule {
  constructor(private offsets: Dirs) {}

  reaches(b: Board, from: Sq, to: Sq): boolean {
    const other = b.at(to)
    const me = b.at(from)!
    return this.offsets.some(([dr, dc]) => from.r + dr === to.r && from.c + dc === to.c) && (!other || other.color !== me.color)
  }
}

/** Forward one (or two from home) onto an empty square. Diagonal one only to capture. */
export class PawnRule implements MoveRule {
  reaches(b: Board, from: Sq, to: Sq): boolean {
    const me = b.at(from)!
    const dir = me.color === 'w' ? 1 : -1
    const home = me.color === 'w' ? 1 : 6
    const dr = to.r - from.r
    const dc = Math.abs(to.c - from.c)
    const other = b.at(to)
    if (dc === 0 && !other) return dr === dir || (dr === 2 * dir && from.r === home && !b.at({ r: from.r + dir, c: from.c }))
    return dc === 1 && dr === dir && !!other && other.color !== me.color
  }
}

const ORTHO: Dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]]
const DIAG: Dirs = [[1, 1], [1, -1], [-1, 1], [-1, -1]]
/** The rules hold no state, so every piece of a kind shares one. */
const RULES: Record<Kind, MoveRule> = {
  P: new PawnRule(),
  N: new Jump([[2, 1], [2, -1], [-2, 1], [-2, -1], [1, 2], [1, -2], [-1, 2], [-1, -2]]),
  B: new Slide(DIAG),
  R: new Slide(ORTHO),
  Q: new Slide([...ORTHO, ...DIAG]),
  K: new Jump([...ORTHO, ...DIAG]),
}

export class Piece {
  readonly rule: MoveRule // each piece carries its own movement rule

  constructor(
    readonly color: Color,
    readonly kind: Kind,
  ) {
    this.rule = RULES[kind]
  }

  get letter(): string {
    return this.color === 'w' ? this.kind : this.kind.toLowerCase()
  }
}

export class Board {
  private cells: (Piece | null)[][] = Array.from({ length: 8 }, () => Array<Piece | null>(8).fill(null))

  /** Reads the piece-placement part of FEN: rank 8 first, capitals are white, digits are empty squares. */
  static fromFen(fen: string): Board {
    const b = new Board()
    fen.split('/').forEach((row, i) => {
      let c = 0
      for (const ch of row) {
        if (ch >= '1' && ch <= '8') c += Number(ch)
        else b.cells[7 - i][c++] = new Piece(ch === ch.toUpperCase() ? 'w' : 'b', ch.toUpperCase() as Kind)
      }
    })
    return b
  }

  toFen(): string {
    return [7, 6, 5, 4, 3, 2, 1, 0]
      .map((r) => this.cells[r].map((p) => p?.letter ?? '1').join('').replace(/1+/g, (run) => String(run.length)))
      .join('/')
  }

  inside(s: Sq): boolean {
    return s.r >= 0 && s.r < 8 && s.c >= 0 && s.c < 8
  }

  at(s: Sq): Piece | null {
    return this.inside(s) ? this.cells[s.r][s.c] : null
  }

  /** Moves without any checking and returns what was captured, so the move can be undone. */
  move(from: Sq, to: Sq): Piece | null {
    const taken = this.cells[to.r][to.c]
    this.cells[to.r][to.c] = this.cells[from.r][from.c]
    this.cells[from.r][from.c] = null
    return taken
  }

  undo(from: Sq, to: Sq, taken: Piece | null): void {
    this.cells[from.r][from.c] = this.cells[to.r][to.c]
    this.cells[to.r][to.c] = taken
  }

  /** One side's pieces in a fixed order: rank 1 up, file a to h. */
  pieces(color: Color): [Sq, Piece][] {
    const out: [Sq, Piece][] = []
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if (this.cells[r][c]?.color === color) out.push([{ r, c }, this.cells[r][c]!])
    return out
  }
}

const name = (s: Sq): string => 'abcdefgh'[s.c] + (s.r + 1)

export class Game {
  over = false

  constructor(
    readonly board: Board, // [1] the game owns the board and whose turn it is
    public turn: Color = 'w',
  ) {}

  /** Returns "ok", "check", "checkmate" or "stalemate" for a move that was played, or "rejected: why". */
  move(text: string): string {
    if (this.over) return 'rejected: game over'
    const m = /^([a-h])([1-8])([a-h])([1-8])$/.exec(text)
    if (!m) return 'rejected: bad input'
    const from = { r: Number(m[2]) - 1, c: m[1].charCodeAt(0) - 97 }
    const to = { r: Number(m[4]) - 1, c: m[3].charCodeAt(0) - 97 }
    const piece = this.board.at(from)
    if (!piece) return 'rejected: no piece'
    if (piece.color !== this.turn) return 'rejected: not your turn' // [2] it must be a piece of the side to move
    if (!piece.rule.reaches(this.board, from, to)) return 'rejected: illegal move' // [3] ask the piece's own rule: shape, clear path, not onto your own
    if (this.exposesKing(from, to)) return 'rejected: king in check' // [4] try the move, look for an attacker on your king, undo
    this.board.move(from, to) // [5] play it, pass the turn, and see whether the other side is in check or has no move
    this.turn = this.turn === 'w' ? 'b' : 'w'
    const check = this.inCheck(this.turn)
    if (this.legal(this.turn).length === 0) {
      this.over = true
      return check ? 'checkmate' : 'stalemate'
    }
    return check ? 'check' : 'ok'
  }

  /** Every fully legal move for a side as "e2e4" text, sorted. Pass a square to see only that piece. */
  legal(color: Color, only?: string): string[] {
    const out: string[] = []
    for (const [from, p] of this.board.pieces(color)) {
      if (only && name(from) !== only) continue
      for (let r = 0; r < 8; r++)
        for (let c = 0; c < 8; c++) if (p.rule.reaches(this.board, from, { r, c }) && !this.exposesKing(from, { r, c })) out.push(name(from) + name({ r, c }))
    }
    return out.sort()
  }

  inCheck(color: Color): boolean {
    const king = this.board.pieces(color).find(([, p]) => p.kind === 'K')?.[0]
    const foe: Color = color === 'w' ? 'b' : 'w'
    return !!king && this.board.pieces(foe).some(([sq, p]) => p.rule.reaches(this.board, sq, king))
  }

  private exposesKing(from: Sq, to: Sq): boolean {
    const mine = this.board.at(from)!.color
    const taken = this.board.move(from, to)
    const bad = this.inCheck(mine)
    this.board.undo(from, to, taken)
    return bad
  }
}
