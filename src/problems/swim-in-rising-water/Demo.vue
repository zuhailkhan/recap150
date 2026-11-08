<script setup lang="ts">
import { computed, ref } from 'vue'
import { grid, type Tone } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// Raise the water. The flooded region is every cell you can reach using only cells at or below the water level.
const g = [[0, 1, 2, 3], [11, 12, 13, 4], [10, 15, 14, 5], [9, 8, 7, 6]]
const level = ref(0)
const view = computed(() => {
  const n = g.length
  const reach = new Set<string>()
  if (g[0][0] <= level.value) {
    const stack: [number, number][] = [[0, 0]]
    reach.add('0,0')
    while (stack.length) {
      const [r, c] = stack.pop()!
      for (const [a, b] of [[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]]) {
        if (a >= 0 && b >= 0 && a < n && b < n && g[a][b] <= level.value && !reach.has(`${a},${b}`)) { reach.add(`${a},${b}`); stack.push([a, b]) }
      }
    }
  }
  const tones = g.map((row, i) => row.map((h, j): Tone | null => (reach.has(`${i},${j}`) ? 'hit' : h <= level.value ? 'keep' : null)))
  return { panel: grid(g, { tones, label: `water level ${level.value}. Green = you can swim here. Shaded = under water but cut off` }), connected: reach.has('3,3') }
})
</script>

<template>
  <div class="srd">
    <label class="fld">Water level: <strong>{{ level }}</strong>
      <input v-model.number="level" type="range" min="0" max="15" aria-label="Water level" />
    </label>
    <PanelView :panel="view.panel" />
    <p class="verdict" :class="{ ok: view.connected }" role="status">
      <template v-if="view.connected">At level {{ level }} the corners are connected. Slide down: the first level where this is true is the answer.</template>
      <template v-else>At level {{ level }} the bottom-right cell is not reachable yet. Keep raising the water.</template>
    </p>
  </div>
</template>

<style scoped>
.srd { display: grid; gap: 10px; }
.fld { display: grid; gap: 4px; font-weight: 600; }
.fld input { width: 100%; min-height: 44px; accent-color: var(--accent); }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--keep-bd); background: var(--keep-bg); color: var(--keep-fg); }
.verdict.ok { border-color: var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); }
</style>
