// Trace-only drawing helpers for binary trees. Never shown on the page.
// The tree panel wants a level-order array and tones by array position. The solution only holds nodes,
// so this file finds each node's array position by identity, and rebuilds the array from the live root
// every time (so a tree that changes shape is always drawn as it is right now).
import { tree, type Panel, type Pointer, type Tone, type Tones } from '../../../core/panels'

export interface N { val: number; left: N | null; right: N | null }
type Mark = [N | null | undefined, Tone, boolean?]
type Ptr = [string, N | null | undefined, Tone?, boolean?]

let roots: (N | null)[] = []
let sticky = new Map<N, Tone>()
let tags = new Map<N, string>()

/** Register the root(s) being drawn and forget everything remembered from an earlier run. */
export function use(...rs: (N | null)[]): void {
  roots = rs
  sticky = new Map()
  tags = new Map()
}

/** LeetCode-style level-order array (null = missing child) to nodes. */
export function fromLevel(items: (number | null)[]): N | null {
  if (!items.length || items[0] === null) return null
  const root: N = { val: items[0], left: null, right: null }
  const q: N[] = [root]
  let i = 1
  for (let h = 0; h < q.length && i < items.length; h++) {
    for (const side of ['left', 'right'] as const) {
      if (i >= items.length) break
      const v = items[i++]
      if (v !== null) {
        const child: N = { val: v, left: null, right: null }
        q[h][side] = child
        q.push(child)
      }
    }
  }
  return root
}

/** Nodes to a level-order array (trailing nulls trimmed) and the array position of every node. */
export function layout(root: N | null): { items: (number | null)[]; at: Map<N, number> } {
  const items: (number | null)[] = []
  const at = new Map<N, number>()
  if (!root) return { items, at }
  const q: (N | null)[] = [root]
  for (let i = 0; i < q.length && i < 400; i++) {
    const n = q[i]
    if (n) {
      at.set(n, i)
      items.push(n.val)
      q.push(n.left, n.right)
    } else items.push(null)
  }
  while (items.length && items[items.length - 1] === null) items.pop()
  return { items, at }
}

/** Every node of a subtree. */
export function nodesOf(n: N | null | undefined, out: N[] = []): N[] {
  if (n) {
    out.push(n)
    nodesOf(n.left, out)
    nodesOf(n.right, out)
  }
  return out
}

/** Height in nodes. An empty tree is 0. */
export const hgt = (n: N | null): number => (!n ? 0 : 1 + Math.max(hgt(n.left), hgt(n.right)))

/** From a node, keep stepping to the taller child. This is the longest way down. */
export function spine(n: N | null): N[] {
  const out: N[] = []
  for (let c = n; c; c = hgt(c.left) >= hgt(c.right) ? c.left : c.right) out.push(c)
  return out
}

/** The longest path that bends at this node: down the taller way on the left, the node, down the taller way on the right. */
export const bend = (n: N): N[] => [...spine(n.left).reverse(), n, ...spine(n.right)]

/** The longest path in the whole tree, found the slow way (try every bend). Used for the final picture. */
export function longestBend(root: N | null): N[] {
  let out: N[] = []
  for (const n of nodesOf(root)) if (bend(n).length > out.length) out = bend(n)
  return out
}

/** Marks for a list of nodes. */
export const many = (ns: (N | null | undefined)[], tone: Tone, keep = false): Mark[] => ns.map((n): Mark => [n, tone, keep])

/** Marks for a whole subtree. */
export const paint = (n: N | null | undefined, tone: Tone, keep = false): Mark[] => many(nodesOf(n), tone, keep)

/** The node holding this value, searching the whole subtree. */
export const find = (n: N | null, v: number): N | null => (!n ? null : n.val === v ? n : find(n.left, v) ?? find(n.right, v))

/**
 * One tree panel. marks: [node, tone, remember?]. ptrs: [name, node, tone?, remember?].
 * A remembered mark or label stays on that node in every later panel of the run.
 */
export function draw(r: number, label: string, marks: Mark[] = [], ptrs: Ptr[] = []): Panel {
  const { items, at } = layout(roots[r] ?? null)
  const tones: Tones = items.map(() => null)
  const put = (n: N | null | undefined, tone: Tone) => {
    const i = n ? at.get(n) : undefined
    if (i !== undefined) tones[i] = tone
  }
  for (const [n, tone, keep] of marks) if (keep && n) sticky.set(n, tone)
  for (const [n, tone] of sticky) put(n, tone)
  for (const [n, tone, keep] of marks) if (!keep) put(n, tone) // this frame's marks beat remembered ones
  for (const [name, n, , keep] of ptrs) if (keep && n) tags.set(n, name)
  const pointers: Pointer[] = []
  for (const [n, name] of tags) {
    const i = at.get(n)
    if (i !== undefined) pointers.push({ name, at: i })
  }
  for (const [name, n, tone, keep] of ptrs) {
    const i = n && !keep ? at.get(n) : undefined
    if (i !== undefined) pointers.push({ name, at: i, ...(tone ? { tone } : {}) })
  }
  return tree(items, { label, tones, pointers })
}
