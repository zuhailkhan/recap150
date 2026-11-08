import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { arr } from '../../../core/panels'

export function minEatingSpeed(piles: number[], h: number, t: Tracer = noop): number {
  let l = 1 // [1] candidate speeds run from 1 to the biggest pile
  let r = Math.max(...piles) // [1]
  let best = r // [1] the biggest pile always works, since h >= piles.length
  t.step(1, `Koko has ${h} hours. Candidate speeds are 1 to ${r}. Speed ${r} always works, so ${r} is the answer for now.`, [...(r <= 40 ? [arr(Array.from({ length: r }, (_, i) => i + 1), { label: 'candidate speeds', pointers: [{ name: 'l', at: 0 }, { name: 'r', at: r - 1 }], window: [0, r - 1] })] : []), arr(piles, { label: 'piles' })])
  while (l <= r) { // [2] speeds in l..r are still undecided
    const m = l + Math.floor((r - l) / 2)
    t.step(2, `Try the middle speed, ${m} bananas per hour.`, [...(Math.max(...piles) <= 40 ? [arr(Array.from({ length: Math.max(...piles) }, (_, i) => i + 1), { label: 'candidate speeds (red: too slow, green: fast enough)', tones: Array.from({ length: Math.max(...piles) }, (_, i) => (i + 1 < l ? 'miss' : i + 1 > r ? 'hit' : i + 1 === m ? 'focus' : null)), pointers: [{ name: 'l', at: l - 1 }, { name: 'm', at: m - 1, tone: 'focus' }, { name: 'r', at: r - 1 }], window: [l - 1, r - 1] })] : []), arr(piles, { label: 'piles' })])
    let hours = 0
    for (const p of piles) hours += Math.ceil(p / m) // [3] each pile takes ceil(pile / speed) hours
    t.step(3, `At speed ${m} the piles take ${piles.map((p) => Math.ceil(p / m)).join(' + ')} = ${hours} hours. The limit is ${h}.`, [arr(piles, { label: 'piles' }), arr(piles.map((p) => Math.ceil(p / m)), { label: `hours per pile at speed ${m}  (total ${hours})`, tones: piles.map(() => (hours <= h ? 'hit' : 'miss')) })])
    if (hours <= h) { // [4] fast enough: remember it, then look for something slower
      best = m
      r = m - 1
    } else {
      l = m + 1 // [4] too slow: every speed up to m is too slow
    }
    t.step(4, hours <= h ? `${hours} is within ${h}, so ${m} works. Keep it as the best so far, and try slower speeds on the left.` : `${hours} is more than ${h}, so ${m} is too slow, and so is every speed below it. Look to the right.`, [...(Math.max(...piles) <= 40 ? [arr(Array.from({ length: Math.max(...piles) }, (_, i) => i + 1), { label: `candidate speeds (best so far: ${best})`, tones: Array.from({ length: Math.max(...piles) }, (_, i) => (i + 1 < l ? 'miss' : i + 1 > r ? 'hit' : null)), pointers: [{ name: 'l', at: l - 1 }, { name: 'r', at: r - 1 }].filter((p) => p.at >= 0 && p.at < Math.max(...piles)), window: l <= r ? [l - 1, r - 1] : undefined })] : [arr([l, r, best], { label: 'l, r, best so far' })])])
  }
  t.step(5, `l (${l}) passed r (${r}). The slowest speed that works is ${best}.`, [arr([best], { label: 'slowest speed that works', tones: ['hit'] })])
  return best // [5] the slowest speed that still finishes in time
}
