import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { arr, buckets, cursor } from '../../../core/panels'
import { openRange } from './viz'

export function checkValidString(s: string, t: Tracer = noop): boolean {
  let lo = 0 // [1] fewest '(' that can still be open, over every way to read the stars
  let hi = 0 // [1] most '(' that can still be open
  const chars = [...s]
  t.step(1, 'Nothing is open yet, so lo = 0 and hi = 0. Every * will stretch this range: it can close one, do nothing, or open one.', [arr(chars, { label: 'string' }), openRange(lo, hi, s.length), buckets([{ key: 'lo', items: [lo] }, { key: 'hi', items: [hi] }], { label: 'range of open counts' })])
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]
    if (ch === '(') { // [2] an opener adds one to every reading
      lo++
      hi++
    } else if (ch === ')') { // [2] a closer removes one from every reading
      lo--
      hi--
    } else { // [2] a star: ")" lowers lo, "(" raises hi, empty keeps what is between
      lo--
      hi++
    }
    t.step(2, ch === '(' ? `"(" opens one in every reading. Range [${lo}, ${hi}].` : ch === ')' ? `")" closes one in every reading. Range [${lo}, ${hi}].` : `"*" can be ")" (one fewer open), empty, or "(" (one more open). The range widens to [${lo}, ${hi}].`, [arr(chars, { label: 'string', tones: cursor(s.length, i), pointers: [{ name: 'i', at: i }] }), openRange(lo, hi, s.length), buckets([{ key: 'lo', items: [lo], tone: lo < 0 ? 'miss' : undefined }, { key: 'hi', items: [hi], tone: hi < 0 ? 'miss' : undefined }], { label: 'range of open counts' })])
    if (hi < 0) { // [2] even with every * as "(", closers outnumber openers: dead
      t.step(2, `hi is ${hi}. Even reading every * so far as "(", there are more ")" than "(". No reading can work. Invalid.`, [arr(chars, { label: 'string', tones: chars.map((_, k) => (k < i ? 'dim' : k === i ? 'miss' : null)), pointers: [{ name: 'i', at: i, tone: 'miss' }] }), openRange(lo, hi, s.length, 'miss'), buckets([{ key: 'lo', items: [lo] }, { key: 'hi', items: [hi], tone: 'miss' }], { label: 'range of open counts' })])
      return false
    }
    if (lo < 0) { // [3] a count below 0 means a ")" with nothing open. Drop those readings
      t.step(3, `lo is ${lo}, but a count below 0 means a ")" had nothing to close. Those readings are invalid, so throw them away. Clamp lo to 0. hi is still ${hi}, so some reading survives.`, [arr(chars, { label: 'string', tones: cursor(s.length, i), pointers: [{ name: 'i', at: i }] }), openRange(0, hi, s.length), buckets([{ key: 'lo', items: [lo], tone: 'miss' }, { key: 'hi', items: [hi] }], { label: 'range of open counts' })])
      lo = 0
    }
  }
  t.step(4, lo === 0 ? `End of string. 0 is inside [${lo}, ${hi}], so some reading closes every opener. Valid.` : `End of string. lo = ${lo}: even closing as many openers as possible with stars leaves ${lo} open. Invalid.`, [arr(chars, { label: 'string', tones: chars.map(() => 'dim' as const) }), openRange(lo, hi, s.length, lo === 0 ? 'hit' : 'miss'), buckets([{ key: 'lo', items: [lo], tone: lo === 0 ? 'hit' : 'miss' }, { key: 'hi', items: [hi] }], { label: 'range of open counts' })])
  return lo === 0 // [4] zero open is possible only if lo reached 0
}
