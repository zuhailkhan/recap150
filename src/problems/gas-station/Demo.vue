<script setup lang="ts">
import { computed, ref } from 'vue'
import { arr } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// Starts 0, 1 and 2 all run dry at the same station, so skipping straight to 3 loses nothing.
const gains = [2, 1, -5, 3, 1]
const n = gains.length
const start = ref(0)
const trip = computed(() => {
  const tank: number[] = []
  let t = 0
  let failAt = -1
  for (let k = 0; k < n; k++) {
    const i = (start.value + k) % n
    t += gains[i]
    tank.push(t)
    if (t < 0 && failAt < 0) { failAt = i; break }
  }
  return { tank, failAt }
})
const note = computed(() => {
  const f = trip.value.failAt
  if (start.value < f) return `Any start between ${start.value} and ${f} arrives there with no more fuel than this run had, so it fails too.`
  if (start.value === f) return 'This station is itself the failure.'
  return 'The trip wrapped around the circle before running dry.'
})
const panels = computed(() => [
  arr(gains, { label: 'gas − cost at each station', tones: gains.map((_, i) => (i === start.value ? 'focus' : null)), pointers: [{ name: 'start', at: start.value }] }),
  arr(trip.value.tank, { label: `tank after each leg, starting at ${start.value}`, tones: trip.value.tank.map((v) => (v < 0 ? 'miss' : 'keep')) }),
])
</script>

<template>
  <div class="d">
    <div class="row" role="group" aria-label="Start station">
      <button v-for="s in n" :key="s" type="button" class="btn" :class="{ on: start === s - 1 }" :aria-pressed="start === s - 1" @click="start = s - 1">Start {{ s - 1 }}</button>
    </div>
    <PanelView v-for="(p, i) in panels" :key="i" :panel="p" />
    <p class="verdict" :class="{ bad: trip.failAt >= 0 }" role="status">
      <template v-if="trip.failAt >= 0">Dry at station {{ trip.failAt }}. {{ note }}</template>
      <template v-else>The tank never dips below zero. This start completes the lap.</template>
    </p>
    <p class="muted small">Try starts 0, 1 and 2. All fail at station 2. That is why the algorithm jumps straight to 3.</p>
  </div>
</template>

<style scoped>
.d { display: grid; gap: 10px; }
.row { display: flex; gap: 8px; flex-wrap: wrap; }
.row .btn.on { border-color: var(--focus-bd); background: var(--focus-bg); color: var(--focus-fg); }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); }
.verdict.bad { border-color: var(--miss-bd); background: var(--miss-bg); color: var(--miss-fg); }
</style>
