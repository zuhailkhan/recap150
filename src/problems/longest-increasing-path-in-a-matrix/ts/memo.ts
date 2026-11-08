import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { grid, mark2 } from '../../../core/panels'
import { uphill, memoView, tones, bestCells } from './viz'

export function longestIncreasingPath(matrix: number[][], t: Tracer = noop): number {
  const rows = matrix.length
  const cols = rows > 0 ? matrix[0].length : 0
  // memo[r][c] = longest increasing path that starts at (r, c). 0 means "not computed yet": a real answer is at least 1
  const memo = Array.from({ length: rows }, () => new Array<number>(cols).fill(0)) // [1] one table cell per grid cell
  t.step(1, 'The memo is a table the same size as the grid. Each cell will hold the longest increasing path that starts there. 0 means not computed yet.', [grid(matrix, { label: 'matrix' }), grid(memoView(memo), { label: 'memo: longest path starting here' })])

  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]]
  const dfs = (r: number, c: number): number => {
    if (memo[r][c] !== 0) { // [2] already solved: reuse the stored answer
      t.step(2, `(${r},${c}) = ${matrix[r][c]} was solved before. Reuse memo = ${memo[r][c]} without walking again.`, [grid(matrix, { label: 'matrix', tones: mark2(rows, cols, [[r, c, 'keep']]) }), grid(memoView(memo), { label: 'memo: longest path starting here', tones: mark2(rows, cols, [[r, c, 'keep']]) })])
      return memo[r][c]
    }
    t.step(3, `New cell (${r},${c}) = ${matrix[r][c]}. ${uphill(matrix, r, c).length ? `Bigger neighbours: ${uphill(matrix, r, c).map(([a, b]) => `(${a},${b}) = ${matrix[a][b]}`).join(', ')}. Ask each one how long a path it starts.` : 'No neighbour is bigger, so the path stops here.'}`, [grid(matrix, { label: 'matrix', tones: tones(rows, cols, uphill(matrix, r, c), 'keep', [r, c]) }), grid(memoView(memo), { label: 'memo: longest path starting here', tones: mark2(rows, cols, [[r, c, 'focus']]) })])
    let best = 1 // a path of just this cell
    for (const [dr, dc] of dirs) {
      const nr = r + dr
      const nc = c + dc
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols || matrix[nr][nc] <= matrix[r][c]) continue // off the grid, or not strictly bigger
      best = Math.max(best, 1 + dfs(nr, nc)) // [3] step uphill: this cell plus the neighbour's best path
    }
    memo[r][c] = best // [4] the recursion has returned: store the answer
    t.step(4, `Back at (${r},${c}) = ${matrix[r][c]}: 1 + best bigger neighbour (${best - 1}) = ${best}. Store memo[${r}][${c}] = ${best}.`, [grid(matrix, { label: 'matrix', tones: tones(rows, cols, uphill(matrix, r, c), 'keep', [r, c]) }), grid(memoView(memo), { label: 'memo: longest path starting here', tones: tones(rows, cols, uphill(matrix, r, c), 'keep', [r, c]) })])
    return best
  }

  let longest = 0
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      longest = Math.max(longest, dfs(r, c)) // [5] try every start, the memo makes repeats free
    }
  }
  t.step(5, `Every cell is a possible start and every memo entry is filled. The largest value is ${longest}.`, [grid(matrix, { label: 'matrix' }), grid(memoView(memo), { label: `memo: the answer is ${longest}`, tones: mark2(rows, cols, bestCells(memo, longest).map(([a, b]): [number, number, 'hit'] => [a, b, 'hit'])) })])
  return longest // [5] 0 for an empty matrix
}
