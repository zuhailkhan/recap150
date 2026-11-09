<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import type { HldMeta } from '@/core/designSchema'
import { arch, type Frame, type Panel } from '@/core/panels'
import type { TraceResult } from '@/core/tracer'
import { catalogBySlug, hldMetas } from '@/data/design'
import Stepper from '@/components/Stepper.vue'
import Estimator from '@/components/Estimator.vue'
import MarkComplete from '@/components/MarkComplete.vue'

const route = useRoute()
const slug = computed(() => String(route.params.slug))
const entry = computed(() => catalogBySlug('hld', slug.value))
const meta = computed(() => hldMetas.get(slug.value))
const ready = computed(() => (meta.value?.status === 'ready' ? (meta.value as unknown as HldMeta) : undefined))

/** The architecture as it stands after evolution step `upTo`. New parts are highlighted. */
function evolutionPanel(m: HldMeta, upTo: number, label: string): Panel {
  const nodes = m.nodes.filter((n) => n.since <= upTo)
  const ids = new Set(nodes.map((n) => n.id))
  const edges = m.edges.filter((e) => e.since <= upTo && (e.until === undefined || upTo < e.until) && ids.has(e.from) && ids.has(e.to))
  const tones: Record<string, 'focus'> = {}
  for (const n of nodes) if (n.since === upTo) tones[n.id] = 'focus'
  return arch(nodes.map(({ since: _s, ...n }) => n), edges.map((e) => ({ from: e.from, to: e.to, label: e.label, dashed: e.dashed, tone: e.since === upTo ? ('focus' as const) : undefined })), { label, tones })
}

const evoRun = (m: HldMeta) => (): TraceResult => ({
  truncated: false, result: undefined,
  frames: m.evolution.map((e, i): Frame => ({ stage: i + 1, say: `${e.problem} So: ${e.change}${e.numbers ? ` (${e.numbers})` : ''}`, panels: [evolutionPanel(m, i, `design after step ${i + 1}: ${e.title}`)] })),
})

const flowRun = (m: HldMeta) => (args: unknown[]): TraceResult => {
  const flow = m.flows[Number(args[0]) || 0]
  const last = m.evolution.length - 1
  const nodes = m.nodes.filter((n) => n.since <= last).map(({ since: _s, ...n }) => n)
  const edges = m.edges.filter((e) => e.since <= last && (e.until === undefined || last < e.until))
  const frames = flow.steps.map((st, k): Frame => {
    const tones: Record<string, 'focus' | 'dim'> = {}
    for (let j = 0; j < k; j++) for (const id of flow.steps[j].nodes) tones[id] = 'dim'
    for (const id of st.nodes) tones[id] = 'focus'
    const on = new Set(st.edges.map(([a, b]) => `${a}>${b}`))
    const seen = new Set(flow.steps.slice(0, k).flatMap((s) => s.edges.map(([a, b]) => `${a}>${b}`)))
    return {
      stage: k + 1, say: st.say,
      panels: [arch(nodes, edges.map((e) => ({ from: e.from, to: e.to, label: e.label, dashed: e.dashed, tone: on.has(`${e.from}>${e.to}`) ? ('focus' as const) : seen.has(`${e.from}>${e.to}`) ? ('dim' as const) : undefined })), { label: flow.name, tones })],
    }
  })
  return { frames, result: undefined, truncated: false }
}
</script>

<template>
  <div v-if="!entry" class="wrap"><h1>Not found</h1><p>No such design topic. Pick one from the list.</p></div>

  <div v-else-if="!meta" class="wrap">
    <h1>{{ entry.title }}</h1>
    <p class="muted">{{ entry.group }}, {{ entry.difficulty }}</p>
    <p>This high-level design has not been written yet.</p>
  </div>

  <div v-else-if="!ready" class="wrap">
    <h1>{{ meta.title }}</h1>
    <p class="muted">{{ meta.group }}, {{ meta.difficulty }}, draft</p>
    <p>This explainer is a draft. It stays out of recap until it passes the quality checks.</p>
  </div>

  <article v-else class="problem">
    <header class="hd">
      <div class="hd-text">
        <p class="meta"><span class="cat">High-level design</span><span class="cat soft">{{ ready.group }}</span><span class="chip" :class="ready.difficulty">{{ ready.difficulty }}</span></p>
        <h1>{{ ready.title }}</h1>
        <p class="statement">{{ ready.brief }}</p>
        <MarkComplete :card-id="`hld:${ready.slug}`" class="hd-done" />
      </div>
      <div class="reqs">
        <h2 class="h3">It must</h2>
        <ul><li v-for="f in ready.requirements.functional" :key="f">{{ f }}</li></ul>
        <h2 class="h3">Targets</h2>
        <dl><div v-for="n in ready.requirements.nonFunctional" :key="n.name"><dt>{{ n.name }}</dt><dd>{{ n.target }}</dd></div></dl>
        <p v-if="ready.requirements.outOfScope.length" class="muted small out">Out of scope: {{ ready.requirements.outOfScope.join('; ') }}.</p>
      </div>
    </header>

    <section id="numbers" class="sec" aria-labelledby="h-num">
      <div class="sec-h"><h2 id="h-num">Do the numbers first</h2><p class="muted small">Move an assumption and watch what the system has to survive.</p></div>
      <div class="sec-b"><Estimator :estimate="ready.estimate" /></div>
    </section>

    <section id="shape" class="sec" aria-labelledby="h-shape">
      <div class="sec-h"><h2 id="h-shape">API and data</h2><p class="muted small">The contract clients see, and what gets stored where.</p></div>
      <div class="sec-b two">
        <div>
          <h3>API</h3>
          <ul class="api"><li v-for="a in ready.api" :key="a.call"><code>{{ a.call }}</code><span>{{ a.does }}</span></li></ul>
        </div>
        <div>
          <h3>Data</h3>
          <ul class="data"><li v-for="d in ready.data" :key="d.entity"><b>{{ d.entity }}</b><code>{{ d.fields }}</code><span class="muted small">{{ d.store }}. {{ d.why }}</span></li></ul>
        </div>
      </div>
    </section>

    <section id="evolve" aria-labelledby="h-evo">
      <h2 id="h-evo">Grow the design</h2>
      <p class="muted lead">Start with one server. Each step adds a part because a number or a failure forced it.</p>
      <Stepper :run="evoRun(ready)" :presets="[{ label: 'Step by step', args: [] }]" :stages="ready.evolution.map((e, i) => ({ n: i + 1, title: e.title }))" :custom-input="false" preset-label="Run" />
    </section>

    <section id="flows" aria-labelledby="h-flow">
      <h2 id="h-flow">Follow a request</h2>
      <p class="muted lead">The finished design, one hop at a time.</p>
      <Stepper :run="flowRun(ready)" :presets="ready.flows.map((f, i) => ({ label: f.name, args: [i] }))" :custom-input="false" preset-label="Path" />
    </section>

    <section id="dives" class="sec" aria-labelledby="h-dive">
      <div class="sec-h"><h2 id="h-dive">Decisions and trade-offs</h2><p class="muted small">Where the interviewer will push, and what to say.</p></div>
      <div class="sec-b dives">
        <article v-for="d in ready.deepDives" :key="d.title" class="dive">
          <h3>{{ d.title }}</h3>
          <p class="q">{{ d.question }}</p>
          <table>
            <thead><tr><th>Option</th><th>Good</th><th>Costs</th></tr></thead>
            <tbody><tr v-for="o in d.options" :key="o.name"><th scope="row" data-label="Option">{{ o.name }}</th><td data-label="Good">{{ o.pros }}</td><td data-label="Costs">{{ o.cons }}</td></tr></tbody>
          </table>
          <p class="pick"><b>Pick: {{ d.pick }}.</b> {{ d.because }}</p>
        </article>
      </div>
    </section>

    <section id="failures" class="sec" aria-labelledby="h-fail">
      <div class="sec-h"><h2 id="h-fail">What breaks</h2><p class="muted small">Failure modes and how the design survives them.</p></div>
      <div class="sec-b">
        <table class="fail">
          <thead><tr><th>Failure</th><th>Impact</th><th>Fix</th></tr></thead>
          <tbody><tr v-for="f in ready.failures" :key="f.what"><th scope="row" data-label="Failure">{{ f.what }}</th><td data-label="Impact">{{ f.impact }}</td><td data-label="Fix">{{ f.fix }}</td></tr></tbody>
        </table>
        <h3 class="sh">When it outgrows this</h3>
        <ul class="scale"><li v-for="s in ready.scaling" :key="s.limit"><b>{{ s.limit }}</b><span>{{ s.lever }}</span></li></ul>
      </div>
    </section>

    <section id="recap" class="sec" aria-labelledby="h-recap">
      <div class="sec-h"><h2 id="h-recap">30-second recap</h2><p class="muted small">What to say if you only get half a minute.</p></div>
      <div class="sec-b rc">
        <div class="lead-col"><p class="key">{{ ready.recap.key }}</p><p class="nums muted">{{ ready.recap.numbers }}</p></div>
        <ol class="moves"><li v-for="(m, i) in ready.recap.moves" :key="i"><span class="badge">{{ i + 1 }}</span>{{ m }}</li></ol>
      </div>
    </section>
  </article>
</template>

<style scoped>
.wrap { max-width: 720px; }
.problem { display: grid; gap: 56px; min-width: 0; }
section { min-width: 0; }
.hd { display: grid; gap: 28px; min-width: 0; }
@media (min-width: 1020px) { .hd { grid-template-columns: minmax(0, 1.2fr) minmax(300px, 1fr); gap: 56px; align-items: start; } }
.meta { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 18px; margin: 0 0 14px; font-size: .9rem; }
.cat { font-weight: 600; } .cat.soft { font-weight: 500; color: var(--ink-2); }
.statement { font-size: 1.18rem; line-height: 1.55; max-width: 58ch; }
.hd-done { margin-top: 20px; }
.reqs { padding: 18px 20px; background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius); }
.h3 { font: 650 .95rem var(--font-ui); letter-spacing: 0; margin: 0 0 8px; color: var(--ink-2); }
.reqs ul { margin: 0 0 16px; padding-left: 18px; display: grid; gap: 4px; }
.reqs dl { margin: 0 0 12px; display: grid; gap: 4px; }
.reqs dl div { display: grid; grid-template-columns: 9.5em minmax(0, 1fr); gap: 10px; }
.reqs dt { font-weight: 600; font-size: .9rem; } .reqs dd { margin: 0; font: 500 .85rem var(--font-mono); }
.out { margin: 0; }
.lead { margin: -4px 0 16px; max-width: 62ch; }
#evolve > h2, #flows > h2 { margin-bottom: .3em; }
.sec { display: grid; gap: 18px; }
.sec-h h2 { margin-bottom: .3em; } .sec-h p { margin: 0; max-width: 34ch; }
@media (min-width: 1280px) { .sec { grid-template-columns: 230px minmax(0, 1fr); gap: 44px; } .sec-h { position: sticky; top: 76px; align-self: start; } }
.sec-b { min-width: 0; }
.two { display: grid; gap: 28px; }
@media (min-width: 900px) { .two { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 44px; } }
h3 { margin-bottom: 8px; }
.api, .data, .scale { list-style: none; margin: 0; padding: 0; }
.api li, .data li, .scale li { padding: 11px 0; border-top: 1px solid var(--line); display: grid; gap: 3px; }
.api li:last-child, .data li:last-child, .scale li:last-child { border-bottom: 1px solid var(--line); }
.api code, .data code { justify-self: start; overflow-wrap: anywhere; }
.dives { display: grid; gap: 40px; }
.dive .q { color: var(--ink-2); margin-bottom: 10px; max-width: 64ch; }
.pick { margin: 12px 0 0; max-width: 70ch; }
table { width: 100%; border-collapse: collapse; }
th, td { text-align: left; padding: 11px 14px 11px 0; border-bottom: 1px solid var(--line); vertical-align: top; font-size: .93rem; }
thead th { font: 500 .8rem var(--font-ui); color: var(--ink-3); padding-top: 0; }
tbody th { font-weight: 640; width: 22%; }
.sh { margin: 28px 0 6px; }
.scale b { font-weight: 640; }
.rc { display: grid; gap: 22px; padding-top: 18px; border-top: 2px solid var(--ink); }
@media (min-width: 900px) { .rc { grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr); gap: 48px; } }
.key { margin: 0 0 10px; font: 600 clamp(1.3rem, 1.1rem + .9vw, 1.75rem)/1.25 var(--font-head); letter-spacing: -0.018em; max-width: 30ch; }
.nums { margin: 0; font: 500 .9rem var(--font-mono); }
.moves { list-style: none; margin: 0; padding: 0; }
.moves li { display: flex; gap: 12px; padding: 11px 0; border-bottom: 1px solid var(--line); line-height: 1.5; }
.moves li:first-child { padding-top: 2px; }
@media (max-width: 640px) {
  thead { display: none; }
  tr, tbody th, td { display: block; width: auto; }
  td { border: 0; padding: 2px 0 0; } td::before { content: attr(data-label) ': '; color: var(--ink-3); font-size: .8rem; }
  tbody th { border: 0; padding-bottom: 2px; }
  tr { border-bottom: 1px solid var(--line); padding: 8px 0; }
}
</style>
