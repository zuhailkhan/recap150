<script setup lang="ts">
import { computed, ref } from 'vue'
import { grid } from '@/core/panels'
import type { Tone } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// Climb inland from one coast at a time. Cells reached from both coasts are the answer.
const h = [
  [1, 2, 2, 3, 5],
  [3, 2, 3, 4, 4],
  [2, 4, 5, 3, 1],
  [6, 7, 1, 4, 5],
  [5, 1, 1, 2, 4],
]
const mode = ref<'pacific' | 'atlantic' | 'both'>('pacific')
const N = 5

const climb = (coast: (r: number, c: number) => boolean): boolean[][] => {
  const seen = h.map((row, r) => row.map((_, c) => coast(r, c)))
  const stack: [number, number][] = []
  seen.forEach((row, r) => row.forEach((v, c) => { if (v) stack.push([r, c]) }))
  while (stack.length) {
    const [r, c] = stack.pop()!
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nr = r + dr, nc = c + dc
      if (nr >= 0 && nc >= 0 && nr < N && nc < N && !seen[nr][nc] && h[nr][nc] >= h[r][c]) { seen[nr][nc] = true; stack.push([nr, nc]) }
    }
  }
  return seen
}
const pac = climb((r, c) => r === 0 || c === 0)
const atl = climb((r, c) => r === N - 1 || c === N - 1)
const panel = computed(() => grid(h, {
  label: mode.value === 'both' ? 'reached from both coasts' : `reached by climbing from the ${mode.value}`,
  tones: h.map((row, r) => row.map((_, c): Tone | null => (mode.value === 'both' ? (pac[r][c] && atl[r][c] ? 'hit' : 'dim') : (mode.value === 'pacific' ? pac : atl)[r][c] ? 'keep' : null))),
}))
const count = computed(() => h.flat().filter((_, i) => (mode.value === 'both' ? pac[Math.floor(i / N)][i % N] && atl[Math.floor(i / N)][i % N] : (mode.value === 'pacific' ? pac : atl)[Math.floor(i / N)][i % N])).length)
</script>

<template>
  <div class="pad">
    <fieldset class="pad-pick">
      <legend>Show cells reached from</legend>
      <label><input v-model="mode" type="radio" value="pacific" /> Pacific coast (top, left)</label>
      <label><input v-model="mode" type="radio" value="atlantic" /> Atlantic coast (bottom, right)</label>
      <label><input v-model="mode" type="radio" value="both" /> Both</label>
    </fieldset>
    <PanelView :panel="panel" />
    <p class="pad-out" role="status"><strong>{{ count }}</strong> cells. The climb only steps to a neighbour that is the same height or higher.</p>
  </div>
</template>

<style scoped>
.pad { display: grid; gap: 10px; }
.pad-pick { display: grid; gap: 2px; border: 2px solid var(--line); border-radius: 10px; padding: 6px 12px; }
.pad-pick label { display: flex; align-items: center; gap: 8px; min-height: 44px; font-weight: 600; }
.pad-pick input { width: 22px; height: 22px; accent-color: var(--accent); }
.pad-out { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--line); background: var(--surface-2); color: var(--ink); }
</style>
