<script setup lang="ts">
import { computed, ref } from 'vue'
import { arr, dp as dpPanel, mark, type Tone } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// dp[i] = 1 + the biggest dp[j] over earlier j with nums[j] < nums[i].
const samples = [[10, 9, 2, 5, 3, 7, 101, 18], [3, 3, 3, 5]]
const which = ref(0)
const pick = ref(6)
const nums = computed(() => samples[which.value])
const i = computed(() => Math.min(pick.value, nums.value.length - 1))
const table = computed(() => {
  const dp: number[] = []
  nums.value.forEach((x, a) => { dp[a] = 1 + Math.max(0, ...nums.value.slice(0, a).map((y, b) => (y < x ? dp[b] : 0))) })
  return dp
})
const smaller = computed(() => nums.value.slice(0, i.value).flatMap((y, b) => (y < nums.value[i.value] ? [b] : [])))
const top = computed(() => {
  const set: Record<number, Tone> = {}
  for (let k = 0; k < i.value; k++) set[k] = smaller.value.includes(k) ? 'keep' : 'miss'
  set[i.value] = 'focus'
  return arr(nums.value, { label: 'nums: blue = smaller than the focus number, red = not', tones: mark(nums.value.length, set) })
})
const row = computed(() => {
  const set: Record<number, Tone> = { [i.value]: 'focus' }
  smaller.value.forEach((k) => { set[k] = 'keep' })
  const cells = table.value.map((v, k) => (k <= i.value ? v : ''))
  return dpPanel([cells], { label: 'dp[i] = longest increasing run that ends at i', colLabels: nums.value.map((_, k) => k), tones: [mark(nums.value.length, set)] })
})
const say = computed(() => (smaller.value.length ? `dp[${i.value}] = 1 + max(${smaller.value.map((k) => `dp[${k}] = ${table.value[k]}`).join(', ')}) = ${table.value[i.value]}` : `No smaller number before index ${i.value}, so dp[${i.value}] = 1.`))
const choose = (k: number) => { which.value = k; pick.value = samples[k].length - 1 }
</script>

<template>
  <div class="d">
    <div class="row" role="group" aria-label="Sample list">
      <button v-for="(s, k) in samples" :key="k" class="pick" :class="{ on: which === k }" @click="choose(k)">{{ s.join(' ') }}</button>
    </div>
    <label class="fld">Fill cell i = {{ i }} <input v-model.number="pick" type="range" min="0" :max="nums.length - 1" /></label>
    <PanelView :panel="top" />
    <PanelView :panel="row" />
    <p class="say" role="status">{{ say }}</p>
    <p class="muted small">Only strictly smaller numbers count, so equal numbers (try 3 3 3 5) never chain.</p>
  </div>
</template>

<style scoped>
.d { display: grid; gap: 10px; }
.row { display: flex; gap: 8px; flex-wrap: wrap; }
.pick { min-height: 44px; padding: 0 14px; border-radius: 10px; border: 2px solid var(--line); background: var(--surface); color: var(--ink); font: 600 1rem var(--font-mono); cursor: pointer; }
.pick.on { border-color: var(--accent); background: var(--accent-soft); }
.fld { display: grid; gap: 4px; font-weight: 600; }
.fld input { min-height: 44px; accent-color: var(--accent); }
.say { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); font-family: var(--font-mono); overflow-wrap: anywhere; }
</style>
