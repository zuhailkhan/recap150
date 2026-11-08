import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { arr } from '../../../core/panels'
import { reads, view, why } from './viz'

export function isInterleave(s1: string, s2: string, s3: string, t: Tracer = noop): boolean {
  const m = s1.length
  const n = s2.length
  if (m + n !== s3.length) {
    t.step(1, `s1 has ${m} letters and s2 has ${n}, but s3 has ${s3.length}. Every letter must be used exactly once, so ${m} + ${n} must equal ${s3.length}. It does not.`, [arr([...s1], { label: 's1' }), arr([...s2], { label: 's2' }), arr([...s3], { label: 's3', tones: [...s3].map(() => 'miss' as const) })])
    return false // [1] lengths must add up, or no weave can use every letter once
  }
  const dp = Array.from({ length: m + 1 }, () => Array<boolean>(n + 1).fill(false)) // [1] (m+1) x (n+1): rows = letters taken from s1, columns = letters taken from s2
  t.step(1, `Lengths agree: ${m} + ${n} = ${s3.length}. Table with ${m + 1} rows and ${n + 1} columns. Cell (i, j) uses i letters of s1 and j of s2, so it must build the first i + j letters of s3.`, view(dp, s1, s2, s3, 0, 0, [], true))
  for (let i = 0; i <= m; i++) {
    for (let j = 0; j <= n; j++) {
      if (i === 0 && j === 0) {
        dp[0][0] = true // [2] no letters from either string build the empty prefix of s3
        t.step(2, 'dp[0][0] = true. No letters from either string build the empty start of s3.', view(dp, s1, s2, s3, 0, 0, [[0, 0, 'focus']]))
        continue
      }
      const c = s3[i + j - 1] // [3] the newest letter of s3 must come from s1 or from s2
      const viaS1 = i > 0 && dp[i - 1][j] && s1[i - 1] === c // [3] from s1: the cell above works, and s1's next letter matches
      const viaS2 = j > 0 && dp[i][j - 1] && s2[j - 1] === c // [4] from s2: the cell to the left works, and s2's next letter matches
      dp[i][j] = viaS1 || viaS2 // [4] either route is enough
      t.step(viaS1 || j === 0 ? 3 : 4, why(dp, s1, s2, s3, i, j), view(dp, s1, s2, s3, i, j, reads(i, j)))
    }
  }
  t.step(5, `Table full. dp[${m}][${n}] covers every letter of both strings and all of s3: ${dp[m][n] ? 'true, a weave exists' : 'false, no weave exists'}.`, view(dp, s1, s2, s3, m, n, [[m, n, dp[m][n] ? 'hit' : 'miss']]))
  return dp[m][n] // [5] all of s1 and s2 used, all of s3 built
}
