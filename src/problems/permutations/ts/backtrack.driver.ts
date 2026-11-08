import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import type { Panel } from '../../../core/panels'
import { permute } from './backtrack'

type Frame = [number, string, Panel[]]

/** Keeps a long trace readable: the first frames in full, then one "skip ahead" frame that carries the end state. */
function thin(t: Tracer, max = 24): { tracer: Tracer; flush: () => void } {
  const all: Frame[] = []
  const flush = () => {
    if (all.length <= max) {
      for (const f of all) t.step(...f)
      return
    }
    for (const f of all.slice(0, max - 1)) t.step(...f)
    const [stage, say, panels] = all[all.length - 1]
    t.step(stage, `Skip ahead: ${all.length - max} more steps are not shown. They repeat the same choose, explore, undo moves. ${say}`, panels)
  }
  return { tracer: { step: (s, say, p) => void all.push([s, say, p]) }, flush }
}

/** Order inside each permutation matters, so the driver sorts the outer list (by the joined numbers) and the test compares exactly. */
export function permuteDriver(nums: number[], t: Tracer = noop): number[][] {
  const { tracer, flush } = thin(t)
  const out = permute(nums, tracer)
  flush()
  return out.sort((a, b) => { const x = a.join(','), y = b.join(','); return x < y ? -1 : x > y ? 1 : 0 })
}
