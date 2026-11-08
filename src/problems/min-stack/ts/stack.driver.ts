import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { stack, withTop, type Tone } from '../../../core/panels'
import { MinStack } from './stack'

const topOnly = (items: number[], label: string, tone: Tone | null) =>
  stack(items, { label, tones: items.map((_, k) => (k === items.length - 1 ? tone : null)), empty: 'empty' })

/** Replays the calls. ops = method names (the first is the constructor), args = their arguments. Forwards the tracer. */
export function run(ops: string[], args: unknown[][], t: Tracer = noop): unknown[] {
  let s = new MinStack()
  const out: unknown[] = []
  ops.forEach((op, i) => {
    const a = args[i] ?? []
    if (op === 'MinStack') {
      s = new MinStack()
      out.push(null)
      t.step(1, 'A new MinStack. It keeps two stacks: the values, and the smallest value at each level.', [topOnly(s.vals, 'values', null), topOnly(s.mins, 'min so far', null)])
    } else if (op === 'push') {
      s.push(a[0] as number)
      out.push(null)
      t.step(2, `push(${a[0]}). The min stack gets ${s.getMin()}, the smallest value now in the stack.`, [topOnly(s.vals, 'values', 'focus'), topOnly(s.mins, 'min so far', 'focus')])
    } else if (op === 'pop') {
      const gone = s.top()
      const goneMin = s.getMin()
      s.pop()
      out.push(null)
      t.step(3, `pop(). ${gone} leaves the values and ${goneMin} leaves the min stack. ${s.mins.length ? `The older minimum ${s.getMin()} is on top again.` : 'Both stacks are empty.'}`, [withTop(s.vals, gone, 'miss'), withTop(s.mins, goneMin, 'miss')])
    } else if (op === 'top') {
      const v = s.top()
      out.push(v)
      t.step(4, `top() reads the newest value: ${v}.`, [topOnly(s.vals, 'values', 'hit'), topOnly(s.mins, 'min so far', null)])
    } else {
      const v = s.getMin()
      out.push(v)
      t.step(5, `getMin() reads the top of the min stack: ${v}. No search needed.`, [topOnly(s.vals, 'values', null), topOnly(s.mins, 'min so far', 'hit')])
    }
  })
  return out
}
