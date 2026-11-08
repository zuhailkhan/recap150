<script setup lang="ts">
import { computed, ref } from 'vue'
import { bits } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// XOR a number into x, then XOR the same number in again: x is back where it started.
const x = ref(41)
const n = ref(25)
const clamp = (v: number) => (Number.isFinite(v) ? Math.min(63, Math.max(0, Math.trunc(v))) : 0)
const once = computed(() => clamp(x.value) ^ clamp(n.value))
const twice = computed(() => once.value ^ clamp(n.value))
const panel = computed(() =>
  bits(
    [
      { label: 'x', value: clamp(x.value) },
      { label: 'n', value: clamp(n.value) },
      { label: 'x^n', value: once.value, tones: Array.from({ length: 6 }, (_, i) => ((clamp(n.value) >> (5 - i)) & 1 ? 'hit' : null)) },
      { label: '^n', value: twice.value, tones: Array.from({ length: 6 }, (_, i) => ((clamp(n.value) >> (5 - i)) & 1 ? 'focus' : null)) },
    ],
    { width: 6 },
  ),
)
</script>

<template>
  <div class="sn">
    <div class="ins">
      <label>x <input v-model.number="x" type="number" min="0" max="63" step="1" aria-label="x, 0 to 63" /></label>
      <label>n <input v-model.number="n" type="number" min="0" max="63" step="1" aria-label="n, 0 to 63" /></label>
      <button type="button" class="same" @click="n = clamp(x)">Make n equal x</button>
    </div>
    <PanelView :panel="panel" />
    <p class="verdict" role="status">
      <template v-if="clamp(x) === clamp(n)">Same number twice: <strong>x ^ n = 0</strong>. The pair erased itself.</template>
      <template v-else>XOR n in once, then again: <strong>{{ twice }}</strong>, which is x. The second XOR flips the same bits back.</template>
    </p>
    <p class="muted small">Change x or n (0 to 63). The lit bits of n are the ones XOR flips.</p>
  </div>
</template>

<style scoped>
.sn { display: grid; gap: 12px; }
.ins { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
label { display: flex; align-items: center; gap: 8px; font-weight: 600; }
input { width: 64px; min-height: 44px; padding: 0 10px; font: 600 1rem var(--font-mono); color: var(--ink); background: var(--surface); border: 1.5px solid var(--line); border-radius: 10px; }
.same { min-height: 44px; padding: 0 14px; font: 600 .9rem var(--font-sans, inherit); color: var(--ink); background: var(--surface-2); border: 1.5px solid var(--line); border-radius: 10px; cursor: pointer; }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); }
</style>
