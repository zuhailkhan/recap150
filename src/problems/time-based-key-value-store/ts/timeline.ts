import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { arr, buckets } from '../../../core/panels'

export class TimeMap {
  private store = new Map<string, [number, string][]>() // [1] every key owns a list of [timestamp, value]

  set(key: string, value: string, timestamp: number, t: Tracer = noop): void {
    let list = this.store.get(key)
    if (!list) {
      list = []
      this.store.set(key, list) // [1] first time we see this key: give it an empty list
      t.step(1, `"${key}" is new, so it gets an empty list of [timestamp, value] pairs.`, [buckets([...this.store].map(([k, v]) => ({ key: k, items: v.map(([ts, val]) => `${ts}:${val}`), tone: k === key ? 'focus' as const : undefined })), { label: 'store', keyLabel: 'key', empty: 'empty' })])
    }
    list.push([timestamp, value]) // [2] timestamps only grow, so the list stays sorted
    t.step(2, `set("${key}", "${value}", ${timestamp}). Append the pair to the end. The list stays sorted by time.`, [buckets([...this.store].map(([k, v]) => ({ key: k, items: v.map(([ts, val]) => `${ts}:${val}`), tone: k === key ? 'keep' as const : undefined })), { label: 'store (timestamp:value)', keyLabel: 'key', empty: 'empty' })])
  }

  get(key: string, timestamp: number, t: Tracer = noop): string {
    const list = this.store.get(key) ?? []
    let l = 0 // [3] binary search the list for the latest timestamp <= the query
    let r = list.length - 1 // [3]
    let best = '' // [3] "" means no value at or before this time
    t.step(3, `get("${key}", ${timestamp}). Find the newest pair whose timestamp is at most ${timestamp}.`, [arr(list.map(([ts]) => ts), { label: `timestamps of "${key}"`, pointers: list.length ? [{ name: 'l', at: 0 }, { name: 'r', at: r }] : [], window: list.length ? [0, r] : undefined }), arr(list.map(([, v]) => v), { label: 'values' })])
    while (l <= r) {
      const m = l + Math.floor((r - l) / 2)
      if (list[m][0] <= timestamp) { // [4] not newer than the query: a candidate. Look right for a newer one
        best = list[m][1]
        l = m + 1
      } else {
        r = m - 1 // [4] newer than the query: too late. Look left
      }
      t.step(4, list[m][0] <= timestamp ? `Time ${list[m][0]} is at most ${timestamp}, so "${list[m][1]}" is a candidate. A later pair might fit too: go right.` : `Time ${list[m][0]} is after ${timestamp}. Too new: go left.`, [arr(list.map(([ts]) => ts), { label: `timestamps of "${key}"  (query ${timestamp})`, tones: list.map((_, i) => (i === m ? (list[m][0] <= timestamp ? 'hit' : 'miss') : i < l || i > r ? 'dim' : null)), pointers: [{ name: 'l', at: l }, { name: 'r', at: r }].filter((p) => p.at >= 0 && p.at < list.length), window: l <= r ? [l, r] : undefined }), arr(list.map(([, v]) => v), { label: `values  (best so far: ${best === '' ? 'none' : `"${best}"`})`, tones: list.map((_, i) => (i === m ? (list[m][0] <= timestamp ? 'hit' : 'miss') : i < l || i > r ? 'dim' : null)) })])
    }
    t.step(5, best === '' ? `Nothing is at or before ${timestamp}. Return "".` : `The range is empty. The newest value at or before ${timestamp} is "${best}".`, [arr(list.map(([ts]) => ts), { label: `timestamps of "${key}"`, tones: list.map(([ts]) => (ts <= timestamp ? 'keep' : 'dim')) }), arr(list.map(([, v]) => v), { label: `answer: ${best === '' ? '""' : `"${best}"`}`, tones: list.map(([, v]) => (v === best ? 'hit' : 'dim')) })])
    return best // [5] the last candidate we kept, or "" if none
  }
}
