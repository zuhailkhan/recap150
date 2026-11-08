import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { arr, mark } from '../../../core/panels'

export function twoSum(numbers: number[], target: number, t: Tracer = noop): number[] {
  let l = 0, r = numbers.length - 1 // [1] smallest value on the left, largest on the right
  t.step(1, `The list is sorted. Put l on the smallest (${numbers[l]}) and r on the largest (${numbers[r]}). Target is ${target}.`, [arr(numbers, { label: 'numbers (sorted)', pointers: [{ name: 'l', at: l }, { name: 'r', at: r }], window: [l, r] })])
  while (l < r) {
    const sum = numbers[l] + numbers[r] // [2] add the two ends
    t.step(2, `${numbers[l]} + ${numbers[r]} = ${sum}. Compare with ${target}.`, [arr(numbers, { label: 'numbers (sorted)', tones: mark(numbers.length, { [l]: 'focus', [r]: 'focus' }), pointers: [{ name: 'l', at: l }, { name: 'r', at: r }], window: [l, r] })])
    if (sum === target) { // [5] found it
      t.step(5, `${sum} equals ${target}. The answer is positions ${l + 1} and ${r + 1}, counting from 1.`, [arr(numbers, { label: 'numbers (sorted)', tones: mark(numbers.length, { [l]: 'hit', [r]: 'hit' }), pointers: [{ name: 'l', at: l, tone: 'hit' }, { name: 'r', at: r, tone: 'hit' }], window: [l, r] })])
      return [l + 1, r + 1]
    }
    if (sum < target) { // [3] too small: even the biggest partner is not enough for numbers[l]
      t.step(3, `${sum} is too small. ${numbers[l]} with the biggest value left (${numbers[r]}) still falls short, so ${numbers[l]} fits nobody. Drop it and move l right.`, [arr(numbers, { label: 'numbers (sorted)', tones: mark(numbers.length, { [l]: 'miss', [r]: 'keep' }), pointers: [{ name: 'l', at: l, tone: 'miss' }, { name: 'r', at: r }], window: [l, r] })])
      l++
    } else { // [4] too big: even the smallest partner is too much for numbers[r]
      t.step(4, `${sum} is too big. ${numbers[r]} with the smallest value left (${numbers[l]}) is already over, so ${numbers[r]} fits nobody. Drop it and move r left.`, [arr(numbers, { label: 'numbers (sorted)', tones: mark(numbers.length, { [l]: 'keep', [r]: 'miss' }), pointers: [{ name: 'l', at: l }, { name: 'r', at: r, tone: 'miss' }], window: [l, r] })])
      r--
    }
  }
  return []
}
