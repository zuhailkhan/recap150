import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { WordDictionary } from './dictionary'
import { look } from './viz'

/** Replays the operations. One result per operation: null for the constructor and addWord, a boolean for search. */
export function run(ops: string[], args: unknown[][], t: Tracer = noop): unknown[] {
  let dict: WordDictionary | null = null
  return ops.map((op, i) => {
    const a = args[i] as string[]
    if (op === 'WordDictionary') {
      dict = new WordDictionary()
      t.step(1, 'An empty dictionary is one root node. Words will hang below it, one letter per node.', look(dict, '', 0, 'focus', ''))
      return null
    }
    if (!dict) throw new Error('WordDictionary must be created first')
    if (op === 'addWord') {
      dict.addWord(a[0], t)
      return null
    }
    if (op === 'search') return dict.search(a[0], t)
    throw new Error(`unknown operation ${op}`)
  })
}
