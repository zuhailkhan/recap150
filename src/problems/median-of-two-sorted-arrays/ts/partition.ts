import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { arr } from '../../../core/panels'

export function findMedianSortedArrays(nums1: number[], nums2: number[], t: Tracer = noop): number {
  let a = nums1
  let b = nums2
  if (a.length > b.length) [a, b] = [b, a] // [1] a is the shorter one, so b is never too short for the cut
  const total = a.length + b.length
  const half = Math.floor((total + 1) / 2) // [1] the left side holds this many items in total
  t.step(1, `Merged, the two arrays hold ${total} items. A cut puts ${half} of them on the left. a is the shorter array.`, [arr(a, { label: 'a (shorter)' }), arr(b, { label: 'b' })])
  let l = 0 // [2] cut positions in a: 0 (before everything) to a.length (after everything)
  let r = a.length // [2]
  t.step(2, `The cut in a can sit at any position from 0 to ${a.length}. Binary search over those ${a.length + 1} positions.`, [arr(Array.from({ length: a.length + 1 }, (_, k) => k), { label: 'possible cut positions in a (cut after k items)', pointers: [{ name: 'l', at: l }, { name: 'r', at: r }], window: [l, r] }), arr(a, { label: 'a (shorter)' })])
  while (l <= r) {
    const i = l + Math.floor((r - l) / 2) // [3] cut a after i items. Then b must be cut after half - i
    const j = half - i
    const aLeft = i > 0 ? a[i - 1] : -Infinity // [3] the item just left of each cut, and just right of it
    const aRight = i < a.length ? a[i] : Infinity
    const bLeft = j > 0 ? b[j - 1] : -Infinity
    const bRight = j < b.length ? b[j] : Infinity
    t.step(3, `Cut a after ${i} items and b after ${j}. That puts ${i} + ${j} = ${half} items on the left. Next, compare the items beside the cuts.`, [arr([...a.slice(0, i), '|', ...a.slice(i)], { label: `a, cut after ${i}`, tones: [...a, 0].map((_, k) => (k === i - 1 || k === i + 1 ? 'focus' : k < i ? 'keep' : k === i ? 'dim' : null)) }), arr([...b.slice(0, j), '|', ...b.slice(j)], { label: `b, cut after ${j}`, tones: [...b, 0].map((_, k) => (k === j - 1 || k === j + 1 ? 'focus' : k < j ? 'keep' : k === j ? 'dim' : null)) })])
    const tooFar = aLeft > bRight // [4] a's left item must not beat b's right item
    const tooShort = bLeft > aRight // [4] b's left item must not beat a's right item
    t.step(4, tooFar ? `${aLeft} (left of a's cut) is bigger than ${bRight} (right of b's cut). The cut in a is too far right. Move it left.` : tooShort ? `${bLeft} (left of b's cut) is bigger than ${aRight} (right of a's cut). The cut in a is too far left. Move it right.` : `${aLeft} <= ${bRight} and ${bLeft} <= ${aRight}. Everything on the left is no bigger than everything on the right. This is the right cut.`, [arr([...a.slice(0, i), '|', ...a.slice(i)], { label: `a, cut after ${i}`, tones: [...a, 0].map((_, k) => (k === i - 1 ? (tooFar ? 'miss' : 'hit') : k === i + 1 ? (tooShort ? 'miss' : 'hit') : k < i ? 'keep' : k === i ? 'dim' : null)) }), arr([...b.slice(0, j), '|', ...b.slice(j)], { label: `b, cut after ${j}`, tones: [...b, 0].map((_, k) => (k === j - 1 ? (tooShort ? 'miss' : 'hit') : k === j + 1 ? (tooFar ? 'miss' : 'hit') : k < j ? 'keep' : k === j ? 'dim' : null)) })])
    if (tooFar) r = i - 1 // [4] move a's cut left (and b's cut moves right with it)
    else if (tooShort) l = i + 1 // [4] move a's cut right
    else {
      const leftMax = Math.max(aLeft, bLeft) // [5] the median comes from the four items beside the cuts
      const answer = total % 2 === 1 ? leftMax : (leftMax + Math.min(aRight, bRight)) / 2
      t.step(5, total % 2 === 1 ? `${total} is odd, so the median is the biggest item on the left: ${leftMax}.` : `${total} is even. Average the biggest item on the left (${leftMax}) and the smallest on the right (${Math.min(aRight, bRight)}): ${answer}.`, [arr([...a.slice(0, i), '|', ...a.slice(i)], { label: `a, cut after ${i}`, tones: [...a, 0].map((_, k) => (k === i - 1 && aLeft === leftMax ? 'hit' : k === i + 1 && aRight === Math.min(aRight, bRight) && total % 2 === 0 ? 'hit' : k < i ? 'keep' : k === i ? 'dim' : null)) }), arr([...b.slice(0, j), '|', ...b.slice(j)], { label: `b, cut after ${j}`, tones: [...b, 0].map((_, k) => (k === j - 1 && bLeft === leftMax ? 'hit' : k === j + 1 && bRight === Math.min(aRight, bRight) && total % 2 === 0 ? 'hit' : k < j ? 'keep' : k === j ? 'dim' : null)) })])
      return answer
    }
  }
  throw new Error('both arrays must be sorted')
}
