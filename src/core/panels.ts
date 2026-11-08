// The shared visual vocabulary. A Panel is plain data; src/visuals renders it.
// Same tone = same meaning everywhere (see Legend in the stepper).
//   focus = what we are looking at now    keep = remembered / stored
//   hit   = match, answer, success         miss = mismatch, rejected
//   dim   = already handled, out of play
export type Tone = 'focus' | 'keep' | 'hit' | 'miss' | 'dim'
export type Cell = string | number
export type Tones = (Tone | null | undefined)[]

export interface Pointer { name: string; at: number; tone?: Tone }
export interface ArrayPanel {
  kind: 'array'
  label?: string
  items: Cell[]
  tones?: Tones
  pointers?: Pointer[]
  window?: [number, number]
}
export interface Bucket { key: string; items: Cell[]; tone?: Tone; itemTones?: Tones }
export interface BucketsPanel { kind: 'buckets'; label?: string; keyLabel?: string; buckets: Bucket[]; empty?: string }
/** items are listed bottom -> top */
export interface StackPanel { kind: 'stack'; label?: string; items: Cell[]; tones?: Tones; empty?: string }

// More kinds (list, tree, graph, grid, dp, intervals, heap, trie, bits) are added in the
// category that first needs them, so the library only holds visuals that are in use.
export type Panel = ArrayPanel | BucketsPanel | StackPanel

export interface Frame { stage: number; say: string; panels: Panel[] }

type ArrOpts = Omit<ArrayPanel, 'kind' | 'items'>
export const arr = (items: Cell[], o: ArrOpts = {}): ArrayPanel => ({ kind: 'array', items: [...items], ...o })
export const buckets = (b: Bucket[], o: Omit<BucketsPanel, 'kind' | 'buckets'> = {}): BucketsPanel => ({
  kind: 'buckets', buckets: b.map((x) => ({ ...x, items: [...x.items] })), ...o,
})
export const stack = (items: Cell[], o: Omit<StackPanel, 'kind' | 'items'> = {}): StackPanel => ({ kind: 'stack', items: [...items], ...o })
/** Tones array where only the given indexes are set. */
export const mark = (len: number, set: Record<number, Tone>): Tones => Array.from({ length: len }, (_, i) => set[i] ?? null)
/** Tones for a left-to-right scan: handled items dim, the current one is in focus. */
export const cursor = (len: number, at: number): Tones => Array.from({ length: len }, (_, j) => (j < at ? 'dim' : j === at ? 'focus' : null))
/** A stack with one extra, just-popped item shown on top in the given tone. */
export const withTop = (items: Cell[], top: Cell | undefined, tone: Tone): StackPanel =>
  top === undefined ? stack(items) : stack([...items, top], { tones: [...items.map(() => null), tone] })
/** Turn a Map into bucket data. Values may be a single cell or a list of cells. */
export const fromMap = (m: Map<Cell, Cell | Cell[]>, hot?: Cell): Bucket[] =>
  [...m].map(([k, v]) => ({ key: String(k), items: Array.isArray(v) ? v : [v], tone: k === hot ? 'focus' : undefined }))
