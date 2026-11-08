import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { state } from './viz'

export function myPow(x: number, n: number, t: Tracer = noop): number {
  let base = n < 0 ? 1 / x : x // [1] a negative power is a positive power of 1/x
  let k = Math.abs(n) // [1] k counts the power still to apply
  let result = 1
  t.step(1, `${x} to the power ${n}. ${n < 0 ? `Negative power: use 1/${x} = ${base} and count k = ${k}.` : `k = ${k}. Its binary digits say which squares of the base to multiply in.`}`, state(k, Math.abs(n).toString(2).length, base, result))
  while (k > 0) { // [3] until every bit of k is used
    if (k % 2 === 1) { // [2] lowest bit is 1: this base is part of the answer
      result *= base
      t.step(2, `Lowest bit of k is 1, so multiply the result by the base ${base}. Result is ${result}.`, state(k, Math.abs(n).toString(2).length, base, result, 'hit'))
    }
    base *= base // [3] square the base: it now stands for twice the power
    k = Math.floor(k / 2) // [3] drop the lowest bit of k
    t.step(3, `Square the base to ${base} and drop the lowest bit of k. k is now ${k}.`, state(k, Math.abs(n).toString(2).length, base, result))
  }
  t.step(3, `k is 0, so every bit was used. The answer is ${result}.`, state(k, Math.abs(n).toString(2).length, base, result, 'hit'))
  return result
}
