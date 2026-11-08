<script setup lang="ts">
import { computed, ref } from 'vue'
import { arr, list } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// Follow index -> value from index 0. A duplicate value means two arrows reach the same index, so you must loop.
const samples = [
  { name: '1,3,4,2,2', nums: [1, 3, 4, 2, 2] },
  { name: '3,1,3,4,2', nums: [3, 1, 3, 4, 2] },
  { name: '2,5,9,6,9,3,8,9,7,1', nums: [2, 5, 9, 6, 9, 3, 8, 9, 7, 1] },
]
const pick = ref(0)
const steps = ref(0)
const nums = computed(() => samples[pick.value].nums)
const path = computed(() => {
  const p: number[] = []
  for (let i = 0; !p.includes(i); i = nums.value[i]) p.push(i)
  return p
})
const entry = computed(() => path.value.indexOf(nums.value[path.value[path.value.length - 1]]))
const at = computed(() => {
  let i = 0
  for (let s = 0; s < steps.value; s++) i = nums.value[i]
  return i
})
const looped = computed(() => steps.value >= path.value.length)
const choose = (k: number) => { pick.value = k; steps.value = 0 }
const arrow = computed(() => arr(nums.value, { label: 'nums. Index i points at nums[i]', tones: nums.value.map((_, k) => (k === at.value ? 'focus' : null)), pointers: [{ name: 'you', at: at.value }] }))
const chain = computed(() => list(path.value, { label: 'the path you walk from index 0', cycleTo: entry.value, tones: path.value.map((p) => (p === at.value ? 'focus' : null)), pointers: [{ name: 'you', at: path.value.indexOf(at.value) }] }))
</script>

<template>
  <div class="d">
    <div class="row" role="group" aria-label="Choose an array">
      <button v-for="(s, k) in samples" :key="k" class="btn" :class="{ on: pick === k }" @click="choose(k)">{{ s.name }}</button>
    </div>
    <label class="pick">Steps walked: <b>{{ steps }}</b>
      <input v-model.number="steps" type="range" min="0" :max="12" step="1" aria-label="Steps walked" />
    </label>
    <PanelView :panel="arrow" />
    <PanelView :panel="chain" />
    <p class="verdict" role="status">
      <template v-if="looped">You are walking in a circle. The index you re-enter, <b>{{ path[entry] }}</b>, has two arrows into it. That index is the duplicate.</template>
      <template v-else>Keep stepping. A chain of different indexes cannot be endless, because the array is finite.</template>
    </p>
  </div>
</template>

<style scoped>
.d { display: grid; gap: 10px; }
.row { display: flex; flex-wrap: wrap; gap: 8px; }
.btn { min-height: 44px; padding: 0 12px; border-radius: 10px; border: 2px solid var(--line); background: var(--surface-2); color: inherit; font: inherit; cursor: pointer; }
.btn.on { border-color: var(--focus-bd); background: var(--focus-bg); color: var(--focus-fg); }
.pick { display: grid; gap: 6px; font-weight: 600; }
.pick input { width: 100%; min-height: 44px; accent-color: var(--accent); }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--keep-bd); background: var(--keep-bg); color: var(--keep-fg); }
</style>
