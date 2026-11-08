<script setup lang="ts">
import { computed, ref } from 'vue'
import { arr, mark } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// Pick one bar. Its water level is the lower of the two tallest walls around it.
const h = [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]
const i = ref(5)
const at = (from: number, to: number) => {
  let best = from
  for (let k = from; k <= to; k++) if (h[k] > h[best]) best = k
  return best
}
const li = computed(() => at(0, i.value))
const ri = computed(() => at(i.value, h.length - 1))
const level = computed(() => Math.min(h[li.value], h[ri.value]))
const water = computed(() => level.value - h[i.value])
const panel = computed(() => arr(h, {
  label: 'heights',
  tones: mark(h.length, { [li.value]: 'keep', [ri.value]: 'keep', [i.value]: water.value > 0 ? 'hit' : 'focus' }),
  pointers: [{ name: 'bar', at: i.value }],
}))
</script>

<template>
  <div class="d">
    <label class="f">Bar at index {{ i }}, height {{ h[i] }} <input v-model.number="i" type="range" min="0" :max="h.length - 1" /></label>
    <PanelView :panel="panel" />
    <p class="v" :class="{ none: water === 0 }" role="status">
      Tallest on the left: {{ h[li] }}. Tallest on the right: {{ h[ri] }}.
      Level = lower of the two = {{ level }}. Water here = {{ level }} − {{ h[i] }} = <strong>{{ water }}</strong>.
    </p>
    <p class="muted small">Blue-grey bars are the two walls. Green means this bar holds water. Add the water of every bar to get the answer, 6.</p>
  </div>
</template>

<style scoped>
.d { display: grid; gap: 10px; }
.f { display: grid; gap: 4px; font-weight: 600; }
.f input[type='range'] { min-height: 44px; }
.v { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); }
.v.none { border-color: var(--keep-bd); background: var(--keep-bg); color: var(--keep-fg); }
</style>
