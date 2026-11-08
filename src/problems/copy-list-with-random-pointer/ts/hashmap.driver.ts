import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { copyRandomList, type Node } from './hashmap'

type Pair = [number, number | null]

const build = (pairs: Pair[]): Node[] => {
  const nodes: Node[] = pairs.map(([val]) => ({ val, next: null, random: null }))
  pairs.forEach(([, r], i) => {
    nodes[i].next = nodes[i + 1] ?? null
    nodes[i].random = r === null ? null : nodes[r]
  })
  return nodes
}

const chain = (head: Node | null): Node[] => {
  const out: Node[] = []
  for (let n = head; n; n = n.next) out.push(n)
  return out
}

const flat = (head: Node | null): Pair[] => {
  const ns = chain(head)
  return ns.map((n) => {
    const r = n.random ? ns.indexOf(n.random) : null
    if (r === -1) throw new Error('random pointer leaves the list')
    return [n.val, r]
  })
}

/** Pairs [val, randomIndex|null] in, pairs out. Throws if the copy shares a node with the original or the original changed. */
export function copyRandomListDriver(pairs: Pair[], t: Tracer = noop): Pair[] {
  const nodes = build(pairs)
  const dup = copyRandomList(nodes[0] ?? null, t)
  const old = new Set(nodes)
  for (const n of chain(dup)) if (old.has(n)) throw new Error('the copy shares a node with the original')
  const out = flat(dup)
  if (JSON.stringify(flat(nodes[0] ?? null)) !== JSON.stringify(out)) throw new Error('the original list was changed')
  return out
}
