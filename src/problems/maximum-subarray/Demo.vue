<script setup lang="ts">
import { computed, ref } from 'vue'
import { arr, buckets } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// Why dropping a negative run is safe: any later stretch scores better without it.
const tail = [4, -1, 2]
const tailSum = tail.reduce((a, b) => a + b, 0)
const prefix = ref(-3)
const keep = computed(() => prefix.value + tailSum)
const dropBetter = computed(() => tailSum > keep.value)

const panels = computed(() => [
  arr([prefix.value, ...tail], { label: 'carry the run forward', tones: ['dim', 'keep', 'keep', 'keep'] }),
  buckets(
    [
      { key: 'keep the run', items: [keep.value], tone: dropBetter.value ? 'miss' : 'hit' },
      { key: 'start fresh', items: [tailSum], tone: dropBetter.value ? 'hit' : 'miss' },
    ],
    { label: 'sum of the stretch ending at 2', keyLabel: 'choice' },
  ),
])
</script>

<template>
  <div class="d">
    <label class="slide"><span>Running sum so far: <strong>{{ prefix }}</strong></span>
      <input v-model.number="prefix" type="range" min="-8" max="8" step="1" aria-label="Running sum before the next numbers" />
    </label>
    <PanelView v-for="(p, i) in panels" :key="i" :panel="p" />
    <p class="verdict" :class="{ ok: !dropBetter }" role="status">
      <template v-if="dropBetter">The carried sum is negative, so it only subtracts. Starting fresh wins by {{ -prefix }}. Drop it.</template>
      <template v-else>The carried sum is not negative, so it adds {{ prefix }} to whatever follows. Keep it.</template>
    </p>
    <p class="muted small">The numbers after it are 4, -1, 2 either way. Only the carried sum changes the score. Slide it below zero and watch the winner flip.</p>
  </div>
</template>

<style scoped>
.d { display: grid; gap: 10px; }
.slide { display: grid; gap: 6px; font-weight: 600; }
.slide input { width: 100%; min-height: 44px; accent-color: var(--accent); }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--miss-bd); background: var(--miss-bg); color: var(--miss-fg); }
.verdict.ok { border-color: var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); }
</style>
