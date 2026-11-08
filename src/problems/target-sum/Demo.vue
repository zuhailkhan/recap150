<script setup lang="ts">
import { computed, ref } from 'vue'
import { arr, dp, type Tone } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// Flip signs. Different choices land on the same total, so the table keeps just a count.
const nums = [1, 1, 1]
const signs = ref([1, 1, 1])
const running = computed(() => {
  let s = 0
  return nums.map((x, i) => (s += signs.value[i] * x))
})
const final = computed(() => running.value[nums.length - 1])
const sums = [-3, -2, -1, 0, 1, 2, 3]
const counts = computed(() => {
  const c = sums.map(() => 0)
  for (let m = 0; m < 1 << nums.length; m++) {
    const s = nums.reduce((sum, x, i) => sum + (m >> i & 1 ? x : -x), 0)
    c[s + 3]++
  }
  return c
})
const here = computed(() => counts.value[final.value + 3])
const tones = computed<Tone[]>(() => sums.map((s) => (s === final.value ? 'hit' : 'keep')))
function flip(i: number) { signs.value = signs.value.map((v, k) => (k === i ? -v : v)) }
</script>

<template>
  <div class="d">
    <div class="btns" role="group" aria-label="Sign of each number">
      <button v-for="(x, i) in nums" :key="i" type="button" class="pick" :aria-label="`Flip the sign of number ${i + 1}`" @click="flip(i)">{{ signs[i] > 0 ? '+' : '-' }}{{ x }}</button>
    </div>
    <PanelView :panel="arr(running, { label: 'running sum after each number', tones: running.map(() => 'focus') })" />
    <PanelView :panel="dp([counts.map((c) => c || '')], { label: 'choices per final total (a dot means none)', colLabels: sums, tones: [tones] })" />
    <p class="verdict" role="status">Final total {{ final }}. {{ here }} of the 8 sign choices end on this total. The table keeps one number for them, not {{ here }} separate lists.</p>
    <p class="muted small">Tap a number to flip its sign. The green cell is the final total you picked.</p>
  </div>
</template>

<style scoped>
.d { display: grid; gap: 10px; }
.btns { display: flex; gap: 8px; }
.pick { min-width: 56px; min-height: 44px; border-radius: 10px; border: 2px solid var(--focus-bd); background: var(--focus-bg); color: var(--focus-fg); font: 700 1.1rem var(--font-mono); cursor: pointer; }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); }
</style>
