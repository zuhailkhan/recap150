import { arr, type Panel, type Tone, type Tones } from '../../../core/panels'

type Frame = [string, Panel[]]
type Span = [number, number, Tone]

/** Tones for a string of n letters. Later spans paint over earlier ones. */
export const paint = (n: number, ...spans: Span[]): Tones => {
  const out: Tones = Array<Tone | null>(n).fill(null)
  for (const [lo, hi, tone] of spans) for (let i = lo; i <= hi; i++) out[i] = tone
  return out
}

const centre = (c: number, w: number) => (w === 0 ? `Odd centre on index ${c}` : `Even centre between ${c} and ${c + 1}`)

/** The window [l, r] has matching ends, so it is a palindrome. The best so far stays blue. Spread into t.step(stage, ...). */
export const grown = (s: string, c: number, w: number, l: number, r: number, start: number, len: number): Frame => [
  `${centre(c, w)}. s[${l}] = '${s[l]}' and s[${r}] = '${s[r]}' match, so "${s.slice(l, r + 1)}" is a palindrome. Grow outward.`,
  [arr(s.split(''), { label: 's (green = palindrome around this centre, blue = best so far)', tones: paint(s.length, [start, start + len - 1, 'keep'], [l, r, 'hit']), pointers: [{ name: 'l', at: l }, { name: 'r', at: r }], window: [l, r] })],
]

/** The window stopped at l and r (a mismatch or an edge). s[l+1 .. r-1] is what this centre produced. */
export const stopped = (s: string, c: number, w: number, l: number, r: number, start: number, len: number): Frame => {
  const size = r - l - 1
  const better = size > 0 && len === size && start === l + 1
  const inside = l >= 0 && r < s.length
  const why = inside ? `'${s[l]}' and '${s[r]}' differ` : 'the edge of the string is reached'
  const found = size > 0 ? `"${s.slice(l + 1, r)}" (length ${size})` : 'nothing'
  const verdict = better ? 'New best.' : len > 0 ? `Best stays "${s.slice(start, start + len)}" (length ${len}).` : 'No best yet.'
  const spans: Span[] = [[start, start + len - 1, 'keep']]
  if (size > 0) spans.push([l + 1, r - 1, better ? 'hit' : 'dim'])
  if (inside) spans.push([l, l, 'miss'], [r, r, 'miss'])
  const pointers = [...(l >= 0 ? [{ name: 'l', at: l }] : []), ...(r < s.length ? [{ name: 'r', at: r }] : [])]
  return [`${centre(c, w)} stops: ${why}. This centre gave ${found}. ${verdict}`, [arr(s.split(''), { label: 's (green = new best, blue = best so far, red = the pair that failed)', tones: paint(s.length, ...spans), pointers })]]
}
