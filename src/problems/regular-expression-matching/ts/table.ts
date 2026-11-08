import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { dp as table, mark2 } from '../../../core/panels'
import { shown, labels, title, tfs } from './viz'

// Assumes a valid pattern: letters a-z, '.', and '*' only right after a letter or '.'
export function isMatch(s: string, p: string, t: Tracer = noop): boolean {
  const m = s.length
  const n = p.length
  // dp[i][j] = do the first i letters of s match the first j symbols of p?
  const dp = Array.from({ length: m + 1 }, () => new Array<boolean>(n + 1).fill(false))
  dp[0][0] = true // [1] empty text matches empty pattern
  for (let j = 2; j <= n; j++) if (p[j - 1] === '*') dp[0][j] = dp[0][j - 2] // [1] a star can drop its letter: zero copies
  t.step(1, `Add a row and a column for the empty prefix. "" matches "" (T). A pattern like x* can match "" by using zero copies, so it inherits the cell two columns to the left.`, [table(shown(dp, 0, -1), { label: title(s, p), rowLabels: labels(s), colLabels: labels(p), tones: mark2(m + 1, n + 1, [[0, 0, 'keep']]) })])

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (p[j - 1] === '*') {
        // [2] star after p[j-2]: use zero copies, or let one more copy eat s[i-1]
        const zero = dp[i][j - 2]
        const eat = (p[j - 2] === '.' || p[j - 2] === s[i - 1]) && dp[i - 1][j]
        dp[i][j] = zero || eat
        t.step(2, `Star after "${p[j - 2]}". Zero copies: dp[${i}][${j - 2}] = ${tfs(zero)}. Eat "${s[i - 1]}": ${p[j - 2] === '.' || p[j - 2] === s[i - 1] ? `"${p[j - 2]}" fits, dp[${i - 1}][${j}] = ${tfs(dp[i - 1][j])}` : `"${p[j - 2]}" does not fit, so no`}. dp[${i}][${j}] = ${tfs(dp[i][j])}.`, [table(shown(dp, i, j), { label: title(s, p), rowLabels: labels(s), colLabels: labels(p), tones: mark2(m + 1, n + 1, [[i, j - 2, 'keep'], ...(p[j - 2] === '.' || p[j - 2] === s[i - 1] ? [[i - 1, j, 'keep'] as [number, number, 'keep']] : []), [i, j, 'focus']]) })])
      } else {
        dp[i][j] = (p[j - 1] === '.' || p[j - 1] === s[i - 1]) && dp[i - 1][j - 1] // [3] plain symbol: it must fit s[i-1] and the diagonal must be T
        t.step(3, `Pattern symbol "${p[j - 1]}" against "${s[i - 1]}": ${p[j - 1] === '.' || p[j - 1] === s[i - 1] ? 'fits' : 'does not fit'}, and the diagonal dp[${i - 1}][${j - 1}] = ${tfs(dp[i - 1][j - 1])}. dp[${i}][${j}] = ${tfs(dp[i][j])}.`, [table(shown(dp, i, j), { label: title(s, p), rowLabels: labels(s), colLabels: labels(p), tones: mark2(m + 1, n + 1, [[i - 1, j - 1, 'keep'], [i, j, 'focus']]) })])
      }
    }
  }
  t.step(4, `The table is full. The corner dp[${m}][${n}] = ${tfs(dp[m][n])}: the pattern "${p}" ${dp[m][n] ? 'matches' : 'does not match'} the whole text "${s}".`, [table(shown(dp, m, n), { label: title(s, p), rowLabels: labels(s), colLabels: labels(p), tones: mark2(m + 1, n + 1, [[m, n, dp[m][n] ? 'hit' : 'miss']]) })])
  return dp[m][n] // [4] the whole text against the whole pattern
}
