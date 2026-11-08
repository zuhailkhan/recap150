import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { chain, last, sumText } from './viz'

function digitSquareSum(n: number): number {
  let sum = 0
  while (n > 0) {
    const d = n % 10
    sum += d * d // [2] square each digit and add it up
    n = Math.floor(n / 10)
  }
  return sum
}

export function isHappy(n: number, t: Tracer = noop): boolean {
  const seen = new Set<number>()
  while (n !== 1) { // [1] stop at 1 (happy) or at a repeat (loop)
    if (seen.has(n)) {
      t.step(1, `${n} is already in the chain. The sequence is going round in circles and will never reach 1.`, [chain(seen, n, 'miss')])
      return false // [1] seen before: a loop
    }
    seen.add(n) // [2] remember it, then take the next step
    n = digitSquareSum(n)
    t.step(2, `${last(seen)}: ${sumText(last(seen))}. Next number is ${n}.`, [chain(seen, n)])
  }
  t.step(1, 'Reached 1. A 1 maps to 1 forever, so the number is happy.', [chain(seen, n, 'hit')])
  return true // [1] left the loop at 1
}
