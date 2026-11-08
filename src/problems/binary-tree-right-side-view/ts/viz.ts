// Trace-only drawing helpers. Never shown on the page.
import { tree, type Panel, type Tone } from '../../../core/panels'
import type { TreeNode } from './bfs'

export type Levels = (number | null)[]
let levels: Levels = []
let ids = new Map<TreeNode, number>()
let top: TreeNode | null = null

/** Builds nodes from a level-order array and remembers each node's array position. */
export function build(l: Levels): TreeNode | null {
  levels = l
  ids = new Map()
  top = null
  if (l.length === 0 || l[0] === null) return null
  const make = (i: number): TreeNode => {
    const n: TreeNode = { val: l[i] as number, left: null, right: null }
    ids.set(n, i)
    return n
  }
  top = make(0)
  const queue = [top]
  let i = 1
  while (queue.length > 0 && i < l.length) {
    const cur = queue.shift()!
    if (l[i] !== null) queue.push((cur.left = make(i)))
    i++
    if (i < l.length && l[i] !== null) queue.push((cur.right = make(i)))
    i++
  }
  return top
}

export const at = (n: TreeNode | null | undefined): number => (n ? (ids.get(n) ?? -1) : -1)
export const rootOf = (): TreeNode | null => top

type Group = [(TreeNode | null)[], Tone]
type Mark = { name: string; node: TreeNode | null; tone?: Tone }

/** The input tree with some nodes toned and some labelled with pointers. */
export function show(label: string, groups: Group[] = [], marks: Mark[] = []): Panel {
  const tones: (Tone | null)[] = levels.map(() => null)
  for (const [nodes, tone] of groups) for (const n of nodes) if (at(n) >= 0) tones[at(n)] = tone
  const pointers = marks.filter((m) => at(m.node) >= 0).map((m) => ({ name: m.name, at: at(m.node), tone: m.tone }))
  return tree(levels, { label, tones, pointers })
}

/** The last node of each of the first `rows` rows. Drawing only: it finds the answer nodes so the tree can show them. */
export function rightmost(rows: number): TreeNode[] {
  const out: TreeNode[] = []
  let row: TreeNode[] = rootOf() ? [rootOf()!] : []
  while (row.length > 0 && out.length < rows) {
    out.push(row[row.length - 1])
    row = row.flatMap((n) => [n.left, n.right].filter((c): c is TreeNode => c !== null))
  }
  return out
}
