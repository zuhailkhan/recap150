import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { show } from './viz'

class Node {
  next = new Map<string, Node>() // letter -> child. A Map, so a key like "constructor" can never clash
  end = false // a word finishes here and has not been reported yet
}

export function findWords(board: string[][], words: string[], t: Tracer = noop): string[] {
  const root = new Node()
  for (const w of words) {
    let node = root
    for (const ch of w) {
      if (!node.next.has(ch)) node.next.set(ch, new Node()) // [1] build one trie from all the words
      node = node.next.get(ch)!
    }
    node.end = true
  }
  t.step(1, `All ${words.length} words go into one trie. Words with the same start share nodes.`, show(board, words, [], '', 'focus'))

  const found: string[] = []
  const seen = board.map((row) => row.map(() => false)) // cells on the current path
  const dfs = (r: number, c: number, node: Node, path: string): void => {
    const next = node.next.get(board[r][c])
    if (!next) {
      t.step(3, `Cell (${r},${c}) is ${board[r][c]}. No word continues "${path}" with ${board[r][c]}, so stop here and do not go deeper.`, show(board, words, [[r, c]], path, 'miss', seen, found))
      return // [3] prune: no word in the list starts with path + this letter
    }
    path += board[r][c]
    seen[r][c] = true // [2] this cell is on the path, so it cannot be used twice
    t.step(2, `Step onto (${r},${c}) = ${board[r][c]}. The trie has a child for it, so "${path}" can still grow into a word.`, show(board, words, [[r, c]], path, 'focus', seen, found))
    if (next.end) {
      found.push(path) // [4] a whole word is spelled by the path
      next.end = false // report each word once
      t.step(4, `"${path}" is a word. Add it to the answer. Keep going, a longer word may share this path.`, show(board, words, [[r, c]], path, 'hit', seen, found))
    }
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nr = r + dr
      const nc = c + dc
      if (nr >= 0 && nr < board.length && nc >= 0 && nc < board[0].length && !seen[nr][nc]) dfs(nr, nc, next, path)
    }
    seen[r][c] = false // [5] backtrack: free the cell for other paths
    t.step(5, `Done with (${r},${c}). Unmark it and return to "${path.slice(0, -1)}".`, show(board, words, [], path.slice(0, -1), 'dim', seen, found))
  }
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[0].length; c++) dfs(r, c, root, '')
  }
  return found
}
