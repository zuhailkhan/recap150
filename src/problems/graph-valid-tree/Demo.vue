<script setup lang="ts">
import { computed, ref } from 'vue'
import { graph } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// Four nodes. Choose which edges exist. Two checks decide: n - 1 edges, and everything reached from 0.
const all = [[0, 1], [1, 2], [2, 3], [0, 2], [1, 3]]
const on = ref([true, true, false, true, false])
const nodes = [{ id: '0', x: 15, y: 25 }, { id: '1', x: 85, y: 25 }, { id: '2', x: 85, y: 80 }, { id: '3', x: 15, y: 80 }]
const edges = computed(() => all.filter((_, i) => on.value[i]))
const reached = computed(() => {
  const seen = [0]
  for (let h = 0; h < seen.length; h++) for (const [a, b] of edges.value) for (const [x, y] of [[a, b], [b, a]]) if (x === seen[h] && !seen.includes(y)) seen.push(y)
  return seen
})
const countOk = computed(() => edges.value.length === 3)
const allOk = computed(() => reached.value.length === 4)
const panel = computed(() => graph(nodes, edges.value.map(([a, b]) => ({ from: String(a), to: String(b) })), {
  label: 'green nodes are reached from node 0',
  tones: Object.fromEntries([0, 1, 2, 3].map((v) => [String(v), reached.value.includes(v) ? 'hit' : 'miss'])),
}))
</script>

<template>
  <div class="gtd">
    <div class="chips" role="group" aria-label="Edges on or off">
      <label v-for="(e, i) in all" :key="i" class="chip"><input v-model="on[i]" type="checkbox" /> {{ e[0] }}-{{ e[1] }}</label>
    </div>
    <PanelView :panel="panel" />
    <p class="verdict" :class="{ bad: !(countOk && allOk) }" role="status">
      Edges: {{ edges.length }} (need 3) {{ countOk ? 'OK' : 'NO' }}. Reached: {{ reached.length }} of 4 {{ allOk ? 'OK' : 'NO' }}.
      <strong>{{ countOk && allOk ? 'A tree.' : 'Not a tree.' }}</strong>
    </p>
    <p class="muted small">Try 0-1, 1-2, 0-2: three edges, but node 3 is cut off. Both checks are needed.</p>
  </div>
</template>

<style scoped>
.gtd { display: grid; gap: 10px; }
.chips { display: flex; flex-wrap: wrap; gap: 8px; }
.chip { display: flex; align-items: center; gap: 8px; min-height: 44px; padding: 0 12px; border: 1px solid var(--line); border-radius: 10px; background: var(--surface); font-weight: 600; }
.chip input { width: 22px; height: 22px; accent-color: var(--accent); }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); }
.verdict.bad { border-color: var(--miss-bd); background: var(--miss-bg); color: var(--miss-fg); }
</style>
