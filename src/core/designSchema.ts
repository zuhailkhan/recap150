import { z } from 'zod'
import { panelSchema } from './schema'

const slug = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/)
const short = (max: number, min = 3) => z.string().min(min).max(max)
const difficulty = z.enum(['Easy', 'Medium', 'Hard'])

export const LLD_GROUPS = ['Big products', 'Booking and reservation', 'State machines', 'Games', 'Events and messaging', 'Money and rules', 'Storage-like'] as const
export const HLD_GROUPS = ['Ride, food and marketplaces', 'Social and messaging', 'Media and streaming', 'Productivity, maps and payments', 'Building blocks'] as const

export const catalogSchema = z.array(z.object({
  slug, title: z.string().min(2), track: z.enum(['lld', 'hld']), group: z.string(), difficulty,
}))
export type CatalogEntry = z.infer<typeof catalogSchema>[number]

const stage = z.object({ n: z.number().int().min(1), title: short(40), note: short(220) })
const variant = z.object({ id: z.string().regex(/^[a-z][a-z0-9]*$/), label: short(24), tsFn: z.string(), goFn: z.string(), stages: z.array(stage).min(2).max(7) })
const jargon = z.array(z.object({ term: z.string(), plain: z.string() })).default([])

const base = { slug, title: z.string().min(2), difficulty }

/* ---------------- LLD ---------------- */
const lldReady = z.object({
  ...base,
  group: z.enum(LLD_GROUPS),
  status: z.literal('ready'),
  brief: z.string().min(40).max(600),
  requirements: z.object({ functional: z.array(short(160)).min(3).max(8), outOfScope: z.array(short(160)).max(4).default([]) }),
  idea: z.object({ sentence: z.string().min(20).max(260), jargon }),
  model: z.object({
    label: z.string().optional(),
    classes: z.array(z.object({ name: z.string(), kind: z.enum(['class', 'interface', 'enum']).optional(), fields: z.array(z.string()).optional(), methods: z.array(z.string()).optional(), x: z.number().int().min(0), y: z.number().int().min(0) })).min(3).max(10),
    relations: z.array(z.object({ from: z.string(), to: z.string(), kind: z.enum(['inherits', 'implements', 'has', 'uses', 'creates']), label: z.string().optional() })).min(2),
  }),
  patterns: z.array(z.object({ name: short(40), where: short(200), why: short(240) })).min(1).max(5),
  decisions: z.array(z.object({ question: short(120), choice: short(160), because: short(260), instead: short(200) })).min(2).max(4),
  followups: z.array(z.object({ ask: short(140), answer: short(420) })).min(3).max(5),
  watch: z.object({ inputHint: z.string(), presets: z.array(z.object({ label: short(30), args: z.array(z.unknown()) })).min(2).max(4) }),
  variants: z.array(variant).min(1).max(2),
  goArgs: z.array(z.string()).min(1),
  goRet: z.string(),
  compare: z.enum(['exact', 'sortedFlat', 'sortedGroups', 'approx']),
  gotchas: z.array(z.object({ lang: z.enum(['General', 'TypeScript', 'Go']), text: short(300) })).min(2),
  recap: z.object({ pattern: short(60), key: short(200), moves: z.array(short(120)).min(3).max(4) }),
})
const lldDraft = z.object({ ...base, group: z.enum(LLD_GROUPS), status: z.literal('draft') }).passthrough()
export const lldSchema = z.discriminatedUnion('status', [lldReady, lldDraft])
export type LldMeta = z.infer<typeof lldReady>

/* ---------------- HLD ---------------- */
const nodeKind = z.enum(['client', 'lb', 'service', 'cache', 'db', 'queue', 'blob', 'cdn', 'worker', 'external'])
const hldReady = z.object({
  ...base,
  group: z.enum(HLD_GROUPS),
  status: z.literal('ready'),
  brief: z.string().min(40).max(600),
  requirements: z.object({
    functional: z.array(short(160)).min(3).max(7),
    nonFunctional: z.array(z.object({ name: short(40), target: short(120) })).min(2).max(6),
    outOfScope: z.array(short(160)).max(4).default([]),
  }),
  estimate: z.object({
    note: short(240).optional(),
    inputs: z.array(z.object({ id: z.string().regex(/^[a-z][a-zA-Z0-9_]*$/), label: short(48), value: z.number(), min: z.number(), max: z.number(), step: z.number().positive().optional(), unit: z.string().optional(), log: z.boolean().optional() })).min(2).max(6),
    outputs: z.array(z.object({ id: z.string().regex(/^[a-z][a-zA-Z0-9_]*$/), label: short(48), expr: z.string().min(1), unit: z.string(), note: short(160).optional() })).min(2).max(7),
  }),
  api: z.array(z.object({ call: short(80), does: short(160) })).min(2).max(7),
  data: z.array(z.object({ entity: short(40), fields: short(160), store: short(60), why: short(200) })).min(1).max(4),
  nodes: z.array(z.object({ id: z.string().regex(/^[a-z][a-z0-9_]*$/), label: short(24), kind: nodeKind, x: z.number().min(0).max(100), y: z.number().min(0).max(100), sub: short(28).optional(), since: z.number().int().min(0) })).min(4).max(16),
  /** an edge exists from step `since` up to, but not including, step `until` */
  edges: z.array(z.object({ from: z.string(), to: z.string(), label: short(24).optional(), dashed: z.boolean().optional(), since: z.number().int().min(0), until: z.number().int().min(1).optional() })).min(3),
  evolution: z.array(z.object({ title: short(48), problem: short(260), change: short(260), numbers: short(160).optional() })).min(3).max(7),
  flows: z.array(z.object({ name: short(40), steps: z.array(z.object({ say: short(220), nodes: z.array(z.string()), edges: z.array(z.tuple([z.string(), z.string()])) })).min(3).max(10) })).min(1).max(4),
  deepDives: z.array(z.object({
    title: short(60), question: short(200),
    options: z.array(z.object({ name: short(48), pros: short(200), cons: short(200) })).min(2).max(3),
    pick: short(60), because: short(320),
  })).min(2).max(4),
  failures: z.array(z.object({ what: short(100), impact: short(160), fix: short(220) })).min(3).max(5),
  scaling: z.array(z.object({ limit: short(120), lever: short(220) })).min(2).max(4),
  recap: z.object({ key: short(220), numbers: short(200), moves: z.array(short(120)).min(3).max(4) }),
})
const hldDraft = z.object({ ...base, group: z.enum(HLD_GROUPS), status: z.literal('draft') }).passthrough()
export const hldSchema = z.discriminatedUnion('status', [hldReady, hldDraft])
export type HldMeta = z.infer<typeof hldReady>

export { panelSchema }
