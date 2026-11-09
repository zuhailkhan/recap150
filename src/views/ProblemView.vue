<script setup lang="ts">
import { computed, ref, shallowRef, watch } from 'vue'
import { useRoute } from 'vue-router'
import { runTrace } from '@/core/tracer'
import { customDemo, leetcodeUrl, loadVariants, metas, NEETCODE_LIST_URL, officialBySlug, videoUrl, type LoadedVariant } from '@/data/problems'
import type { ReadyMeta } from '@/core/schema'
import ExampleVisual from '@/components/ExampleVisual.vue'
import Stepper from '@/components/Stepper.vue'
import ComplexityPlay from '@/components/ComplexityPlay.vue'
import CodeSection from '@/components/CodeSection.vue'
import EdgeCards from '@/components/EdgeCards.vue'
import RecapCard from '@/components/RecapCard.vue'
import MarkComplete from '@/components/MarkComplete.vue'
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
    <p class="muted">{{ official.category }}, {{ official.difficulty }}</p>
    <p>This explainer has not been written yet.</p>
    <p><a :href="leetcodeUrl(official.slug)" target="_blank" rel="noopener">Open the problem on LeetCode</a></p>
  </div>

  <div v-else-if="!ready" class="wrap">
    <h1>{{ meta.title }}</h1>
    <p class="muted">{{ meta.category }}, {{ meta.difficulty }}, draft</p>
    <p>This explainer is a draft. It stays out of recap until it passes the quality checks.</p>
  </div>

  <article v-else class="problem">
    <header class="hd">
      <div class="hd-text">
        <p class="meta"><span class="cat">{{ ready.category }}</span><span class="chip" :class="ready.difficulty">{{ ready.difficulty }}</span></p>
        <h1>{{ ready.title }}</h1>
        <p class="statement">{{ ready.statement }}</p>
        <p class="links small">
          <a :href="leetcodeUrl(ready.slug)" target="_blank" rel="noopener">Original problem</a>
          <a v-if="official?.video" :href="videoUrl(official.video)" target="_blank" rel="noopener">NeetCode video</a>
          <a :href="NEETCODE_LIST_URL" target="_blank" rel="noopener">NeetCode 150</a>
        </p>
        <MarkComplete :card-id="ready.slug" class="hd-done" />
      </div>
      <ExampleVisual :example="ready.example" />
    </header>

    <section id="idea" aria-labelledby="h-idea" class="idea-sec">
      <div class="idea-text">
        <h2 id="h-idea" class="sr-only">The one idea</h2>
        <p class="idea">{{ ready.idea.sentence }}</p>
        <dl v-if="ready.idea.jargon.length" class="jargon small">
          <template v-for="j in ready.idea.jargon" :key="j.term"><dt>{{ j.term }}</dt><dd>{{ j.plain }}</dd></template>
        </dl>
      </div>
      <div class="card demo stage"><component :is="ready.idea.demo === 'custom' ? customDemo(ready.slug) : DEMOS[ready.idea.demo]" /></div>
    </section>

    <section id="watch" aria-labelledby="h-watch">
      <h2 id="h-watch">Watch it run</h2>
      <Stepper v-if="variants.length" :run="runner" :presets="ready.watch.presets" :input-hint="ready.watch.inputHint" :stages="ready.variants[0].stages" />
      <p v-else-if="loadError" class="warn" role="alert">Could not load the code for this problem. {{ loadError }}</p>
      <p v-else class="muted">Loading…</p>
    </section>

    <section id="fast" class="sec" aria-labelledby="h-fast">
      <div class="sec-h"><h2 id="h-fast">Why it's fast</h2><p class="muted small">Brute force against the real approach, then the cost table.</p></div>
      <div class="sec-b">
        <div class="two">
          <div class="plain"><ComplexityPlay :fast="ready.fast" /></div>
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
      </div>
    </section>

    <section id="code" class="sec" aria-labelledby="h-code">
      <div class="sec-h"><h2 id="h-code">Code</h2><p class="muted small">Each language stays hidden until you ask. Try writing it in your head first. The badges match the stages in the stepper.</p></div>
      <div class="sec-b"><CodeSection v-if="variants.length" :variants="variants" /></div>
    </section>

    <section id="edges" class="sec" aria-labelledby="h-edges">
      <div class="sec-h"><h2 id="h-edges">Edge cases and gotchas</h2><p class="muted small">Inputs that break the obvious solution, and traps in the languages.</p></div>
      <div class="sec-b"><EdgeCards :edges="ready.edges" :gotchas="ready.gotchas" /></div>
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
@media (min-width: 1020px) { .hd { grid-template-columns: minmax(0, 1.25fr) minmax(300px, 1fr); gap: 56px; align-items: start; } }
.meta { display: flex; align-items: center; gap: 18px; margin: 0 0 14px; font-size: .9rem; color: var(--ink-2); }
.cat { font-weight: 560; color: var(--ink); }
.hd h1 { margin-bottom: .3em; }
.statement { font-size: 1.18rem; line-height: 1.55; max-width: 58ch; color: var(--ink); }
.hd-done { margin-top: 20px; }
.links { margin: 0; display: flex; flex-wrap: wrap; gap: 6px 22px; }

.idea-sec { display: grid; gap: 22px; align-items: stretch; }
@media (min-width: 1020px) { .idea-sec { grid-template-columns: minmax(0, 1fr) minmax(0, 1.05fr); gap: 56px; align-items: center; } }
.idea { font: 560 clamp(1.4rem, 1.05rem + 1.4vw, 2.1rem)/1.22 var(--font-head); letter-spacing: -0.022em; margin: 0 0 18px; text-wrap: balance; max-width: 26ch; }
.jargon { display: grid; grid-template-columns: auto 1fr; gap: 6px 16px; margin: 0; max-width: 56ch; }
.jargon dt { font: 600 .82rem var(--font-mono); padding-top: 1px; }
.jargon dd { margin: 0; color: var(--ink-2); }
.demo { padding: 22px; border-radius: 14px; }

#watch > h2 { margin-bottom: 16px; }

/* editorial sections: a heading rail on wide screens, stacked on narrow ones */
.sec { display: grid; gap: 18px; }
.sec-h h2 { margin-bottom: .3em; }
.sec-h p { margin: 0; max-width: 34ch; }
@media (min-width: 1280px) { .sec { grid-template-columns: 230px minmax(0, 1fr); gap: 44px; } .sec-h { position: sticky; top: 76px; align-self: start; } }
.sec-b { min-width: 0; }

.two { display: grid; gap: 28px; min-width: 0; }
@media (min-width: 980px) { .two { grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr); gap: 40px; align-items: start; } }
.plain { min-width: 0; }
.takeaway { margin: 22px 0 0; font: 560 1.15rem/1.4 var(--font-head); letter-spacing: -0.012em; max-width: 56ch; }
.warn { color: var(--miss-fg); }
.tbl { min-width: 0; }
table { width: 100%; border-collapse: collapse; }
th, td { text-align: left; padding: 12px 12px 12px 0; border-bottom: 1px solid var(--line); vertical-align: top; }
thead th { font: 500 .8rem var(--font-ui); color: var(--ink-3); padding-top: 0; }
tbody th { font-weight: 640; }
.note { display: block; font-weight: 400; margin-top: 3px; max-width: 40ch; }
@media (max-width: 560px) {
  thead { display: none; }
  tr, tbody th, td { display: block; }
  td { border: 0; padding: 2px 0 0; } td::before { content: attr(data-label) ': '; color: var(--ink-3); font-size: .8rem; }
  tbody th { border: 0; padding-bottom: 2px; }
  tr { border-bottom: 1px solid var(--line); padding: 8px 0; }
}
</style>
