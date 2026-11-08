import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { arr, buckets, mark } from '../../../core/panels'

export function trap(height: number[], t: Tracer = noop): number {
  let l = 0, r = height.length - 1 // [1] pointers at both ends, no wall seen yet
  let leftMax = 0, rightMax = 0, water = 0
  t.step(1, `Pointers at both ends. leftMax and rightMax start at 0. Water so far: 0.`, [arr(height, { label: 'bar heights', pointers: [{ name: 'l', at: l }, { name: 'r', at: r }], window: [l, r] }), buckets([{ key: 'leftMax', items: [leftMax] }, { key: 'rightMax', items: [rightMax] }, { key: 'water', items: [water] }], { label: 'running values' })])
  while (l < r) {
    const useLeft = height[l] < height[r] // [2] the lower side is safe to finish: the other side has a wall at least this tall
    t.step(2, useLeft ? `Left bar ${height[l]} is lower than right bar ${height[r]}. Some wall at least ${height[r]} high stands on the right, so only the left max can limit the water at l.` : `Right bar ${height[r]} is not higher than left bar ${height[l]}. Some wall at least ${height[l]} high stands on the left, so only the right max can limit the water at r.`, [arr(height, { label: 'bar heights', tones: mark(height.length, { [l]: useLeft ? 'focus' : 'keep', [r]: useLeft ? 'keep' : 'focus' }), pointers: [{ name: 'l', at: l }, { name: 'r', at: r }], window: [l, r] }), buckets([{ key: 'leftMax', items: [leftMax] }, { key: 'rightMax', items: [rightMax] }, { key: 'water', items: [water] }], { label: 'running values' })])
    if (useLeft) {
      leftMax = Math.max(leftMax, height[l]) // [3] tallest wall seen on the left
      water += leftMax - height[l] // [3] this bar holds water up to that wall
      t.step(3, `leftMax is ${leftMax}. The bar is ${height[l]} high, so it holds ${leftMax - height[l]}. Water: ${water}.`, [arr(height, { label: 'bar heights', tones: mark(height.length, { [l]: leftMax > height[l] ? 'hit' : 'focus' }), pointers: [{ name: 'l', at: l }, { name: 'r', at: r }], window: [l, r] }), buckets([{ key: 'leftMax', items: [leftMax], tone: 'focus' }, { key: 'rightMax', items: [rightMax] }, { key: 'water', items: [water] }], { label: 'running values' })])
      l++
    } else {
      rightMax = Math.max(rightMax, height[r]) // [3] tallest wall seen on the right
      water += rightMax - height[r] // [3] this bar holds water up to that wall
      t.step(3, `rightMax is ${rightMax}. The bar is ${height[r]} high, so it holds ${rightMax - height[r]}. Water: ${water}.`, [arr(height, { label: 'bar heights', tones: mark(height.length, { [r]: rightMax > height[r] ? 'hit' : 'focus' }), pointers: [{ name: 'l', at: l }, { name: 'r', at: r }], window: [l, r] }), buckets([{ key: 'leftMax', items: [leftMax] }, { key: 'rightMax', items: [rightMax], tone: 'focus' }, { key: 'water', items: [water] }], { label: 'running values' })])
      r--
    }
  }
  t.step(4, `The pointers met. Every bar has been counted. Total water: ${water}.`, [arr(height, { label: 'bar heights' }), buckets([{ key: 'water', items: [water], tone: 'hit' }], { label: 'answer' })])
  return water // [4] total over all bars
}
