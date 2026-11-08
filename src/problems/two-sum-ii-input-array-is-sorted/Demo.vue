<script setup lang="ts">
import { computed, ref } from 'vue'
import { arr, mark } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// Pick l and r. See which value the sum proves useless.
const nums = [1, 3, 4, 6, 8, 11]
const target = 10
const l = ref(0)
const r = ref(5)
const lo = computed(() => Math.min(l.value, r.value - 1))
const hi = computed(() => Math.max(r.value, lo.value + 1))
const sum = computed(() => nums[lo.value] + nums[hi.value])
const panel = computed(() => {
  const set: Record<number, 'focus' | 'miss' | 'hit' | 'keep'> = {}
  if (sum.value === target) { set[lo.value] = 'hit'; set[hi.value] = 'hit' }
  else if (sum.value < target) { set[lo.value] = 'miss'; set[hi.value] = 'keep' }
  else { set[lo.value] = 'keep'; set[hi.value] = 'miss' }
  return arr(nums, { label: `target ${target}`, tones: mark(nums.length, set), pointers: [{ name: 'l', at: lo.value }, { name: 'r', at: hi.value }] })
})
const verdict = computed(() => {
  const a = nums[lo.value], b = nums[hi.value]
  if (sum.value === target) return `${a} + ${b} = ${sum.value}. Match.`
  if (sum.value < target) return `${a} + ${b} = ${sum.value}, too small. ${b} is the biggest value in range, so ${a} cannot reach ${target} with anything. Drop ${a}.`
  return `${a} + ${b} = ${sum.value}, too big. ${a} is the smallest value in range, so ${b} overshoots with anything. Drop ${b}.`
})
</script>

<template>
  <div class="d">
    <label class="f">Left pointer: {{ lo }} <input v-model.number="l" type="range" min="0" max="4" /></label>
    <label class="f">Right pointer: {{ hi }} <input v-model.number="r" type="range" min="1" max="5" /></label>
    <PanelView :panel="panel" />
    <p class="v" :class="{ bad: sum !== target }" role="status">{{ verdict }}</p>
    <p class="muted small">Red is the value that can be thrown away for good.</p>
  </div>
</template>

<style scoped>
.d { display: grid; gap: 10px; }
.f { display: grid; gap: 4px; font-weight: 600; }
.f input[type='range'] { min-height: 44px; }
.v { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); }
.v.bad { border-color: var(--miss-bd); background: var(--miss-bg); color: var(--miss-fg); }
</style>
