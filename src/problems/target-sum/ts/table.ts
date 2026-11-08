import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { sample, view } from './viz'

export function findTargetSumWays(nums: number[], target: number, t: Tracer = noop): number {
  const n = nums.length
  const total = nums.reduce((sum, x) => sum + x, 0)
  const off = total // [1] column s + off holds running sum s, so negative sums get a column too
  const dp = Array.from({ length: n + 1 }, () => Array<number>(2 * total + 1).fill(0))
  dp[0][off] = 1 // [1] no numbers used yet: running sum 0, reached in exactly one way
  t.step(1, `Columns are running sums from -${total} to ${total}. Row 0 (no numbers yet): sum 0 is reached in 1 way.`, [view(dp, nums, total, 0, 'start')])
  let reach = 0 // sums so far stay between -reach and reach
  for (let i = 1; i <= n; i++) {
    const x = nums[i - 1]
    for (let s = -reach; s <= reach; s++) dp[i][s + x + off] += dp[i - 1][s + off] // [2] choose +x: every way to reach s now reaches s + x
    t.step(2, `Number ${x}, choosing +${x}. Each filled cell above moves ${x} to the right and keeps its count: ${sample(dp[i - 1], off, x)}.`, [view(dp, nums, total, i, 'plus', x)])
    for (let s = -reach; s <= reach; s++) dp[i][s - x + off] += dp[i - 1][s + off] // [3] choose -x: the same ways also reach s - x, and counts landing on one cell add up
    t.step(3, `Number ${x}, choosing -${x}. Each filled cell above also moves ${x} to the left: ${sample(dp[i - 1], off, -x)}. Counts that land on the same sum are added.`, [view(dp, nums, total, i, 'minus', x)])
    reach += x
  }
  const ways = Math.abs(target) <= total ? dp[n][target + off] : 0
  t.step(4, Math.abs(target) <= total ? `Read the last row at sum ${target}: ${ways} way${ways === 1 ? '' : 's'}.` : `${target} is outside -${total}..${total}, so no sign choice can reach it: 0 ways.`, [view(dp, nums, total, n, 'answer', 0, target)])
  return ways // [4] ways to reach the target using all numbers (0 if it is out of range)
}
