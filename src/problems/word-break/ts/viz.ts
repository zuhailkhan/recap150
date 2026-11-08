// Trace-only drawing helpers. Never shown on the page.
import { arr, dp as dpPanel, mark, type Panel, type Tone } from '../../../core/panels'

/** The first cut j (scanning from 0) where dp[j] is true and s[j..i) is a word, or -1. */
export function cutOf(s: string, words: string[], dp: boolean[], i: number): number {
  for (let j = 0; j < i; j++) if (dp[j] && words.includes(s.slice(j, i))) return j
  return -1
}

/** Letters, the dp row (T / F, blank past i) and the word list. The cut and the word it found are marked. */
export function view(s: string, words: string[], dp: boolean[], i: number, cut: number, last = false): Panel[] {
  const letters: Record<number, Tone> = {}
  for (let k = 0; k < i; k++) letters[k] = last ? (dp[i] ? 'hit' : 'miss') : cut < 0 ? 'miss' : k < cut ? 'keep' : 'hit'
  const cells: Record<number, Tone> = { [i]: last ? (dp[i] ? 'hit' : 'miss') : cut < 0 && i > 0 ? 'miss' : 'focus' }
  if (cut >= 0) cells[cut] = 'keep'
  return [
    arr([...s], { label: 's', tones: mark(s.length, letters) }),
    dpPanel([dp.map((v, k) => (k <= i ? (v ? 'T' : 'F') : ''))], { label: 'dp[i] = can the first i letters be split into words?', colLabels: dp.map((_, k) => k), tones: [mark(dp.length, cells)] }),
    arr(words, { label: 'words' }),
  ]
}
