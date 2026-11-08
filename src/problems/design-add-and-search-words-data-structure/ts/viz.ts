// Trace-only drawing helpers. Never shown on the page.
import { arr, cursor, trie, type Panel, type Tone } from '../../../core/panels'
import type { TrieNode, WordDictionary } from './dictionary'

/** Every stored word, found by walking the nodes. Capped so a huge trie cannot make a huge panel. */
function words(node: TrieNode, prefix = '', out: string[] = []): string[] {
  if (node.end && prefix) out.push(prefix)
  for (const [ch, child] of node.children) if (out.length < 30) words(child, prefix + ch, out)
  return out
}

/** The trie, the pattern letters with a cursor at `at`, and the concrete path walked so far as the highlight. */
export function look(d: WordDictionary, pattern: string, at: number, tone: Tone, path: string): Panel[] {
  const letters = [...pattern]
  return [
    trie(words(d.root), { label: 'trie', hot: path, hotTone: tone }),
    arr(letters, { label: 'pattern', tones: at >= letters.length ? letters.map(() => tone) : cursor(letters.length, at) }),
  ]
}
