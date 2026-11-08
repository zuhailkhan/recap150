import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { showQuick } from './viz'

// Rearrange a[lo..hi] around one pivot. Smaller values end up left of it. Returns the pivot's final index.
function partition(a: number[], lo: number, hi: number): number {
  const mid = (lo + hi) >> 1
  ;[a[mid], a[hi]] = [a[hi], a[mid]] // park the middle value at the end as the pivot
  const pivot = a[hi]
  let i = lo
  for (let j = lo; j < hi; j++) {
    if (a[j] < pivot) {
      ;[a[i], a[j]] = [a[j], a[i]]
      i++
    }
  }
  ;[a[i], a[hi]] = [a[hi], a[i]] // the pivot goes between the smaller values and the rest
  return i
}

export function findKthLargest(nums: number[], k: number, t: Tracer = noop): number {
  const a = [...nums] // quickselect reorders, so work on a copy
  const target = a.length - k // [1] in sorted order the kth largest sits at this index
  t.step(1, `${a.length} numbers. Number ${k} from the biggest would sit at index ${target} once sorted. Do not sort, just partition.`, showQuick(a, 0, a.length - 1, target))
  let lo = 0
  let hi = a.length - 1
  for (;;) {
    const p = partition(a, lo, hi) // [2] one pivot lands in its final sorted place
    t.step(2, `Partition ${lo}..${hi}. Pivot ${a[p]} lands at index ${p}: smaller values left, the rest right.`, showQuick(a, lo, hi, target, p))
    if (p === target) {
      t.step(4, `The pivot sits at index ${target}, exactly where the answer belongs. It is ${a[p]}.`, showQuick(a, lo, hi, target, p))
      return a[p] // [4] the pivot is in the target place
    }
    if (p < target) lo = p + 1 // [3] the target is to the right: drop the left side
    else hi = p - 1 // [3] the target is to the left: drop the right side
    t.step(3, `Index ${target} is ${p < target ? 'right' : 'left'} of ${p}. Keep only ${lo}..${hi}.`, showQuick(a, lo, hi, target))
  }
}
