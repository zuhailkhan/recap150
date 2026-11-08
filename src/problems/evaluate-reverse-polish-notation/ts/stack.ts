import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { arr, cursor, stack as stackPanel } from '../../../core/panels'

export function evalRPN(tokens: string[], t: Tracer = noop): number {
  const apply = new Map<string, (a: number, b: number) => number>([
    ['+', (a, b) => a + b],
    ['-', (a, b) => a - b],
    ['*', (a, b) => a * b],
    ['/', (a, b) => Math.trunc(a / b)], // [1] cut toward zero, like Go and C
  ])
  const stack: number[] = [] // [1] numbers waiting for an operator
  t.step(1, 'Start with an empty stack. Numbers will wait on it until an operator needs them.', [arr(tokens, { label: 'tokens' }), stackPanel([], { label: 'stack', empty: 'empty' })])
  for (let i = 0; i < tokens.length; i++) {
    const op = apply.get(tokens[i])
    if (!op) { // [2] a number: push it
      stack.push(Number(tokens[i]))
      t.step(2, `${tokens[i]} is a number. Push it.`, [arr(tokens, { label: 'tokens', tones: cursor(tokens.length, i), pointers: [{ name: 'i', at: i }] }), stackPanel(stack, { label: 'stack', tones: stack.map((_, k) => (k === stack.length - 1 ? 'focus' : null)) })])
      continue
    }
    const b = stack.pop()! // [3] an operator: the top is the right operand
    const a = stack.pop()! // [3] the one below is the left operand
    t.step(3, `"${tokens[i]}" needs two numbers. Pop ${b} (right side) and then ${a} (left side).`, [arr(tokens, { label: 'tokens', tones: cursor(tokens.length, i), pointers: [{ name: 'i', at: i }] }), stackPanel([...stack, a, b], { label: 'stack', tones: [...stack.map(() => null), 'focus', 'focus'] })])
    const result = op(a, b)
    stack.push(result) // [4] the answer goes back, as a new number
    t.step(4, tokens[i] === '/' ? `${a} / ${b} is ${a / b}. Cut toward zero: ${result}. Push it back.` : `${a} ${tokens[i]} ${b} = ${result}. Push it back.`, [arr(tokens, { label: 'tokens', tones: cursor(tokens.length, i), pointers: [{ name: 'i', at: i }] }), stackPanel(stack, { label: 'stack', tones: stack.map((_, k) => (k === stack.length - 1 ? 'hit' : null)) })])
  }
  t.step(5, `All tokens are used. One number is left: ${stack[0]}. That is the answer.`, [arr(tokens, { label: 'tokens', tones: tokens.map(() => 'dim' as const) }), stackPanel(stack, { label: 'stack', tones: ['hit'] })])
  return stack[0] // [5] one number remains
}
