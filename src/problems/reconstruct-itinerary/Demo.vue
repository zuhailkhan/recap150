<script setup lang="ts">
import { computed, ref } from 'vue'
import { arr } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// Tickets: JFK->ATL (dead end), JFK->NRT, NRT->LAX, LAX->JFK. Compare two ways of writing the route.
const tickets = [['JFK', 'ATL'], ['JFK', 'NRT'], ['NRT', 'LAX'], ['LAX', 'JFK']]
const mode = ref<'greedy' | 'after'>('greedy')

const build = () => {
  const next = new Map<string, string[]>()
  for (const [a, b] of tickets) next.set(a, [...(next.get(a) ?? []), b])
  for (const d of next.values()) d.sort().reverse()
  return next
}
const greedy = computed(() => {
  const next = build()
  const out = ['JFK']
  for (let d = next.get('JFK'); d && d.length; d = next.get(out[out.length - 1])) out.push(d.pop()!)
  return out
})
const after = computed(() => {
  const next = build()
  const path = ['JFK']
  const route: string[] = []
  while (path.length) {
    const d = next.get(path[path.length - 1])
    if (d && d.length) path.push(d.pop()!)
    else route.push(path.pop()!)
  }
  return route.reverse()
})
const route = computed(() => (mode.value === 'greedy' ? greedy.value : after.value))
const panel = computed(() => arr(route.value, { label: 'route', tones: route.value.map(() => (route.value.length === tickets.length + 1 ? 'hit' : 'miss')) }))
</script>

<template>
  <div class="rid">
    <div class="row" role="group" aria-label="When to write an airport down">
      <button class="btn" :class="{ on: mode === 'greedy' }" :aria-pressed="mode === 'greedy'" @click="mode = 'greedy'">Write it on arrival</button>
      <button class="btn" :class="{ on: mode === 'after' }" :aria-pressed="mode === 'after'" @click="mode = 'after'">Write it when stuck, then reverse</button>
    </div>
    <PanelView :panel="panel" />
    <p class="verdict" :class="{ bad: route.length !== tickets.length + 1 }" role="status">
      <template v-if="route.length === tickets.length + 1">All {{ tickets.length }} tickets used. A dead end (ATL) is written first, so it ends up last.</template>
      <template v-else>Only {{ route.length - 1 }} of {{ tickets.length }} tickets used. The walk took ATL (smallest) and got stuck there.</template>
    </p>
  </div>
</template>

<style scoped>
.rid { display: grid; gap: 10px; }
.row { display: flex; flex-wrap: wrap; gap: 8px; }
.btn { min-height: 44px; padding: 0 14px; border-radius: 10px; border: 2px solid var(--line); background: var(--surface-2); color: inherit; font: inherit; cursor: pointer; }
.btn.on { border-color: var(--focus-bd); background: var(--focus-bg); color: var(--focus-fg); }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); }
.verdict.bad { border-color: var(--miss-bd); background: var(--miss-bg); color: var(--miss-fg); }
</style>
