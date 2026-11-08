<script setup lang="ts">
import { computed, ref } from 'vue'
import { bits } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// Press the button to clear the lowest 1 of x. The number of presses is the count of 1 bits.
const start = ref(44)
const x = ref(44)
const presses = ref(0)
const clamp = (v: number) => (Number.isFinite(v) ? Math.min(63, Math.max(0, Math.trunc(v))) : 0)
const tone = (v: number, f: (i: number) => boolean) => Array.from({ length: 6 }, (_, i) => (f(5 - i) ? 'focus' : null))
const lowest = computed(() => (x.value === 0 ? -1 : Math.log2(x.value & -x.value)))
const panel = computed(() =>
  bits(
    [
      { label: 'x', value: x.value, tones: tone(x.value, (k) => k === lowest.value) },
      { label: 'x−1', value: Math.max(0, x.value - 1), tones: tone(x.value, (k) => x.value > 0 && k <= lowest.value) },
      { label: 'AND', value: x.value & (x.value - 1 < 0 ? 0 : x.value - 1) },
    ],
    { width: 6 },
  ),
)
const setStart = (v: number) => { start.value = clamp(v); x.value = start.value; presses.value = 0 }
const press = () => { if (x.value > 0) { x.value = x.value & (x.value - 1); presses.value++ } }
</script>

<template>
  <div class="ob">
    <label>Start number <input :value="start" type="number" min="0" max="63" step="1" aria-label="Start number, 0 to 63" @input="setStart(Number(($event.target as HTMLInputElement).value))" /></label>
    <PanelView :panel="panel" />
    <button type="button" class="go" :disabled="x === 0" @click="press">Clear the lowest 1: x = x &amp; (x − 1)</button>
    <p class="verdict" role="status">
      Presses so far: <strong>{{ presses }}</strong>.
      <template v-if="x === 0">x is 0. The number {{ start }} had <strong>{{ presses }}</strong> bits set.</template>
      <template v-else>x is {{ x }}. Keep pressing until it reaches 0.</template>
    </p>
    <p class="muted small">Row x−1 shows the flipped digits: the lowest 1 and the zeros under it. AND keeps the rest.</p>
  </div>
</template>

<style scoped>
.ob { display: grid; gap: 12px; }
label { display: flex; align-items: center; gap: 8px; font-weight: 600; }
input { width: 90px; min-height: 44px; padding: 0 10px; font: 600 1rem var(--font-mono); color: var(--ink); background: var(--surface); border: 1.5px solid var(--line); border-radius: 10px; }
.go { font-family: inherit; min-height: 44px; padding: 0 14px; font-weight: 600; color: var(--ink); background: var(--surface-2); border: 1.5px solid var(--line); border-radius: 10px; cursor: pointer; }
.go:disabled { opacity: .5; cursor: default; }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); }
</style>
