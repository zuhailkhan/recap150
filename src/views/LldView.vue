<script setup lang="ts">
import { computed, ref, shallowRef, watch } from 'vue'
import { useRoute } from 'vue-router'
import type { LldMeta } from '@/core/designSchema'
import { classes } from '@/core/panels'
import { runTrace } from '@/core/tracer'
import { catalogBySlug, lldDemo, lldMetas, loadLldVariants, type LldVariant } from '@/data/design'
import Stepper from '@/components/Stepper.vue'
import CodeSection from '@/components/CodeSection.vue'
import EdgeCards from '@/components/EdgeCards.vue'
import RecapCard from '@/components/RecapCard.vue'
import MarkComplete from '@/components/MarkComplete.vue'
import PanelView from '@/visuals/PanelView.vue'

const route = useRoute()
const slug = computed(() => String(route.params.slug))
const entry = computed(() => catalogBySlug('lld', slug.value))
const meta = computed(() => lldMetas.get(slug.value))
const ready = computed(() => (meta.value?.status === 'ready' ? (meta.value as unknown as LldMeta) : undefined))
const demo = computed(() => (ready.value ? lldDemo(ready.value.slug) : undefined))

const variants = shallowRef<LldVariant[]>([])
const loadError = ref('')
watch(ready, async (m) => {
  variants.value = []
  loadError.value = ''
  if (!m) return
  try { variants.value = await loadLldVariants(m) } catch (e) { loadError.value = String(e) }
}, { immediate: true })
const runner = computed(() => (args: unknown[]) => runTrace(variants.value[0].fn, args))
const modelPanel = computed(() => (ready.value ? classes(ready.value.model.classes, ready.value.model.relations, { label: ready.value.model.label ?? 'classes and how they relate' }) : null))
</script>

<template>
  <div v-if="!entry" class="wrap"><h1>Not found</h1><p>No such design topic. Pick one from the list.</p></div>

  <div v-else-if="!meta" class="wrap">
    <h1>{{ entry.title }}</h1>
    <p class="muted">{{ entry.group }}, {{ entry.difficulty }}</p>
    <p>This low-level design has not been written yet.</p>
  </div>

  <div v-else-if="!ready" class="wrap">
    <h1>{{ meta.title }}</h1>
    <p class="muted">{{ meta.group }}, {{ meta.difficulty }}, draft</p>
    <p>This explainer is a draft. It stays out of recap until it passes the quality checks.</p>
  </div>

  <article v-else class="problem">
    <header class="hd">
      <div class="hd-text">
        <p class="meta"><span class="cat">Low-level design</span><span class="cat soft">{{ ready.group }}</span><span class="chip" :class="ready.difficulty">{{ ready.difficulty }}</span></p>
        <h1>{{ ready.title }}</h1>
        <p class="statement">{{ ready.brief }}</p>
        <MarkComplete :card-id="`lld:${ready.slug}`" class="hd-done" />
      </div>
      <div class="reqs">
        <h2 class="h3">It must</h2>
        <ul><li v-for="f in ready.requirements.functional" :key="f">{{ f }}</li></ul>
        <p v-if="ready.requirements.outOfScope.length" class="muted small out">Out of scope: {{ ready.requirements.outOfScope.join('; ') }}.</p>
      </div>
    </header>

    <section id="idea" aria-labelledby="h-idea" class="idea-sec">
      <h2 id="h-idea" class="sr-only">The design idea</h2>
      <p class="idea">{{ ready.idea.sentence }}</p>
      <dl v-if="ready.idea.jargon.length" class="jargon small">
        <template v-for="j in ready.idea.jargon" :key="j.term"><dt>{{ j.term }}</dt><dd>{{ j.plain }}</dd></template>
      </dl>
    </section>

    <section id="model" aria-labelledby="h-model">
      <h2 id="h-model">The model</h2>
      <div class="stage modelstage"><PanelView v-if="modelPanel" :panel="modelPanel" /></div>
      <component :is="demo" v-if="demo" class="demo" />
    </section>

    <section id="watch" aria-labelledby="h-watch">
      <h2 id="h-watch">Run a scenario</h2>
      <p class="muted lead">Real calls through the real code. The diagram builds as each call happens.</p>
      <Stepper v-if="variants.length" :run="runner" :presets="ready.watch.presets" :input-hint="ready.watch.inputHint" :stages="ready.variants[0].stages" />
      <p v-else-if="loadError" class="warn" role="alert">Could not load the code. {{ loadError }}</p>
      <p v-else class="muted">Loading…</p>
    </section>

    <section id="patterns" class="sec" aria-labelledby="h-pat">
      <div class="sec-h"><h2 id="h-pat">Patterns used</h2><p class="muted small">Named ideas worth saying out loud in an interview.</p></div>
      <div class="sec-b"><ul class="rows"><li v-for="p in ready.patterns" :key="p.name"><b>{{ p.name }}</b><span>{{ p.where }}</span><span class="muted">{{ p.why }}</span></li></ul></div>
    </section>

    <section id="decisions" class="sec" aria-labelledby="h-dec">
      <div class="sec-h"><h2 id="h-dec">Design decisions</h2><p class="muted small">Each choice, and the road not taken.</p></div>
      <div class="sec-b decs">
        <article v-for="d in ready.decisions" :key="d.question" class="dec">
          <h3>{{ d.question }}</h3>
          <p><b>Chosen:</b> {{ d.choice }}. {{ d.because }}</p>
          <p class="muted"><b>Instead:</b> {{ d.instead }}</p>
        </article>
      </div>
    </section>

    <section id="code" class="sec" aria-labelledby="h-code">
      <div class="sec-h"><h2 id="h-code">Code</h2><p class="muted small">Each language stays hidden until you ask. The badges match the stages in the scenario.</p></div>
      <div class="sec-b"><CodeSection v-if="variants.length" :variants="variants" hide-pseudo /></div>
    </section>

    <section id="followups" class="sec" aria-labelledby="h-fu">
      <div class="sec-h"><h2 id="h-fu">Follow-up questions</h2><p class="muted small">Think first, then open the answer.</p></div>
      <div class="sec-b fus">
        <details v-for="f in ready.followups" :key="f.ask" class="fu">
          <summary>{{ f.ask }}</summary>
          <p>{{ f.answer }}</p>
        </details>
      </div>
    </section>

    <section id="gotchas" class="sec" aria-labelledby="h-got">
      <div class="sec-h"><h2 id="h-got">Gotchas</h2><p class="muted small">Traps in the design and in the languages.</p></div>
      <div class="sec-b"><EdgeCards :gotchas="ready.gotchas" /></div>
    </section>

    <section id="recap" class="sec" aria-labelledby="h-recap">
      <div class="sec-h"><h2 id="h-recap">30-second recap</h2><p class="muted small">What to remember tomorrow.</p></div>
      <div class="sec-b"><RecapCard :recap="ready.recap" /></div>
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
.reqs ul { margin: 0 0 12px; padding-left: 18px; display: grid; gap: 4px; }
.out { margin: 0; }
.idea { font: 560 clamp(1.45rem, 1.05rem + 1.6vw, 2.3rem)/1.2 var(--font-head); letter-spacing: -0.024em; margin: 0 0 18px; text-wrap: balance; max-width: 30ch; }
.jargon { display: grid; grid-template-columns: auto 1fr; gap: 6px 16px; margin: 0; max-width: 60ch; }
.jargon dt { font: 600 .82rem var(--font-mono); padding-top: 1px; } .jargon dd { margin: 0; color: var(--ink-2); }
.modelstage { padding: 20px 22px; overflow-x: auto; margin-top: 14px; }
.demo { margin-top: 18px; }
.lead { margin: -4px 0 16px; max-width: 62ch; }
#watch > h2 { margin-bottom: .3em; }
.warn { color: var(--miss-fg); }
.sec { display: grid; gap: 18px; }
.sec-h h2 { margin-bottom: .3em; } .sec-h p { margin: 0; max-width: 34ch; }
@media (min-width: 1280px) { .sec { grid-template-columns: 230px minmax(0, 1fr); gap: 44px; } .sec-h { position: sticky; top: 76px; align-self: start; } }
.sec-b { min-width: 0; }
.rows { list-style: none; margin: 0; padding: 0; }
.rows li { display: grid; gap: 4px; padding: 14px 0; border-top: 1px solid var(--line); }
.rows li:last-child { border-bottom: 1px solid var(--line); }
@media (min-width: 900px) { .rows li { grid-template-columns: 11em minmax(0, 1fr) minmax(0, 1.2fr); gap: 20px; } }
.rows b { font: 650 .95rem var(--font-mono); }
.decs { display: grid; gap: 28px; }
.dec h3 { margin-bottom: 6px; } .dec p { margin: 0 0 6px; max-width: 70ch; }
.fus { display: grid; max-width: 78ch; }
.fu { border-top: 1px solid var(--line); }
.fu:last-child { border-bottom: 1px solid var(--line); }
.fu summary { cursor: pointer; padding: 14px 0; min-height: 44px; font-weight: 600; list-style: none; display: flex; gap: 12px; align-items: baseline; }
.fu summary::-webkit-details-marker { display: none; }
.fu summary::before { content: '+'; font: 500 1.1rem var(--font-mono); color: var(--ink-3); width: 1ch; }
.fu[open] summary::before { content: '–'; }
.fu p { margin: 0 0 16px; padding-left: calc(1ch + 12px); color: var(--ink-2); }
</style>
