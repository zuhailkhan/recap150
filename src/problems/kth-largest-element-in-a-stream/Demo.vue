<script setup lang="ts">
import { computed, ref } from 'vue'
import { arr, heap } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// Keep only the k biggest numbers. The smallest of them is the kth largest.
const k = 3
const stream = [4, 5, 8, 2, 3, 5, 10, 9, 4]
const start = stream.slice(0, 4)
const seen = ref<number[]>([...start])
const pos = ref(start.length) // how far into the stream the Add next button has read
const custom = ref(7)

const kept = computed(() => [...seen.value].sort((a, b) => a - b).slice(-k)) // ascending is a valid min-heap
const answer = computed(() => (seen.value.length >= k ? kept.value[0] : null))
const next = () => { if (pos.value < stream.length) seen.value = [...seen.value, stream[pos.value++]] }
const addCustom = () => { if (Number.isFinite(custom.value)) seen.value = [...seen.value, Math.trunc(custom.value)] }
const reset = () => { seen.value = [...start]; pos.value = start.length }

const seenPanel = computed(() => arr(seen.value, { label: 'numbers seen so far', tones: seen.value.map((v) => (kept.value.includes(v) ? 'keep' : 'dim')) }))
const heapPanel = computed(() => heap(kept.value, { label: `min-heap of the ${k} biggest`, tones: kept.value.map((_, i) => (i === 0 && answer.value !== null ? 'hit' : null)) }))
</script>

<template>
  <div class="d">
    <PanelView :panel="seenPanel" />
    <PanelView :panel="heapPanel" />
    <div class="row">
      <button class="btn go" :disabled="pos >= stream.length" @click="next">Add next number ({{ stream[pos] ?? 'done' }})</button>
      <button class="btn" @click="reset">Start over</button>
    </div>
    <div class="row">
      <label class="lab">Your own number <input v-model.number="custom" class="num" type="number" inputmode="numeric" /></label>
      <button class="btn" @click="addCustom">Add it</button>
    </div>
    <p class="verdict" role="status">
      <template v-if="answer === null">Need at least {{ k }} numbers before there is a {{ k }}rd largest.</template>
      <template v-else>The {{ k }}rd largest is {{ answer }}, the top of the heap. Small numbers (grey) were thrown out and never come back.</template>
    </p>
  </div>
</template>

<style scoped>
.d { display: grid; gap: 10px; }
.row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.lab { display: flex; gap: 8px; align-items: center; }
.num { min-height: 44px; width: 90px; padding: 0 10px; border-radius: 10px; border: 2px solid var(--line); background: var(--surface-2); color: inherit; font: inherit; }
.btn { min-height: 44px; padding: 0 14px; border-radius: 10px; border: 2px solid var(--line); background: var(--surface-2); color: inherit; font: inherit; cursor: pointer; }
.btn.go { border-color: var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); }
.btn:disabled { opacity: 0.5; cursor: default; }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--keep-bd); background: var(--keep-bg); color: var(--keep-fg); }
</style>
