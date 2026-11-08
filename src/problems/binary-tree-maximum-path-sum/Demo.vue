<script setup lang="ts">
import { computed, ref } from 'vue'
import { arr, tree } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// One node with two leaf children. A leaf offers its own value, a negative offer is dropped.
const mid = ref(5)
const a = ref(3)
const b = ref(7)
const num = (x: number) => (Number.isFinite(x) ? Math.trunc(x) : 0)
const left = computed(() => Math.max(0, num(a.value)))
const right = computed(() => Math.max(0, num(b.value)))
const bend = computed(() => num(mid.value) + left.value + right.value)
const up = computed(() => num(mid.value) + Math.max(left.value, right.value))
const panel = computed(() =>
  tree([num(mid.value), num(a.value), num(b.value)], { label: 'node and its two children', tones: ['focus', num(a.value) > 0 ? 'keep' : 'miss', num(b.value) > 0 ? 'keep' : 'miss'] }),
)
const sums = computed(() => arr([bend.value, up.value], { label: 'bend here (both sides), offered upward (one side)', tones: ['hit', 'keep'] }))
</script>

<template>
  <div class="d">
    <div class="row">
      <label>Left child <input v-model.number="a" type="number" step="1" inputmode="numeric" /></label>
      <label>Node <input v-model.number="mid" type="number" step="1" inputmode="numeric" /></label>
      <label>Right child <input v-model.number="b" type="number" step="1" inputmode="numeric" /></label>
    </div>
    <PanelView :panel="panel" />
    <PanelView :panel="sums" />
    <p class="verdict" role="status">
      Bend: {{ num(mid) }} + {{ left }} + {{ right }} = <strong>{{ bend }}</strong>. Offered upward: {{ num(mid) }} + {{ Math.max(left, right) }} = <strong>{{ up }}</strong>.
    </p>
    <p class="muted small">Make a child negative: it turns red and counts as 0. The parent only gets one side, but the bend uses both.</p>
  </div>
</template>

<style scoped>
.d { display: grid; gap: 10px; }
.row { display: flex; flex-wrap: wrap; gap: 10px; }
.row label { display: grid; gap: 4px; font-weight: 600; }
.row input { width: 5.5rem; min-height: 44px; padding: 0 10px; font: inherit; border-radius: 10px; border: 2px solid var(--line); background: var(--tile-bg); color: var(--tile-fg); }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); }
</style>
