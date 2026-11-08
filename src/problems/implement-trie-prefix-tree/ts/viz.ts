// Trace-only drawing helpers. Never shown on the page.
import { arr, cursor, trie, type Panel, type Tone } from '../../../core/panels'
import type { Trie, TrieNode } from './trie'

/** Every stored word, found by walking the nodes. Capped so a huge trie cannot make a huge panel. */
function words(node: TrieNode, prefix = '', out: string[] = []): string[] {
  if (node.end && prefix) out.push(prefix)
  for (const [ch, child] of node.children) if (out.length < 30) words(child, prefix + ch, out)
  return out
}

/** The trie, the query letters, and the first `done` letters of the query as the highlighted path. */
export function look(tr: Trie, query: string, done: number, tone: Tone, pending?: string): Panel[] {
  const stored = words(tr.root)
  if (pending && !stored.includes(pending)) stored.push(pending)
  const letters = [...query]
  return [
    trie(stored, { label: 'trie', hot: query.slice(0, done), hotTone: tone }),
    ...(letters.length ? [arr(letters, { label: 'letters', tones: done >= letters.length ? letters.map(() => tone) : cursor(letters.length, done) })] : []),
  ]
}
