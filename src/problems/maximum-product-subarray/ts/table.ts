import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { view } from './viz'

export function maxProduct(nums: number[], t: Tracer = noop): number {
  const n = nums.length
  const hi: number[] = new Array(n).fill(0) // hi[i] = biggest product of a subarray ending at i
  const lo: number[] = new Array(n).fill(0) // lo[i] = smallest product of a subarray ending at i
  hi[0] = lo[0] = nums[0] // [1] a subarray of one number is just that number
  let best = nums[0]
  t.step(1, `The only subarray ending at index 0 is [${nums[0]}], so hi[0] = lo[0] = ${nums[0]}.`, view(nums, hi, lo, 0, 0, 0, false, { hi: 'focus', lo: 'focus' }))
  for (let i = 1; i < n; i++) {
    const x = nums[i]
    const a = x * hi[i - 1]
    const b = x * lo[i - 1]
    hi[i] = Math.max(x, a, b) // [2] biggest of: start fresh, extend the biggest, extend the smallest
    t.step(2, `x = ${x}. Start fresh: ${x}. Extend hi: ${x} × ${hi[i - 1]} = ${a}. Extend lo: ${x} × ${lo[i - 1]} = ${b}. Biggest: hi[${i}] = ${hi[i]}.${x < 0 ? ' A negative x flips the old smallest into a big one.' : ''}`, view(nums, hi, lo, i, i, i - 1, true, { hi: 'focus' }))
    lo[i] = Math.min(x, a, b) // [3] smallest of the same three, kept for the next negative
    t.step(3, `The smallest of ${x}, ${a} and ${b} is lo[${i}] = ${lo[i]}. A later negative number may turn it into the biggest.`, view(nums, hi, lo, i, i, i, true, { lo: 'focus' }))
    best = Math.max(best, hi[i]) // [4] the answer is the biggest hi anywhere
  }
  t.step(4, `The best subarray ends somewhere, so the answer is the biggest hi: ${best}.`, view(nums, hi, lo, hi.indexOf(best), n - 1, n - 1, false, { hi: 'hit' }))
  return best // [4]
}
