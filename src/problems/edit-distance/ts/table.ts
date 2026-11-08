import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { dp as table, mark2 } from '../../../core/panels'
import { shown, labels, title } from './viz'

export function minDistance(word1: string, word2: string, t: Tracer = noop): number {
  const m = word1.length
  const n = word2.length
  // dp[i][j] = fewest edits that turn the first i letters of word1 into the first j letters of word2
  const dp = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0))
  for (let i = 0; i <= m; i++) dp[i][0] = i // [1] first column: delete all i letters to reach the empty word
  for (let j = 0; j <= n; j++) dp[0][j] = j // [1] first row: insert all j letters starting from the empty word
  t.step(1, `Add a row and a column for the empty prefix. Turning "" into j letters costs j inserts. Turning i letters into "" costs i deletes.`, [table(shown(dp, 0, -1), { label: title(word1, word2), rowLabels: labels(word1), colLabels: labels(word2), tones: mark2(m + 1, n + 1, [[0, 0, 'keep']]) })])

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (word1[i - 1] === word2[j - 1]) { // [2] same letter: no edit, copy the diagonal
        dp[i][j] = dp[i - 1][j - 1]
        t.step(2, `Letters "${word1[i - 1]}" and "${word2[j - 1]}" match, so dp[${i}][${j}] = dp[${i - 1}][${j - 1}] = ${dp[i][j]}. No edit needed.`, [table(shown(dp, i, j), { label: title(word1, word2), rowLabels: labels(word1), colLabels: labels(word2), tones: mark2(m + 1, n + 1, [[i - 1, j - 1, 'keep'], [i, j, 'focus']]) })])
      } else {
        // [3] different letters: 1 edit plus the cheapest of delete (up), insert (left), replace (diagonal)
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
        t.step(3, `"${word1[i - 1]}" differs from "${word2[j - 1]}". dp[${i}][${j}] = 1 + min(delete ${dp[i - 1][j]}, insert ${dp[i][j - 1]}, replace ${dp[i - 1][j - 1]}) = ${dp[i][j]}.`, [table(shown(dp, i, j), { label: title(word1, word2), rowLabels: labels(word1), colLabels: labels(word2), tones: mark2(m + 1, n + 1, [[i - 1, j, 'keep'], [i, j - 1, 'keep'], [i - 1, j - 1, 'keep'], [i, j, 'focus']]) })])
      }
    }
  }
  t.step(4, `The table is full. The corner dp[${m}][${n}] = ${dp[m][n]} edits turn "${word1}" into "${word2}".`, [table(dp, { label: title(word1, word2), rowLabels: labels(word1), colLabels: labels(word2), tones: mark2(m + 1, n + 1, [[m, n, 'hit']]) })])
  return dp[m][n] // [4] the whole word1 to the whole word2
}
