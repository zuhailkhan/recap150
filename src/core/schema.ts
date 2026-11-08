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
])

const growth = z.enum(['1', 'n', 'nlogn', 'n2', 'nk', 'nklogk', 'n2k'])
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
    demo: z.enum(['fingerprint', 'complement', 'match']),
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
  compare: z.enum(['exact', 'sortedFlat', 'sortedGroups']),
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
