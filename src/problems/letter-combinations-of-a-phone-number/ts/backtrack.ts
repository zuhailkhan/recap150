import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { arr } from '../../../core/panels'

const LETTERS = ['abc', 'def', 'ghi', 'jkl', 'mno', 'pqrs', 'tuv', 'wxyz'] // letters for digits 2 to 9

export function letterCombinations(digits: string, t: Tracer = noop): string[] {
  const out: string[] = []
  if (digits === '') return out // [1] no digits, no combinations (not even an empty one)
  const path: string[] = [] // [1] one letter per digit so far
  t.step(1, `Each digit of "${digits}" is one level. At each level I pick one of its letters.`, [arr(digits.split(''), { label: 'digits' }), arr(path, { label: 'letters so far' }), arr(out, { label: 'combinations found' })])

  function walk(i: number): void {
    if (i === digits.length) { // [4] one letter for every digit: save the word
      out.push(path.join(''))
      t.step(4, `A letter is chosen for every digit. "${path.join('')}" is a combination. Save it.`, [arr(digits.split(''), { label: 'digits', tones: digits.split('').map(() => 'keep') }), arr(path, { label: 'letters so far', tones: path.map(() => 'hit') }), arr(out, { label: 'combinations found', tones: out.map((_, k) => (k === out.length - 1 ? 'hit' : null)) })])
      return
    }
    const options = LETTERS[Number(digits[i]) - 2] // [2] the letters on this digit
    t.step(2, `Digit ${digits[i]} can be ${options.split('').join(', ')}. Try each one in turn.`, [arr(digits.split(''), { label: 'digits', tones: digits.split('').map((_, j) => (j < i ? 'keep' : j === i ? 'focus' : null)) }), arr(options.split(''), { label: `letters on ${digits[i]}` }), arr(path, { label: 'letters so far' })])
    for (const ch of options) {
      path.push(ch) // [3] pick this letter, then handle the next digit
      t.step(3, `Pick "${ch}" for digit ${digits[i]}. Word so far: "${path.join('')}".`, [arr(digits.split(''), { label: 'digits', tones: digits.split('').map((_, j) => (j < i ? 'keep' : j === i ? 'focus' : null)) }), arr(options.split(''), { label: `letters on ${digits[i]}`, tones: options.split('').map((x) => (x === ch ? 'focus' : null)) }), arr(path, { label: 'letters so far', tones: path.map((_, k) => (k === path.length - 1 ? 'focus' : null)) })])
      walk(i + 1)
      path.pop() // [5] undo the pick, then try the next letter
      t.step(5, `Undo "${ch}". Word so far: "${path.join('')}". Try the next letter for digit ${digits[i]}.`, [arr(digits.split(''), { label: 'digits', tones: digits.split('').map((_, j) => (j < i ? 'keep' : j === i ? 'focus' : null)) }), arr(options.split(''), { label: `letters on ${digits[i]}`, tones: options.split('').map((x) => (x === ch ? 'dim' : null)) }), arr(path, { label: 'letters so far' })])
    }
  }

  walk(0)
  t.step(5, `Every choice was tried and undone. ${out.length} combination${out.length === 1 ? '' : 's'} found.`, [arr(digits.split(''), { label: 'digits' }), arr(out, { label: 'combinations found', tones: out.map(() => 'hit') })])
  return out
}
