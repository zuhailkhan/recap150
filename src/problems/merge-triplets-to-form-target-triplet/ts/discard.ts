import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { arr } from '../../../core/panels'
import { board } from './viz'

export function mergeTriplets(triplets: number[][], target: number[], t: Tracer = noop): boolean {
  const hit = [false, false, false] // [1] slots where some usable triplet equals the target
  t.step(1, `Target ${target.join(', ')}. No slot is matched yet. A merge keeps the larger value in each slot, and values never go back down.`, [board(triplets, target, -1), arr(target, { label: 'target (green = slot matched)' })])
  for (let i = 0; i < triplets.length; i++) {
    const tri = triplets[i]
    if (tri[0] > target[0] || tri[1] > target[1] || tri[2] > target[2]) { // [2] too big in some slot: merging it would break that slot for good
      t.step(2, `[${tri.join(', ')}] is above the target in some slot. Merging it would push that slot past the target, and it can never come back down. Discard it.`, [board(triplets, target, i), arr(target, { label: 'target (green = slot matched)', tones: hit.map((h) => (h ? 'hit' : null)) })])
      continue
    }
    for (let j = 0; j < 3; j++) if (tri[j] === target[j]) hit[j] = true // [3] this safe triplet supplies slot j
    t.step(3, `[${tri.join(', ')}] stays under the target everywhere, so merging it is safe. ${hit.some(Boolean) ? `Matched slots so far: ${hit.map((h, j) => (h ? j : -1)).filter((j) => j >= 0).join(', ')}.` : 'It matches no slot yet.'}`, [board(triplets, target, i), arr(target, { label: 'target (green = slot matched)', tones: hit.map((h) => (h ? 'hit' : null)) })])
  }
  t.step(4, hit.every(Boolean) ? 'All three slots are matched by safe triplets. Merging them all gives exactly the target.' : `Slot${hit.filter((h) => !h).length > 1 ? 's' : ''} ${hit.map((h, j) => (h ? -1 : j)).filter((j) => j >= 0).join(', ')} never matched. No safe triplet reaches it. Impossible.`, [board(triplets, target, triplets.length), arr(target, { label: 'target (green = slot matched)', tones: hit.map((h) => (h ? 'hit' : 'miss')) })])
  return hit[0] && hit[1] && hit[2] // [4] every slot must be matched
}
