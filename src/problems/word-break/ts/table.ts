import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { cutOf, view } from './viz'

export function wordBreak(s: string, wordDict: string[], t: Tracer = noop): boolean {
  const words = new Set(wordDict)
  const n = s.length
  const dp: boolean[] = new Array(n + 1).fill(false)
  dp[0] = true // [1] the empty prefix splits into zero words
  t.step(1, 'dp[0] = true: the empty prefix needs no words. Every other cell starts false.', view(s, wordDict, dp, 0, -1))
  for (let i = 1; i <= n; i++) {
    for (let j = 0; j < i; j++) {
      if (dp[j] && words.has(s.slice(j, i))) { // [2] a good prefix of length j, then one word s[j..i)
        dp[i] = true
        break
      }
    }
    t.step(2, dp[i] ? `Prefix "${s.slice(0, i)}": cut at ${cutOf(s, wordDict, dp, i)}. dp[${cutOf(s, wordDict, dp, i)}] is true and "${s.slice(cutOf(s, wordDict, dp, i), i)}" is a word, so dp[${i}] = true.` : `Prefix "${s.slice(0, i)}": no cut j has dp[j] true and a word s[j..${i}). So dp[${i}] = false.`, view(s, wordDict, dp, i, dp[i] ? cutOf(s, wordDict, dp, i) : -1))
  }
  t.step(3, dp[n] ? `The whole string is the prefix of length ${n}, and dp[${n}] is true. Answer: true.` : `The whole string is the prefix of length ${n}, and dp[${n}] is false. Answer: false.`, view(s, wordDict, dp, n, -1, true))
  return dp[n] // [3] can the whole string be split?
}
