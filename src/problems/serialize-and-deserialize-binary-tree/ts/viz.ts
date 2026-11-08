// Trace-only drawing helpers. Never shown on the page.
import { tree, type Panel, type Tone } from '../../../core/panels'
import type { TreeNode } from './codec'

export type Levels = (number | null)[]

let levels: Levels = []
let ids = new Map<TreeNode, number>()
const written = new Set<TreeNode>()

/** Level-order array of a tree, trailing nulls trimmed. Also tells where `mark` sits in that array (-1 if absent). */
export function levelOrder(root: TreeNode | null, mark?: TreeNode): { nodes: Levels; at: number } {
  const nodes: Levels = []
  const queue: (TreeNode | null)[] = [root]
  let at = -1
  for (let i = 0; i < queue.length; i++) {
    const n = queue[i]
    if (n && n === mark) at = nodes.length
    nodes.push(n ? n.val : null)
    if (n) queue.push(n.left, n.right)
  }
  while (nodes.length > 0 && nodes[nodes.length - 1] === null) nodes.pop()
  return { nodes, at }
}

/** Builds the input tree from a level-order array and remembers each node's array position. Also clears old trace state. */
export function build(l: Levels): TreeNode | null {
  levels = l
  ids = new Map()
  written.clear()
  open = []
  shadowRoot = null
  if (l.length === 0 || l[0] === null) return null
  const make = (i: number): TreeNode => {
    const n: TreeNode = { val: l[i] as number, left: null, right: null }
    ids.set(n, i)
    return n
  }
  const root = make(0)
  const queue = [root]
  let i = 1
  while (queue.length > 0 && i < l.length) {
    const cur = queue.shift()!
    if (l[i] !== null) queue.push((cur.left = make(i)))
    i++
    if (i < l.length && l[i] !== null) queue.push((cur.right = make(i)))
    i++
  }
  return root
}

/** The input tree while it is being written out. Written nodes are dim, the current one is in focus. */
export function writing(label: string, node: TreeNode | null): Panel {
  if (node) written.add(node)
  const tones: (Tone | null)[] = levels.map(() => null)
  for (const n of written) tones[ids.get(n) ?? -1] = 'dim'
  if (node && ids.has(node)) tones[ids.get(node)!] = 'focus'
  return tree(levels, { label, tones })
}

// While reading, the real nodes are only linked to their parent after the whole subtree returns.
// So we keep a shadow tree and link each node as its token is read. A frame counts how many child slots it has used.
interface Frame { shadow: TreeNode; used: number }
let open: Frame[] = []
let shadowRoot: TreeNode | null = null

/** Feed the token just read (the node it made, or null for "#"). Draws the tree rebuilt so far. */
export function reading(label: string, node: TreeNode | null, done = false): Panel {
  let fresh: TreeNode | undefined
  if (node) {
    fresh = { val: node.val, left: null, right: null }
    const top = open[open.length - 1]
    if (!top) shadowRoot = fresh
    else {
      if (top.used === 0) top.shadow.left = fresh
      else top.shadow.right = fresh
      top.used++
    }
    open.push({ shadow: fresh, used: 0 })
  } else if (open.length > 0) {
    open[open.length - 1].used++
  }
  while (open.length > 0 && open[open.length - 1].used === 2) open.pop()
  const { nodes, at } = levelOrder(shadowRoot, fresh)
  return tree(nodes, { label, tones: nodes.map((_, i): Tone | null => (i === at ? 'focus' : done ? 'hit' : 'keep')) })
}
