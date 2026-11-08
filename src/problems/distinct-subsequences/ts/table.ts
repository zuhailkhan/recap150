import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { dp as table, mark2 } from '../../../core/panels'
import { shown, labels, title } from './viz'

export function numDistinct(s: string, target: string, t: Tracer = noop): number {
  const m = s.length
  const n = target.length
  // dp[i][j] = ways to pick letters from the first i letters of s that spell the first j letters of target
  const dp = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0))
  for (let i = 0; i <= m; i++) dp[i][0] = 1 // [1] the empty target has exactly one way: pick nothing. Row 0 stays 0 for j > 0
  t.step(1, `Add a row and a column for the empty prefix. Spelling "" has 1 way (pick nothing), so column 0 is all 1. Spelling a real letter from "" has 0 ways, so row 0 is 0.`, [table(shown(dp, 0, -1), { label: title(s, target), rowLabels: labels(s), colLabels: labels(target), tones: mark2(m + 1, n + 1, [[0, 0, 'keep']]) })])

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = dp[i - 1][j] // [2] always allowed: skip s[i-1], keep the ways found without it
      if (s[i - 1] === target[j - 1]) {
        dp[i][j] += dp[i - 1][j - 1] // [3] letters match: also allowed to use s[i-1] for target[j-1]
        t.step(3, `"${s[i - 1]}" equals "${target[j - 1]}". dp[${i}][${j}] = skip ${dp[i - 1][j]} + use ${dp[i - 1][j - 1]} = ${dp[i][j]}.`, [table(shown(dp, i, j), { label: title(s, target), rowLabels: labels(s), colLabels: labels(target), tones: mark2(m + 1, n + 1, [[i - 1, j, 'keep'], [i - 1, j - 1, 'keep'], [i, j, 'focus']]) })])
      } else {
        t.step(2, `"${s[i - 1]}" differs from "${target[j - 1]}", so it cannot be used. dp[${i}][${j}] = skip only = dp[${i - 1}][${j}] = ${dp[i][j]}.`, [table(shown(dp, i, j), { label: title(s, target), rowLabels: labels(s), colLabels: labels(target), tones: mark2(m + 1, n + 1, [[i - 1, j, 'keep'], [i, j, 'focus']]) })])
      }
    }
  }
  t.step(4, `The table is full. The corner dp[${m}][${n}] = ${dp[m][n]} ways to spell "${target}" from "${s}".`, [table(dp, { label: title(s, target), rowLabels: labels(s), colLabels: labels(target), tones: mark2(m + 1, n + 1, [[m, n, 'hit']]) })])
  return dp[m][n] // [4] all of s, all of target
}
