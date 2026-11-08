import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { show } from './viz'

// JavaScript has no built-in heap. This small one keeps the item that wins less(a, b) on top.
export class Heap<T> {
  items: T[] = []
  less: (a: T, b: T) => boolean

  constructor(less: (a: T, b: T) => boolean) {
    this.less = less
  }

  get size(): number {
    return this.items.length
  }

  push(x: T): void {
    const a = this.items
    a.push(x)
    for (let i = a.length - 1; i > 0; ) {
      const p = (i - 1) >> 1
      if (!this.less(a[i], a[p])) break
      ;[a[i], a[p]] = [a[p], a[i]]
      i = p
    }
  }

  pop(): T {
    const a = this.items
    const top = a[0]
    const last = a.pop()!
    if (a.length > 0) {
      a[0] = last
      for (let i = 0; ; ) {
        let m = i
        for (const c of [2 * i + 1, 2 * i + 2]) if (c < a.length && this.less(a[c], a[m])) m = c
        if (m === i) break
        ;[a[m], a[i]] = [a[i], a[m]]
        i = m
      }
    }
    return top
  }
}

export interface Slot {
  task: string
  left: number // how many copies still have to run
}

export interface Rest {
  slot: Slot
  back: number // the first time unit it may run again
}

export function leastInterval(tasks: string[], n: number, t: Tracer = noop): number {
  const counts = new Map<string, number>()
  for (const task of tasks) counts.set(task, (counts.get(task) ?? 0) + 1) // [1] how many times each task must run
  const ready = new Heap<Slot>((a, b) => a.left > b.left) // max-heap: the task with the most copies left is on top
  for (const [task, left] of counts) ready.push({ task, left })
  const cooling: Rest[] = [] // tasks that are resting, in the order they come back
  const timeline: string[] = []
  t.step(1, `Count the tasks and put them in a max-heap. The task with the most copies left is on top.`, show(ready.items, cooling, timeline))
  let time = 0
  while (ready.size > 0 || cooling.length > 0) {
    time++
    while (cooling.length > 0 && cooling[0].back <= time) {
      const woke = cooling.shift()!.slot
      ready.push(woke) // [2] a rested task may run again
      t.step(2, `Time ${time}: ${woke.task} has rested long enough. It goes back in the heap with ${woke.left} left.`, show(ready.items, cooling, timeline, woke))
    }
    if (ready.size > 0) {
      const slot = ready.pop() // [3] run the task with the most copies left. With none ready, this unit is idle
      slot.left--
      timeline.push(slot.task)
      t.step(3, `Time ${time}: run ${slot.task}, the busiest ready task. ${slot.left} cop${slot.left === 1 ? 'y' : 'ies'} left.`, show(ready.items, cooling, timeline))
      if (slot.left > 0) {
        cooling.push({ slot, back: time + n + 1 }) // [4] it must rest n time units before it may run again
        t.step(4, `${slot.task} rests until time ${time + n + 1}. It leaves the heap, so it cannot run too early.`, show(ready.items, cooling, timeline, slot))
      }
    } else {
      timeline.push('idle')
      t.step(3, `Time ${time}: every task is resting. Nothing may run, so this unit is idle.`, show(ready.items, cooling, timeline))
    }
  }
  t.step(5, `No task is ready or resting. The schedule took ${time} time units.`, show(ready.items, cooling, timeline, undefined, true))
  return time // [5] the number of time units used, idle ones included
}
