import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { arr } from '../../../core/panels'
import { deck } from './viz'

export function isNStraightHand(hand: number[], groupSize: number, t: Tracer = noop): boolean {
  if (hand.length % groupSize !== 0) return false // [1] the cards cannot split into equal groups
  const count = new Map<number, number>() // [1] card value -> copies left in the hand
  for (const card of hand) count.set(card, (count.get(card) ?? 0) + 1)
  t.step(1, `${hand.length} cards, groups of ${groupSize}. Count the copies of each value.`, [arr(hand, { label: 'hand' }), deck(count)])
  const cards = [...count.keys()].sort((a, b) => a - b) // [2] distinct values, smallest first
  t.step(2, `Walk the values from smallest to largest: ${cards.join(', ')}.`, [arr(cards, { label: 'distinct values, sorted', tones: cards.map(() => 'keep' as const) }), deck(count)])
  for (const x of cards) {
    while (count.get(x)! > 0) { // [3] x is the smallest card left, so it must start a group
      t.step(3, `${x} is the smallest card left. Nothing smaller remains to hold it, so ${x} must start a group: ${x} to ${x + groupSize - 1}.`, [arr(Array.from({ length: groupSize }, (_, k) => x + k), { label: 'group to build', tones: Array.from({ length: groupSize }, (_, k) => (k === 0 ? 'focus' : null)) }), deck(count, [x], 'focus')])
      for (let k = 0; k < groupSize; k++) { // [4] take x, x + 1, ... one copy each
        const left = count.get(x + k) ?? 0
        if (left === 0) {
          t.step(4, `No ${x + k} left. The group ${x} to ${x + groupSize - 1} cannot be finished, and ${x} had no other group to join. Not possible.`, [arr(Array.from({ length: groupSize }, (_, j) => x + j), { label: 'group to build', tones: Array.from({ length: groupSize }, (_, j) => (j < k ? 'keep' : j === k ? 'miss' : null)) }), deck(count, [x + k], 'miss')])
          return false
        }
        count.set(x + k, left - 1)
      }
      t.step(4, `Took one each of ${x} to ${x + groupSize - 1}. Copies left drop by one.`, [arr(Array.from({ length: groupSize }, (_, k) => x + k), { label: 'group formed', tones: Array.from({ length: groupSize }, () => 'hit' as const) }), deck(count, Array.from({ length: groupSize }, (_, k) => x + k), 'hit')])
    }
  }
  t.step(2, 'Every copy of every card was used. All groups are full runs.', [arr(cards, { label: 'distinct values, sorted', tones: cards.map(() => 'dim' as const) }), deck(count)])
  return true
}
