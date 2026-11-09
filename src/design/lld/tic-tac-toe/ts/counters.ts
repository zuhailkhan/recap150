export type Mark = 'X' | 'O'
export type Outcome = 'ok' | 'win' | 'draw' | 'out' | 'taken' | 'over'
export interface Move {
  r: number
  c: number
  mark: Mark
}

/** The cells. It knows what is where and nothing about the rules. */
export class Board {
  readonly cells: (Mark | null)[][]

  constructor(readonly n: number) {
    this.cells = Array.from({ length: n }, () => Array<Mark | null>(n).fill(null))
  }

  has(r: number, c: number): boolean {
    return Number.isInteger(r) && Number.isInteger(c) && r >= 0 && r < this.n && c >= 0 && c < this.n
  }

  at(r: number, c: number): Mark | null {
    return this.cells[r][c]
  }

  set(r: number, c: number, mark: Mark | null): void {
    this.cells[r][c] = mark
  }
}

/**
 * One counter per row, column and diagonal. X adds 1 and O subtracts 1, so a line is complete
 * when its counter reaches +n or -n. A move touches at most four counters, so this is O(1).
 */
export class Tally {
  readonly rows: number[]
  readonly cols: number[]
  diag = 0
  anti = 0

  constructor(private n: number) {
    this.rows = Array<number>(n).fill(0)
    this.cols = Array<number>(n).fill(0)
  }

  /** Record a mark. True if it completes a line. */
  add(r: number, c: number, mark: Mark): boolean {
    this.bump(r, c, mark === 'X' ? 1 : -1) // [3] touch only the counters this cell belongs to
    const n = this.n
    return [this.rows[r], this.cols[c], this.diag, this.anti].some((v) => Math.abs(v) === n) // [4] a line is complete when a counter reaches n
  }

  /** Take a mark back out, for undo. */
  remove(r: number, c: number, mark: Mark): void {
    this.bump(r, c, mark === 'X' ? -1 : 1)
  }

  private bump(r: number, c: number, d: number): void {
    this.rows[r] += d
    this.cols[c] += d
    if (r === c) this.diag += d
    if (r + c === this.n - 1) this.anti += d
  }
}

/** Turn order, move validation and the end of the game. X always starts. */
export class Game {
  readonly board: Board
  readonly tally: Tally
  readonly history: Move[] = []
  turn: Mark = 'X'
  winner: Mark | null = null

  constructor(readonly n: number) {
    this.board = new Board(n) // [1] an n by n board and its counters, both empty
    this.tally = new Tally(n)
  }

  play(r: number, c: number): Outcome {
    if (this.winner || this.history.length === this.n * this.n) return 'over' // [2] check before changing anything
    if (!this.board.has(r, c)) return 'out'
    if (this.board.at(r, c)) return 'taken'
    const mark = this.turn
    this.board.set(r, c, mark)
    this.history.push({ r, c, mark })
    if (this.tally.add(r, c, mark)) {
      this.winner = mark
      return 'win'
    }
    if (this.history.length === this.n * this.n) return 'draw' // [5] full board and no line: a draw
    this.turn = mark === 'X' ? 'O' : 'X'
    return 'ok'
  }

  /** Take back the last move. False if there is none. Works after a win too. */
  undo(): boolean {
    const m = this.history.pop() // [6] the history is a stack: the last move comes off first
    if (!m) return false
    this.board.set(m.r, m.c, null)
    this.tally.remove(m.r, m.c, m.mark)
    this.winner = null
    this.turn = m.mark
    return true
  }

  status(): string {
    if (this.winner) return `${this.winner} wins`
    return this.history.length === this.n * this.n ? 'draw' : `${this.turn} to move`
  }
}
