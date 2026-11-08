import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { arr, buckets } from '../../../core/panels'
import { runPanel, runStart } from './viz'

export function maxSubArray(nums: number[], t: Tracer = noop): number {
  let best = nums[0] // [1] best sum so far. Start from a real element, not 0, so all-negative input works
  let run = 0 // [1] sum of the run that ends at the current index
  t.step(1, `Track two numbers: the run ending here (run = 0) and the best sum seen (best = ${best}, the first element).`, [arr(nums, { label: 'nums' }), buckets([{ key: 'run', items: [run] }, { key: 'best', items: [best], tone: 'hit' }], { label: 'running state' })])
  for (let i = 0; i < nums.length; i++) {
    if (run < 0) { // [2] a negative run can only drag a later subarray down, so drop it
      t.step(2, `run is ${run}, below zero. Any subarray that carries it forward is beaten by the same subarray without it. Drop it and restart at index ${i}.`, [runPanel(nums, runStart(nums, i - 1), i - 1, 'miss', i), buckets([{ key: 'run', items: [run], tone: 'miss' }, { key: 'best', items: [best], tone: 'hit' }], { label: 'running state' })])
      run = 0
    }
    run += nums[i] // [3] extend the run with this number
    t.step(3, `Add ${nums[i]}. The run ending at index ${i} now sums to ${run}.`, [runPanel(nums, runStart(nums, i), i), buckets([{ key: 'run', items: [run], tone: 'focus' }, { key: 'best', items: [best], tone: 'hit' }], { label: 'running state' })])
    if (run > best) { // [4] a better sum than any before
      best = run
      t.step(4, `${run} beats the old best. best is now ${best}.`, [runPanel(nums, runStart(nums, i), i, 'hit'), buckets([{ key: 'run', items: [run] }, { key: 'best', items: [best], tone: 'hit' }], { label: 'running state' })])
    }
  }
  t.step(4, `End of the list. The best run sums to ${best}.`, [arr(nums, { label: 'nums', tones: nums.map(() => 'dim' as const) }), buckets([{ key: 'best', items: [best], tone: 'hit' }], { label: 'answer' })])
  return best
}
