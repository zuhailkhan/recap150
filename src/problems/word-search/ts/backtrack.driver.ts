import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import type { Panel } from '../../../core/panels'
import { exist } from './backtrack'

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

/** Works on a copy, because the solution writes # into the board while it searches. */
export function existDriver(board: string[][], word: string, t: Tracer = noop): boolean {
  const { tracer, flush } = thin(t)
  const out = exist(board.map((row) => [...row]), word, tracer)
  flush()
  return out
}
