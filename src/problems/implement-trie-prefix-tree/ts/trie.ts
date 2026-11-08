import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { look } from './viz'

export class TrieNode {
  children = new Map<string, TrieNode>() // letter -> child. A Map, so a key like "constructor" can never clash
  end = false // true when a stored word finishes at this node
}

export class Trie {
  root = new TrieNode() // [1] an empty node stands for the empty prefix

  insert(word: string, t: Tracer = noop): void {
    let node = this.root
    for (let i = 0; i < word.length; i++) {
      const old = node.children.get(word[i])
      const child = old ?? new TrieNode() // [2] reuse the child if the prefix is shared, else make one
      node.children.set(word[i], child)
      t.step(2, `${word[i]}: ${old ? 'this prefix is already stored, so reuse its node' : 'no such child yet, so make a new node'}.`, look(this, word, i + 1, 'focus', word))
      node = child
    }
    node.end = true // [3] only the last node of the word is marked
    t.step(3, `Mark the node after "${word}" as a word end (the ring).`, look(this, word, word.length, 'hit'))
  }

  search(word: string, t: Tracer = noop): boolean {
    let node = this.root
    for (let i = 0; i < word.length; i++) {
      const child = node.children.get(word[i]) // [4] follow one letter at a time
      if (!child) {
        t.step(4, `Search "${word}": no child for ${word[i]}. The word is not stored.`, look(this, word, i, 'miss'))
        return false
      }
      node = child
      t.step(4, `Search "${word}": follow ${word[i]}.`, look(this, word, i + 1, 'focus'))
    }
    t.step(5, `The path exists. ${node.end ? 'The last node is a word end, so it is stored.' : 'But the last node is not a word end, so only a longer word is stored.'}`, look(this, word, word.length, node.end ? 'hit' : 'miss'))
    return node.end // [5] a full path is not enough: the word must end here
  }

  startsWith(prefix: string, t: Tracer = noop): boolean {
    let node = this.root
    for (let i = 0; i < prefix.length; i++) {
      const child = node.children.get(prefix[i]) // [4] the same walk
      if (!child) {
        t.step(4, `Prefix "${prefix}": no child for ${prefix[i]}. No stored word starts like this.`, look(this, prefix, i, 'miss'))
        return false
      }
      node = child
      t.step(4, `Prefix "${prefix}": follow ${prefix[i]}.`, look(this, prefix, i + 1, 'focus'))
    }
    t.step(5, 'The whole prefix exists as a path. Some word starts with it, so the end flag does not matter.', look(this, prefix, prefix.length, 'hit'))
    return true // [5] reaching the end of the walk is enough
  }
}
