import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import type { Panel } from '../../../core/panels'
import { solveNQueens } from './backtrack'

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

/** The rows of a board are in a fixed order, so the driver sorts the list of boards (by the rows joined with /) and the test compares exactly. */
export function solveNQueensDriver(n: number, t: Tracer = noop): string[][] {
  const { tracer: inner, flush } = thin(t)
  // Attacked squares are the most common step. Show the first few, then fold the rest into the next shown step.
  let rejected = 0
  let folded = 0
  const tracer: Tracer = {
    step(stage, say, panels) {
      if (stage === 2 && ++rejected > 3) {
        folded++
        return
      }
      inner.step(stage, folded ? `(${folded} attacked square${folded === 1 ? '' : 's'} not shown.) ${say}` : say, panels)
      folded = 0
    },
  }
  const out = solveNQueens(n, tracer)
  flush()
  return out.sort((a, b) => { const x = a.join('/'), y = b.join('/'); return x < y ? -1 : x > y ? 1 : 0 })
}
