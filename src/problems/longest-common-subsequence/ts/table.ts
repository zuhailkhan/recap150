import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { edge, view } from './viz'

export function longestCommonSubsequence(text1: string, text2: string, t: Tracer = noop): number {
  const m = text1.length
  const n = text2.length
  const dp = Array.from({ length: m + 1 }, () => Array<number>(n + 1).fill(0)) // [1] one extra row and column of 0s: an empty prefix shares nothing
  t.step(1, `The table has ${m + 1} rows and ${n + 1} columns. Row 0 and column 0 are the empty prefix, so they are 0. Fill the rest row by row, left to right.`, [view(dp, text1, text2, 0, 0, edge(m, n))])
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (text1[i - 1] === text2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1 // [2] same letter: pair them up, add 1 to the best of both shorter prefixes
        t.step(2, `"${text1[i - 1]}" and "${text2[j - 1]}" are the same letter. dp[${i}][${j}] = diagonal ${dp[i - 1][j - 1]} + 1 = ${dp[i][j]}.`, [view(dp, text1, text2, i, j, [[i - 1, j - 1, 'keep'], [i, j, 'focus']])])
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]) // [3] different letters: drop one of them and keep the better result
        t.step(3, `"${text1[i - 1]}" and "${text2[j - 1]}" differ. dp[${i}][${j}] = max(above ${dp[i - 1][j]}, left ${dp[i][j - 1]}) = ${dp[i][j]}.`, [view(dp, text1, text2, i, j, [[i - 1, j, 'keep'], [i, j - 1, 'keep'], [i, j, 'focus']])])
      }
    }
  }
  t.step(4, `Table full. The bottom-right cell covers both whole strings: the longest common subsequence has length ${dp[m][n]}.`, [view(dp, text1, text2, m, n, [[m, n, 'hit']])])
  return dp[m][n] // [4] the bottom-right cell covers both whole strings
}
