<script setup lang="ts">
import { computed, ref } from 'vue'
import { dp, mark2 } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// Pick a square. Its count is the square above plus the square to its left.
const R = 4
const C = 5
const ri = ref(2)
const cj = ref(3)
const table: number[][] = Array.from({ length: R }, (_, i) => Array.from({ length: C }, (_, j) => (i === 0 || j === 0 ? 1 : 0)))
for (let i = 1; i < R; i++) for (let j = 1; j < C; j++) table[i][j] = table[i - 1][j] + table[i][j - 1]
const panel = computed(() => {
  const set: [number, number, 'keep' | 'focus'][] = [[ri.value, cj.value, 'focus']]
  if (ri.value > 0) set.push([ri.value - 1, cj.value, 'keep'])
  if (cj.value > 0) set.push([ri.value, cj.value - 1, 'keep'])
  return dp(table, { label: 'dp[i][j] = routes into square (i, j)', tones: mark2(R, C, set), rowLabels: table.map((_, i) => `i=${i}`), colLabels: table[0].map((_, j) => `j=${j}`) })
})
const text = computed(() => {
  const i = ri.value
  const j = cj.value
  if (i === 0 || j === 0) return `Square (${i}, ${j}) is on the edge. Only one straight route reaches it: 1.`
  return `dp[${i}][${j}] = above ${table[i - 1][j]} + left ${table[i][j - 1]} = ${table[i][j]}.`
})
</script>

<template>
  <div class="d">
    <label class="ctl">Row i: {{ ri }}<input v-model.number="ri" type="range" min="0" :max="R - 1" /></label>
    <label class="ctl">Column j: {{ cj }}<input v-model.number="cj" type="range" min="0" :max="C - 1" /></label>
    <PanelView :panel="panel" />
    <p class="verdict" role="status">{{ text }}</p>
    <p class="muted small">Move the sliders. Amber is the square you picked. Blue squares are the two its count is built from.</p>
  </div>
</template>

<style scoped>
.d { display: grid; gap: 10px; }
.ctl { display: grid; gap: 4px; font-weight: 600; }
.ctl input { width: 100%; min-height: 44px; accent-color: var(--accent); }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--focus-bd); background: var(--focus-bg); color: var(--focus-fg); }
</style>
