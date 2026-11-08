import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { arr } from '../../../core/panels'

export function partition(s: string, t: Tracer = noop): string[][] {
  const out: string[][] = []
  const path: string[] = [] // [1] the pieces cut so far
  const chars = s.split('')
  t.step(1, `Cut "${s}" into pieces from the left. Every piece must read the same forwards and backwards.`, [arr(chars, { label: 'string' }), arr(path, { label: 'pieces cut so far' }), arr(out.map((p) => p.join(' | ')), { label: 'partitions found' })])

  const isPal = (l: number, r: number): boolean => {
    while (l < r) {
      if (s[l] !== s[r]) return false
      l++
      r--
    }
    return true
  }

  function walk(start: number): void {
    if (start === s.length) { // [4] the whole string is cut: save a copy of the pieces
      out.push([...path])
      t.step(4, `The whole string is used. ${path.join(' | ')} is a partition. Save a copy.`, [arr(chars, { label: 'string', tones: chars.map(() => 'hit') }), arr(path, { label: 'pieces cut so far', tones: path.map(() => 'hit') }), arr(out.map((p) => p.join(' | ')), { label: 'partitions found', tones: out.map((_, k) => (k === out.length - 1 ? 'hit' : null)) })])
      return
    }
    for (let end = start + 1; end <= s.length; end++) {
      const piece = s.slice(start, end)
      if (!isPal(start, end - 1)) { // [2] not a palindrome: this piece is rejected
        t.step(2, `"${piece}" is not a palindrome. Try a longer piece.`, [arr(chars, { label: 'string', tones: chars.map((_, j) => (j < start ? 'keep' : j < end ? 'miss' : null)) }), arr(path, { label: 'pieces cut so far' }), arr(out.map((p) => p.join(' | ')), { label: 'partitions found' })])
        continue
      }
      path.push(piece) // [3] it is a palindrome: cut it off, then split what is left
      t.step(3, `"${piece}" is a palindrome. Cut it off. ${end === s.length ? 'Nothing is left.' : `Split the rest, "${s.slice(end)}".`}`, [arr(chars, { label: 'string', tones: chars.map((_, j) => (j < start ? 'keep' : j < end ? 'focus' : null)) }), arr(path, { label: 'pieces cut so far', tones: path.map((_, k) => (k === path.length - 1 ? 'focus' : null)) }), arr(out.map((p) => p.join(' | ')), { label: 'partitions found' })])
      walk(end)
      path.pop() // [5] undo the cut, then try a longer piece
      t.step(5, `Undo "${piece}". Back to ${path.length ? path.join(' | ') : 'no pieces'}, next piece starts at index ${start}.`, [arr(chars, { label: 'string', tones: chars.map((_, j) => (j < start ? 'keep' : null)) }), arr(path, { label: 'pieces cut so far' }), arr(out.map((p) => p.join(' | ')), { label: 'partitions found' })])
    }
  }

  walk(0)
  t.step(5, `Every cut was tried and undone. ${out.length} partition${out.length === 1 ? '' : 's'} found.`, [arr(chars, { label: 'string' }), arr(out.map((p) => p.join(' | ')), { label: 'partitions found', tones: out.map(() => 'hit') })])
  return out
}
