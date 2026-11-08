<script setup lang="ts">
import { computed, ref } from 'vue'
import { grid, mark2, type Tone } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// Pick a start cell. Its best path is 1 plus the best of its strictly bigger neighbours.
const m = [[9, 9, 4], [6, 6, 8], [2, 1, 1]]
const r = ref(2)
const c = ref(1)
const up = (a: number, b: number): [number, number][] =>
  ([[1, 0], [-1, 0], [0, 1], [0, -1]] as const)
    .map(([dr, dc]): [number, number] => [a + dr, b + dc])
    .filter(([x, y]) => x >= 0 && x < m.length && y >= 0 && y < m[0].length && m[x][y] > m[a][b])
const len = (a: number, b: number): number => 1 + Math.max(0, ...up(a, b).map(([x, y]) => len(x, y)))
const bigger = computed(() => up(r.value, c.value))
const panel = computed(() => grid(m, {
  label: 'matrix: the start is lit, bigger neighbours are marked',
  tones: mark2(3, 3, [...bigger.value.map(([x, y]): [number, number, Tone] => [x, y, 'keep']), [r.value, c.value, 'focus']]),
}))
</script>

<template>
  <div class="lpd">
    <label class="fld">Row: <strong>{{ r }}</strong> <input v-model.number="r" type="range" min="0" max="2" aria-label="Start row" /></label>
    <label class="fld">Column: <strong>{{ c }}</strong> <input v-model.number="c" type="range" min="0" max="2" aria-label="Start column" /></label>
    <PanelView :panel="panel" />
    <p class="verdict" role="status">
      Start {{ m[r][c] }}.
      <template v-if="bigger.length">Bigger neighbours start paths of {{ bigger.map(([x, y]) => len(x, y)).join(', ') }}. Best = 1 + {{ len(r, c) - 1 }} = <strong>{{ len(r, c) }}</strong>.</template>
      <template v-else>No neighbour is bigger. Best = <strong>1</strong>.</template>
    </p>
    <p class="muted small">Each answer is stored once in the memo, so a neighbour reached from two cells is not walked twice.</p>
  </div>
</template>

<style scoped>
.lpd { display: grid; gap: 10px; }
.fld { display: grid; gap: 4px; font-weight: 600; }
.fld input { width: 100%; min-height: 44px; accent-color: var(--accent); }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--line); background: var(--surface-2); color: var(--ink); }
</style>
