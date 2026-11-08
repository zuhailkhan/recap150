import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { arr, buckets, cursor, fromMap } from '../../../core/panels'

export function groupAnagramsSorted(strs: string[], t: Tracer = noop): string[][] {
  const groups = new Map<string, string[]>() // [1] fingerprint -> the words that share it
  t.step(1, 'Start with no bins. Each bin will hold the words that share one fingerprint.', [arr(strs, { label: 'words' }), buckets([], { label: 'bins', keyLabel: 'fingerprint', empty: 'no bins yet' })])
  for (let i = 0; i < strs.length; i++) {
    const word = strs[i]
    const key = [...word].sort().join('') // [2] same letters, same sorted key
    t.step(2, `Take "${word}". Its letters sorted are "${key}". That is its fingerprint.`, [arr(strs, { label: 'words', tones: cursor(strs.length, i) }), buckets(fromMap(groups, key), { label: 'bins', keyLabel: 'fingerprint', empty: 'no bins yet' })])
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(word) // [3] drop the word into its bin
    t.step(3, `${groups.get(key)!.length === 1 ? 'New bin' : 'Existing bin'} "${key}". Drop "${word}" in.`, [arr(strs, { label: 'words', tones: cursor(strs.length, i) }), buckets(fromMap(groups, key), { label: 'bins', keyLabel: 'fingerprint' })])
  }
  t.step(4, `All words placed. ${groups.size} bin${groups.size === 1 ? '' : 's'} means ${groups.size} group${groups.size === 1 ? '' : 's'}.`, [buckets([...groups].map(([k, v]) => ({ key: k, items: v, tone: 'hit' as const })), { label: 'bins', keyLabel: 'fingerprint', empty: 'no words, no bins' })])
  return [...groups.values()] // [4] the bins are the answer
}
