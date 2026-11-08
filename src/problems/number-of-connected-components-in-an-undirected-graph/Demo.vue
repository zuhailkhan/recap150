<script setup lang="ts">
import { computed, ref } from 'vue'
import { graph } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// Switch edges on and off. Each edge either merges two groups or changes nothing.
const all = [[0, 1], [1, 2], [3, 4], [2, 3], [0, 2]]
const on = ref([true, true, false, false, false])
const nodes = [{ id: '0', x: 10, y: 30 }, { id: '1', x: 30, y: 75 }, { id: '2', x: 52, y: 30 }, { id: '3', x: 72, y: 75 }, { id: '4', x: 92, y: 30 }]
const comps = computed(() => {
  const g = [0, 1, 2, 3, 4]
  const find = (x: number): number => (g[x] === x ? x : (g[x] = find(g[x])))
  const merges = on.value.map((e, i) => {
    if (!e) return null
    const [a, b] = all[i].map(find)
    if (a === b) return false
    g[a] = b
    return true
  })
  const roots = [...new Set([0, 1, 2, 3, 4].map(find))]
  return { merges, label: [0, 1, 2, 3, 4].map((v) => roots.indexOf(find(v)) + 1), count: roots.length }
})
const panel = computed(() => graph(nodes, all.flatMap(([a, b], i) => (on.value[i] ? [{ from: String(a), to: String(b), tone: comps.value.merges[i] ? ('hit' as const) : ('miss' as const) }] : [])), {
  label: 'green edge merged two groups, red edge changed nothing',
  tones: Object.fromEntries(comps.value.label.map((c, v) => [String(v), c % 2 ? 'keep' : 'focus'])),
  notes: Object.fromEntries(comps.value.label.map((c, v) => [String(v), `#${c}`])),
}))
</script>

<template>
  <div class="ccd">
    <div class="chips" role="group" aria-label="Edges on or off">
      <label v-for="(e, i) in all" :key="i" class="chip"><input v-model="on[i]" type="checkbox" /> {{ e[0] }}-{{ e[1] }}</label>
    </div>
    <PanelView :panel="panel" />
    <p class="verdict" role="status"><strong>{{ comps.count }}</strong> component{{ comps.count === 1 ? '' : 's' }}. Five nodes, minus one for every green edge.</p>
    <p class="muted small">Turn on 2-3, then 0-2. The second one is red: 0 and 2 were already together.</p>
  </div>
</template>

<style scoped>
.ccd { display: grid; gap: 10px; }
.chips { display: flex; flex-wrap: wrap; gap: 8px; }
.chip { display: flex; align-items: center; gap: 8px; min-height: 44px; padding: 0 12px; border: 1px solid var(--line); border-radius: 10px; background: var(--surface); font-weight: 600; }
.chip input { width: 22px; height: 22px; accent-color: var(--accent); }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); }
</style>
