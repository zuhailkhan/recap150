<script setup lang="ts">
import { computed, ref } from 'vue'
import { arr } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// One run 1..n. Count how many lookups each starting number costs, with and without the "run start" check.
const n = ref(8)
const onlyStarts = ref(false)
const cost = computed(() =>
  Array.from({ length: n.value }, (_, i) => {
    const x = i + 1
    if (onlyStarts.value && x > 1) return 1 // one lookup: x - 1 is present, skip
    return n.value - x + 1 // walk x, x+1, ... up to n
  }),
)
const total = computed(() => cost.value.reduce((a, b) => a + b, 0))
const panel = computed(() => arr(cost.value, { label: 'lookups spent starting at 1, 2, ..., n', tones: cost.value.map((c) => (c > 2 ? 'miss' as const : 'hit' as const)) }))
</script>

<template>
  <div class="lcd">
    <label class="fld">Run length n: <strong>{{ n }}</strong> <input v-model.number="n" type="range" min="3" max="12" aria-label="Run length n" /></label>
    <label class="opt"><input v-model="onlyStarts" type="checkbox" /> Only start at a number whose predecessor is missing</label>
    <PanelView :panel="panel" />
    <p class="verdict" :class="{ bad: !onlyStarts }" role="status">
      Total: <strong>{{ total }}</strong> lookups for {{ n }} numbers.
      <template v-if="onlyStarts">Only the number 1 walks. Every other number costs one quick check.</template>
      <template v-else>Every number walks to the end of the run again. That grows like n².</template>
    </p>
    <p class="muted small">Tick the box, then drag the slider. The tall bars disappear.</p>
  </div>
</template>

<style scoped>
.lcd { display: grid; gap: 10px; }
.fld { display: grid; gap: 4px; font-weight: 600; }
.fld input { width: 100%; min-height: 44px; accent-color: var(--accent); }
.opt { display: flex; align-items: center; gap: 10px; min-height: 44px; font-weight: 600; }
.opt input { width: 22px; height: 22px; accent-color: var(--accent); }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); }
.verdict.bad { border-color: var(--miss-bd); background: var(--miss-bg); color: var(--miss-fg); }
</style>
