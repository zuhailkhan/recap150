import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { arr, mark } from '../../../core/panels'

export function plusOne(digits: number[], t: Tracer = noop): number[] {
  const out = [...digits] // work on a copy
  t.step(1, `Digits ${out.join('')}. Add 1 to the last digit first, like on paper, and carry left if needed.`, [arr(out, { label: 'digits, most significant first', pointers: [{ name: 'i', at: out.length - 1 }], tones: mark(out.length, { [out.length - 1]: 'focus' }) })])
  for (let i = out.length - 1; i >= 0; i--) { // [1] start at the last digit and walk left
    if (out[i] < 9) {
      out[i]++ // [3] a digit below 9 absorbs the carry, so we are done
      t.step(3, `Digit ${out[i] - 1} is below 9. It becomes ${out[i]} and the carry stops here.`, [arr(out, { label: 'digits', tones: mark(out.length, { [i]: 'hit' }), pointers: [{ name: 'i', at: i }] })])
      return out
    }
    out[i] = 0 // [2] 9 + 1 = 10: write 0 and carry 1 to the left
    t.step(2, `Digit 9 plus the carry is 10. Write 0 and carry 1 one place left.`, [arr(out, { label: 'digits', tones: out.map((_, j) => (j === i ? 'focus' : j > i ? 'keep' : null)), pointers: [{ name: 'i', at: i }] })])
  }
  t.step(3, 'The carry fell off the left end. Every digit was 9, so the number needs one more digit: a new leading 1.', [arr([1, ...out], { label: 'one digit longer', tones: [1, ...out].map((_, j) => (j === 0 ? 'hit' : 'keep')) })])
  return [1, ...out] // [3] all nines: the result is 1 followed by zeros
}
