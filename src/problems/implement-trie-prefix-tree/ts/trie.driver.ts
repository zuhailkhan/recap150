import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { Trie } from './trie'
import { look } from './viz'

/** Replays the operations. One result per operation: null for the constructor and insert, a boolean otherwise. */
export function run(ops: string[], args: unknown[][], t: Tracer = noop): unknown[] {
  let trie: Trie | null = null
  return ops.map((op, i) => {
    const a = args[i] as string[]
    if (op === 'Trie') {
      trie = new Trie()
      t.step(1, 'An empty trie is one root node. Every word will hang below it, one letter per node.', look(trie, '', 0, 'focus'))
      return null
    }
    if (!trie) throw new Error('Trie must be created first')
    if (op === 'insert') {
      trie.insert(a[0], t)
      return null
    }
    if (op === 'search') return trie.search(a[0], t)
    if (op === 'startsWith') return trie.startsWith(a[0], t)
    throw new Error(`unknown operation ${op}`)
  })
}
