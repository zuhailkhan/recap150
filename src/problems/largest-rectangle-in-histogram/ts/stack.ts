import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { arr, stack as stackPanel, withTop } from '../../../core/panels'

export function largestRectangleArea(heights: number[], t: Tracer = noop): number {
  const stack: number[] = [] // [1] indices of bars, heights rising from bottom to top
  let best = 0
  t.step(1, 'The stack holds bars whose rectangle can still grow to the right. Their heights rise from bottom to top. A bar of height 0 at the end will pop everything.', [arr(heights, { label: 'bar heights' }), stackPanel([], { label: 'stack (index: height)', empty: 'empty' })])
  for (let i = 0; i <= heights.length; i++) {
    const h = i === heights.length ? 0 : heights[i] // [1] a height-0 bar past the end
    while (stack.length > 0 && h < heights[stack[stack.length - 1]]) { // [2] a shorter bar ends the rectangle of the bar on top
      const top = stack.pop()! // [2] pop it
      const height = heights[top]
      t.step(2, `${i === heights.length ? 'The end marker (height 0)' : `Bar ${i} (height ${h})`} is shorter than bar ${top} (height ${height}). Bar ${top} cannot grow to the right any more. Pop it.`, [arr(heights, { label: 'bar heights', tones: heights.map((_, k) => (k === i ? 'miss' : k === top ? 'focus' : stack.includes(k) ? 'keep' : null)), pointers: i < heights.length ? [{ name: 'i', at: i, tone: 'miss' as const }] : [] }), withTop(stack.map((k) => `${k}: ${heights[k]}`), `${top}: ${height}`, 'focus')])
      const left = stack.length > 0 ? stack[stack.length - 1] : -1 // [3] the nearest shorter bar on the left
      const width = i - left - 1 // [3] the rectangle covers every bar between left and i
      best = Math.max(best, height * width) // [3] keep the biggest area seen
      t.step(3, `It reaches left to bar ${left + 1} (the stack top is ${left < 0 ? 'empty' : `bar ${left}, shorter`}) and right to bar ${i - 1}. Width ${width}, area ${height} x ${width} = ${height * width}. Best is ${best}.`, [arr(heights, { label: 'bar heights', tones: heights.map((_, k) => (k > left && k < i ? 'hit' : stack.includes(k) ? 'keep' : null)), pointers: i < heights.length ? [{ name: 'i', at: i }] : [] }), stackPanel(stack.map((k) => `${k}: ${heights[k]}`), { label: 'stack (index: height)', empty: 'empty' })])
    }
    stack.push(i) // [4] bar i can still grow right. Keep it
    t.step(4, i === heights.length ? 'The end marker is pushed. Every real bar has been measured.' : `Push bar ${i} (${h}). Nothing on the stack is taller, so the heights still rise.`, [arr(heights, { label: 'bar heights', tones: heights.map((_, k) => (k === i ? 'focus' : stack.includes(k) ? 'keep' : null)), pointers: i < heights.length ? [{ name: 'i', at: i }] : [] }), stackPanel(stack.map((k) => (k < heights.length ? `${k}: ${heights[k]}` : 'end')), { label: 'stack (index: height)', tones: stack.map((_, k) => (k === stack.length - 1 ? 'focus' : null)) })])
  }
  t.step(5, `All done. The largest rectangle has area ${best}.`, [arr(heights, { label: 'bar heights', tones: heights.map(() => 'dim' as const) }), arr([best], { label: 'largest area', tones: ['hit'] })])
  return best // [5] the biggest area seen
}
