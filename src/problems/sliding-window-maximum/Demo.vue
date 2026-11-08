<script setup lang="ts">
import { computed, ref } from 'vue'
import { arr, stack } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// Feed numbers in one at a time and watch weaker ones get thrown out of the deque.
const nums = [4, 2, 5, 1, 3, 6]
const fed = ref(0)
const view = computed(() => {
  const dq: number[] = []
  let popped: number[] = []
  for (let i = 0; i < fed.value; i++) {
    popped = []
    while (dq.length > 0 && nums[dq[dq.length - 1]] <= nums[i]) popped.push(dq.pop() as number)
    dq.push(i)
  }
  return { dq, popped }
})
const panel = computed(() =>
  arr(nums, { label: 'nums', tones: nums.map((_, i) => (i === fed.value - 1 ? 'focus' : view.value.dq.includes(i) ? 'keep' : i < fed.value ? 'dim' : null)) }),
)
const deque = computed(() => stack(view.value.dq.map((i) => nums[i]), { label: 'deque of values (front first)', empty: 'empty', tones: view.value.dq.map((_, j) => (j === 0 ? 'hit' : 'keep')) }))
</script>

<template>
  <div class="d">
    <div class="row">
      <button type="button" class="b" :disabled="fed >= nums.length" @click="fed++">Feed next number</button>
      <button type="button" class="b" @click="fed = 0">Reset</button>
    </div>
    <PanelView :panel="panel" />
    <PanelView :panel="deque" />
    <p class="verdict" role="status">
      <template v-if="fed === 0">Nothing fed yet.</template>
      <template v-else-if="view.popped.length">{{ nums[fed - 1] }} arrived and threw out {{ view.popped.map((i) => nums[i]).join(', ') }}. They sit behind a bigger, newer number.</template>
      <template v-else>{{ nums[fed - 1] }} is smaller than the one before it, so nothing is thrown out.</template>
      The front ({{ fed ? nums[view.dq[0]] : '-' }}) is the biggest so far.
    </p>
    <p class="muted small">This demo has no window limit. The real algorithm also removes the front once it slides out.</p>
  </div>
</template>

<style scoped>
.d { display: grid; gap: 10px; }
.row { display: flex; gap: 8px; flex-wrap: wrap; }
.b { min-height: 44px; padding: 0 14px; font-weight: 600; color: var(--ink); background: var(--surface); border: 1.5px solid var(--line); border-radius: 10px; cursor: pointer; }
.b:disabled { opacity: .5; cursor: default; }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--line); background: var(--surface-2); color: var(--ink); }
</style>
