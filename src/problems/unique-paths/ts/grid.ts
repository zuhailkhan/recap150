import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { edge, view } from './viz'

export function uniquePaths(m: number, n: number, t: Tracer = noop): number {
  const dp = Array.from({ length: m }, () => Array<number>(n).fill(1)) // [1] first row and first column: one way each (go straight)
  t.step(1, `A ${m} by ${n} table. Every square in the first row and first column has exactly 1 way: only straight moves reach it. The inside is still blank.`, [view(dp, 0, 0, edge(m, n))])
  for (let i = 1; i < m; i++) {
    for (let j = 1; j < n; j++) {
      dp[i][j] = dp[i - 1][j] + dp[i][j - 1] // [2] you arrive from above or from the left: add both
      t.step(2, `dp[${i}][${j}] = above (${dp[i - 1][j]}) + left (${dp[i][j - 1]}) = ${dp[i][j]}. Every path to this square came through one of those two.`, [view(dp, i, j, [[i - 1, j, 'keep'], [i, j - 1, 'keep'], [i, j, 'focus']])])
    }
  }
  t.step(3, `Table full. The bottom-right square holds the answer: ${dp[m - 1][n - 1]} paths.`, [view(dp, m - 1, n - 1, [[m - 1, n - 1, 'hit']])])
  return dp[m - 1][n - 1] // [3] the bottom-right square is the answer
}
