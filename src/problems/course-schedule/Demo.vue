<script setup lang="ts">
import { computed, ref } from 'vue'
import { graph } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// Peel off courses with in-degree 0. A loop never reaches 0, so its courses stay stuck.
const loop = ref(false)
const pos = [{ id: '0', x: 12, y: 50 }, { id: '1', x: 38, y: 50 }, { id: '2', x: 64, y: 50 }, { id: '3', x: 88, y: 50 }]
const pairs = computed<[number, number][]>(() => [[0, 1], [1, 2], [2, 3], ...(loop.value ? [[3, 1] as [number, number]] : [])])
const result = computed(() => {
  const indeg = [0, 0, 0, 0]
  for (const [, to] of pairs.value) indeg[to]++
  const queue = [0, 1, 2, 3].filter((c) => indeg[c] === 0)
  for (let h = 0; h < queue.length; h++) for (const [from, to] of pairs.value) if (from === queue[h] && --indeg[to] === 0) queue.push(to)
  return { done: queue, left: indeg }
})
const panel = computed(() => graph(pos, pairs.value.map(([a, b]) => ({ from: String(a), to: String(b), directed: true, tone: loop.value && a === 3 ? ('miss' as const) : undefined })), {
  label: 'arrow = must come first',
  tones: Object.fromEntries([0, 1, 2, 3].map((c) => [String(c), result.value.done.includes(c) ? 'hit' : 'miss'])),
  notes: Object.fromEntries(result.value.left.map((d, i) => [String(i), `in ${d}`])),
}))
</script>

<template>
  <div class="csd">
    <label class="opt"><input v-model="loop" type="checkbox" /> Add the arrow 3 → 1 (3 must come before 1)</label>
    <PanelView :panel="panel" />
    <p class="verdict" :class="{ bad: result.done.length < 4 }" role="status">
      <template v-if="result.done.length === 4">Finished in order {{ result.done.join(', ') }}. Every course reached in-degree 0.</template>
      <template v-else>Finished {{ result.done.length }} of 4. Courses 1, 2, 3 each wait on another one in the loop, so none reaches 0.</template>
    </p>
    <p class="muted small">Toggle the box. The number under each course is what it still waits for (in-degree). Green courses were finished by the queue. Red ones are stuck.</p>
  </div>
</template>

<style scoped>
.csd { display: grid; gap: 10px; }
.opt { display: flex; align-items: center; gap: 10px; min-height: 44px; font-weight: 600; }
.opt input { width: 22px; height: 22px; accent-color: var(--accent); }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); }
.verdict.bad { border-color: var(--miss-bd); background: var(--miss-bg); color: var(--miss-fg); }
</style>
