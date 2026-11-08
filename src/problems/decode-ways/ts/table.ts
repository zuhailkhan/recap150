import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { view } from './viz'

export function numDecodings(s: string, t: Tracer = noop): number {
  const n = s.length
  const dp: number[] = new Array(n + 1).fill(0)
  dp[0] = 1 // [1] the empty prefix has exactly one reading
  t.step(1, 'dp[0] = 1: the empty prefix has one reading (read nothing). Every other cell starts unfilled and will add up readings.', view(s, dp, 0, [], []))
  for (let i = 1; i <= n; i++) {
    if (s[i - 1] !== '0') dp[i] += dp[i - 1] // [2] last digit alone is a letter (1 to 9)
    t.step(2, s[i - 1] === '0' ? `Digit "0" cannot be a letter alone, so it adds nothing. dp[${i}] = ${dp[i]} so far.` : `Digit "${s[i - 1]}" alone is a letter, so every reading of the first ${i - 1} digits extends by it: dp[${i}] = dp[${i - 1}] = ${dp[i]} so far.`, view(s, dp, i, [i - 1], s[i - 1] !== '0' ? [i - 1] : []))
    const pair = i >= 2 ? Number(s.slice(i - 2, i)) : 0
    if (pair >= 10 && pair <= 26) dp[i] += dp[i - 2] // [3] last two digits together make a letter (10 to 26)
    t.step(3, i < 2 ? 'Only one digit so far, so there is no pair to try.' : pair >= 10 && pair <= 26 ? `The pair "${s.slice(i - 2, i)}" is ${pair}, a letter. Add dp[${i - 2}] = ${dp[i - 2]}. So dp[${i}] = ${dp[i]}.` : `The pair "${s.slice(i - 2, i)}" is ${pair}, not in 10 to 26, so no letter. dp[${i}] stays ${dp[i]}.`, view(s, dp, i, i >= 2 ? [i - 2, i - 1] : [], pair >= 10 && pair <= 26 ? [i - 2] : []))
  }
  t.step(4, `The whole string is the first ${n} digits, so the answer is dp[${n}] = ${dp[n]}.`, view(s, dp, n, [], [], true))
  return dp[n] // [4] readings of the full string
}
