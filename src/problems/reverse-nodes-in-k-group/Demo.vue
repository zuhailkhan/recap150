<script setup lang="ts">
import { computed, ref } from 'vue'
import { list } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// Choose k. Full blocks of k flip. A short last block stays.
const vals = [1, 2, 3, 4, 5, 6, 7]
const k = ref(3)

const full = computed(() => Math.floor(vals.length / k.value) * k.value)
const before = computed(() => list(vals, { label: 'input. Blocks of k are blue, the short tail is grey', tones: vals.map((_, i) => (i >= full.value ? 'dim' : Math.floor(i / k.value) % 2 === 0 ? 'focus' : 'keep')) }))
const result = computed(() => {
  const out: number[] = []
  for (let s = 0; s < vals.length; s += k.value) {
    const block = vals.slice(s, s + k.value)
    out.push(...(block.length === k.value ? block.reverse() : block))
  }
  return out
})
const after = computed(() => list(result.value, { label: 'result. Each full block is reversed', tones: vals.map((_, i) => (i >= full.value ? 'dim' : 'hit')) }))
const tail = computed(() => vals.length - full.value)
</script>

<template>
  <div class="d">
    <label class="pick">Block size k: <b>{{ k }}</b>
      <input v-model.number="k" type="range" min="1" :max="vals.length + 1" step="1" aria-label="Block size k" />
    </label>
    <PanelView :panel="before" />
    <PanelView :panel="after" />
    <p class="verdict" role="status">
      <template v-if="tail === 0">{{ full / k }} full {{ full / k === 1 ? 'block' : 'blocks' }} and no tail. Everything flips.</template>
      <template v-else-if="full === 0">No full block fits, so nothing flips.</template>
      <template v-else>{{ full / k }} full {{ full / k === 1 ? 'block flips' : 'blocks flip' }}. The last {{ tail }} {{ tail === 1 ? 'node is' : 'nodes are' }} fewer than k, so they stay.</template>
    </p>
  </div>
</template>

<style scoped>
.d { display: grid; gap: 10px; }
.pick { display: grid; gap: 6px; font-weight: 600; }
.pick input { width: 100%; min-height: 44px; accent-color: var(--accent); }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--keep-bd); background: var(--keep-bg); color: var(--keep-fg); }
</style>
