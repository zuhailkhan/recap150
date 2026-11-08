<script setup lang="ts">
import { computed, ref } from 'vue'
import { list } from '@/core/panels'
import type { Pointer, Tone } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// A 6-node list. The tail links back to node `loopAt` (or to nothing). Run the two runners for k turns.
const N = 6
const loopAt = ref(2)
const turns = ref(0)
const vals = Array.from({ length: N }, (_, i) => i + 1)
const step = (i: number | null): number | null => (i === null ? null : i < N - 1 ? i + 1 : loopAt.value < 0 ? null : loopAt.value)
const walk = (k: number): number | null => {
  let i: number | null = 0
  for (let s = 0; s < k; s++) i = step(i)
  return i
}
const slow = computed(() => walk(turns.value))
const fast = computed(() => walk(turns.value * 2))
const met = computed(() => turns.value > 0 && slow.value !== null && slow.value === fast.value)
const gone = computed(() => fast.value === null)
const panel = computed(() => {
  const pts: Pointer[] = []
  if (slow.value !== null) pts.push({ name: 'slow', at: slow.value })
  if (fast.value !== null) pts.push({ name: 'fast', at: fast.value, tone: 'keep' })
  return list(vals, {
    label: `after ${turns.value} turn${turns.value === 1 ? '' : 's'}`,
    tones: vals.map((_, i): Tone | null => (met.value && i === slow.value ? 'hit' : null)),
    pointers: pts,
    ...(loopAt.value >= 0 ? { cycleTo: loopAt.value } : {}),
  })
})
</script>

<template>
  <div class="d">
    <label class="opt">Tail links back to
      <select v-model.number="loopAt" aria-label="Where the tail links back to">
        <option :value="-1">nothing (no cycle)</option>
        <option v-for="i in N" :key="i" :value="i - 1">node {{ i }}</option>
      </select>
    </label>
    <label class="opt">Turns: {{ turns }}
      <input v-model.number="turns" type="range" min="0" max="12" aria-label="Turns taken" />
    </label>
    <PanelView :panel="panel" />
    <p class="verdict" :class="{ bad: gone }" role="status">
      <template v-if="gone">fast ran off the end. A list that ends has no cycle.</template>
      <template v-else-if="met">They are on the same node. Inside a loop fast gains one node on slow every turn, so it cannot skip past slow.</template>
      <template v-else>Still running. Keep dragging the slider.</template>
    </p>
  </div>
</template>

<style scoped>
.d { display: grid; gap: 10px; }
.opt { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; min-height: 44px; font-weight: 600; }
.opt select { min-height: 44px; padding: 0 10px; }
.opt input[type='range'] { flex: 1; min-width: 140px; min-height: 44px; accent-color: var(--accent); }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); }
.verdict.bad { border-color: var(--miss-bd); background: var(--miss-bg); color: var(--miss-fg); }
</style>
