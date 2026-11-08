<script setup lang="ts">
import { computed, ref, shallowRef, watch } from 'vue'
import { useRoute } from 'vue-router'
import { runTrace } from '@/core/tracer'
import { leetcodeUrl, loadVariants, metas, NEETCODE_LIST_URL, officialBySlug, videoUrl, type LoadedVariant } from '@/data/problems'
import type { ReadyMeta } from '@/core/schema'
import ExampleVisual from '@/components/ExampleVisual.vue'
import Stepper from '@/components/Stepper.vue'
import ComplexityPlay from '@/components/ComplexityPlay.vue'
import CodeSection from '@/components/CodeSection.vue'
import EdgeCards from '@/components/EdgeCards.vue'
import RecapCard from '@/components/RecapCard.vue'
import { DEMOS } from '@/demos'

const route = useRoute()
const slug = computed(() => String(route.params.slug))
const meta = computed(() => metas.get(slug.value))
const official = computed(() => officialBySlug.get(slug.value))
const ready = computed(() => (meta.value?.status === 'ready' ? (meta.value as ReadyMeta) : undefined))

const variants = shallowRef<LoadedVariant[]>([])
const loadError = ref('')
watch(
  ready,
  async (m) => {
    variants.value = []
    loadError.value = ''
    if (!m) return
    try { variants.value = await loadVariants(m) } catch (e) { loadError.value = String(e) }
  },
  { immediate: true },
)
const runner = computed(() => (args: unknown[]) => runTrace(variants.value[0].fn, args))
</script>

<template>
  <div v-if="!official" class="wrap"><h1>Not found</h1><p>No such problem. Pick one from the list.</p></div>

  <div v-else-if="!meta" class="wrap">
    <h1>{{ official.title }}</h1>
    <p class="muted">{{ official.category }} · {{ official.difficulty }}</p>
    <p>This explainer has not been written yet. It is on the list for a later pass.</p>
    <p><a :href="leetcodeUrl(official.slug)" target="_blank" rel="noopener">Open the problem on LeetCode</a></p>
  </div>

  <div v-else-if="!ready" class="wrap">
    <h1>{{ meta.title }}</h1>
    <p class="muted">{{ meta.category }} · {{ meta.difficulty }} · draft</p>
    <p>This explainer is a draft. It is hidden from recap until it passes the quality checks.</p>
  </div>

  <article v-else class="problem">
    <header class="hd">
      <div class="hd-text">
        <div class="chips"><span class="chip">{{ ready.category }}</span><span class="chip" :class="ready.difficulty">{{ ready.difficulty }}</span></div>
        <h1>{{ ready.title }}</h1>
        <p class="statement">{{ ready.statement }}</p>
        <p class="links small">
          <a :href="leetcodeUrl(ready.slug)" target="_blank" rel="noopener">Original problem on LeetCode</a>
          <template v-if="official?.video"> · <a :href="videoUrl(official.video)" target="_blank" rel="noopener">NeetCode video</a></template>
          · <a :href="NEETCODE_LIST_URL" target="_blank" rel="noopener">NeetCode 150 list</a>
        </p>
      </div>
      <ExampleVisual :example="ready.example" />
    </header>

    <section id="idea" aria-labelledby="h-idea">
      <h2 id="h-idea">The one idea</h2>
      <div class="two">
        <div>
          <p class="idea">{{ ready.idea.sentence }}</p>
          <dl v-if="ready.idea.jargon.length" class="jargon small">
            <template v-for="j in ready.idea.jargon" :key="j.term"><dt>{{ j.term }}</dt><dd>{{ j.plain }}</dd></template>
          </dl>
        </div>
        <div class="card"><component :is="DEMOS[ready.idea.demo]" /></div>
      </div>
    </section>

    <section id="watch" aria-labelledby="h-watch">
      <h2 id="h-watch">Watch it run</h2>
      <Stepper v-if="variants.length" :run="runner" :presets="ready.watch.presets" :input-hint="ready.watch.inputHint" :stages="ready.variants[0].stages" />
      <p v-else-if="loadError" class="warn" role="alert">Could not load the code for this problem. {{ loadError }}</p>
      <p v-else class="muted">Loading…</p>
    </section>

    <section id="fast" aria-labelledby="h-fast">
      <h2 id="h-fast">Why it's fast</h2>
      <div class="two">
        <div class="card"><ComplexityPlay :fast="ready.fast" /></div>
        <div class="tbl">
          <table>
            <thead><tr><th>Approach</th><th>Time</th><th>Space</th></tr></thead>
            <tbody>
              <tr v-for="r in ready.fast.rows" :key="r.name">
                <th scope="row" data-label="Approach">{{ r.name }}<span class="note small muted">{{ r.note }}</span></th>
                <td data-label="Time"><code>{{ r.time }}</code></td>
                <td data-label="Space"><code>{{ r.space }}</code></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <p class="takeaway">{{ ready.fast.takeaway }}</p>
    </section>

    <section id="code" aria-labelledby="h-code">
      <h2 id="h-code">Code</h2>
      <p class="muted small">Each language is hidden until you ask. Try to write it in your head first. The numbers match the stages in the stepper.</p>
      <CodeSection v-if="variants.length" :variants="variants" />
    </section>

    <section id="edges" aria-labelledby="h-edges">
      <h2 id="h-edges">Edge cases and gotchas</h2>
      <EdgeCards :edges="ready.edges" :gotchas="ready.gotchas" />
    </section>

    <section id="recap" aria-labelledby="h-recap">
      <h2 id="h-recap">30-second recap</h2>
      <RecapCard :recap="ready.recap" />
    </section>
  </article>
</template>

<style scoped>
.wrap { max-width: 720px; }
.problem { display: grid; gap: 40px; max-width: 1180px; min-width: 0; }
section { min-width: 0; }
.hd { display: grid; gap: 18px; min-width: 0; }
@media (min-width: 980px) { .hd { grid-template-columns: minmax(0, 1.2fr) minmax(300px, 1fr); gap: 32px; align-items: start; } }
.chips { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 10px; }
.statement { font-size: 1.1rem; max-width: 62ch; }
.links { margin: 0; }
.two { display: grid; gap: 16px; min-width: 0; }
@media (min-width: 980px) { .two { grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr); gap: 28px; align-items: start; } }
.idea { font: 600 clamp(1.15rem, 1rem + .8vw, 1.5rem) var(--font-head); line-height: 1.4; margin-bottom: 14px; }
.jargon { display: grid; grid-template-columns: auto 1fr; gap: 4px 12px; margin: 0; }
.jargon dt { font-weight: 700; } .jargon dd { margin: 0; color: var(--ink-2); }
.takeaway { margin: 14px 0 0; font-weight: 600; }
.warn { color: var(--miss-fg); }
.tbl { min-width: 0; }
table { width: 100%; border-collapse: collapse; background: var(--surface); border: 1px solid var(--line); border-radius: 12px; overflow: hidden; }
th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid var(--line); vertical-align: top; }
thead th { background: var(--surface-2); font-size: .8rem; text-transform: uppercase; letter-spacing: .06em; }
tbody th { font-weight: 700; }
.note { display: block; font-weight: 400; margin-top: 2px; }
@media (max-width: 560px) {
  thead { display: none; }
  tr, tbody th, td { display: block; }
  td { border: 0; padding-top: 2px; } td::before { content: attr(data-label) ': '; color: var(--ink-2); font-size: .8rem; }
  tbody th { border: 0; padding-bottom: 2px; }
  tr { border-bottom: 1px solid var(--line); padding: 6px 0; }
}
</style>
