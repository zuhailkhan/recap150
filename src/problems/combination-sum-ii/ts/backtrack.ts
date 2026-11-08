import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { arr } from '../../../core/panels'

export function combinationSum2(candidates: number[], target: number, t: Tracer = noop): number[][] {
  const sorted = [...candidates].sort((a, b) => a - b) // [1] sort: equal numbers become neighbours
  const out: number[][] = []
  const path: number[] = []
  t.step(1, `Sort the candidates: ${JSON.stringify(sorted)}. Each one can be used once. The target is ${target}.`, [arr(sorted, { label: 'sorted candidates' }), arr(path, { label: `path (still need ${target})` }), arr(out.map((s) => JSON.stringify(s)), { label: 'combinations found' })])

  function walk(start: number, left: number): void {
    if (left === 0) { // [4] the path adds up to the target: save a copy
      out.push([...path])
      t.step(4, `Nothing left to reach. ${JSON.stringify(path)} adds up to ${target}. Save a copy.`, [arr(sorted, { label: 'sorted candidates', tones: sorted.map((_, j) => (j < start ? 'dim' : null)) }), arr(path, { label: 'path (still need 0)', tones: path.map(() => 'hit') }), arr(out.map((s) => JSON.stringify(s)), { label: 'combinations found', tones: out.map((_, k) => (k === out.length - 1 ? 'hit' : null)) })])
      return
    }
    for (let i = start; i < sorted.length; i++) {
      if (i > start && sorted[i] === sorted[i - 1]) { // [3] same value was already tried at this depth: skip
        t.step(3, `${sorted[i]} equals the one before it, which was already tried here. Skip it.`, [arr(sorted, { label: 'sorted candidates', tones: sorted.map((_, j) => (j === i ? 'miss' : j === i - 1 ? 'keep' : j < start ? 'dim' : null)) }), arr(path, { label: `path (still need ${left})` }), arr(out.map((s) => JSON.stringify(s)), { label: 'combinations found' })])
        continue
      }
      if (sorted[i] > left) { // [3] too big, and so is everything after it: stop this loop
        t.step(3, `${sorted[i]} is more than the ${left} still needed. The rest are bigger, so stop here.`, [arr(sorted, { label: 'sorted candidates', tones: sorted.map((_, j) => (j >= i ? 'miss' : j < start ? 'dim' : null)) }), arr(path, { label: `path (still need ${left})` }), arr(out.map((s) => JSON.stringify(s)), { label: 'combinations found' })])
        break
      }
      path.push(sorted[i]) // [2] choose sorted[i], then look only at what follows it
      t.step(2, `Choose ${sorted[i]}. Path is ${JSON.stringify(path)}, still need ${left - sorted[i]}.`, [arr(sorted, { label: 'sorted candidates', tones: sorted.map((_, j) => (j === i ? 'focus' : j < start ? 'dim' : null)) }), arr(path, { label: `path (still need ${left - sorted[i]})`, tones: path.map((_, k) => (k === path.length - 1 ? 'focus' : null)) }), arr(out.map((s) => JSON.stringify(s)), { label: 'combinations found' })])
      walk(i + 1, left - sorted[i])
      path.pop() // [5] undo the choice
      t.step(5, `Undo ${sorted[i]}. Path is back to ${JSON.stringify(path)}, still need ${left}.`, [arr(sorted, { label: 'sorted candidates', tones: sorted.map((_, j) => (j === i ? 'dim' : j < start ? 'dim' : null)) }), arr(path, { label: `path (still need ${left})` }), arr(out.map((s) => JSON.stringify(s)), { label: 'combinations found' })])
    }
  }

  walk(0, target)
  t.step(5, `Search finished. ${out.length} combination${out.length === 1 ? '' : 's'}, none repeated.`, [arr(sorted, { label: 'sorted candidates' }), arr(out.map((s) => JSON.stringify(s)), { label: 'combinations found', tones: out.map(() => 'hit') })])
  return out
}
