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

/** Singly linked list drawn left to right. cycleTo draws the tail pointing back to that index. links are extra arrows (e.g. random pointers). */
export interface ListPanel { kind: "list"; label?: string; items: Cell[]; tones?: Tones; pointers?: Pointer[]; cycleTo?: number; links?: { from: number; to: number; label?: string }[]; doubly?: boolean }
/** Binary tree from a level-order array (null = no child), like the usual LeetCode notation. tones are by array index. */
export interface TreePanel { kind: "tree"; label?: string; nodes: (Cell | null)[]; tones?: Tones; pointers?: Pointer[] }
export interface GraphNode { id: string; x?: number; y?: number }
export interface GraphEdge { from: string; to: string; directed?: boolean; weight?: number; tone?: Tone }
/** Nodes without x/y are placed on a circle. x and y are 0..100. */
export interface GraphPanel { kind: "graph"; label?: string; nodes: GraphNode[]; edges: GraphEdge[]; tones?: Record<string, Tone>; notes?: Record<string, string> }
/** Plain 2-D grid (islands, matrices, boards). */
export interface GridPanel { kind: "grid"; label?: string; cells: Cell[][]; tones?: Tones[]; pointers?: { r: number; c: number; name: string; tone?: Tone }[] }
/** DP table with optional row and column headers. 1-D tables use a single row. */
export interface DpPanel { kind: "dp"; label?: string; cells: Cell[][]; tones?: Tones[]; rowLabels?: Cell[]; colLabels?: Cell[] }
export interface Span { start: number; end: number; label?: string; tone?: Tone }
export interface IntervalsPanel { kind: "intervals"; label?: string; spans: Span[]; min?: number; max?: number; marks?: { at: number; label?: string }[] }
/** Binary heap in array form. Drawn as a tree with the array underneath. */
export interface HeapPanel { kind: "heap"; label?: string; items: Cell[]; tones?: Tones; max?: boolean }
/** Trie built from words. hot is a prefix to highlight. */
export interface TriePanel { kind: "trie"; label?: string; words: string[]; hot?: string; hotTone?: Tone }
/** Rows of binary digits, e.g. a, b and a & b. */
export interface BitsPanel { kind: "bits"; label?: string; width?: number; rows: { label: string; value: number; tones?: Tones }[] }

/** UML-style class box. x and y are grid positions (column, row), not pixels. */
export interface ClassBox { name: string; kind?: 'class' | 'interface' | 'enum'; fields?: string[]; methods?: string[]; x: number; y: number }
export interface ClassRel { from: string; to: string; kind: 'inherits' | 'implements' | 'has' | 'uses' | 'creates'; label?: string }
/** LLD class diagram. tones highlight classes by name. */
export interface ClassesPanel { kind: 'classes'; label?: string; classes: ClassBox[]; relations: ClassRel[]; tones?: Record<string, Tone> }
export interface SeqMessage { from: string; to: string; label: string; dashed?: boolean; tone?: Tone }
/** Sequence diagram: lifelines for the actors and one arrow per message, top to bottom. */
export interface SeqPanel { kind: 'seq'; label?: string; actors: string[]; messages: SeqMessage[] }
export type ArchKind = 'client' | 'lb' | 'service' | 'cache' | 'db' | 'queue' | 'blob' | 'cdn' | 'worker' | 'external'
/** x and y are 0..100 across the canvas. */
export interface ArchNode { id: string; label: string; kind: ArchKind; x: number; y: number; sub?: string }
export interface ArchEdge { from: string; to: string; label?: string; dashed?: boolean; tone?: Tone }
/** HLD architecture diagram. tones highlight nodes by id. */
export interface ArchPanel { kind: 'arch'; label?: string; nodes: ArchNode[]; edges: ArchEdge[]; tones?: Record<string, Tone> }

export type Panel = ArrayPanel | BucketsPanel | StackPanel | ListPanel | TreePanel | GraphPanel | GridPanel | DpPanel | IntervalsPanel | HeapPanel | TriePanel | BitsPanel | ClassesPanel | SeqPanel | ArchPanel

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

export const list = (items: Cell[], o: Omit<ListPanel, "kind" | "items"> = {}): ListPanel => ({ kind: "list", items: [...items], ...o })
export const tree = (nodes: (Cell | null)[], o: Omit<TreePanel, "kind" | "nodes"> = {}): TreePanel => ({ kind: "tree", nodes: [...nodes], ...o })
export const graph = (nodes: (string | number)[] | GraphNode[], edges: GraphEdge[], o: Omit<GraphPanel, "kind" | "nodes" | "edges"> = {}): GraphPanel => ({
  kind: "graph", nodes: (nodes as (string | number | GraphNode)[]).map((n) => (typeof n === "object" ? n : { id: String(n) })), edges: edges.map((e) => ({ ...e })), ...o,
})
export const grid = (cells: Cell[][], o: Omit<GridPanel, "kind" | "cells"> = {}): GridPanel => ({ kind: "grid", cells: cells.map((r) => [...r]), ...o })
export const dp = (cells: Cell[][], o: Omit<DpPanel, "kind" | "cells"> = {}): DpPanel => ({ kind: "dp", cells: cells.map((r) => [...r]), ...o })
export const intervals = (spans: Span[], o: Omit<IntervalsPanel, "kind" | "spans"> = {}): IntervalsPanel => ({ kind: "intervals", spans: spans.map((s) => ({ ...s })), ...o })
export const heap = (items: Cell[], o: Omit<HeapPanel, "kind" | "items"> = {}): HeapPanel => ({ kind: "heap", items: [...items], ...o })
export const trie = (words: string[], o: Omit<TriePanel, "kind" | "words"> = {}): TriePanel => ({ kind: "trie", words: [...words], ...o })
export const bits = (rows: BitsPanel["rows"], o: Omit<BitsPanel, "kind" | "rows"> = {}): BitsPanel => ({ kind: "bits", rows: rows.map((r) => ({ ...r })), ...o })
/** 2-D tones with only the given [r,c] cells set. */
export const mark2 = (rows: number, cols: number, set: [number, number, Tone][]): Tones[] => {
  const t: Tones[] = Array.from({ length: rows }, () => Array<Tone | null>(cols).fill(null))
  for (const [r, c, tone] of set) if (t[r]) t[r][c] = tone
  return t
}
/** Values of a linked list, head first. Stops after cap nodes so a cycle cannot hang the tracer. */
export const listVals = <N extends { val: Cell; next: N | null }>(head: N | null, cap = 40): Cell[] => {
  const out: Cell[] = []
  for (let n = head; n && out.length < cap; n = n.next) out.push(n.val)
  return out
}

export const classes = (cs: ClassBox[], relations: ClassRel[], o: Omit<ClassesPanel, 'kind' | 'classes' | 'relations'> = {}): ClassesPanel => ({ kind: 'classes', classes: cs.map((c) => ({ ...c })), relations: relations.map((r) => ({ ...r })), ...o })
export const seq = (actors: string[], messages: SeqMessage[], o: Omit<SeqPanel, 'kind' | 'actors' | 'messages'> = {}): SeqPanel => ({ kind: 'seq', actors: [...actors], messages: messages.map((m) => ({ ...m })), ...o })
export const arch = (nodes: ArchNode[], edges: ArchEdge[], o: Omit<ArchPanel, 'kind' | 'nodes' | 'edges'> = {}): ArchPanel => ({ kind: 'arch', nodes: nodes.map((n) => ({ ...n })), edges: edges.map((e) => ({ ...e })), ...o })
