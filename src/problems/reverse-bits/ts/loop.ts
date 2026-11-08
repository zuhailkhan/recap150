import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { bits } from '../../../core/panels'
import { at, lit } from './viz'

export function reverseBits(n: number, width: number, t: Tracer = noop): number {
  let result = 0 // [1] the reversed number, built one bit at a time
  t.step(1, `Reverse ${width} bits. Take bits off the right end of n, push them onto the right end of the result.`, [bits([{ label: 'n', value: n >>> 0 }, { label: 'out', value: 0 }], { width })])
  for (let i = 0; i < width; i++) {
    const bit = n & 1 // [2] the lowest bit of n
    t.step(2, `Lowest bit of n is ${bit}. This is bit ${i} from the right, so it must end up bit ${i} from the left.`, [bits([{ label: 'n', value: n >>> 0, tones: at(width, 0, 'focus') }, { label: 'out', value: result >>> 0 }], { width })])
    result = (result << 1) | bit // [3] make room on the right of the result and drop the bit in
    n >>>= 1 // [3] logical shift: the next bit of n is now the lowest
    t.step(3, `Shift out left by one and add ${bit}. Shift n right. Out now holds ${i + 1} reversed bit${i ? 's' : ''}.`, [bits([{ label: 'n', value: n >>> 0 }, { label: 'out', value: result >>> 0, tones: at(width, 0, 'hit') }], { width })])
  }
  t.step(4, `All ${width} bits moved. The result is ${result >>> 0}.`, [bits([{ label: 'out', value: result >>> 0, tones: lit(width, result, 'hit') }], { width })])
  return result >>> 0 // [4] >>> 0 reads the bits as unsigned (bit 31 would make a negative number)
}
