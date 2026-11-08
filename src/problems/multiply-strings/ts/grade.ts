import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { arr, mark } from '../../../core/panels'

export function multiply(num1: string, num2: string, t: Tracer = noop): string {
  const m = num1.length
  const n = num2.length
  const res: number[] = new Array(m + n).fill(0) // [1] a product has at most m + n digits
  t.step(1, `${num1} has ${m} digits and ${num2} has ${n}, so the product fits in ${m + n} slots. Digit i of the first times digit j of the second lands in slots i+j and i+j+1.`, [arr(num1.split(''), { label: 'num1 (index i)' }), arr(num2.split(''), { label: 'num2 (index j)' }), arr(res, { label: 'result slots' })])
  for (let i = m - 1; i >= 0; i--) { // [2] each digit of num1, right to left
    t.step(2, `Take digit ${num1[i]} (index ${i}) of the first number and multiply it with every digit of the second.`, [arr(num1.split(''), { label: 'num1 (index i)', pointers: [{ name: 'i', at: i }], tones: mark(m, { [i]: 'focus' }) }), arr(num2.split(''), { label: 'num2 (index j)' }), arr(res, { label: 'result slots' })])
    for (let j = n - 1; j >= 0; j--) {
      const p = Number(num1[i]) * Number(num2[j]) + res[i + j + 1] // [3] digit product plus what the ones slot already holds
      res[i + j + 1] = p % 10 // [3] the ones digit stays in slot i+j+1
      res[i + j] += Math.floor(p / 10) // [3] the tens digit carries into slot i+j
      t.step(3, `${num1[i]} x ${num2[j]} plus the old slot value is ${p}. Write ${p % 10} in slot ${i + j + 1} and carry ${Math.floor(p / 10)} into slot ${i + j}.`, [arr(num1.split(''), { label: 'num1 (index i)', pointers: [{ name: 'i', at: i }], tones: mark(m, { [i]: 'focus' }) }), arr(num2.split(''), { label: 'num2 (index j)', pointers: [{ name: 'j', at: j }], tones: mark(n, { [j]: 'focus' }) }), arr(res, { label: 'result slots', tones: mark(m + n, { [i + j + 1]: 'focus', [i + j]: 'keep' }) })])
    }
  }
  let k = 0
  while (k < res.length - 1 && res[k] === 0) k++ // [4] skip leading zeros, but keep at least one digit
  t.step(4, `All digit pairs done. Skip ${k} leading zero${k === 1 ? '' : 's'} and join the slots.`, [arr(res, { label: 'result slots', tones: res.map((_, j) => (j < k ? 'dim' : 'hit')) })])
  return res.slice(k).join('')
}
