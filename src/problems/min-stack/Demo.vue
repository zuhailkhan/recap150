<script setup lang="ts">
import { computed, ref } from 'vue'
import PanelView from '@/visuals/PanelView.vue'

// Two stacks side by side, plus a single "lowest ever" variable that cannot recover after a pop.
const vals = ref<number[]>([])
const mins = ref<number[]>([])
const lowest = ref<number | null>(null)
const next = ref(3)

function push() {
  const v = Number.isFinite(next.value) ? Math.trunc(next.value) : 0
  const low = mins.value.length ? mins.value[mins.value.length - 1] : v
  vals.value.push(v)
  mins.value.push(Math.min(v, low))
  lowest.value = lowest.value === null ? v : Math.min(lowest.value, v)
}
function pop() {
  vals.value.pop()
  mins.value.pop()
}
const real = computed(() => (mins.value.length ? mins.value[mins.value.length - 1] : null))
const wrong = computed(() => lowest.value !== null && lowest.value !== real.value)
const vp = computed(() => ({ kind: 'stack' as const, label: 'values', items: vals.value, empty: 'empty' }))
const mp = computed(() => ({ kind: 'stack' as const, label: 'min so far', items: mins.value, tones: mins.value.map((_, i) => (i === mins.value.length - 1 ? ('hit' as const) : null)), empty: 'empty' }))
</script>

<template>
  <div class="ms">
    <div class="row">
      <label class="num">Value <input v-model.number="next" type="number" step="1" inputmode="numeric" /></label>
      <button class="btn" type="button" @click="push">Push</button>
      <button class="btn quiet" type="button" :disabled="!vals.length" @click="pop">Pop</button>
    </div>
    <div class="pair"><PanelView :panel="vp" /><PanelView :panel="mp" /></div>
    <p class="verdict" role="status">getMin() with two stacks: <strong>{{ real ?? 'empty' }}</strong></p>
    <p class="verdict" :class="{ bad: wrong }" role="status">
      One "lowest ever" variable says: <strong>{{ lowest ?? 'empty' }}</strong>
      <template v-if="wrong"> Wrong. That value was popped and the variable cannot go back.</template>
    </p>
    <p class="muted small">Push 5, then 2, then pop. The second stack still knows 5.</p>
  </div>
</template>

<style scoped>
.ms { display: grid; gap: 10px; }
.row { display: flex; flex-wrap: wrap; align-items: end; gap: 8px; }
.num { display: grid; gap: 4px; font-weight: 600; }
.num input { min-height: 44px; width: 7rem; padding: 0 10px; border: 2px solid var(--line); border-radius: 10px; background: var(--tile-bg); color: var(--tile-fg); font: inherit; }
.pair { display: flex; flex-wrap: wrap; gap: 16px; }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); }
.verdict.bad { border-color: var(--miss-bd); background: var(--miss-bg); color: var(--miss-fg); }
</style>
