import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { arr, stack } from '../../../core/panels'

export function maxSlidingWindow(nums: number[], k: number, t: Tracer = noop): number[] {
  const out: number[] = []
  const dq: number[] = [] // [1] indexes of candidates. Their values shrink from front to back
  t.step(1, `Start with an empty deque. Windows are ${k} wide. The front of the deque will always be the window's maximum.`, [arr(nums, { label: 'nums' }), stack([], { label: 'deque (front first)', empty: 'empty' }), arr(out, { label: 'answers so far' })])
  for (let right = 0; right < nums.length; right++) {
    while (dq.length > 0 && nums[dq[dq.length - 1]] <= nums[right]) { // [2] smaller or equal values behind the new one can never be the max
      const gone = dq.pop() as number
      t.step(2, `${nums[right]} is at least as big as ${nums[gone]} and arrives later. ${nums[gone]} can never be the max again. Pop it from the back.`, [arr(nums, { label: 'nums', tones: nums.map((_, i) => (i === gone ? 'miss' : i === right ? 'focus' : dq.includes(i) ? 'keep' : null)), pointers: [{ name: 'r', at: right, tone: 'focus' }] }), stack([...dq, gone].map((i) => nums[i]), { label: 'deque (front first)', tones: [...dq, gone].map((i) => (i === gone ? 'miss' : 'keep')) }), arr(out, { label: 'answers so far' })])
    }
    dq.push(right) // [3] the new index joins at the back
    t.step(3, `Push ${nums[right]} at the back. The deque stays in falling order.`, [arr(nums, { label: 'nums', tones: nums.map((_, i) => (i === right ? 'focus' : dq.includes(i) ? 'keep' : null)), pointers: [{ name: 'r', at: right, tone: 'focus' }], window: [Math.max(0, right - k + 1), right] }), stack(dq.map((i) => nums[i]), { label: 'deque (front first)', tones: dq.map((i) => (i === right ? 'focus' : 'keep')) }), arr(out, { label: 'answers so far' })])
    if (dq[0] <= right - k) { // [4] the front index slid out of the window: remove it
      const old = dq.shift() as number
      t.step(4, `Index ${old} (value ${nums[old]}) is no longer inside the window. Remove it from the front.`, [arr(nums, { label: 'nums', tones: nums.map((_, i) => (i === old ? 'miss' : dq.includes(i) ? 'keep' : null)), window: [right - k + 1, right] }), stack([old, ...dq].map((i) => nums[i]), { label: 'deque (front first)', tones: [old, ...dq].map((i) => (i === old ? 'miss' : 'keep')) }), arr(out, { label: 'answers so far' })])
    }
    if (right >= k - 1) { // [5] the window is full: its max is at the front
      out.push(nums[dq[0]])
      t.step(5, `Window [${right - k + 1}..${right}] is full. The front of the deque is ${nums[dq[0]]}, so that is its maximum.`, [arr(nums, { label: 'nums', tones: nums.map((_, i) => (i === dq[0] ? 'hit' : dq.includes(i) ? 'keep' : null)), window: [right - k + 1, right] }), stack(dq.map((i) => nums[i]), { label: 'deque (front first)', tones: dq.map((_, j) => (j === 0 ? 'hit' : 'keep')) }), arr(out, { label: 'answers so far', tones: out.map((_, j) => (j === out.length - 1 ? 'hit' : null)) })])
    }
  }
  return out
}
