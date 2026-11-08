<script setup lang="ts">
import { computed, ref } from 'vue'
import { arr, mark } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// Mirror pairs of the cleaned text. Move the slider to compare pair after pair.
const text = ref('Nurses run!')
const k = ref(0)
const clean = computed(() => text.value.toLowerCase().replace(/[^a-z0-9]/g, '').split(''))
const n = computed(() => clean.value.length)
const pairs = computed(() => Math.floor(n.value / 2))
const step = computed(() => Math.min(k.value, pairs.value))
const bad = computed(() => clean.value.findIndex((c, i) => i < pairs.value && c !== clean.value[n.value - 1 - i]))
const failed = computed(() => bad.value >= 0 && step.value > bad.value)
const panel = computed(() => {
  const set: Record<number, 'hit' | 'miss'> = {}
  for (let i = 0; i < step.value; i++) {
    const tone = bad.value >= 0 && i >= bad.value ? 'miss' : 'hit'
    set[i] = tone
    set[n.value - 1 - i] = tone
  }
  return arr(clean.value, { label: 'letters and digits only, lower-cased', tones: mark(n.value, set) })
})
const verdict = computed(() => {
  if (n.value === 0) return 'Nothing left after cleaning. That counts as a palindrome.'
  if (failed.value) return `Pair ${bad.value + 1} differs: ${clean.value[bad.value]} vs ${clean.value[n.value - 1 - bad.value]}. Stop. Not a palindrome.`
  if (step.value >= pairs.value) return bad.value < 0 ? 'Every pair matched. It is a palindrome.' : 'Every pair so far matched.'
  return `${step.value} of ${pairs.value} pairs checked. Slide right to check the next pair.`
})
</script>

<template>
  <div class="d">
    <label class="f">Text <input v-model="text" type="text" autocomplete="off" /></label>
    <label class="f">Pairs checked: {{ step }} <input v-model.number="k" type="range" min="0" :max="Math.max(pairs, 1)" /></label>
    <PanelView :panel="panel" />
    <p class="v" :class="{ bad: failed }" role="status">{{ verdict }}</p>
  </div>
</template>

<style scoped>
.d { display: grid; gap: 10px; }
.f { display: grid; gap: 4px; font-weight: 600; }
.f input[type='text'] { min-height: 44px; padding: 0 10px; font: inherit; }
.f input[type='range'] { min-height: 44px; }
.v { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); }
.v.bad { border-color: var(--miss-bd); background: var(--miss-bg); color: var(--miss-fg); }
</style>
