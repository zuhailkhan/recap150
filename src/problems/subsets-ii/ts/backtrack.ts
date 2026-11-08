import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { arr } from '../../../core/panels'

export function subsetsWithDup(nums: number[], t: Tracer = noop): number[][] {
  const sorted = [...nums].sort((a, b) => a - b) // [1] sort so equal numbers sit side by side
  const out: number[][] = []
  const path: number[] = []
  t.step(1, `Sort the numbers so equal ones are neighbours: ${JSON.stringify(sorted)}. Every path will be a subset.`, [arr(sorted, { label: 'sorted numbers' }), arr(path, { label: 'path' }), arr(out.map((s) => JSON.stringify(s)), { label: 'subsets found' })])

  function walk(start: number): void {
    out.push([...path]) // [4] every path is a subset: save a copy of it
    t.step(4, `Path ${JSON.stringify(path)} is a subset. Save a copy. Next pick comes from index ${start} on.`, [arr(sorted, { label: 'sorted numbers', tones: sorted.map((_, j) => (j < start ? 'dim' : null)) }), arr(path, { label: 'path', tones: path.map(() => 'hit') }), arr(out.map((s) => JSON.stringify(s)), { label: 'subsets found', tones: out.map((_, k) => (k === out.length - 1 ? 'hit' : null)) })])
    for (let i = start; i < sorted.length; i++) {
      if (i > start && sorted[i] === sorted[i - 1]) { // [3] same value was already tried at this depth: skip
        t.step(3, `${sorted[i]} equals the one before it, and that one was already tried here. Skip it, or the subsets repeat.`, [arr(sorted, { label: 'sorted numbers', tones: sorted.map((_, j) => (j === i ? 'miss' : j === i - 1 ? 'keep' : j < start ? 'dim' : null)) }), arr(path, { label: 'path' }), arr(out.map((s) => JSON.stringify(s)), { label: 'subsets found' })])
        continue
      }
      path.push(sorted[i]) // [2] choose sorted[i], then look only at what follows it
      t.step(2, `Choose ${sorted[i]}. Path is ${JSON.stringify(path)}.`, [arr(sorted, { label: 'sorted numbers', tones: sorted.map((_, j) => (j === i ? 'focus' : j < start ? 'dim' : null)) }), arr(path, { label: 'path', tones: path.map((_, k) => (k === path.length - 1 ? 'focus' : null)) }), arr(out.map((s) => JSON.stringify(s)), { label: 'subsets found' })])
      walk(i + 1)
      path.pop() // [5] undo the choice
      t.step(5, `Undo ${sorted[i]}. Path is back to ${JSON.stringify(path)}.`, [arr(sorted, { label: 'sorted numbers', tones: sorted.map((_, j) => (j === i ? 'dim' : j < start ? 'dim' : null)) }), arr(path, { label: 'path' }), arr(out.map((s) => JSON.stringify(s)), { label: 'subsets found' })])
    }
  }

  walk(0)
  t.step(5, `Search finished. ${out.length} different subset${out.length === 1 ? '' : 's'}, none repeated.`, [arr(sorted, { label: 'sorted numbers' }), arr(out.map((s) => JSON.stringify(s)), { label: 'subsets found', tones: out.map(() => 'hit') })])
  return out
}
