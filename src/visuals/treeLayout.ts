import type { Cell } from '@/core/panels'

export interface LNode { id: string; label: string; x: number; y: number; idx: number; end?: boolean }
export interface LEdge { from: string; to: string }
export interface Layout { nodes: LNode[]; edges: LEdge[]; cols: number; rows: number }

interface T { idx: number; val: Cell; l?: T; r?: T }
const EMPTY: Layout = { nodes: [], edges: [], cols: 0, rows: 0 }

/** Level-order array (null = missing child) to positioned nodes. x = in-order column, y = depth. */
export function levelOrderLayout(items: (Cell | null)[]): Layout {
  if (!items.length || items[0] === null) return EMPTY
  const root: T = { idx: 0, val: items[0] }
  const q: T[] = [root]
  let i = 1
  while (q.length && i < items.length) {
    const n = q.shift()!
    if (i < items.length) { const v = items[i]; if (v !== null) { n.l = { idx: i, val: v }; q.push(n.l) } i++ }
    if (i < items.length) { const v = items[i]; if (v !== null) { n.r = { idx: i, val: v }; q.push(n.r) } i++ }
  }
  return place(root)
}

/** Complete binary tree stored in an array, as in a heap. */
export function heapLayout(items: Cell[]): Layout {
  if (!items.length) return EMPTY
  const mk = (i: number): T | undefined => (i < items.length ? { idx: i, val: items[i], l: mk(2 * i + 1), r: mk(2 * i + 2) } : undefined)
  return place(mk(0)!)
}

function place(root: T): Layout {
  const nodes: LNode[] = []
  const edges: LEdge[] = []
  let col = 0
  let maxDepth = 0
  const walk = (t: T, depth: number): void => {
    if (t.l) walk(t.l, depth + 1)
    nodes.push({ id: String(t.idx), label: String(t.val), x: col++, y: depth, idx: t.idx })
    maxDepth = Math.max(maxDepth, depth)
    if (t.r) walk(t.r, depth + 1)
    if (t.l) edges.push({ from: String(t.idx), to: String(t.l.idx) })
    if (t.r) edges.push({ from: String(t.idx), to: String(t.r.idx) })
  }
  walk(root, 0)
  return { nodes, edges, cols: col, rows: maxDepth + 1 }
}

/** Trie of the given words. A node is centered over its children. Node id is its prefix. */
export function trieLayout(words: string[]): Layout {
  interface TN { prefix: string; ch: string; kids: Map<string, TN>; end: boolean }
  const root: TN = { prefix: '', ch: '•', kids: new Map(), end: false }
  for (const w of words) {
    let n = root
    for (const ch of w) {
      if (!n.kids.has(ch)) n.kids.set(ch, { prefix: n.prefix + ch, ch, kids: new Map(), end: false })
      n = n.kids.get(ch)!
    }
    n.end = true
  }
  const nodes: LNode[] = []
  const edges: LEdge[] = []
  let leaf = 0
  let maxDepth = 0
  const walk = (n: TN, depth: number): number => {
    maxDepth = Math.max(maxDepth, depth)
    const kids = [...n.kids.values()].sort((a, b) => a.ch.localeCompare(b.ch))
    const xs = kids.map((k) => walk(k, depth + 1))
    const x = xs.length ? (xs[0] + xs[xs.length - 1]) / 2 : leaf++
    nodes.push({ id: n.prefix, label: n.ch, x, y: depth, idx: nodes.length, end: n.end })
    for (const k of kids) edges.push({ from: n.prefix, to: k.prefix })
    return x
  }
  walk(root, 0)
  return { nodes, edges, cols: Math.max(1, leaf), rows: maxDepth + 1 }
}
