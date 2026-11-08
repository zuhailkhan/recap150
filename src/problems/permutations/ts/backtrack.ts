import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { arr } from '../../../core/panels'

export function permute(nums: number[], t: Tracer = noop): number[][] {
  const out: number[][] = []
  const path: number[] = [] // [1] the order built so far
  const used = nums.map(() => false) // which numbers are already in the path
  t.step(1, `Build an order one slot at a time. Each slot takes any number that is not used yet.`, [arr(nums, { label: 'numbers' }), arr(path, { label: 'path (order so far)' }), arr(out.map((s) => s.join(' ')), { label: 'orders found' })])

  function walk(): void {
    if (path.length === nums.length) { // [4] every slot is filled: save a copy
      out.push([...path])
      t.step(4, `All ${nums.length} slots are filled. ${path.join(' ')} is one order. Save a copy.`, [arr(nums, { label: 'numbers', tones: nums.map(() => 'keep') }), arr(path, { label: 'path (order so far)', tones: path.map(() => 'hit') }), arr(out.map((s) => s.join(' ')), { label: 'orders found', tones: out.map((_, k) => (k === out.length - 1 ? 'hit' : null)) })])
      return
    }
    for (let i = 0; i < nums.length; i++) {
      if (used[i]) { // [3] already in the path: skip it
        t.step(3, `${nums[i]} is already in the path. Skip it.`, [arr(nums, { label: 'numbers', tones: nums.map((_, j) => (j === i ? 'miss' : used[j] ? 'keep' : null)) }), arr(path, { label: 'path (order so far)' }), arr(out.map((s) => s.join(' ')), { label: 'orders found' })])
        continue
      }
      used[i] = true // [2] choose nums[i] for this slot
      path.push(nums[i])
      t.step(2, `Put ${nums[i]} in slot ${path.length}. Path is ${path.join(' ')}. Fill the next slot.`, [arr(nums, { label: 'numbers', tones: nums.map((_, j) => (j === i ? 'focus' : used[j] ? 'keep' : null)) }), arr(path, { label: 'path (order so far)', tones: path.map((_, k) => (k === path.length - 1 ? 'focus' : null)) }), arr(out.map((s) => s.join(' ')), { label: 'orders found' })])
      walk()
      path.pop() // [5] undo: take it out and free the number again
      used[i] = false
      t.step(5, `Undo ${nums[i]}. Path is back to ${path.length ? path.join(' ') : 'empty'}. Try the next number for slot ${path.length + 1}.`, [arr(nums, { label: 'numbers', tones: nums.map((_, j) => (j === i ? 'dim' : used[j] ? 'keep' : null)) }), arr(path, { label: 'path (order so far)' }), arr(out.map((s) => s.join(' ')), { label: 'orders found' })])
    }
  }

  walk()
  t.step(5, `Every choice was tried and undone. ${out.length} order${out.length === 1 ? '' : 's'} found.`, [arr(nums, { label: 'numbers' }), arr(out.map((s) => s.join(' ')), { label: 'orders found', tones: out.map(() => 'hit') })])
  return out
}
