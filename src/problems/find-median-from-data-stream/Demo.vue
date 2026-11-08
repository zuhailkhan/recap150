<script setup lang="ts">
import { computed, ref } from 'vue'
import { heap } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// Type numbers in. The smaller half sits in a max-heap, the bigger half in a min-heap. The median is made from the two tops.
const nums = ref<number[]>([5, 15, 1])
const custom = ref(8)

const sorted = computed(() => [...nums.value].sort((a, b) => a - b))
const cut = computed(() => Math.ceil(sorted.value.length / 2)) // the lower half may hold one extra
const lower = computed(() => sorted.value.slice(0, cut.value).reverse()) // biggest first is a valid max-heap
const upper = computed(() => sorted.value.slice(cut.value)) // smallest first is a valid min-heap
const odd = computed(() => lower.value.length > upper.value.length)
const median = computed(() => (nums.value.length === 0 ? null : odd.value ? lower.value[0] : (lower.value[0] + upper.value[0]) / 2))

const add = () => { if (Number.isFinite(custom.value)) nums.value = [...nums.value, Math.trunc(custom.value)] }
const reset = () => { nums.value = [] }

const lowerPanel = computed(() => heap(lower.value, { max: true, label: 'lower half: max-heap', tones: lower.value.map((_, i) => (i === 0 ? 'hit' : null)) }))
const upperPanel = computed(() => heap(upper.value, { label: 'upper half: min-heap', tones: upper.value.map((_, i) => (i === 0 && !odd.value ? 'hit' : null)) }))
</script>

<template>
  <div class="d">
    <PanelView :panel="lowerPanel" />
    <PanelView :panel="upperPanel" />
    <div class="row">
      <label class="lab">Add a number <input v-model.number="custom" class="num" type="number" inputmode="numeric" /></label>
      <button class="btn go" @click="add">Add it</button>
      <button class="btn" @click="reset">Start over</button>
    </div>
    <p class="verdict" role="status">
      <template v-if="median === null">Nothing added yet.</template>
      <template v-else-if="odd">Odd count ({{ nums.length }}). The lower half has the extra number, so the median is its top: {{ median }}.</template>
      <template v-else>Even count ({{ nums.length }}). The median is the mean of the two tops: ({{ lower[0] }} + {{ upper[0] }}) / 2 = {{ median }}.</template>
    </p>
  </div>
</template>

<style scoped>
.d { display: grid; gap: 10px; }
.row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.lab { display: flex; gap: 8px; align-items: center; }
.num { min-height: 44px; width: 90px; padding: 0 10px; border-radius: 10px; border: 2px solid var(--line); background: var(--surface-2); color: inherit; font: inherit; }
.btn { min-height: 44px; padding: 0 14px; border-radius: 10px; border: 2px solid var(--line); background: var(--surface-2); color: inherit; font: inherit; cursor: pointer; }
.btn.go { border-color: var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--keep-bd); background: var(--keep-bg); color: var(--keep-fg); }
</style>
