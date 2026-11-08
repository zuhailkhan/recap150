<script setup lang="ts">
import { computed, ref } from 'vue'
import { intervals, type Tone } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// Same greedy, two sort keys. Only the sort by END is safe.
const by = ref<'start' | 'end'>('start')
const ivs = [[1, 6], [2, 3], [3, 4], [4, 5], [5, 6]]
const run = computed(() => {
  const k = by.value === 'start' ? 0 : 1
  const sorted = [...ivs].sort((a, b) => a[k] - b[k])
  let line = -Infinity
  return sorted.map(([start, end]) => {
    const keep = start >= line
    if (keep) line = end
    return { start, end, keep }
  })
})
const removed = computed(() => run.value.filter((x) => !x.keep).length)
const panel = computed(() =>
  intervals(run.value.map((x) => ({ start: x.start, end: x.end, tone: (x.keep ? 'hit' : 'miss') as Tone })), { label: `sorted by ${by.value}: kept = hit, removed = miss`, min: 1, max: 6 }),
)
</script>

<template>
  <div class="d">
    <fieldset class="pick">
      <legend>Sort by</legend>
      <label class="opt"><input v-model="by" type="radio" value="start" /> start</label>
      <label class="opt"><input v-model="by" type="radio" value="end" /> end</label>
    </fieldset>
    <PanelView :panel="panel" />
    <p class="verdict" :class="{ bad: by === 'start' }" role="status">
      <template v-if="by === 'start'">Removes {{ removed }}. The long [1,6] came first, was kept, and blocked everything.</template>
      <template v-else>Removes {{ removed }}. Finishing early leaves room, so the long one is the only casualty.</template>
    </p>
  </div>
</template>

<style scoped>
.d { display: grid; gap: 10px; }
.pick { display: flex; gap: 16px; align-items: center; border: 0; padding: 0; margin: 0; font-weight: 600; }
.opt { display: flex; align-items: center; gap: 8px; min-height: 44px; }
.opt input { width: 22px; height: 22px; accent-color: var(--accent); }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); }
.verdict.bad { border-color: var(--miss-bd); background: var(--miss-bg); color: var(--miss-fg); }
</style>
