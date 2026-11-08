import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { arr, stack } from '../../../core/panels'

export function generateParenthesis(n: number, t: Tracer = noop): string[] {
  const out: string[] = []
  const path: string[] = [] // [1] the string built so far, one character per slot
  t.step(1, `We build strings of ${n} pair${n === 1 ? '' : 's'}. The stack holds the characters chosen so far.`, [stack([], { label: 'string so far (stack)', empty: 'empty' }), arr([], { label: 'found' })])

  function build(open: number, close: number): void {
    if (path.length === 2 * n) { // [4] every pair is used: this string is complete
      out.push(path.join(''))
      return
    }
    if (open < n) { // [2] we may open while we still have openers left
      path.push('(')
      t.step(2, `Add "(". ${open + 1} opened, ${close} closed.`, [stack(path, { label: 'string so far (stack)', tones: path.map((_, k) => (k === path.length - 1 ? 'focus' : null)) }), arr(out, { label: 'found' })])
      build(open + 1, close)
      path.pop() // [5] undo this choice, then try the other one
    }
    if (close < open) { // [3] we may close only something that is open
      path.push(')')
      t.step(path.length === 2 * n ? 4 : 3, path.length === 2 * n ? `Add ")". ${n} opened and ${n} closed: "${path.join('')}" is complete. Save it.` : `Add ")". ${open} opened, ${close + 1} closed.`, [stack(path, { label: 'string so far (stack)', tones: path.map((_, k) => (path.length === 2 * n ? 'hit' : k === path.length - 1 ? 'focus' : null)) }), arr(path.length === 2 * n ? [...out, path.join('')] : out, { label: 'found', tones: path.length === 2 * n ? [...out.map(() => null), 'hit'] : undefined })])
      build(open, close + 1)
      path.pop() // [5] undo this choice
    }
  }

  build(0, 0)
  t.step(5, `Every choice has been tried and undone. The stack is empty again. ${out.length} string${out.length === 1 ? '' : 's'} found.`, [stack(path, { label: 'string so far (stack)', empty: 'empty' }), arr(out, { label: 'found', tones: out.map(() => 'hit' as const) })])
  return out // [5] all complete strings
}
