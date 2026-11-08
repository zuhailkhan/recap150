<script setup lang="ts">
import { computed, ref } from 'vue'
import { arr, tree } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// A search tree. Reading it in order (left, node, right) gives the values from smallest to largest.
const nodes = [5, 3, 6, 2, 4, null, null, 1]
const order = [7, 3, 1, 4, 0, 2] // array positions in the order an in-order walk visits them
const k = ref(3)
const kk = computed(() => Math.min(order.length, Math.max(1, Math.trunc(k.value) || 1)))
const panel = computed(() => {
  const tones = nodes.map(() => null as 'dim' | 'hit' | null)
  order.forEach((pos, rank) => {
    if (rank + 1 < kk.value) tones[pos] = 'dim'
    if (rank + 1 === kk.value) tones[pos] = 'hit'
  })
  return tree(nodes, { label: 'visited before the answer are grey', tones })
})
const strip = computed(() => arr(order.map((p) => nodes[p] as number), { label: 'in-order visit list', tones: order.map((_, i) => (i + 1 < kk.value ? 'dim' : i + 1 === kk.value ? 'hit' : null)) }))
</script>

<template>
  <div class="d">
    <label class="opt">k = {{ kk }} <input v-model.number="k" type="range" min="1" :max="order.length" step="1" aria-label="k" /></label>
    <PanelView :panel="panel" />
    <PanelView :panel="strip" />
    <p class="verdict" role="status">The {{ kk }}{{ kk === 1 ? 'st' : kk === 2 ? 'nd' : kk === 3 ? 'rd' : 'th' }} node visited holds <strong>{{ nodes[order[kk - 1]] }}</strong>. The walk stops there.</p>
    <p class="muted small">Slide k. The visit list is already sorted, so counting visits is all you need.</p>
  </div>
</template>

<style scoped>
.d { display: grid; gap: 10px; }
.opt { display: flex; align-items: center; gap: 12px; min-height: 44px; font-weight: 600; }
.opt input { flex: 1; min-height: 44px; accent-color: var(--accent); }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); }
</style>
