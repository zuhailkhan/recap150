import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { arr, dp as table, mark, mark2 } from '../../../core/panels'
import { shown, labels, title } from './viz'

export function maxCoins(nums: number[], t: Tracer = noop): number {
  const a = [1, ...nums, 1] // [1] pad both ends with a 1: a missing neighbour counts as 1
  const n = a.length
  // dp[l][r] = most coins from bursting every balloon strictly between l and r (l and r stay)
  const dp = Array.from({ length: n }, () => new Array<number>(n).fill(0))
  t.step(1, `Pad the row with a 1 on each side: [${a.join(', ')}]. dp[l][r] is the best score for the balloons strictly between l and r. Ranges with nothing inside are 0.`, [arr(a, { label: 'balloons with a 1 padded at each end', tones: mark(n, { 0: 'keep', [n - 1]: 'keep' }) }), table(shown(dp, 2, -1), { label: title(), rowLabels: labels(a), colLabels: labels(a) })])

  for (let gap = 2; gap < n; gap++) { // [2] short ranges first, so the smaller ranges inside are ready
    t.step(2, `Now ranges with ${gap - 1} balloon${gap === 2 ? '' : 's'} inside (r = l + ${gap}). Every smaller range is already filled.`, [table(shown(dp, gap, -1), { label: title(), rowLabels: labels(a), colLabels: labels(a) })])
    for (let l = 0; l + gap < n; l++) {
      const r = l + gap
      for (let k = l + 1; k < r; k++) { // [3] try balloon k as the LAST one burst between l and r
        const coins = dp[l][k] + a[l] * a[k] * a[r] + dp[k][r]
        dp[l][r] = Math.max(dp[l][r], coins) // [4] keep the best choice of last balloon
        t.step(3, `Burst ${k} (value ${a[k]}) last in (${l}, ${r}): dp[${l}][${k}] ${dp[l][k]} + ${a[l]}*${a[k]}*${a[r]} + dp[${k}][${r}] ${dp[k][r]} = ${coins}. Best for this range so far: ${dp[l][r]}.`, [arr(a, { label: `last balloon k = ${k} between l = ${l} and r = ${r}`, tones: a.map((_, i) => (i === k ? 'focus' : i === l || i === r ? 'keep' : i > l && i < r ? 'dim' : null)), pointers: [{ name: 'l', at: l }, { name: 'k', at: k, tone: 'focus' }, { name: 'r', at: r }] }), table(shown(dp, gap, l), { label: title(), rowLabels: labels(a), colLabels: labels(a), tones: mark2(n, n, [[l, k, 'keep'], [k, r, 'keep'], [l, r, 'focus']]) })])
      }
      t.step(4, `Every choice of last balloon is tried. dp[${l}][${r}] = ${dp[l][r]}, the best of them.`, [table(shown(dp, gap, l), { label: title(), rowLabels: labels(a), colLabels: labels(a), tones: mark2(n, n, [[l, r, 'focus']]) })])
    }
  }
  t.step(5, `The whole padded row is covered. dp[0][${n - 1}] = ${dp[0][n - 1]} is the most coins for bursting every real balloon.`, [table(shown(dp, n, n), { label: title(), rowLabels: labels(a), colLabels: labels(a), tones: mark2(n, n, [[0, n - 1, 'hit']]) })])
  return dp[0][n - 1] // [5] range (0, n-1) holds every real balloon
}
