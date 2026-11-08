import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { arr, mark } from '../../../core/panels'

export function maxArea(heights: number[], t: Tracer = noop): number {
  let l = 0, r = heights.length - 1 // [1] start with the widest container
  let best = 0
  t.step(1, `Start as wide as possible: walls at index ${l} and ${r}. Narrowing can only help if a wall gets taller.`, [arr(heights, { label: 'wall heights', pointers: [{ name: 'l', at: l }, { name: 'r', at: r }], window: [l, r] }), arr([best], { label: 'best area so far' })])
  while (l < r) {
    const area = (r - l) * Math.min(heights[l], heights[r]) // [2] width times the shorter wall
    t.step(2, `Width ${r - l}, shorter wall ${Math.min(heights[l], heights[r])}. Area = ${area}.`, [arr(heights, { label: 'wall heights', tones: mark(heights.length, { [l]: 'focus', [r]: 'focus' }), pointers: [{ name: 'l', at: l }, { name: 'r', at: r }], window: [l, r] }), arr([r - l, '×', Math.min(heights[l], heights[r]), '=', area], { label: 'width × shorter wall = area' })])
    best = Math.max(best, area) // [3] remember the largest area seen
    t.step(3, area >= best ? `${area} is the best so far.` : `${area} does not beat ${best}. Keep ${best}.`, [arr(heights, { label: 'wall heights', tones: mark(heights.length, { [l]: 'focus', [r]: 'focus' }), pointers: [{ name: 'l', at: l }, { name: 'r', at: r }], window: [l, r] }), arr([best], { label: 'best area so far', tones: ['hit'] })])
    if (heights[l] <= heights[r]) { // [4] the shorter wall caps every container it is part of, so drop it
      t.step(4, `Left wall ${heights[l]} is the shorter one. Any container using it is at most ${heights[l]} tall, and every other partner is closer. Move l right.`, [arr(heights, { label: 'wall heights', tones: mark(heights.length, { [l]: 'miss', [r]: 'keep' }), pointers: [{ name: 'l', at: l, tone: 'miss' }, { name: 'r', at: r }], window: [l, r] }), arr([best], { label: 'best area so far' })])
      l++
    } else {
      t.step(4, `Right wall ${heights[r]} is the shorter one. Any container using it is at most ${heights[r]} tall, and every other partner is closer. Move r left.`, [arr(heights, { label: 'wall heights', tones: mark(heights.length, { [l]: 'keep', [r]: 'miss' }), pointers: [{ name: 'l', at: l }, { name: 'r', at: r, tone: 'miss' }], window: [l, r] }), arr([best], { label: 'best area so far' })])
      r--
    }
  }
  return best
}
