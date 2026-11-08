// Trace-only drawing helpers. Never shown on the page.
import { tree, type Panel, type Tone } from '../../../core/panels'
import type { TreeNode } from './gain'

export type Levels = (number | null)[]
let levels: Levels = []
let ids = new Map<TreeNode, number>()
let top: TreeNode | null = null
const verdicts = new Map<TreeNode, Tone>()

/** Builds nodes from a level-order array and remembers each node's array position. */
export function build(l: Levels): TreeNode | null {
  levels = l
  ids = new Map()
  verdicts.clear()
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

/** The input tree. Dim sticks (finished nodes). Hit sticks too, but a new hit group replaces the old one (the best path so far). */
export function show(label: string, groups: Group[] = [], marks: Mark[] = []): Panel {
  const tones: (Tone | null)[] = levels.map(() => null)
  for (const [nodes, tone] of groups) {
    if (tone === 'hit') for (const [n, v] of verdicts) if (v === 'hit') verdicts.delete(n)
    for (const n of nodes) if (n && (tone === 'hit' || tone === 'dim')) verdicts.set(n, tone)
  }
  for (const [n, tone] of verdicts) tones[at(n)] = tone
  for (const [nodes, tone] of groups) for (const n of nodes) if (at(n) >= 0 && tone !== 'hit' && tone !== 'dim') tones[at(n)] = tone
  const pointers = marks.filter((m) => at(m.node) >= 0).map((m) => ({ name: m.name, at: at(m.node), tone: m.tone }))
  return tree(levels, { label, tones, pointers })
}
