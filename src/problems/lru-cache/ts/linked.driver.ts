import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { LRUCache } from './linked'

/** Replays the operations. Returns one result per operation: null for the constructor and put, a number for get. */
export function run(ops: string[], args: unknown[][], t: Tracer = noop): unknown[] {
  let cache: LRUCache | null = null
  return ops.map((op, i) => {
    const a = args[i] as number[]
    if (op === 'LRUCache') {
      cache = new LRUCache(a[0], t)
      return null
    }
    if (!cache) throw new Error('LRUCache must be created first')
    if (op === 'get') return cache.get(a[0], t)
    if (op === 'put') {
      cache.put(a[0], a[1], t)
      return null
    }
    throw new Error(`unknown operation ${op}`)
  })
}
