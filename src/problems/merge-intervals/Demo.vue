<script setup lang="ts">
import { computed, ref } from 'vue'
import { intervals } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// The overlap test on sorted intervals: is the next start at or before the current end?
const start = ref(3)
const cur = { start: 1, end: 3 }
const touches = computed(() => start.value <= cur.end)
const next = computed(() => ({ start: start.value, end: start.value + 2 }))
const before = computed(() =>
  intervals([{ ...cur, tone: 'keep' }, { ...next.value, tone: 'focus' }], { label: 'sorted: current, then next', min: 1, max: 7, marks: [{ at: cur.end, label: `end ${cur.end}` }] }),
)
const after = computed(() =>
  touches.value
    ? intervals([{ start: cur.start, end: Math.max(cur.end, next.value.end), tone: 'hit' }], { label: 'merged', min: 1, max: 7 })
    : intervals([{ ...cur, tone: 'hit' }, { ...next.value, tone: 'hit' }], { label: 'kept apart', min: 1, max: 7 }),
)
</script>

<template>
  <div class="d">
    <label class="row">Next interval starts at <b>{{ start }}</b>
      <input v-model.number="start" type="range" min="1" max="5" step="1" aria-label="Start of the next interval" />
    </label>
    <PanelView :panel="before" />
    <p class="verdict" :class="{ bad: !touches }" role="status">
      <code>{{ start }} &lt;= {{ cur.end }}</code> is <b>{{ touches }}</b>.
      <template v-if="start === cur.end"> The two only touch at {{ cur.end }}, and touching still merges.</template>
      <template v-else-if="touches"> They overlap, so stretch to the larger end.</template>
      <template v-else> There is a gap, so start a new interval.</template>
    </p>
    <PanelView :panel="after" />
    <p class="muted small">Slide the start across the dashed line. Exactly on it still merges.</p>
  </div>
</template>

<style scoped>
.d { display: grid; gap: 10px; }
.row { display: grid; gap: 6px; font-weight: 600; }
.row input { width: 100%; min-height: 44px; accent-color: var(--accent); }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); }
.verdict.bad { border-color: var(--miss-bd); background: var(--miss-bg); color: var(--miss-fg); }
</style>
