// Trace-only drawing helpers. Never shown on the page.
import { arr, tree, type Panel, type Tone } from '../../../core/panels'
import type { TreeNode } from './split'

export type Levels = (number | null)[]

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

// The real nodes are only linked to their parent after the whole subtree returns.
// So we keep a shadow tree that links each node the moment it is created.
// A node made for the range (lo, hi) is the left child of the node whose left range is (lo, hi), or its right child.
interface Rec { real: TreeNode; shadow: TreeNode; lo: number; hi: number; mid: number }
let recs: Rec[] = []
let shadowRoot: TreeNode | null = null

export function reset(): void {
  recs = []
  shadowRoot = null
}

/** Register a freshly created node and draw the tree so far. The new node is in focus. */
export function grow(real: TreeNode, lo: number, hi: number, mid: number): Panel {
  const shadow: TreeNode = { val: real.val, left: null, right: null }
  const parent = recs.find((r) => (r.lo === lo && r.mid - 1 === hi) || (r.mid + 1 === lo && r.hi === hi))
  if (!parent) shadowRoot = shadow
  else if (parent.lo === lo && parent.mid - 1 === hi) parent.shadow.left = shadow
  else parent.shadow.right = shadow
  recs.push({ real, shadow, lo, hi, mid })
  return built('tree built so far', real)
}

/** The tree built so far. Existing nodes are "keep". The newest node is "focus" unless done is set. */
export function built(label: string, focus?: TreeNode, done = false): Panel {
  const { nodes, at } = levelOrder(shadowRoot, recs.find((r) => r.real === focus)?.shadow)
  return tree(nodes, { label, tones: nodes.map((_, i): Tone | null => (i === at ? 'focus' : done ? 'hit' : 'keep')) })
}

/** Both arrays. The inorder window is the current range, and the root splits it into a left and a right part. */
export function split(pre: number[], ino: number[], root: number, next: number, lo: number, hi: number, mid: number, side: 'both' | 'left' | 'right'): Panel[] {
  const preTones = pre.map((v, i): Tone | null => (v === root ? 'focus' : i < next ? 'dim' : null))
  const inTones = ino.map((_, i): Tone | null => {
    if (i < lo || i > hi) return 'dim'
    if (i === mid) return 'focus'
    if (i < mid) return side === 'right' ? 'dim' : 'keep'
    return side === 'left' ? 'dim' : 'keep'
  })
  return [
    arr(pre, { label: 'preorder: the next unused value is the next root', tones: preTones, pointers: next < pre.length ? [{ name: 'next', at: next }] : [] }),
    arr(ino, { label: `inorder: window ${lo}..${hi}, the root splits it`, tones: inTones, window: lo <= hi ? [lo, hi] : undefined }),
  ]
}
