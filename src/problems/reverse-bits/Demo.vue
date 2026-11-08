<script setup lang="ts">
import { computed, ref } from 'vue'
import { bits, type Tone } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// After k turns, the lowest k bits of n have been moved to the result, in reverse order.
const n = ref(11)
const k = ref(3)
const clamp = (v: number) => (Number.isFinite(v) ? Math.min(63, Math.max(0, Math.trunc(v))) : 0)
const out = computed(() => {
  let r = 0
  for (let i = 0; i < k.value; i++) r = (r << 1) | ((clamp(n.value) >> i) & 1)
  return r
})
const tone = (t: Tone) => Array.from({ length: 6 }, (_, i) => (5 - i < k.value ? t : null))
const panel = computed(() =>
  bits(
    [
      { label: 'n', value: clamp(n.value), tones: tone('dim') },
      { label: 'out', value: out.value, tones: tone('hit') },
    ],
    { width: 6 },
  ),
)
</script>

<template>
  <div class="rb">
    <label>n <input v-model.number="n" type="number" min="0" max="63" step="1" aria-label="n, 0 to 63" /></label>
    <label>Turns <input v-model.number="k" type="range" min="0" max="6" step="1" aria-label="Turns done, 0 to 6" /> <strong>{{ k }}</strong></label>
    <PanelView :panel="panel" />
    <p class="verdict" role="status">
      <template v-if="k === 0">Nothing moved yet. Slide the turns.</template>
      <template v-else>The lowest {{ k }} bit{{ k > 1 ? 's' : '' }} of n (dim) were pushed into out (green), in reverse order. Out is {{ out }}.</template>
    </p>
    <p class="muted small">At 6 turns, out is n read backwards. The first bit pushed ends up furthest left.</p>
  </div>
</template>

<style scoped>
.rb { display: grid; gap: 12px; }
label { display: flex; align-items: center; gap: 10px; font-weight: 600; }
input[type='number'] { width: 90px; min-height: 44px; padding: 0 10px; font: 600 1rem var(--font-mono); color: var(--ink); background: var(--surface); border: 1.5px solid var(--line); border-radius: 10px; }
input[type='range'] { flex: 1; min-height: 44px; }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); }
</style>
