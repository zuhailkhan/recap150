import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { arr, cursor } from '../../../core/panels'

export function encodeList(strs: string[], t: Tracer = noop): string {
  let out = ''
  t.step(1, strs.length === 0 ? 'The list is empty, so the encoded text is empty too.' : `Encode ${strs.length} word${strs.length === 1 ? '' : 's'}. Each one becomes its length, a "#", then the word.`, [arr(strs, { label: 'words' }), arr([], { label: 'encoded text' })])
  for (let i = 0; i < strs.length; i++) {
    out += `${strs[i].length}#${strs[i]}` // [1] length, then '#', then the word itself
    t.step(1, `"${strs[i]}" has length ${strs[i].length}, so write ${strs[i].length}#${strs[i]}.`, [arr(strs, { label: 'words', tones: cursor(strs.length, i) }), arr(out.split(''), { label: 'encoded text' })])
  }
  return out
}

export function decodeList(s: string, t: Tracer = noop): string[] {
  const res: string[] = []
  let i = 0
  while (i < s.length) {
    let j = i
    while (j < s.length && s[j] !== '#') j++ // [2] the digits run up to the first '#'
    const len = Number(s.slice(i, j))
    t.step(2, `Read digits up to the first "#": the length is ${len}.`, [arr(s.split(''), { label: 'encoded text', tones: s.split('').map((_, k) => (k < i ? 'dim' : k < j ? 'focus' : k === j ? 'keep' : null)), pointers: [{ name: 'i', at: i }, { name: 'j', at: j }] }), arr(res, { label: 'decoded' })])
    res.push(s.slice(j + 1, j + 1 + len)) // [3] take exactly len characters, whatever they are
    t.step(3, `Take exactly ${len} character${len === 1 ? '' : 's'} after the "#": "${res[res.length - 1]}". Any "#" or digit inside it is just text.`, [arr(s.split(''), { label: 'encoded text', tones: s.split('').map((_, k) => (k < i ? 'dim' : k < j ? 'focus' : k === j ? 'keep' : k <= j + len ? 'hit' : null)), pointers: [{ name: 'i', at: i }, { name: 'j', at: j }] }), arr(res, { label: 'decoded', tones: res.map((_, k) => (k === res.length - 1 ? 'hit' : null)) })])
    i = j + 1 + len // [4] jump past the word to the next length
    t.step(4, i < s.length ? `Move i to ${i}, where the next length starts.` : `Move i to ${i}, the end of the text. Done.`, [arr(s.split(''), { label: 'encoded text', tones: s.split('').map((_, k) => (k < i ? 'dim' : null)), pointers: i < s.length ? [{ name: 'i', at: i }] : [] }), arr(res, { label: 'decoded' })])
  }
  return res
}
