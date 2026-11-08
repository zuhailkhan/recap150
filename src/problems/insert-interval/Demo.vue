<script setup lang="ts">
import { computed, ref } from 'vue'
import { intervals } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// Slide the new interval around. The input falls into three groups: before, overlapping, after.
const ivs = [[1, 2], [3, 4], [5, 6]]
const from = ref(4)
const len = ref(1)
const to = computed(() => Math.min(6, from.value + len.value))
const groups = computed(() => ({
  left: ivs.filter((x) => x[1] < from.value),
  mid: ivs.filter((x) => x[1] >= from.value && x[0] <= to.value),
  right: ivs.filter((x) => x[0] > to.value),
}))
const merged = computed(() => {
  const m = groups.value.mid
  return [Math.min(from.value, ...m.map((x) => x[0])), Math.max(to.value, ...m.map((x) => x[1]))]
})
const top = computed(() =>
  intervals(
    [{ start: from.value, end: to.value, tone: 'hit', label: 'new' }, ...ivs.map(([start, end]) => ({ start, end, tone: end < from.value || start > to.value ? ('keep' as const) : ('focus' as const) }))],
    { label: 'keep = untouched, focus = overlaps the new one', min: 1, max: 6 },
  ),
)
const result = computed(() =>
  intervals([...groups.value.left, merged.value, ...groups.value.right].map(([start, end]) => ({ start, end, tone: start === merged.value[0] && end === merged.value[1] ? ('hit' as const) : ('keep' as const) })), { label: 'result', min: 1, max: 6 }),
)
</script>

<template>
  <div class="d">
    <label class="row">New interval starts at <b>{{ from }}</b>
      <input v-model.number="from" type="range" min="1" max="6" aria-label="Start of the new interval" />
    </label>
    <label class="row">New interval is <b>{{ len }}</b> long
      <input v-model.number="len" type="range" min="0" max="3" aria-label="Length of the new interval" />
    </label>
    <PanelView :panel="top" />
    <p class="verdict" role="status">
      {{ groups.left.length }} end before it, {{ groups.mid.length }} overlap it, {{ groups.right.length }} start after it. The overlapping ones melt into [{{ merged[0] }}, {{ merged[1] }}].
    </p>
    <PanelView :panel="result" />
    <p class="muted small">Try start 2 with length 0: [1,2] touches it and is absorbed.</p>
  </div>
</template>

<style scoped>
.d { display: grid; gap: 10px; }
.row { display: grid; gap: 6px; font-weight: 600; }
.row input { width: 100%; min-height: 44px; accent-color: var(--accent); }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--keep-bd); background: var(--keep-bg); color: var(--keep-fg); }
</style>
