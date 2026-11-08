import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { look } from './viz'

export class TrieNode {
  children = new Map<string, TrieNode>() // letter -> child. A Map, so a key like "constructor" can never clash
  end = false // true when a stored word finishes at this node
}

export class WordDictionary {
  root = new TrieNode() // [1] an empty node stands for the empty prefix

  addWord(word: string, t: Tracer = noop): void {
    let node = this.root
    for (const ch of word) {
      if (!node.children.has(ch)) node.children.set(ch, new TrieNode()) // [2] reuse shared prefixes, create the rest
      node = node.children.get(ch)!
    }
    node.end = true // [2] mark where the word finishes
    t.step(2, `Add "${word}": walk down, create missing nodes, ring the last letter.`, look(this, word, word.length, 'hit', word))
  }

  search(word: string, t: Tracer = noop): boolean {
    const dfs = (node: TrieNode, i: number, path: string): boolean => {
      if (i === word.length) {
        t.step(5, `All ${word.length} letters are matched. ${node.end ? `"${path}" is a stored word.` : `"${path}" is only a prefix of a longer word.`}`, look(this, word, i, node.end ? 'hit' : 'miss', path))
        return node.end // [5] the whole pattern is used: the node must end a word
      }
      if (word[i] === '.') {
        t.step(4, `"." matches any letter. Children under "${path}": ${[...node.children.keys()].join(', ') || 'none'}. Try them one by one.`, look(this, word, i, 'focus', path))
        for (const [ch, child] of node.children) {
          if (dfs(child, i + 1, path + ch)) return true // [4] a wildcard branches into every child
        }
        t.step(4, `No child of "${path}" completed the pattern. Back up.`, look(this, word, i, 'miss', path))
        return false
      }
      const child = node.children.get(word[i]) // [3] a plain letter has exactly one way to go
      if (!child) {
        t.step(3, `No child ${word[i]} under "${path}". This branch fails.`, look(this, word, i, 'miss', path))
        return false
      }
      t.step(3, `Letter ${word[i]} matches a child. Go down.`, look(this, word, i + 1, 'focus', path + word[i]))
      return dfs(child, i + 1, path + word[i])
    }
    return dfs(this.root, 0, '')
  }
}
