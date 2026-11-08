<script setup lang="ts">
import { computed, ref } from 'vue'
import { arr, heap, type Tone } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// Slide k. The k biggest numbers are the heap, and the smallest of them is the answer.
const nums = [3, 2, 1, 5, 6, 4, 3]
const k = ref(2)

const sorted = computed(() => [...nums].sort((a, b) => b - a))
const kept = computed(() => sorted.value.slice(0, k.value).reverse()) // ascending is a valid min-heap
const answer = computed(() => kept.value[0])

const numsPanel = computed(() => {
  const left = [...kept.value]
  const tones = nums.map((v): Tone => {
    const at = left.indexOf(v)
    if (at === -1) return 'dim'
    left.splice(at, 1)
    return v === answer.value ? 'hit' : 'keep'
  })
  return arr(nums, { label: 'the array', tones })
})
const heapPanel = computed(() => heap(kept.value, { label: `min-heap of the ${k.value} biggest`, tones: kept.value.map((_, i) => (i === 0 ? 'hit' : null)) }))
</script>

<template>
  <div class="d">
    <PanelView :panel="numsPanel" />
    <PanelView :panel="heapPanel" />
    <label class="lab">k = {{ k }}
      <input v-model.number="k" class="rng" type="range" min="1" max="7" />
    </label>
    <p class="verdict" role="status">The {{ k }} biggest numbers are in the heap (green and blue). Its top, {{ answer }}, is number {{ k }} counting from the biggest. Grey numbers are smaller and never enter.</p>
  </div>
</template>

<style scoped>
.d { display: grid; gap: 10px; }
.lab { display: grid; gap: 4px; }
.rng { min-height: 44px; width: 100%; }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--keep-bd); background: var(--keep-bg); color: var(--keep-fg); }
</style>
