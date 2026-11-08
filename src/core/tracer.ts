import type { Frame, Panel } from './panels'

/** Hook the reference solutions call to describe what they are doing. Display code strips these lines. */
export interface Tracer { step(stage: number, say: string, panels: Panel[]): void }

export const noop: Tracer = { step() {} }

/** Hard cap so a custom input cannot produce a giant trace. */
export const MAX_STEPS = 60
/** Authors keep preset traces at or under this size (checked by verify). */
export const TARGET_STEPS = 24

export class TraceLimit extends Error {}

export function createTracer(cap = MAX_STEPS) {
  const frames: Frame[] = []
  const tracer: Tracer = {
    step(stage, say, panels) {
      if (frames.length >= cap) throw new TraceLimit()
      frames.push(JSON.parse(JSON.stringify({ stage, say, panels })))
    },
  }
  return { tracer, frames }
}

export interface TraceResult { frames: Frame[]; result: unknown; truncated: boolean; error?: string }

export function runTrace(fn: (...a: any[]) => unknown, args: unknown[], cap = MAX_STEPS): TraceResult {
  const { tracer, frames } = createTracer(cap)
  try {
    const result = fn(...structuredClone(args), tracer)
    return { frames, result, truncated: false }
  } catch (e) {
    if (e instanceof TraceLimit) return { frames, result: undefined, truncated: true }
    return { frames, result: undefined, truncated: false, error: e instanceof Error ? e.message : String(e) }
  }
}
