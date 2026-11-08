import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { arr, dp } from '../../../core/panels'

export function productExceptSelf(nums: number[], t: Tracer = noop): number[] {
  const n = nums.length
  const out = new Array<number>(n).fill(0) // [1] out[i] will hold the answer for index i
  t.step(1, 'out starts empty. Two sweeps will fill it: one for the left side, one for the right side.', [dp([nums, out.map(() => '·')], { rowLabels: ['nums', 'out'], colLabels: nums.map((_, i) => i) }), arr([1], { label: 'prefix' })])
  let prefix = 1 // product of everything left of i
  for (let i = 0; i < n; i++) {
    out[i] = prefix // [2] left sweep: out[i] is the product of everything left of i
    t.step(2, `Index ${i}. Everything to its left multiplies to ${prefix}, so out[${i}] = ${prefix}. Then ${nums[i]} joins the prefix.`, [dp([nums, out.map((v, k) => (k <= i ? v : '·'))], { rowLabels: ['nums', 'out'], colLabels: nums.map((_, k) => k), tones: [nums.map((_, k) => (k < i ? 'keep' : k === i ? 'focus' : null)), out.map((_, k) => (k < i ? 'keep' : k === i ? 'focus' : null))] }), arr([prefix], { label: 'prefix (left of i)', tones: ['keep'] })])
    prefix *= nums[i]
  }
  let suffix = 1 // product of everything right of i
  for (let i = n - 1; i >= 0; i--) {
    out[i] *= suffix // [3] right sweep: multiply in everything right of i
    t.step(3, `Index ${i}. Everything to its right multiplies to ${suffix}. Left times right gives out[${i}] = ${out[i]}. Then ${nums[i]} joins the suffix.`, [dp([nums, out], { rowLabels: ['nums', 'out'], colLabels: nums.map((_, k) => k), tones: [nums.map((_, k) => (k > i ? 'keep' : k === i ? 'focus' : null)), out.map((_, k) => (k >= i ? 'hit' : null))] }), arr([suffix], { label: 'suffix (right of i)', tones: ['keep'] })])
    suffix *= nums[i]
  }
  return out
}
