import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { arr, cursor, stack as stackPanel, withTop } from '../../../core/panels'

export function isValid(s: string, t: Tracer = noop): boolean {
  const pairs = new Map([[')', '('], [']', '['], ['}', '{']]) // [1] closer -> its opener
  const stack: string[] = []
  const chars = [...s]
  t.step(1, 'Start with an empty stack. It will hold openers that are still waiting for their closer.', [arr(chars, { label: 'brackets' }), stackPanel([], { label: 'stack', empty: 'empty' })])
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]
    if (!pairs.has(ch)) { // [2] opener: push it and wait for its partner
      stack.push(ch)
      t.step(2, `"${ch}" opens something. Push it and wait for its closer.`, [arr(chars, { label: 'brackets', tones: cursor(s.length, i), pointers: [{ name: 'i', at: i }] }), stackPanel(stack, { label: 'stack', tones: stack.map((_, k) => (k === stack.length - 1 ? 'focus' : null)) })])
      continue
    }
    const top = stack.pop() // [3] closer: it must match the most recent opener
    if (top !== pairs.get(ch)) {
      t.step(3, top === undefined ? `"${ch}" closes something, but nothing is open. Invalid.` : `"${ch}" needs "${pairs.get(ch)}" but the top is "${top}". Invalid.`, [arr(chars, { label: 'brackets', tones: cursor(s.length, i).map((x, k) => (k === i ? 'miss' : x)), pointers: [{ name: 'i', at: i, tone: 'miss' }] }), withTop(stack, top, 'miss')])
      return false
    }
    t.step(3, `"${ch}" closes "${top}". They match, so pop it.`, [arr(chars, { label: 'brackets', tones: cursor(s.length, i).map((x, k) => (k === i ? 'hit' : x)), pointers: [{ name: 'i', at: i, tone: 'hit' }] }), withTop(stack, top, 'hit')])
  }
  t.step(4, stack.length === 0 ? 'End of string and the stack is empty. Every opener was closed. Valid.' : `End of string but ${stack.length} opener${stack.length === 1 ? ' is' : 's are'} still open. Invalid.`, [arr(chars, { label: 'brackets', tones: chars.map(() => 'dim' as const) }), stackPanel(stack, { label: 'stack', tones: stack.map(() => 'miss' as const), empty: 'empty' })])
  return stack.length === 0 // [4] nothing may be left open
}
