import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { grid } from '../../../core/panels'

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]]

export function solve(board: string[][], t: Tracer = noop): string[][] {
  const rows = board.length
  const cols = rows > 0 ? board[0].length : 0
  const safe = Array.from({ length: rows }, () => new Array<boolean>(cols).fill(false)) // safe[r][c]: this O is connected to the border

  let frontier: number[][] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const onBorder = r === 0 || r === rows - 1 || c === 0 || c === cols - 1
      if (onBorder && board[r][c] === 'O') { // [1] an O on the border can never be surrounded
        safe[r][c] = true
        frontier.push([r, c])
      }
    }
  }
  t.step(1, `${frontier.length} O${frontier.length === 1 ? '' : "'s"} on the border. They cannot be surrounded, so they are safe. Spread from them.`, [grid(board, { label: 'board', tones: board.map((row, i) => row.map((_, j) => (safe[i][j] ? 'focus' : null))) })])

  while (frontier.length > 0) {
    const next: number[][] = []
    for (const [r, c] of frontier) {
      for (const [dr, dc] of DIRS) {
        const nr = r + dr
        const nc = c + dc
        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue // off the board
        if (board[nr][nc] === 'O' && !safe[nr][nc]) { // [2] an O touching a safe O is safe too
          safe[nr][nc] = true
          next.push([nr, nc])
        }
      }
    }
    frontier = next
    t.step(2, next.length > 0 ? `${next.length} more O${next.length === 1 ? '' : "'s"} touch a safe O, so they are safe too.` : 'No new O touches a safe one. The spreading stops.', [grid(board, { label: 'board', tones: board.map((row, i) => row.map((_, j) => (safe[i][j] ? (next.some(([a, b]) => a === i && b === j) ? 'focus' : 'keep') : null))) })])
  }

  // [3] every O that is not safe is surrounded: flip it to X
  const result = board.map((row, r) => row.map((v, c) => (v === 'O' && !safe[r][c] ? 'X' : v)))
  t.step(3, 'Every O that was never marked safe is surrounded. Flip those to X.', [grid(result, { label: 'result', tones: board.map((row, i) => row.map((v, j) => (v === 'O' && !safe[i][j] ? 'hit' : safe[i][j] ? 'keep' : null))) })])
  return result
}
