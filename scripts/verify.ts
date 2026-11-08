// npm run verify:content
// Checks every problem folder: schema, shared stages, traces, TypeScript cases, Go vet + Go tests.
// Also rewrites PROGRESS.md from the results.
import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { spawnSync } from 'node:child_process'
import { metaSchema, casesSchema, panelSchema, CATEGORIES, type ReadyMeta } from '../src/core/schema'
import { stagesIn, stripTraceCode, stripGoPackage, badTraceLines } from '../src/core/codeUtils'
import { runTrace, TARGET_STEPS, MAX_STEPS } from '../src/core/tracer'
import { same } from '../src/core/compare'
import official from '../src/data/neetcode150.json'
import { lldSchema } from '../src/core/designSchema'
import catalog from '../src/design/catalog.json'

const root = resolve(import.meta.dirname, '..')
// --track=lld checks src/design/lld with the LLD schema; the default checks the DSA problems
const isLld = process.argv.includes('--track=lld')
const problemsDir = join(root, isLld ? 'src/design/lld' : 'src/problems')
const errors: string[] = []
const fail = (slug: string, msg: string) => errors.push(`${slug}: ${msg}`)
const eq = (a: number[], b: number[]) => a.join() === b.join()

const readyForGo: { meta: ReadyMeta; pkg: string }[] = []
const status = new Map<string, 'ready' | 'draft'>()

/** Go package name: the slug with - as _, and a p_ prefix when it starts with a digit (3sum -> p_3sum). */
const pkgOf = (slug: string) => (isLld ? 'lld_' : /^[0-9]/.test(slug) ? 'p_' : '') + slug.replaceAll('-', '_')
const argv = process.argv.slice(2)
const onlyArg = argv.find((a) => a.startsWith('--only='))?.slice(7)
const only = onlyArg ? new Set(onlyArg.split(',').filter(Boolean)) : null
const skipProgress = argv.includes('--no-progress') || !!only || isLld
const allSlugs = readdirSync(problemsDir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)
const slugs = only ? allSlugs.filter((s) => only.has(s)) : allSlugs
if (only) for (const o of only) if (!allSlugs.includes(o)) errors.push(`${o}: no such problem folder`)

for (const slug of slugs) {
  const dir = join(problemsDir, slug)
  const metaPath = join(dir, 'meta.json')
  if (!existsSync(metaPath)) { fail(slug, 'meta.json is missing'); continue }
  const parsed = (isLld ? lldSchema : metaSchema).safeParse(JSON.parse(readFileSync(metaPath, 'utf8')))
  if (!parsed.success) {
    for (const i of parsed.error.issues) fail(slug, `schema: ${i.path.join('.')} ${i.message}`)
    continue
  }
  const meta = parsed.data as unknown as ReadyMeta & { group?: string }
  status.set(slug, meta.status)
  if (meta.slug !== slug) fail(slug, `meta.slug "${meta.slug}" does not match the folder name`)
  if (isLld) {
    const c = catalog.find((x) => x.track === 'lld' && x.slug === slug)
    if (!c) fail(slug, 'not in src/design/catalog.json')
    else {
      if (c.title !== meta.title) fail(slug, `title should be "${c.title}"`)
      if (c.group !== meta.group) fail(slug, `group should be "${c.group}"`)
      if (c.difficulty !== meta.difficulty) fail(slug, `difficulty should be "${c.difficulty}"`)
    }
  } else {
    const off = official.find((o) => o.slug === slug)
    if (!off) fail(slug, 'not in the official NeetCode 150 list')
    else {
      if (off.title !== meta.title) fail(slug, `title should be "${off.title}"`)
      if (off.category !== meta.category) fail(slug, `category should be "${off.category}"`)
      if (off.difficulty !== meta.difficulty) fail(slug, `difficulty should be "${off.difficulty}"`)
    }
  }
  if ((meta as { status: string }).status === 'draft') continue

  // ---- cases
  const casesParsed = casesSchema.safeParse(JSON.parse(readFileSync(join(dir, 'cases.json'), 'utf8')))
  if (!casesParsed.success) { for (const i of casesParsed.error.issues) fail(slug, `cases: ${i.path.join('.')} ${i.message}`); continue }
  const cases = casesParsed.data
  if (cases.filter((c) => c.edge).length < 2) fail(slug, 'cases.json needs at least 2 cases marked "edge": true')
  for (const c of cases) if (c.input.length !== meta.goArgs.length) fail(slug, `case "${c.name}" has ${c.input.length} args, goArgs has ${meta.goArgs.length}`)

  // ---- demo
  if (!isLld && !['fingerprint', 'complement', 'match', 'custom'].includes(meta.idea.demo)) fail(slug, `idea.demo "${meta.idea.demo}" is not a shared demo. Use "custom" with a Demo.vue`)
  if (!isLld && meta.idea.demo === 'custom' && !existsSync(join(dir, 'Demo.vue'))) fail(slug, 'idea.demo is "custom" but Demo.vue is missing')

  // ---- variants: files, shared stages, TypeScript cases
  const stageSets: number[][] = []
  meta.variants.forEach((v, vi) => {
    const want = v.stages.map((s) => s.n).sort((a, b) => a - b)
    stageSets.push(want)
    const paths: Record<string, string> = { ts: join(dir, 'ts', `${v.id}.ts`), go: join(dir, 'go', `${v.id}.go`), ...(isLld ? {} : { pseudo: join(dir, 'pseudo', `${v.id}.txt`) }) }
    for (const [k, p] of Object.entries(paths)) if (!existsSync(p)) fail(slug, `${v.id}: missing ${k} file ${p}`)
    if (!Object.values(paths).every(existsSync)) return
    const tsRaw = readFileSync(paths.ts, 'utf8')
    for (const l of badTraceLines(tsRaw)) fail(slug, `${v.id}: tracer call must be one complete line: ${l.trim().slice(0, 60)}`)
    const goRaw = readFileSync(paths.go, 'utf8')
    const pkg = pkgOf(slug)
    if (!goRaw.startsWith(`package ${pkg}\n`)) fail(slug, `${v.id}: Go file must start with "package ${pkg}"`)
    const got = {
      ...(isLld ? {} : { pseudo: stagesIn(readFileSync(paths.pseudo, 'utf8')) }),
      ts: stagesIn(stripTraceCode(tsRaw)),
      go: stagesIn(stripGoPackage(goRaw)),
    }
    for (const [lang, st] of Object.entries(got)) if (!eq(st, want)) fail(slug, `${v.id}: ${lang} stages [${st}] differ from meta stages [${want}]`)
    if (/\bt\.step\b|Tracer|[,(]\s*t\s*[,)]/.test(stripTraceCode(tsRaw))) fail(slug, `${v.id}: tracer code leaked into the displayed TypeScript`)
    const driver = join(dir, 'ts', `${v.id}.driver.ts`)
    ;(v as any)._mod = existsSync(driver) ? driver : paths.ts
    const gdriver = join(dir, 'go', `${v.id}.driver.go`)
    if (existsSync(gdriver) && !readFileSync(gdriver, 'utf8').startsWith(`package ${pkg}
`)) fail(slug, `${v.id}: Go driver must start with "package ${pkg}"`)
  })
  for (const s of stageSets) if (!eq(s, stageSets[0])) fail(slug, 'all variants must use the same stage numbers')

  for (const [vi, v] of meta.variants.entries()) {
    const file = (v as any)._mod as string | undefined
    if (!file) continue
    let mod: Record<string, (...a: any[]) => unknown>
    try { mod = await import(pathToFileURL(file).href) } catch (e) { fail(slug, `${v.id}: cannot import: ${e}`); continue }
    const fn = mod[v.tsFn]
    if (typeof fn !== 'function') { fail(slug, `${v.id}: ts file does not export ${v.tsFn}`); continue }
    for (const c of cases) {
      try {
        // Run through the tracer for the traced variant so tracing can never change the answer.
        const out = vi === 0 ? runTrace(fn, c.input, MAX_STEPS * 10) : { result: fn(...structuredClone(c.input)), error: undefined as string | undefined }
        if (out.error) fail(slug, `${v.id} case "${c.name}" threw: ${out.error}`)
        else if (!same(out.result, c.expected, meta.compare)) fail(slug, `${v.id} case "${c.name}": got ${JSON.stringify(out.result)}, expected ${JSON.stringify(c.expected)}`)
      } catch (e) { fail(slug, `${v.id} case "${c.name}" threw: ${e}`) }
    }
    // ---- traces (first variant drives the stepper)
    if (vi === 0) {
      const allowed = new Set(v.stages.map((s) => s.n))
      for (const p of meta.watch.presets) {
        const tr = runTrace(fn, p.args)
        const tag = `preset "${p.label}"`
        if (tr.error) { fail(slug, `${tag} threw: ${tr.error}`); continue }
        if (tr.truncated) fail(slug, `${tag} hit the ${MAX_STEPS}-step cap`)
        if (tr.frames.length < 3) fail(slug, `${tag} has only ${tr.frames.length} steps`)
        if (tr.frames.length > TARGET_STEPS) fail(slug, `${tag} has ${tr.frames.length} steps, keep it to ${TARGET_STEPS} or fewer (use a smaller input)`)
        for (const f of tr.frames) {
          if (!allowed.has(f.stage)) fail(slug, `${tag}: step uses stage ${f.stage}, not declared in meta`)
          for (const pn of f.panels) { const r = panelSchema.safeParse(pn); if (!r.success) fail(slug, `${tag}: bad panel ${JSON.stringify(pn).slice(0, 80)}`) }
        }
        const seen = new Set(tr.frames.map((f) => f.stage))
        const unused = [...allowed].filter((n) => !seen.has(n))
        if (p === meta.watch.presets[0] && unused.length) fail(slug, `first preset never reaches stage(s) ${unused}`)
      }
    }
  }
  readyForGo.push({ meta, pkg: pkgOf(slug) })
}

// ---- Go: copy sources, generate tests from cases.json, gofmt, vet, test
const goRoot = join(root, '.verify', (isLld ? 'lld' : 'go') + (only ? `-${[...only].sort().join('_').slice(0, 60)}` : ''))
rmSync(goRoot, { recursive: true, force: true })
mkdirSync(goRoot, { recursive: true })
writeFileSync(join(goRoot, 'go.mod'), 'module recap150verify\n\ngo 1.22\n')
const cap = (s: string) => s[0].toUpperCase() + s.slice(1)

for (const { meta, pkg } of readyForGo) {
  const out = join(goRoot, pkg)
  mkdirSync(out, { recursive: true })
  const src = join(problemsDir, meta.slug)
  writeFileSync(join(out, 'cases.json'), readFileSync(join(src, 'cases.json')))
  for (const v of meta.variants) {
    writeFileSync(join(out, `${v.id}.go`), readFileSync(join(src, 'go', `${v.id}.go`)))
    const gd = join(src, 'go', `${v.id}.driver.go`)
    if (existsSync(gd)) writeFileSync(join(out, `${v.id}.driver.go`), readFileSync(gd))
  }
  const tests = meta.variants.map((v) => {
    const decls = meta.goArgs.map((t, i) => `\t\t\tvar a${i} ${t}\n\t\t\trcDecode(t, c.Input[${i}], &a${i})`).join('\n')
    const args = meta.goArgs.map((_, i) => `a${i}`).join(', ')
    return `func Test${cap(v.goFn)}(t *testing.T) {
	for _, c := range rcLoadCases(t) {
		t.Run(c.Name, func(t *testing.T) {
${decls}
			rcCheck(t, ${v.goFn}(${args}), c.Expected)
		})
	}
}
`
  }).join('\n')
  writeFileSync(join(out, 'solution_test.go'), `// Code generated by scripts/verify.ts from cases.json. DO NOT EDIT.
package ${pkg}

import (
	"encoding/json"
	"math"
	"os"
	"reflect"
	"sort"
	"testing"
)

const rcMode = "${meta.compare}"

type rcCase struct {
	Name     string            \`json:"name"\`
	Input    []json.RawMessage \`json:"input"\`
	Expected json.RawMessage   \`json:"expected"\`
}

func rcLoadCases(t *testing.T) []rcCase {
	t.Helper()
	raw, err := os.ReadFile("cases.json")
	if err != nil {
		t.Fatal(err)
	}
	var cases []rcCase
	if err := json.Unmarshal(raw, &cases); err != nil {
		t.Fatal(err)
	}
	return cases
}

func rcDecode(t *testing.T, raw json.RawMessage, into any) {
	t.Helper()
	if err := json.Unmarshal(raw, into); err != nil {
		t.Fatal(err)
	}
}

// rcGeneric turns any Go value into plain JSON data. A nil slice and an empty slice both become [].
func rcGeneric(t *testing.T, v any) any {
	t.Helper()
	b, err := json.Marshal(v)
	if err != nil {
		t.Fatal(err)
	}
	var out any
	if err := json.Unmarshal(b, &out); err != nil {
		t.Fatal(err)
	}
	return rcFixNil(out)
}

func rcFixNil(v any) any {
	switch x := v.(type) {
	case nil:
		return []any{}
	case []any:
		for i := range x {
			x[i] = rcFixNil(x[i])
		}
	}
	return v
}

func rcKey(v any) string {
	b, _ := json.Marshal(v)
	return string(b)
}

func rcLess(a, b any) bool {
	if x, ok := a.(float64); ok {
		return x < b.(float64)
	}
	return a.(string) < b.(string)
}

func rcNormalize(v any) any {
	switch rcMode {
	case "sortedFlat":
		xs := v.([]any)
		sort.Slice(xs, func(i, j int) bool { return rcLess(xs[i], xs[j]) })
	case "sortedGroups":
		gs := v.([]any)
		for _, g := range gs {
			inner := g.([]any)
			sort.Slice(inner, func(i, j int) bool { return rcLess(inner[i], inner[j]) })
		}
		sort.Slice(gs, func(i, j int) bool { return rcKey(gs[i]) < rcKey(gs[j]) })
	}
	return v
}

func rcCheck(t *testing.T, got any, expected json.RawMessage) {
	t.Helper()
	var want any
	rcDecode(t, expected, &want)
	if rcMode == "approx" {
		g, w := rcGeneric(t, got).(float64), rcFixNil(want).(float64)
		if math.Abs(g-w) > 1e-5*math.Max(1, math.Abs(w)) {
			t.Fatalf("got %v, want %v", g, w)
		}
		return
	}
	g, w := rcNormalize(rcGeneric(t, got)), rcNormalize(rcFixNil(want))
	if !reflect.DeepEqual(g, w) {
		t.Fatalf("got %s, want %s", rcKey(g), rcKey(w))
	}
}

${tests}`)
}

const run = (cmd: string, args: string[]) => spawnSync(cmd, args, { cwd: goRoot, encoding: 'utf8' })
if (readyForGo.length) {
  const fmt = run('gofmt', ['-l', '.'])
  const unformatted = fmt.stdout.split('\n').filter((l) => l && !l.endsWith('solution_test.go'))
  if (fmt.error) fail('go', `gofmt not available: ${fmt.error.message}`)
  for (const f of unformatted) fail('go', `${f} is not gofmt-formatted (run gofmt -w on the source file)`)
  const vet = run('go', ['vet', './...'])
  if (vet.status !== 0) fail('go', `go vet failed:\n${vet.stdout}${vet.stderr}`)
  const test = run('go', ['test', './...'])
  if (test.status !== 0) fail('go', `go test failed:\n${test.stdout}${test.stderr}`)
}

// ---- PROGRESS.md (only on a full run)
const lines = ['# Progress', '', 'Generated by `npm run verify:content`. Do not edit by hand.', '', '| Category | Ready | Draft | Not started | Total |', '|---|---:|---:|---:|---:|']
let R = 0, D = 0, T = 0
for (const cat of CATEGORIES) {
  const all = official.filter((o) => o.category === cat)
  const ready = all.filter((o) => status.get(o.slug) === 'ready').length
  const draft = all.filter((o) => status.get(o.slug) === 'draft').length
  R += ready; D += draft; T += all.length
  lines.push(`| ${cat} | ${ready} | ${draft} | ${all.length - ready - draft} | ${all.length} |`)
}
lines.push(`| **All** | **${R}** | **${D}** | **${T - R - D}** | **${T}** |`, '')
if (!skipProgress) writeFileSync(join(root, 'PROGRESS.md'), lines.join('\n'))

if (errors.length) {
  console.error(`\nverify:content FAILED (${errors.length})\n` + errors.map((e) => ' - ' + e).join('\n'))
  process.exit(1)
}
if (isLld) { const st = [...status.values()]; const total = catalog.filter((c) => c.track === "lld").length; const r = st.filter((x) => x === "ready").length; const d = st.filter((x) => x === "draft").length; console.log(`verify:content (lld) OK. ${r} ready, ${d} draft, ${total - r - d} not started.`) }
else console.log(`verify:content OK. ${R} ready, ${D} draft, ${T - R - D} not started.`)
