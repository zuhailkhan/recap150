import { arr, type Panel, type Tone, type Tones } from '../../../core/panels'

type Frame = [string, Panel[]]

const centre = (c: number, w: number) => (w === 0 ? `Odd centre on index ${c}` : `Even centre between ${c} and ${c + 1}`)

const tones = (n: number, lo: number, hi: number, tone: Tone): Tones => Array.from({ length: n }, (_, i) => (i >= lo && i <= hi ? tone : null))

/** The window [l, r] has matching ends: one more palindrome. Spread into t.step(stage, ...). */
export const found = (s: string, c: number, w: number, l: number, r: number, count: number): Frame => [
  `${centre(c, w)}. s[${l}] = '${s[l]}' and s[${r}] = '${s[r]}' match, so "${s.slice(l, r + 1)}" is a palindrome. Count = ${count}.`,
  [arr(s.split(''), { label: `s (green = the palindrome just counted). count = ${count}`, tones: tones(s.length, l, r, 'hit'), pointers: [{ name: 'l', at: l }, { name: 'r', at: r }], window: [l, r] })],
]

/** Growth stopped at l and r. This centre counted ceil(size / 2) palindromes, one per window size it reached. */
export const finished = (s: string, c: number, w: number, l: number, r: number, count: number): Frame => {
  const size = r - l - 1
  const here = Math.ceil(size / 2)
  const inside = l >= 0 && r < s.length
  const why = inside ? `'${s[l]}' and '${s[r]}' differ` : 'the edge of the string is reached'
  const t: Tones = size > 0 ? tones(s.length, l + 1, r - 1, 'dim') : Array<Tone | null>(s.length).fill(null)
  if (inside) { t[l] = 'miss'; t[r] = 'miss' }
  const pointers = [...(l >= 0 ? [{ name: 'l', at: l }] : []), ...(r < s.length ? [{ name: 'r', at: r }] : [])]
  return [`${centre(c, w)} stops: ${why}. It counted ${here} palindrome${here === 1 ? '' : 's'}. Total so far: ${count}.`, [arr(s.split(''), { label: `s (red = the pair that failed). count = ${count}`, tones: t, pointers })]]
}
