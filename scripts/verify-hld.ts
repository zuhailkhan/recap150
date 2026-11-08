// npm run verify:hld: checks every src/design/hld/<slug>/meta.json.
// Schema, catalog match, graph integrity, evolution, flows, estimator maths and diagram layout.
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { hldSchema, type HldMeta } from '../src/core/designSchema'
import { evalExpr } from '../src/core/expr'
import catalog from '../src/design/catalog.json'

const root = resolve(import.meta.dirname, '..')
const dir = join(root, 'src/design/hld')
const errors: string[] = []
const fail = (slug: string, msg: string) => errors.push(`${slug}: ${msg}`)

const only = process.argv.find((a) => a.startsWith('--only='))?.slice(7).split(',').filter(Boolean)
const slugs = (existsSync(dir) ? readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name) : []).filter((s) => !only || only.includes(s))
let ready = 0, draft = 0

// The diagram canvas is 760x440 with nodes 124x56. Percent units, so a node is about 17% wide and 14% tall.
const NW = (124 / 720) * 100
const NH = (56 / 392) * 100

type Pt = { x: number; y: number }
const segHitsBox = (a: Pt, b: Pt, c: Pt): boolean => {
  // sample the segment, ignoring the first and last 22% so edges can touch their own end nodes
  for (let t = 0.22; t <= 0.78; t += 0.02) {
    const x = a.x + (b.x - a.x) * t, y = a.y + (b.y - a.y) * t
    if (Math.abs(x - c.x) < NW / 2 - 0.3 && Math.abs(y - c.y) < NH / 2 - 0.3) return true
  }
  return false
}

for (const slug of slugs) {
  const metaPath = join(dir, slug, 'meta.json')
  if (!existsSync(metaPath)) { fail(slug, 'meta.json is missing'); continue }
  const parsed = hldSchema.safeParse(JSON.parse(readFileSync(metaPath, 'utf8')))
  if (!parsed.success) { for (const i of parsed.error.issues) fail(slug, `schema: ${i.path.join('.')} ${i.message}`); continue }
  const meta = parsed.data
  if (meta.slug !== slug) fail(slug, `meta.slug "${meta.slug}" does not match the folder name`)
  const c = catalog.find((x) => x.track === 'hld' && x.slug === slug)
  if (!c) fail(slug, 'not in src/design/catalog.json')
  else {
    if (c.title !== meta.title) fail(slug, `title should be "${c.title}"`)
    if (c.group !== meta.group) fail(slug, `group should be "${c.group}"`)
    if (c.difficulty !== meta.difficulty) fail(slug, `difficulty should be "${c.difficulty}"`)
  }
  if (meta.status === 'draft') { draft++; continue }
  ready++
  const m = meta as HldMeta

  // ---- graph integrity
  const ids = new Set<string>()
  for (const n of m.nodes) { if (ids.has(n.id)) fail(slug, `duplicate node id "${n.id}"`); ids.add(n.id) }
  const steps = m.evolution.length
  for (const n of m.nodes) if (n.since >= steps) fail(slug, `node "${n.id}" appears at step ${n.since} but there are only ${steps} steps`)
  for (const e of m.edges) {
    if (!ids.has(e.from) || !ids.has(e.to)) fail(slug, `edge ${e.from}>${e.to} uses an unknown node`)
    if (e.since >= steps) fail(slug, `edge ${e.from}>${e.to} appears at step ${e.since} but there are only ${steps} steps`)
    if (e.until !== undefined && e.until <= e.since) fail(slug, `edge ${e.from}>${e.to} has until <= since`)
    const a = m.nodes.find((n) => n.id === e.from), b = m.nodes.find((n) => n.id === e.to)
    if (a && b && a.since > e.since) fail(slug, `edge ${e.from}>${e.to} appears before its node "${a.id}"`)
    if (a && b && b.since > e.since) fail(slug, `edge ${e.from}>${e.to} appears before its node "${b.id}"`)
  }
  for (let i = 0; i < steps; i++) {
    const adds = m.nodes.filter((n) => n.since === i).length + m.edges.filter((e) => e.since === i).length
    if (adds === 0) fail(slug, `evolution step ${i + 1} ("${m.evolution[i].title}") adds no node or edge`)
  }
  if (!m.nodes.some((n) => n.kind === 'client')) fail(slug, 'the diagram needs a client node')

  // ---- layout, checked at every evolution step
  for (let i = 0; i < steps; i++) {
    const vis = m.nodes.filter((n) => n.since <= i)
    for (let a = 0; a < vis.length; a++) for (let b = a + 1; b < vis.length; b++) {
      if (Math.abs(vis[a].x - vis[b].x) < NW && Math.abs(vis[a].y - vis[b].y) < NH) fail(slug, `nodes "${vis[a].id}" and "${vis[b].id}" overlap at step ${i + 1}`)
    }
    for (const e of m.edges.filter((x) => x.since <= i && (x.until === undefined || i < x.until))) {
      const a = vis.find((n) => n.id === e.from), b = vis.find((n) => n.id === e.to)
      if (!a || !b) continue
      for (const n of vis) if (n !== a && n !== b && segHitsBox(a, b, n)) fail(slug, `edge ${e.from}>${e.to} passes through node "${n.id}" at step ${i + 1}`)
    }
  }

  // ---- flows use the finished design
  const last = steps - 1
  const finalEdges = new Set(m.edges.filter((e) => e.since <= last && (e.until === undefined || last < e.until)).map((e) => `${e.from}>${e.to}`))
  for (const f of m.flows) {
    f.steps.forEach((st, k) => {
      for (const id of st.nodes) if (!ids.has(id)) fail(slug, `flow "${f.name}" step ${k + 1} uses unknown node "${id}"`)
      for (const [a, b] of st.edges) if (!finalEdges.has(`${a}>${b}`)) fail(slug, `flow "${f.name}" step ${k + 1} uses edge ${a}>${b}, which is not in the finished design`)
      if (st.nodes.length === 0) fail(slug, `flow "${f.name}" step ${k + 1} highlights nothing`)
    })
  }

  // ---- estimator: finite numbers at the defaults and at both extremes
  const inIds = new Set(m.estimate.inputs.map((i) => i.id))
  const outIds = new Set<string>()
  for (const o of m.estimate.outputs) { if (inIds.has(o.id) || outIds.has(o.id)) fail(slug, `estimator id "${o.id}" is used twice`); outIds.add(o.id) }
  for (const i of m.estimate.inputs) if (!(i.min <= i.value && i.value <= i.max)) fail(slug, `input "${i.id}" default ${i.value} is outside ${i.min}..${i.max}`)
  const scenarios: [string, (i: HldMeta['estimate']['inputs'][number]) => number][] = [['defaults', (i) => i.value], ['all minimums', (i) => i.min], ['all maximums', (i) => i.max]]
  for (const [name, pick] of scenarios) {
    const vars: Record<string, number> = Object.fromEntries(m.estimate.inputs.map((i) => [i.id, pick(i)]))
    for (const o of m.estimate.outputs) {
      try {
        const v = evalExpr(o.expr, vars)
        vars[o.id] = v
        if (!Number.isFinite(v) || v < 0) fail(slug, `estimator "${o.id}" gives ${v} at ${name}`)
      } catch (e) { fail(slug, `estimator "${o.id}": ${(e as Error).message}`); break }
    }
  }
}

if (errors.length) {
  console.error(`\nverify:hld FAILED (${errors.length})\n` + errors.map((e) => ' - ' + e).join('\n'))
  process.exit(1)
}
const total = catalog.filter((c) => c.track === 'hld').length
console.log(`verify:hld OK. ${ready} ready, ${draft} draft, ${total - ready - draft} not started.`)
