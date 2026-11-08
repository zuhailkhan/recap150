<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { useRoute } from 'vue-router'
import { GRADES, RECAP, type Grade } from '@/recap/config'
import { buildCategory, buildDaily, buildWeak } from '@/recap/scheduler'
import { candidates } from '@/recap/stats'
import { currentStreak, progress, rateCard } from '@/recap/store'
import { formatInterval, newCard, previewIntervals } from '@/recap/sm2'
import { dayNumber } from '@/recap/sm2'
import { loadVariants, readyBySlug, type LoadedVariant } from '@/data/problems'
import MaskedCode from '@/components/MaskedCode.vue'
import RecapCard from '@/components/RecapCard.vue'

const route = useRoute()
const queue = ref<string[]>([])
const pos = ref(0)
const revealed = ref(false)
const code = shallowRef<LoadedVariant | null>(null)
const tally = ref<Record<Grade, number>>({ again: 0, hard: 0, good: 0, easy: 0 })
const requeued = new Set<string>()
const started = ref(false)

function build() {
  const mode = String(route.query.mode ?? 'daily')
  const today = dayNumber(Date.now())
  if (mode === 'category') queue.value = buildCategory(candidates, progress.cards, today, String(route.query.cat ?? ''))
  else if (mode === 'weak') queue.value = buildWeak(candidates, progress.cards)
  else queue.value = buildDaily(candidates, progress.cards, today)
  pos.value = 0
  revealed.value = false
  started.value = true
}
// Wait for IndexedDB to load once, then freeze the queue for this session.
watch(() => progress.ready, (r) => { if (r && !started.value) build() }, { immediate: true })

const id = computed(() => queue.value[pos.value])
const meta = computed(() => (id.value ? readyBySlug.get(id.value) : undefined))
const done = computed(() => started.value && pos.value >= queue.value.length)
const preview = computed(() => (id.value ? previewIntervals(progress.cards.get(id.value) ?? newCard(id.value), Date.now()) : null))
const title = computed(() => ({ daily: 'Daily mix', category: String(route.query.cat ?? 'Category'), weak: 'Weak spots' })[String(route.query.mode ?? 'daily')] ?? 'Recap')

watch(revealed, async (r) => {
  if (r && meta.value && !code.value) code.value = (await loadVariants(meta.value))[0]
})
watch(id, () => { code.value = null })

function reveal() { revealed.value = true }
async function rate(g: Grade) {
  if (!id.value || !revealed.value) return
  const cardId = id.value
  tally.value[g]++
  await rateCard(cardId, g)
  if (g === 'again' && RECAP.requeueAgain && !requeued.has(cardId)) { requeued.add(cardId); queue.value.push(cardId) }
  pos.value++
  revealed.value = false
}

function onKey(e: KeyboardEvent) {
  const t = e.target as HTMLElement | null
  if (e.metaKey || e.ctrlKey || e.altKey || done.value) return
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) return
  if (!revealed.value && (e.key === ' ' || e.key === 'Enter') && !(t && (t.tagName === 'BUTTON' || t.tagName === 'A'))) { e.preventDefault(); reveal() }
  else if (revealed.value && ['1', '2', '3', '4'].includes(e.key)) rate(GRADES[Number(e.key) - 1])
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
const labels: Record<Grade, string> = { again: 'Again', hard: 'Hard', good: 'Good', easy: 'Easy' }
</script>

<template>
  <div class="rs">
    <p class="crumb small"><router-link to="/recap">Recap</router-link> / {{ title }}</p>

    <p v-if="!started" class="muted">Loading your progress…</p>

    <div v-else-if="!queue.length" class="empty">
      <h1>Nothing to review</h1>
      <p class="muted">No cards match this list right now. Come back when something is due, or try another mode.</p>
      <router-link class="btn primary" to="/recap">Back to recap</router-link>
    </div>

    <div v-else-if="done" class="empty">
      <h1>Done for now</h1>
      <p>You went through {{ tally.again + tally.hard + tally.good + tally.easy }} card{{ tally.again + tally.hard + tally.good + tally.easy === 1 ? '' : 's' }}.</p>
      <p class="tally"><span v-for="g in GRADES" :key="g" class="grade" :class="g"><b>{{ tally[g] }}</b> {{ labels[g].toLowerCase() }}</span></p>
      <p class="muted">Streak: {{ currentStreak() }} day{{ currentStreak() === 1 ? '' : 's' }}.</p>
      <router-link class="btn primary" to="/recap">Back to recap</router-link>
    </div>

    <article v-else-if="meta" class="c">
      <div class="meta">
        <span class="count">Card <b>{{ pos + 1 }}</b> of {{ queue.length }}</span>
        <span class="cat">{{ meta.category }}</span><span class="chip" :class="meta.difficulty">{{ meta.difficulty }}</span>
      </div>
      <div class="bar" role="progressbar" :aria-valuenow="pos" aria-valuemin="0" :aria-valuemax="queue.length" aria-label="Session progress"><span :style="{ width: (pos / queue.length) * 100 + '%' }"></span></div>
      <h1>{{ meta.title }}</h1>
      <p class="statement">{{ meta.statement }}</p>

      <template v-if="!revealed">
        <p class="prompt">Say the key idea and the first move out loud. Then reveal.</p>
        <button class="btn primary big" type="button" @click="reveal">Show answer</button>
        <p class="muted small hint">or press <kbd>Space</kbd></p>
      </template>

      <template v-else>
        <p class="idea">{{ meta.idea.sentence }}</p>
        <div class="two">
          <ol class="moves">
            <li v-for="(m, i) in meta.recap.moves" :key="i"><span class="badge">{{ i + 1 }}</span>{{ m }}</li>
          </ol>
          <p class="cx muted">{{ meta.recap.complexity }}</p>
        </div>
        <div v-if="code" class="blocks">
          <MaskedCode lang="pseudo" label="Pseudocode" :code="code.pseudo" :stages="code.stages" />
          <MaskedCode lang="ts" label="TypeScript" :code="code.ts" :stages="code.stages" />
          <MaskedCode lang="go" label="Go" :code="code.go" :stages="code.stages" />
        </div>
        <p v-else class="muted">Loading code…</p>

        <div class="dock stage" role="group" aria-label="Rate your recall">
          <p class="q">How did that go?</p>
          <div class="rate">
            <button v-for="(g, i) in GRADES" :key="g" type="button" class="btn rbtn" :class="g" @click="rate(g)">
              <span>{{ labels[g] }}</span><small>{{ preview ? formatInterval(preview[g]) : '' }} <kbd>{{ i + 1 }}</kbd></small>
            </button>
          </div>
        </div>
      </template>
    </article>
  </div>
</template>

<style scoped>
.rs { max-width: 880px; }
.crumb { margin: 0 0 18px; color: var(--ink-2); }
.c { display: grid; gap: 16px; }
.meta { display: flex; flex-wrap: wrap; gap: 6px 18px; align-items: center; font-size: .9rem; color: var(--ink-2); }
.count { margin-right: auto; font: 500 .85rem var(--font-mono); } .count b { color: var(--ink); }
.cat { font-weight: 560; color: var(--ink); }
.bar { height: 4px; border-radius: 2px; background: var(--surface-2); overflow: hidden; }
.bar span { display: block; height: 100%; background: var(--ink); transition: width .25s; }
h1 { margin: 10px 0 0; font-size: clamp(2.2rem, 1.5rem + 3vw, 3.4rem); }
.statement { font-size: 1.15rem; line-height: 1.55; margin: 0; max-width: 60ch; }
.prompt { margin: 14px 0 0; padding: 16px 0; border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); color: var(--ink-2); font-size: 1.05rem; }
.big { min-height: 54px; font-size: 1.05rem; justify-self: start; padding: 0 28px; }
.hint { margin: 0; }
.idea { font: 600 clamp(1.4rem, 1.1rem + 1.2vw, 1.9rem)/1.25 var(--font-head); letter-spacing: -0.02em; margin: 10px 0 0; padding-top: 18px; border-top: 2px solid var(--ink); max-width: 30ch; text-wrap: balance; }
.two { display: grid; gap: 14px 40px; }
@media (min-width: 820px) { .two { grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr); align-items: start; } }
.moves { list-style: none; margin: 0; padding: 0; }
.moves li { display: flex; gap: 12px; align-items: flex-start; padding: 10px 0; border-bottom: 1px solid var(--line); line-height: 1.5; }
.moves li:first-child { padding-top: 0; }
.cx { margin: 0; font: 500 .9rem var(--font-mono); }
.blocks { display: grid; gap: 14px; }
.dock { position: sticky; bottom: 10px; z-index: 6; padding: 12px 14px 14px; margin-top: 8px; display: grid; gap: 8px; }
.q { margin: 0; font-weight: 600; font-size: .95rem; color: var(--ink-2); }
.rate { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
@media (min-width: 640px) { .rate { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
.rbtn { flex-direction: column; gap: 0; min-height: 58px; border-width: 1.5px; }
.rbtn small { font: 500 .78rem var(--font-mono); opacity: .85; }
.rbtn kbd { background: transparent; color: inherit; border-color: currentColor; opacity: .7; }
.rbtn.again { border-color: var(--miss-bd); color: var(--miss-fg); background: var(--miss-bg); }
.rbtn.hard { border-color: var(--focus-bd); color: var(--focus-fg); background: var(--focus-bg); }
.rbtn.good { border-color: var(--hit-bd); color: var(--hit-fg); background: var(--hit-bg); }
.rbtn.easy { border-color: var(--keep-bd); color: var(--keep-fg); background: var(--keep-bg); }
.empty { display: grid; gap: 14px; justify-items: start; max-width: 560px; }
.tally { display: flex; flex-wrap: wrap; gap: 8px 20px; margin: 0; }
.grade { font: 500 .95rem var(--font-mono); color: var(--ink-2); } .grade b { color: var(--ink); font-size: 1.3rem; }
</style>
