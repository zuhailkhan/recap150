<script setup lang="ts">
import { computed, ref } from 'vue'
import { intervals } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// Two meetings clash only if the later one starts strictly before the earlier one ends.
const start = ref(3)
const first = { start: 1, end: 3 }
const clash = computed(() => start.value < first.end)
const panel = computed(() => {
  const tone = clash.value ? ('miss' as const) : ('hit' as const)
  return intervals(
    [{ ...first, tone, label: 'meeting A' }, { start: start.value, end: start.value + 2, tone, label: 'meeting B' }],
    { label: 'A, then B', min: 1, max: 7, marks: [{ at: first.end, label: `A ends ${first.end}` }] },
  )
})
</script>

<template>
  <div class="d">
    <label class="row">Meeting B starts at <b>{{ start }}</b>
      <input v-model.number="start" type="range" min="1" max="5" aria-label="Start of meeting B" />
    </label>
    <PanelView :panel="panel" />
    <p class="verdict" :class="{ bad: clash }" role="status">
      <code>{{ start }} &lt; {{ first.end }}</code> is <b>{{ clash }}</b>.
      <template v-if="clash"> B starts while A is still running. One person cannot attend both.</template>
      <template v-else-if="start === first.end"> B starts the moment A ends. That is allowed, so no clash.</template>
      <template v-else> There is a gap. No clash.</template>
    </p>
    <p class="muted small">Move B to exactly {{ first.end }}. In Merge Intervals the same two would be joined; here they are fine.</p>
  </div>
</template>

<style scoped>
.d { display: grid; gap: 10px; }
.row { display: grid; gap: 6px; font-weight: 600; }
.row input { width: 100%; min-height: 44px; accent-color: var(--accent); }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); }
.verdict.bad { border-color: var(--miss-bd); background: var(--miss-bg); color: var(--miss-fg); }
</style>
