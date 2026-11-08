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
    <p class="crumb small"><router-link to="/recap">← Recap</router-link> · {{ title }}</p>

    <p v-if="!started" class="muted">Loading your progress…</p>

    <div v-else-if="!queue.length" class="card empty">
      <h1>Nothing to review</h1>
      <p>No cards match this list right now. Come back when something is due, or try another mode.</p>
      <router-link class="btn primary" to="/recap">Back to recap</router-link>
    </div>

    <div v-else-if="done" class="card empty">
      <h1>Done for now</h1>
      <p>You went through {{ tally.again + tally.hard + tally.good + tally.easy }} card{{ tally.again + tally.hard + tally.good + tally.easy === 1 ? '' : 's' }}.</p>
      <p class="tally"><span v-for="g in GRADES" :key="g" class="chip">{{ labels[g] }} {{ tally[g] }}</span></p>
      <p>Streak: <strong>{{ currentStreak() }}</strong> day{{ currentStreak() === 1 ? '' : 's' }}.</p>
      <router-link class="btn primary" to="/recap">Back to recap</router-link>
    </div>

    <article v-else-if="meta" class="card c">
      <div class="meta">
        <span class="count">Card {{ pos + 1 }} of {{ queue.length }}</span>
        <span class="chip">{{ meta.category }}</span><span class="chip" :class="meta.difficulty">{{ meta.difficulty }}</span>
      </div>
      <div class="bar" role="progressbar" :aria-valuenow="pos" aria-valuemin="0" :aria-valuemax="queue.length" aria-label="Session progress"><span :style="{ width: (pos / queue.length) * 100 + '%' }"></span></div>
      <h1>{{ meta.title }}</h1>
      <p class="statement">{{ meta.statement }}</p>

      <template v-if="!revealed">
        <p class="prompt">Try to recall the key idea, then the code. Say it out loud if you can.</p>
        <button class="btn primary big" type="button" @click="reveal">Show answer</button>
        <p class="muted small hint">or press <kbd>Space</kbd></p>
      </template>

      <template v-else>
        <h2>Key idea</h2>
        <p class="idea">{{ meta.idea.sentence }}</p>
        <RecapCard :recap="meta.recap" />
        <h2 class="gap">Code</h2>
        <div v-if="code" class="blocks">
          <MaskedCode lang="pseudo" label="Pseudocode" :code="code.pseudo" :stages="code.stages" />
          <MaskedCode lang="ts" label="TypeScript" :code="code.ts" :stages="code.stages" />
          <MaskedCode lang="go" label="Go" :code="code.go" :stages="code.stages" />
        </div>
        <p v-else class="muted">Loading code…</p>

        <p class="rate-q">How did that go?</p>
        <div class="rate" role="group" aria-label="Rate your recall">
          <button v-for="(g, i) in GRADES" :key="g" type="button" class="btn rbtn" :class="g" @click="rate(g)">
            <span>{{ labels[g] }}</span><small>{{ preview ? formatInterval(preview[g]) : '' }} · <kbd>{{ i + 1 }}</kbd></small>
          </button>
        </div>
      </template>
    </article>
  </div>
</template>

<style scoped>
.rs { max-width: 900px; }
.crumb { margin: 0 0 12px; }
.c { display: grid; gap: 12px; padding: clamp(16px, 3vw, 28px); }
.meta { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.count { font-weight: 700; margin-right: auto; }
.bar { height: 6px; border-radius: 999px; background: var(--surface-2); overflow: hidden; }
.bar span { display: block; height: 100%; background: var(--accent); }
h1 { margin: 6px 0 0; } h2 { margin: 8px 0 0; font-size: 1.15rem; }
.gap { margin-top: 12px; }
.statement { font-size: 1.1rem; margin: 0; }
.prompt { margin: 12px 0 0; padding: 14px; border: 2px dashed var(--line); border-radius: 12px; color: var(--ink-2); }
.big { min-height: 52px; font-size: 1.05rem; }
.hint { margin: 0; text-align: center; }
.idea { font: 600 1.25rem var(--font-head); margin: 0; }
.blocks { display: grid; gap: 12px; }
.rate-q { margin: 12px 0 0; font-weight: 700; }
.rate { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; position: sticky; bottom: 8px; padding: 8px; background: color-mix(in srgb, var(--surface) 92%, transparent); border-radius: 14px; backdrop-filter: blur(4px); }
@media (min-width: 640px) { .rate { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
.rbtn { flex-direction: column; gap: 0; min-height: 60px; border-width: 2px; }
.rbtn small { font-weight: 500; color: inherit; opacity: .85; }
.rbtn.again { border-color: var(--miss-bd); color: var(--miss-fg); background: var(--miss-bg); }
.rbtn.hard { border-color: var(--focus-bd); color: var(--focus-fg); background: var(--focus-bg); }
.rbtn.good { border-color: var(--hit-bd); color: var(--hit-fg); background: var(--hit-bg); }
.rbtn.easy { border-color: var(--keep-bd); color: var(--keep-fg); background: var(--keep-bg); }
.empty { display: grid; gap: 10px; justify-items: start; }
.tally { display: flex; flex-wrap: wrap; gap: 6px; margin: 0; }
</style>
