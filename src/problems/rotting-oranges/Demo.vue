<script setup lang="ts">
import { computed, ref } from 'vue'
import { grid } from '@/core/panels'
import type { Tone } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// Slide through the minutes. Add a second rotten orange and watch the spread finish sooner.
const g = [
  [1, 1, 1, 1, 1],
  [1, 1, 0, 1, 1],
  [1, 0, 1, 1, 1],
  [1, 1, 1, 1, 1],
]
const second = ref(false)
const minute = ref(0)

// the minute at which each cell rots (Infinity = never), by waves from all sources at once
const rotAt = computed(() => {
  const at = g.map((row) => row.map(() => Infinity))
  let wave: number[][] = [[0, 0]]
  if (second.value) wave.push([3, 4])
  wave.forEach(([r, c]) => { at[r][c] = 0 })
  for (let m = 1; wave.length; m++) {
    const next: number[][] = []
    for (const [r, c] of wave) for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nr = r + dr, nc = c + dc
      if (nr >= 0 && nc >= 0 && nr < g.length && nc < g[0].length && g[nr][nc] === 1 && at[nr][nc] === Infinity) { at[nr][nc] = m; next.push([nr, nc]) }
    }
    wave = next
  }
  return at
})
const total = computed(() => Math.max(...rotAt.value.flat().filter((v) => v !== Infinity)))
const shown = computed(() => Math.min(minute.value, total.value))
const panel = computed(() => grid(
  g.map((row, r) => row.map((v, c) => (v === 0 ? 0 : rotAt.value[r][c] <= shown.value ? 2 : 1))),
  { label: `minute ${shown.value} (2 rotten, 1 fresh, 0 empty)`, tones: g.map((row, r) => row.map((v, c): Tone | null => (v === 0 ? 'dim' : rotAt.value[r][c] === shown.value ? 'focus' : rotAt.value[r][c] < shown.value ? 'keep' : null))) },
))
</script>

<template>
  <div class="rod">
    <label class="rod-opt"><input v-model="second" type="checkbox" /> Second rotten orange in the bottom-right corner</label>
    <label class="rod-fld">Minute: <strong>{{ shown }}</strong> of {{ total }} <input v-model.number="minute" type="range" min="0" :max="total" aria-label="Minute" /></label>
    <PanelView :panel="panel" />
    <p class="rod-out" role="status">All oranges rotten after <strong>{{ total }}</strong> minutes. Each minute is one ring of the spread, from every rotten orange together.</p>
  </div>
</template>

<style scoped>
.rod { display: grid; gap: 10px; }
.rod-opt { display: flex; align-items: center; gap: 8px; min-height: 44px; font-weight: 600; }
.rod-opt input { width: 22px; height: 22px; accent-color: var(--accent); }
.rod-fld { display: grid; gap: 4px; font-weight: 600; }
.rod-fld input { width: 100%; min-height: 44px; accent-color: var(--accent); }
.rod-out { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--line); background: var(--surface-2); color: var(--ink); }
</style>
