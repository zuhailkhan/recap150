import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { arr, mark } from '../../../core/panels'

export function reverse(x: number, t: Tracer = noop): number {
  const LIM = 214748364 // [1] 2147483647 divided by 10, rounded toward zero
  let result = 0
  t.step(1, `Reverse ${x} digit by digit. Peel the last digit off x, push it onto result. If result would leave 32 bits, answer 0.`, [arr(String(x).split(''), { label: 'x' }), arr(['0'], { label: 'result' })])
  while (x !== 0) {
    const digit = x % 10 // [2] the last digit. % keeps the sign of x
    x = Math.trunc(x / 10) // [2] drop it. trunc rounds toward zero, floor would not for negatives
    t.step(2, `Last digit is ${digit}. Drop it from x.`, [arr(String(x * 10 + digit).split(''), { label: 'x', tones: mark(String(x * 10 + digit).length, { [String(x * 10 + digit).length - 1]: 'focus' }) }), arr(String(result).split(''), { label: 'result' })])
    if (result > LIM || (result === LIM && digit > 7) || result < -LIM || (result === -LIM && digit < -8)) { // [3] result * 10 + digit would not fit in 32 bits
      t.step(3, `result is ${result}. Adding ${digit} on the right would leave the range -2147483648..2147483647, so the answer is 0.`, [arr(String(result).split(''), { label: 'result', tones: String(result).split('').map(() => 'miss' as const) }), arr(String(digit).split(''), { label: 'digit', tones: ['miss'] })])
      return 0
    }
    result = result * 10 + digit // [3] safe: push the digit on the right
    t.step(3, `Check passed. result = ${result - digit} * 10 + ${digit} = ${result}.`, [arr(String(x).split(''), { label: 'x', tones: String(x).split('').map(() => 'dim' as const) }), arr(String(result).split(''), { label: 'result', tones: mark(String(result).length, { [String(result).length - 1]: 'hit' }) })])
  }
  t.step(4, `x is 0, so every digit has moved. The answer is ${result}.`, [arr(String(result).split(''), { label: 'result', tones: String(result).split('').map(() => 'hit' as const) })])
  return result // [4] x is used up
}
