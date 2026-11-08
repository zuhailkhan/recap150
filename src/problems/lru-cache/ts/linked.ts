import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { show } from './viz'

export interface Entry {
  key: number
  val: number
  prev: Entry | null
  next: Entry | null
}

export class LRUCache {
  capacity: number
  map = new Map<number, Entry>() // key -> its node, so a lookup is one step
  head: Entry = { key: 0, val: 0, prev: null, next: null } // dummy. head.next is the most recent
  tail: Entry = { key: 0, val: 0, prev: null, next: null } // dummy. tail.prev is the least recent

  constructor(capacity: number, t: Tracer = noop) {
    this.capacity = capacity
    this.head.next = this.tail // [1] the dummies link to each other, so no node ever needs a null check
    this.tail.prev = this.head
    t.step(1, `Empty cache with capacity ${capacity}. H and T are dummy nodes, so every real node has a neighbour on both sides.`, show(this))
  }

  get(key: number, t: Tracer = noop): number {
    const node = this.map.get(key) // [2] the map finds the node without walking the list
    if (!node) {
      t.step(2, `get(${key}): not in the map. Return -1. The order does not change.`, show(this))
      return -1
    }
    t.step(2, `get(${key}): the map points straight at its node. Value ${node.val}.`, show(this, { hit: key }))
    this.moveToFront(node) // [3] reading counts as use
    t.step(3, `Unlink ${key} and relink it next to H. It is now the most recently used.`, show(this, { hit: key }))
    return node.val
  }

  put(key: number, value: number, t: Tracer = noop): void {
    const old = this.map.get(key) // [2] is this key already stored?
    if (old) {
      old.val = value
      this.moveToFront(old) // [3] updating counts as use too
      t.step(3, `put(${key}, ${value}): ${key} exists. Replace its value and move it to the front.`, show(this, { hit: key }))
      return
    }
    const node: Entry = { key, val: value, prev: null, next: null }
    this.map.set(key, node) // [4] new key: add to the map and link at the front
    this.insertFront(node)
    t.step(4, `put(${key}, ${value}): new key. Add it to the map and link it next to H.${this.map.size > this.capacity ? ' Over capacity: the node next to T is the oldest.' : ''}`, show(this, { hit: key }))
    if (this.map.size > this.capacity) {
      const lru = this.tail.prev! // [5] the least recently used node sits right before T
      this.unlink(lru)
      this.map.delete(lru.key) // [5] remove it from the list AND the map
      t.step(5, `Evict ${lru.key}: unlinked from the list and deleted from the map.`, show(this))
    }
  }

  unlink(node: Entry): void {
    node.prev!.next = node.next // [3] bypass the node: two pointer changes
    node.next!.prev = node.prev
  }

  insertFront(node: Entry): void {
    node.prev = this.head // [3] link right after the dummy head: four pointer changes
    node.next = this.head.next
    this.head.next!.prev = node
    this.head.next = node
  }

  moveToFront(node: Entry): void {
    this.unlink(node)
    this.insertFront(node)
  }
}
