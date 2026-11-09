<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { RECAP } from '@/recap/config'
import { buildDaily, buildWeak } from '@/recap/scheduler'
import { DECKS, isDeck, relativeDay, useStats, type Deck } from '@/recap/stats'
import { progress } from '@/recap/store'

const route = useRoute()
const router = useRouter()
const deck = computed<Deck>(() => (isDeck(route.query.deck) ? route.query.deck : 'dsa'))
const setDeck = (d: Deck) => router.replace({ query: { ...route.query, deck: d } })

const stats = computed(() => useStats(deck.value))
const today = computed(() => stats.value.today.value)
const due = computed(() => stats.value.due.value)
const streak = computed(() => stats.value.streak.value)
const last = computed(() => stats.value.last.value)
const cands = computed(() => stats.value.cands.value)
const readyCats = computed(() => stats.value.categories.value.filter((c) => c.ready))

const daily = computed(() => buildDaily(cands.value, progress.cards, today.value).length)
const weak = computed(() => buildWeak(cands.value, progress.cards).length)
const cat = ref('')
watch(readyCats, (c) => { if (!c.find((x) => x.name === cat.value)) cat.value = c[0]?.name ?? '' }, { immediate: true })
const deckLong = computed(() => DECKS.find((d) => d.id === deck.value)!.long)
const q = (mode: string, extra: Record<string, string> = {}) => ({ path: '/recap/run', query: { deck: deck.value, mode, ...extra } })
</script>

<template>
  <div class="rh">
    <h1>Recap</h1>
    <p class="lede">Try to recall each topic before you look. Then rate how it went. Hard ones come back sooner.</p>

    <div class="decks" role="group" aria-label="Deck">
      <button v-for="d in DECKS" :key="d.id" type="button" class="btn" :aria-pressed="deck === d.id" @click="setDeck(d.id)">{{ d.label }}</button>
    </div>
    <p class="status muted">{{ deckLong }}. {{ due }} due today. {{ streak }}-day streak. Last review: {{ relativeDay(last) }}.</p>

    <p v-if="!cands.length" class="empty muted">No topics in this deck are written yet, so there is nothing to review.</p>

    <ul v-else class="modes">
      <li class="mode">
        <div class="txt">
          <h2>Daily mix</h2>
          <p class="muted">Cards that are due, then up to {{ RECAP.newPerDay }} new ones, at most {{ RECAP.dailyCap }} in all.</p>
        </div>
        <p class="n"><b>{{ daily }}</b> {{ daily === 1 ? 'card' : 'cards' }}</p>
        <router-link class="btn primary" :class="{ off: !daily }" :to="q('daily')" :aria-disabled="!daily">Start daily mix</router-link>
      </li>
      <li class="mode">
        <div class="txt">
          <h2>Group drill</h2>
          <p class="muted">Every written topic in one group.</p>
          <label class="sel"><span class="sr-only">Group</span>
            <select v-model="cat"><option v-for="c in readyCats" :key="c.name" :value="c.name">{{ c.name }} ({{ c.ready }})</option></select>
          </label>
        </div>
        <p class="n"><b>{{ readyCats.find((c) => c.name === cat)?.ready ?? 0 }}</b> cards</p>
        <router-link class="btn primary" :to="q('category', { cat })">Start drill</router-link>
      </li>
      <li class="mode">
        <div class="txt">
          <h2>Weak spots</h2>
          <p class="muted">Cards you have lapsed on, or that keep feeling hard. Worst first.</p>
        </div>
        <p class="n"><b>{{ weak }}</b> {{ weak === 1 ? 'card' : 'cards' }}</p>
        <router-link class="btn primary" :class="{ off: !weak }" :to="q('weak')" :aria-disabled="!weak">Start weak spots</router-link>
      </li>
    </ul>

    <p class="muted small keys">During a card: <kbd>Space</kbd> shows the answer, then <kbd>1</kbd> Again, <kbd>2</kbd> Hard, <kbd>3</kbd> Good, <kbd>4</kbd> Easy.</p>
  </div>
</template>

<style scoped>
.rh { max-width: 1000px; }
.lede { font-size: 1.15rem; color: var(--ink-2); max-width: 46ch; margin-bottom: 18px; }
.decks { display: inline-flex; gap: 6px; margin-bottom: 14px; }
.status { margin: 0 0 32px; font-size: .95rem; }
.empty { padding: 28px 0; border-top: 1px solid var(--line); }
.modes { list-style: none; margin: 0; padding: 0; }
.mode { display: grid; gap: 12px 24px; align-items: center; padding: 24px 0; border-top: 1px solid var(--line); grid-template-columns: minmax(0, 1fr); }
.mode:last-child { border-bottom: 1px solid var(--line); }
@media (min-width: 820px) { .mode { grid-template-columns: minmax(0, 1fr) 110px 200px; } }
.mode h2 { margin: 0 0 4px; }
.mode p { margin: 0; }
.txt p { max-width: 46ch; }
.n { font: 500 .95rem var(--font-mono); color: var(--ink-2); }
.n b { font-size: 1.5rem; color: var(--ink); font-weight: 700; }
.off { opacity: .4; pointer-events: none; }
.sel { display: block; margin-top: 10px; }
select { min-height: 44px; padding: 0 12px; font: .95rem var(--font-ui); color: var(--ink); background: var(--surface); border: 1.5px solid var(--line); border-radius: var(--radius-s); max-width: 100%; }
.keys { margin-top: 28px; }
</style>
