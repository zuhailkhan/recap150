<script setup lang="ts">
import { computed, ref } from 'vue'
import { arr, tree } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// Array positions: 0:3  1:1  2:4  3:3  5:1  6:5. parent[i] is the position of node i's parent.
const nodes = [3, 1, 4, 3, null, 1, 5]
const parent: Record<number, number> = { 1: 0, 2: 0, 3: 1, 5: 2, 6: 2 }
const real = [0, 1, 2, 3, 5, 6]
const at = ref(5)

const path = computed(() => {
  const out = [at.value]
  while (parent[out[0]] !== undefined) out.unshift(parent[out[0]])
  return out
})
const above = computed(() => path.value.slice(0, -1).map((i) => nodes[i] as number))
const highest = computed(() => (above.value.length ? Math.max(...above.value) : null))
const good = computed(() => highest.value === null || (nodes[at.value] as number) >= highest.value)
const panel = computed(() =>
  tree(nodes, { label: 'tap a node below to pick it', tones: nodes.map((_, i) => (i === at.value ? (good.value ? 'hit' : 'miss') : path.value.includes(i) ? 'keep' : null)) }),
)
const strip = computed(() => arr(path.value.map((i) => nodes[i] as number), { label: 'path from the root to the picked node', tones: path.value.map((i) => (i === at.value ? (good.value ? 'hit' : 'miss') : 'keep')) }))
</script>

<template>
  <div class="d">
    <PanelView :panel="panel" />
    <div class="pick" role="group" aria-label="Pick a node by its array position">
      <button v-for="i in real" :key="i" type="button" :class="{ on: i === at }" :aria-pressed="i === at" :aria-label="`Node ${nodes[i]} at position ${i}`" @click="at = i">{{ nodes[i] }}<small>#{{ i }}</small></button>
    </div>
    <PanelView :panel="strip" />
    <p class="verdict" :class="{ bad: !good }" role="status">
      <template v-if="highest === null">The root has nothing above it, so it is good.</template>
      <template v-else-if="good">The biggest value above it is {{ highest }}. {{ nodes[at] }} is at least that, so it is good.</template>
      <template v-else>The biggest value above it is {{ highest }}. {{ nodes[at] }} is smaller, so it is not good.</template>
    </p>
    <p class="muted small">Only the nodes on the path matter. Siblings never count.</p>
  </div>
</template>

<style scoped>
.d { display: grid; gap: 10px; }
.pick { display: flex; flex-wrap: wrap; gap: 8px; }
.pick button { min-width: 44px; min-height: 44px; padding: 0 12px; border-radius: 10px; border: 2px solid var(--line); background: var(--tile-bg); color: var(--tile-fg); font: inherit; font-weight: 700; cursor: pointer; }
.pick button small { margin-left: 4px; font-weight: 400; opacity: 0.7; }
.pick button.on { border-color: var(--focus-bd); background: var(--focus-bg); color: var(--focus-fg); }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); }
.verdict.bad { border-color: var(--miss-bd); background: var(--miss-bg); color: var(--miss-fg); }
</style>
