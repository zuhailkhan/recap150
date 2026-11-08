<script setup lang="ts">
import { computed, ref } from 'vue'
import { grid, type Tone } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// Numbers 1..n*n so you can follow one cell. Step 0 = start, 1 = transposed, 2 = rows reversed.
const n = ref(3)
const step = ref(0)
const start = computed(() => Array.from({ length: n.value }, (_, r) => Array.from({ length: n.value }, (_, c) => r * n.value + c + 1)))
const shown = computed(() => {
  let m = start.value.map((row) => [...row])
  if (step.value >= 1) m = m.map((row, r) => row.map((_, c) => start.value[c][r]))
  if (step.value >= 2) m = m.map((row) => [...row].reverse())
  return m
})
const tones = computed(() => shown.value.map((row, r): (Tone | null)[] => row.map((_, c) => (step.value === 1 && r !== c ? 'focus' : step.value === 2 ? 'hit' : null))))
const panel = computed(() => grid(shown.value, { label: ['original', 'after transpose', 'after reversing every row (rotated)'][step.value], tones: tones.value }))
const said = computed(() => [
  'Cell 1 is top-left. A clockwise turn must move it to the top-right.',
  'Transpose: each cell jumps over the diagonal (row and column trade places). The diagonal stays still. Cell 1 is still top-left.',
  'Mirror each row. Cell 1 lands top-right. Every cell is where a clockwise turn puts it.',
][step.value])
const resize = (k: number) => { n.value = k; step.value = 0 }
</script>

<template>
  <div class="rd">
    <div class="row" role="group" aria-label="Matrix size">
      <button v-for="k in [3, 4]" :key="k" class="btn" :aria-pressed="n === k" @click="resize(k)">{{ k }} by {{ k }}</button>
    </div>
    <PanelView :panel="panel" />
    <div class="row" role="group" aria-label="Move">
      <button class="btn" :aria-pressed="step === 0" @click="step = 0">Start</button>
      <button class="btn" :aria-pressed="step === 1" @click="step = 1">1. Transpose</button>
      <button class="btn" :aria-pressed="step === 2" @click="step = 2">2. Reverse rows</button>
    </div>
    <p class="verdict" role="status">{{ said }}</p>
  </div>
</template>

<style scoped>
.rd { display: grid; gap: 10px; }
.row { display: flex; flex-wrap: wrap; gap: 8px; }
.btn { min-height: 44px; padding: 0 14px; border-radius: 10px; border: 2px solid var(--line); background: var(--surface-2); color: inherit; font: inherit; cursor: pointer; }
.btn[aria-pressed='true'] { border-color: var(--focus-bd); background: var(--focus-bg); color: var(--focus-fg); }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--keep-bd); background: var(--keep-bg); color: var(--keep-fg); }
</style>
