<script setup lang="ts">
import { computed, ref } from 'vue'
import { arr, heap } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// Keep the k closest. The farthest of them sits on top and is the first to go.
const k = ref(2)
const points = [[3, 3], [5, -1], [-2, 4], [1, 1], [0, 2]]
const used = ref(3)

const d2 = (p: number[]) => p[0] * p[0] + p[1] * p[1]
const seen = computed(() => points.slice(0, used.value))
const kept = computed(() => [...seen.value].sort((a, b) => d2(b) - d2(a)).slice(-k.value)) // farthest first is a valid max-heap
const next = () => { if (used.value < points.length) used.value++ }
const reset = () => { used.value = 0 }

const pointsPanel = computed(() => arr(points.map((p) => `(${p[0]},${p[1]}) d2=${d2(p)}`), {
  label: 'points, with squared distance d2 = x*x + y*y',
  tones: points.map((p, i) => (i >= used.value ? null : kept.value.includes(p) ? 'keep' : 'dim')),
}))
const heapPanel = computed(() => heap(kept.value.map(d2), { max: true, label: `max-heap, at most ${k.value} points`, tones: kept.value.map((_, i) => (i === 0 ? 'focus' : null)) }))
</script>

<template>
  <div class="d">
    <PanelView :panel="pointsPanel" />
    <PanelView :panel="heapPanel" />
    <label class="lab">How many to keep (k): {{ k }}
      <input v-model.number="k" class="rng" type="range" min="1" max="4" />
    </label>
    <div class="row">
      <button class="btn go" :disabled="used >= points.length" @click="next">Look at the next point</button>
      <button class="btn" @click="reset">Start over</button>
    </div>
    <p class="verdict" role="status">
      <template v-if="used === 0">No points seen yet.</template>
      <template v-else>The farthest kept point (top) has d2 = {{ d2(kept[0]) }}. A later point with a bigger d2 is thrown out at once. Grey points were evicted.</template>
    </p>
  </div>
</template>

<style scoped>
.d { display: grid; gap: 10px; }
.row { display: flex; flex-wrap: wrap; gap: 8px; }
.lab { display: grid; gap: 4px; }
.rng { min-height: 44px; width: 100%; }
.btn { min-height: 44px; padding: 0 14px; border-radius: 10px; border: 2px solid var(--line); background: var(--surface-2); color: inherit; font: inherit; cursor: pointer; }
.btn.go { border-color: var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); }
.btn:disabled { opacity: 0.5; cursor: default; }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--keep-bd); background: var(--keep-bg); color: var(--keep-fg); }
</style>
