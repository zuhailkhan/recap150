import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { arr } from '../../../core/panels'

export function subsets(nums: number[], t: Tracer = noop): number[][] {
  const out: number[][] = []
  const path: number[] = [] // [1] the numbers taken so far
  t.step(1, `Start with an empty path. For each of the ${nums.length} numbers I decide: take it, or leave it out.`, [arr(nums, { label: 'numbers' }), arr(path, { label: 'path (taken so far)' }), arr(out.map((s) => JSON.stringify(s)), { label: 'subsets found' })])

  function walk(i: number): void {
    if (i === nums.length) { // [4] every number is decided: the path is one finished subset
      out.push([...path]) // copy it, because path keeps changing
      t.step(4, `All numbers decided. ${JSON.stringify(path)} is a subset. Save a copy of it.`, [arr(nums, { label: 'numbers', tones: nums.map((x) => (path.includes(x) ? 'keep' : 'dim')) }), arr(path, { label: 'path (taken so far)', tones: path.map(() => 'hit') }), arr(out.map((s) => JSON.stringify(s)), { label: 'subsets found', tones: out.map((_, k) => (k === out.length - 1 ? 'hit' : null)) })])
      return
    }
    path.push(nums[i]) // [2] take nums[i], then decide the rest
    t.step(2, `Take ${nums[i]}. Path is ${JSON.stringify(path)}. Now decide the next number.`, [arr(nums, { label: 'numbers', tones: nums.map((x, j) => (j === i ? 'focus' : j < i ? (path.includes(x) ? 'keep' : 'dim') : null)) }), arr(path, { label: 'path (taken so far)', tones: path.map((_, k) => (k === path.length - 1 ? 'focus' : null)) }), arr(out.map((s) => JSON.stringify(s)), { label: 'subsets found' })])
    walk(i + 1)
    path.pop() // [3] undo the take, then decide the rest without nums[i]
    t.step(3, `Undo: remove ${nums[i]} from the path. Now try the other choice: leave ${nums[i]} out.`, [arr(nums, { label: 'numbers', tones: nums.map((x, j) => (j === i ? 'dim' : j < i ? (path.includes(x) ? 'keep' : 'dim') : null)) }), arr(path, { label: 'path (taken so far)' }), arr(out.map((s) => JSON.stringify(s)), { label: 'subsets found' })])
    walk(i + 1)
  }

  walk(0)
  t.step(4, `Done. Each number was both taken and left out, so ${nums.length} numbers give ${out.length} subsets.`, [arr(nums, { label: 'numbers' }), arr(out.map((s) => JSON.stringify(s)), { label: 'subsets found', tones: out.map(() => 'hit') })])
  return out
}
