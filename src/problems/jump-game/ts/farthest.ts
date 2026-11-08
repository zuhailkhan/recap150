import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { arr, buckets } from '../../../core/panels'
import { reachTones } from './viz'

export function canJump(nums: number[], t: Tracer = noop): boolean {
  const last = nums.length - 1
  let far = 0 // [1] the farthest index any jump so far can reach
  t.step(1, `Goal: reach index ${last}. Before any move I can stand only on index 0, so far = 0.`, [arr(nums, { label: 'nums (bracket = reachable so far)', tones: reachTones(nums.length, -1, far), window: [0, 0] }), buckets([{ key: 'far', items: [far], tone: 'keep' }], { label: 'state' })])
  for (let i = 0; i <= last; i++) {
    t.step(2, `Index ${i}. Is it inside the reachable stretch (${i} <= far = ${far})?`, [arr(nums, { label: 'nums (bracket = reachable so far)', tones: reachTones(nums.length, i, far), pointers: [{ name: 'i', at: i }], window: [0, Math.min(far, last)] }), buckets([{ key: 'far', items: [far], tone: 'keep' }], { label: 'state' })])
    if (i > far) { // [2] beyond the reach: nothing before can land here, so nothing after can either
      t.step(2, `${i} > ${far}. No earlier cell can jump this far, so index ${i} and everything after it is unreachable.`, [arr(nums, { label: 'nums', tones: nums.map((_, k) => (k < i ? 'dim' : 'miss')), pointers: [{ name: 'i', at: i, tone: 'miss' }], window: [0, far] }), buckets([{ key: 'far', items: [far], tone: 'miss' }], { label: 'state' })])
      return false
    }
    far = Math.max(far, i + nums[i]) // [3] standing on i, I can reach i + nums[i]
    t.step(3, `Standing on ${i}, I can reach ${i} + ${nums[i]} = ${i + nums[i]}. far = ${far}. Every cell up to far is reachable.`, [arr(nums, { label: 'nums (bracket = reachable so far)', tones: reachTones(nums.length, i, far), pointers: [{ name: 'i', at: i }], window: [0, Math.min(far, last)] }), buckets([{ key: 'far', items: [far], tone: 'focus' }], { label: 'state' })])
    if (far >= last) { // [4] the goal is inside the reach: done
      t.step(4, `far = ${far} covers the last index ${last}. Reachable.`, [arr(nums, { label: 'nums', tones: nums.map((_, k) => (k === last ? 'hit' : 'keep')), window: [0, last] }), buckets([{ key: 'far', items: [far], tone: 'hit' }], { label: 'state' })])
      return true
    }
  }
  return true
}
