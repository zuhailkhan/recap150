import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { arr } from '../../../core/panels'

export function combinationSum(candidates: number[], target: number, t: Tracer = noop): number[][] {
  const out: number[][] = []
  const path: number[] = [] // [1] the numbers picked so far
  t.step(1, `Pick numbers from ${JSON.stringify(candidates)} until they add up to ${target}. A number may be picked again.`, [arr(candidates, { label: 'candidates' }), arr(path, { label: `path (still need ${target})` }), arr(out.map((s) => JSON.stringify(s)), { label: 'combinations found' })])

  function walk(start: number, left: number): void {
    if (left === 0) { // [4] the path adds up to the target: save a copy
      out.push([...path])
      t.step(4, `Nothing left to reach. ${JSON.stringify(path)} adds up to ${target}. Save a copy.`, [arr(candidates, { label: 'candidates' }), arr(path, { label: 'path (still need 0)', tones: path.map(() => 'hit') }), arr(out.map((s) => JSON.stringify(s)), { label: 'combinations found', tones: out.map((_, k) => (k === out.length - 1 ? 'hit' : null)) })])
      return
    }
    for (let i = start; i < candidates.length; i++) {
      if (candidates[i] > left) { // [3] too big: this pick would overshoot, skip it
        t.step(3, `${candidates[i]} is more than the ${left} still needed. Skip it.`, [arr(candidates, { label: 'candidates', tones: candidates.map((_, j) => (j === i ? 'miss' : j < start ? 'dim' : null)) }), arr(path, { label: `path (still need ${left})` }), arr(out.map((s) => JSON.stringify(s)), { label: 'combinations found' })])
        continue
      }
      path.push(candidates[i]) // [2] pick candidates[i]
      t.step(2, `Pick ${candidates[i]}. Path is ${JSON.stringify(path)}, still need ${left - candidates[i]}.`, [arr(candidates, { label: 'candidates', tones: candidates.map((_, j) => (j === i ? 'focus' : j < start ? 'dim' : null)) }), arr(path, { label: `path (still need ${left - candidates[i]})`, tones: path.map((_, k) => (k === path.length - 1 ? 'focus' : null)) }), arr(out.map((s) => JSON.stringify(s)), { label: 'combinations found' })])
      walk(i, left - candidates[i]) // pass i, not i + 1: the same number may be used again
      path.pop() // [5] undo the pick, then try the next candidate
      t.step(5, `Undo ${candidates[i]}. Path is back to ${JSON.stringify(path)}, still need ${left}. Try the next candidate.`, [arr(candidates, { label: 'candidates', tones: candidates.map((_, j) => (j === i ? 'dim' : j < start ? 'dim' : null)) }), arr(path, { label: `path (still need ${left})` }), arr(out.map((s) => JSON.stringify(s)), { label: 'combinations found' })])
    }
  }

  walk(0, target)
  t.step(5, `Every choice was tried and undone. ${out.length} combination${out.length === 1 ? '' : 's'} found.`, [arr(candidates, { label: 'candidates' }), arr(out.map((s) => JSON.stringify(s)), { label: 'combinations found', tones: out.map(() => 'hit') })])
  return out
}
