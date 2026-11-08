import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { mapView, view } from './viz'

export interface Node {
  val: number
  next: Node | null
  random: Node | null
}

export function copyRandomList(head: Node | null, t: Tracer = noop): Node | null {
  const copy = new Map<Node, Node>()
  const twin = (n: Node | null) => (n && copy.get(n)) || null // [2] the new twin of an old node. null stays null
  for (let n = head; n; n = n.next) {
    copy.set(n, { val: n.val, next: null, random: null }) // [1] one new node per old node, remembered in the map
    t.step(1, `Make a new node for ${n.val} and store old -> new in the map. Nothing is wired yet.`, [view(head, 'original', { at: n }), mapView(head, copy)])
  }
  for (let n = head; n; n = n.next) {
    twin(n)!.next = twin(n.next) // [2] the twin's next is the twin of the old next
    t.step(2, `The twin of ${n.val} points next at the twin of ${n.next ? n.next.val : 'null'}.`, [view(head, 'original', { at: n }), view(twin(head), 'copy (next wired so far)', { at: twin(n) })])
  }
  for (let n = head; n; n = n.next) {
    twin(n)!.random = twin(n.random) // [3] same trick for random: look the target up in the map
    t.step(3, n.random ? `Old ${n.val} has random -> ${n.random.val}. So its twin gets random -> the twin of ${n.random.val}.` : `Old ${n.val} has random = null. Its twin gets null too.`, [view(head, 'original', { at: n, hit: n.random }), view(twin(head), 'copy', { at: twin(n), hit: twin(n.random) })])
  }
  t.step(4, 'Every pointer in the copy points inside the copy. Return the twin of the head.', [view(head, 'original (untouched)', { dim: true }), view(twin(head), 'copy', { all: 'hit' })])
  return twin(head) // [4] the copy's head
}
