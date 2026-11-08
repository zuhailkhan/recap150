import { z } from 'zod'

export const CATEGORIES = [
  'Arrays & Hashing', 'Two Pointers', 'Sliding Window', 'Stack', 'Binary Search', 'Linked List',
  'Trees', 'Tries', 'Heap / Priority Queue', 'Backtracking', 'Graphs', 'Advanced Graphs',
  '1-D Dynamic Programming', '2-D Dynamic Programming', 'Greedy', 'Intervals', 'Math & Geometry', 'Bit Manipulation',
] as const

const tone = z.enum(['focus', 'keep', 'hit', 'miss', 'dim'])
const cell = z.union([z.string(), z.number()])
const tones = z.array(tone.nullable().optional())

export const panelSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('array'), label: z.string().optional(), items: z.array(cell), tones: tones.optional(),
    pointers: z.array(z.object({ name: z.string(), at: z.number().int(), tone: tone.optional() })).optional(),
    window: z.tuple([z.number().int(), z.number().int()]).optional(),
  }),
  z.object({
    kind: z.literal('buckets'), label: z.string().optional(), keyLabel: z.string().optional(), empty: z.string().optional(),
    buckets: z.array(z.object({ key: z.string(), items: z.array(cell), tone: tone.optional(), itemTones: tones.optional() })),
  }),
  z.object({ kind: z.literal('stack'), label: z.string().optional(), items: z.array(cell), tones: tones.optional(), empty: z.string().optional() }),
  z.object({
    kind: z.literal('list'), label: z.string().optional(), items: z.array(cell), tones: tones.optional(), cycleTo: z.number().int().optional(), doubly: z.boolean().optional(),
    pointers: z.array(z.object({ name: z.string(), at: z.number().int(), tone: tone.optional() })).optional(),
    links: z.array(z.object({ from: z.number().int(), to: z.number().int(), label: z.string().optional() })).optional(),
  }),
  z.object({
    kind: z.literal('tree'), label: z.string().optional(), nodes: z.array(cell.nullable()), tones: tones.optional(),
    pointers: z.array(z.object({ name: z.string(), at: z.number().int(), tone: tone.optional() })).optional(),
  }),
  z.object({
    kind: z.literal('graph'), label: z.string().optional(),
    nodes: z.array(z.object({ id: z.string(), x: z.number().optional(), y: z.number().optional() })),
    edges: z.array(z.object({ from: z.string(), to: z.string(), directed: z.boolean().optional(), weight: z.number().optional(), tone: tone.optional() })),
    tones: z.record(z.string(), tone).optional(), notes: z.record(z.string(), z.string()).optional(),
  }),
  z.object({
    kind: z.literal('grid'), label: z.string().optional(), cells: z.array(z.array(cell)), tones: z.array(tones).optional(),
    pointers: z.array(z.object({ r: z.number().int(), c: z.number().int(), name: z.string(), tone: tone.optional() })).optional(),
  }),
  z.object({ kind: z.literal('dp'), label: z.string().optional(), cells: z.array(z.array(cell)), tones: z.array(tones).optional(), rowLabels: z.array(cell).optional(), colLabels: z.array(cell).optional() }),
  z.object({
    kind: z.literal('intervals'), label: z.string().optional(), min: z.number().optional(), max: z.number().optional(),
    spans: z.array(z.object({ start: z.number(), end: z.number(), label: z.string().optional(), tone: tone.optional() })),
    marks: z.array(z.object({ at: z.number(), label: z.string().optional() })).optional(),
  }),
  z.object({ kind: z.literal('heap'), label: z.string().optional(), items: z.array(cell), tones: tones.optional(), max: z.boolean().optional() }),
  z.object({ kind: z.literal('trie'), label: z.string().optional(), words: z.array(z.string()), hot: z.string().optional(), hotTone: tone.optional() }),
  z.object({ kind: z.literal('bits'), label: z.string().optional(), width: z.number().int().optional(), rows: z.array(z.object({ label: z.string(), value: z.number(), tones: tones.optional() })) }),
])

const growth = z.enum(['1', 'logn', 'n', 'nlogn', 'n2', 'n3', '2n', 'nk', 'nklogk', 'n2k', 'nm', 'nlogm'])
const slug = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/)
const short = (max: number) => z.string().min(3).max(max)

const stage = z.object({ n: z.number().int().min(1), title: short(40), note: short(220) })
const variant = z.object({
  id: z.string().regex(/^[a-z][a-z0-9]*$/),
  label: short(24),
  tsFn: z.string(),
  goFn: z.string(),
  stages: z.array(stage).min(2).max(7),
})

const base = {
  slug,
  title: z.string().min(2),
  category: z.enum(CATEGORIES),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']),
}

const ready = z.object({
  ...base,
  status: z.literal('ready'),
  statement: z.string().min(40).max(600),
  example: z.object({ caption: short(160), input: z.array(panelSchema).min(1), output: z.array(panelSchema).min(1) }),
  idea: z.object({
    sentence: z.string().min(20).max(240),
    /** A shared demo name (fingerprint, complement, match) or 'custom' for problems/<slug>/Demo.vue */
    demo: z.string().min(3),
    jargon: z.array(z.object({ term: z.string(), plain: z.string() })).default([]),
  }),
  watch: z.object({
    inputHint: z.string(),
    presets: z.array(z.object({ label: short(30), args: z.array(z.unknown()) })).min(2).max(5),
  }),
  fast: z.object({
    vars: z.array(z.object({ sym: z.string(), meaning: z.string() })).min(1),
    compare: z.object({ brute: growth, optimal: growth, bruteLabel: z.string(), optimalLabel: z.string(), unit: z.string() }),
    rows: z.array(z.object({ name: z.string(), time: z.string(), space: z.string(), note: z.string() })).min(2),
    takeaway: short(240),
  }),
  variants: z.array(variant).min(1).max(3),
  goArgs: z.array(z.string()).min(1),
  goRet: z.string(),
  compare: z.enum(['exact', 'sortedFlat', 'sortedGroups', 'approx']),
  edges: z.array(z.object({ title: short(40), input: z.string(), output: z.string(), why: short(200) })).length(4),
  gotchas: z.array(z.object({ lang: z.enum(['General', 'TypeScript', 'Go']), text: short(300) })).min(2),
  recap: z.object({ pattern: short(40), key: short(200), complexity: short(80), moves: z.array(short(120)).min(3).max(4) }),
})

/** Drafts only need identity fields; everything else may be unfinished. They never reach recap. */
const draft = z.object({ ...base, status: z.literal('draft') }).passthrough()

export const metaSchema = z.discriminatedUnion('status', [ready, draft])
export type ReadyMeta = z.infer<typeof ready>
export type ProblemMeta = z.infer<typeof metaSchema>
export type Variant = z.infer<typeof variant>

export const casesSchema = z
  .array(z.object({ name: z.string(), input: z.array(z.unknown()), expected: z.unknown(), edge: z.boolean().optional() }))
  .min(4)
export type Cases = z.infer<typeof casesSchema>
