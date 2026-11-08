import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { arr, buckets } from '../../../core/panels'
import { windowTones } from './viz'

export function jump(nums: number[], t: Tracer = noop): number {
  const last = nums.length - 1
  let jumps = 0 // [1] jumps taken so far
  let end = 0 // [1] last index reachable with that many jumps (the current window)
  let far = 0 // [1] farthest index reachable with one more jump
  t.step(1, `Goal: index ${last}. With 0 jumps I can only stand on index 0. Track the window end (${end}) and the farthest next reach (${far}).`, [arr(nums, { label: 'nums', tones: windowTones(nums.length, -1, end) }), buckets([{ key: 'jumps', items: [jumps], tone: 'hit' }, { key: 'end', items: [end], tone: 'keep' }, { key: 'far', items: [far] }], { label: 'state' })])
  for (let i = 0; i < last; i++) { // stop before the last cell: no jump starts there
    far = Math.max(far, i + nums[i]) // [2] the best a jump from anywhere in this window can do
    t.step(2, `Index ${i} is in the current window. From it I reach ${i} + ${nums[i]} = ${i + nums[i]}. far = ${far}.`, [arr(nums, { label: 'nums. Kept = current window. Bracket = next window', tones: windowTones(nums.length, i, end), pointers: [{ name: 'i', at: i }], window: far > end ? [end + 1, Math.min(far, last)] : undefined }), buckets([{ key: 'jumps', items: [jumps], tone: 'hit' }, { key: 'end', items: [end], tone: 'keep' }, { key: 'far', items: [far], tone: 'focus' }], { label: 'state' })])
    if (i === end) { // [3] the window is used up: one more jump is forced
      jumps++
      t.step(3, `i reached the window end ${end}. Cells up to here took ${jumps - 1} jump${jumps === 2 ? '' : 's'}. One more jump is unavoidable, and landing on the best cell in the window gets me to ${far}.`, [arr(nums, { label: 'nums. Bracket = where the new jump lands', tones: windowTones(nums.length, i, end), pointers: [{ name: 'i', at: i }], window: [end + 1, Math.min(far, last)] }), buckets([{ key: 'jumps', items: [jumps], tone: 'hit' }, { key: 'end', items: [end], tone: 'keep' }, { key: 'far', items: [far], tone: 'focus' }], { label: 'state' })])
      end = far // [4] the next window runs up to far
      t.step(4, `The new window ends at ${end}. Cells after ${i} up to ${end} can be reached with ${jumps} jump${jumps === 1 ? '' : 's'}.`, [arr(nums, { label: 'nums. Kept = new window', tones: windowTones(nums.length, i, end), pointers: [{ name: 'i', at: i }] }), buckets([{ key: 'jumps', items: [jumps], tone: 'hit' }, { key: 'end', items: [end], tone: 'focus' }, { key: 'far', items: [far] }], { label: 'state' })])
    }
  }
  t.step(4, `The loop stopped before index ${last}, so that cell was never counted as a jump. Answer: ${jumps}.`, [arr(nums, { label: 'nums', tones: nums.map((_, k) => (k === last ? 'hit' : 'dim')) }), buckets([{ key: 'jumps', items: [jumps], tone: 'hit' }], { label: 'answer' })])
  return jumps
}
