<script setup lang="ts">
import { computed, ref } from 'vue'
import { arr, graph, type Tone } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// Same flights, same rounds. The only difference: do later flights in a round see this round's new prices?
const flights = [[0, 1, 100], [1, 2, 100], [2, 0, 100], [1, 3, 600], [2, 3, 200]]
const spots = [[12, 50], [44, 10], [44, 90], [88, 50]]
const mode = ref<'copy' | 'inplace'>('copy')
const stops = ref(1)

const run = (inPlace: boolean, k: number): number[] => {
  let cost = [0, Infinity, Infinity, Infinity]
  for (let r = 0; r <= k; r++) {
    const next = inPlace ? cost : cost.slice()
    for (const [from, to, price] of flights) if (cost[from] + price < next[to]) next[to] = cost[from] + price
    cost = next
  }
  return cost
}
const shown = computed(() => run(mode.value === 'inplace', stops.value))
const right = computed(() => run(false, stops.value)[3])
const fmt = (c: number) => (c === Infinity ? 'inf' : String(c))
const wrong = computed(() => shown.value[3] !== right.value)

const panels = computed(() => [
  graph(spots.map(([x, y], i) => ({ id: String(i), x, y })), flights.map(([a, b, w]) => ({ from: String(a), to: String(b), weight: w, directed: true })), {
    notes: Object.fromEntries(shown.value.map((c, i) => [String(i), fmt(c)])),
    tones: { 0: 'focus', 3: wrong.value ? 'miss' : 'hit' } as Record<string, Tone>,
    label: 'from city 0 to city 3. Number under a city = cost after all rounds',
  }),
  arr(shown.value.map(fmt), { label: 'cost per city', tones: shown.value.map((_, i): Tone | null => (i === 3 ? (wrong.value ? 'miss' : 'hit') : null)) }),
])
</script>

<template>
  <div class="cfd">
    <div class="row" role="group" aria-label="How a round updates costs">
      <button class="btn" :class="{ on: mode === 'copy' }" :aria-pressed="mode === 'copy'" @click="mode = 'copy'">Read the old copy</button>
      <button class="btn" :class="{ on: mode === 'inplace' }" :aria-pressed="mode === 'inplace'" @click="mode = 'inplace'">Update in place</button>
    </div>
    <label class="fld">Stops allowed (k): <strong>{{ stops }}</strong>
      <input v-model.number="stops" type="range" min="0" max="2" aria-label="Stops allowed" />
    </label>
    <PanelView v-for="(p, i) in panels" :key="i" :panel="p" />
    <p class="verdict" :class="{ bad: wrong }" role="status">
      <template v-if="wrong">City 3 shows {{ fmt(shown[3]) }}, but the right answer is {{ fmt(right) }}. In place, flight 1 to 2 was already priced when flight 2 to 3 was checked, so one round used two flights.</template>
      <template v-else>City 3 shows {{ fmt(shown[3]) }}, which is right. Each round added exactly one flight.</template>
    </p>
  </div>
</template>

<style scoped>
.cfd { display: grid; gap: 10px; }
.row { display: flex; flex-wrap: wrap; gap: 8px; }
.btn { min-height: 44px; padding: 0 14px; border-radius: 10px; border: 2px solid var(--line); background: var(--surface-2); color: inherit; font: inherit; cursor: pointer; }
.btn.on { border-color: var(--focus-bd); background: var(--focus-bg); color: var(--focus-fg); }
.fld { display: grid; gap: 4px; font-weight: 600; }
.fld input { width: 100%; min-height: 44px; accent-color: var(--accent); }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); }
.verdict.bad { border-color: var(--miss-bd); background: var(--miss-bg); color: var(--miss-fg); }
</style>
