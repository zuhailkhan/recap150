// Trace-only drawing helpers. Never shown on the page.
import { arr, list, type Panel, type Tone } from '../../../core/panels'

/** The array, and the chain 0 -> nums[0] -> nums[nums[0]] ... drawn until it repeats (the tail points back into the loop). */
export function show(nums: number[], slow: number, fast: number, done = false): Panel[] {
  const path: number[] = []
  for (let i = 0; !path.includes(i); i = nums[i]) path.push(i)
  const entry = path.indexOf(nums[path[path.length - 1]])
  const spot = (k: number): Tone | null => (k === slow && k === fast ? 'hit' : k === slow ? 'focus' : k === fast ? 'keep' : null)
  const same = slow === fast
  const pointers = (at: (v: number) => number) => (same ? [{ name: 'slow=fast', at: at(slow), tone: 'hit' as const }] : [{ name: 'slow', at: at(slow), tone: 'focus' as const }, { name: 'fast', at: at(fast), tone: 'keep' as const }])
  const dup = path[entry]
  return [
    arr(nums, { label: 'nums. Index i points at the value nums[i]', tones: nums.map((_, k) => (done && nums[k] === dup ? 'hit' : spot(k))), pointers: pointers((v) => v) }),
    list(path, { label: 'the chain of pointers from index 0. Boxes are indexes', tones: path.map((p, k) => (done && k === entry ? 'hit' : spot(p))), cycleTo: entry, pointers: pointers((v) => path.indexOf(v)) }),
  ]
}
