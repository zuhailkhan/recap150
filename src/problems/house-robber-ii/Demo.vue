<script setup lang="ts">
import { computed, ref } from 'vue'
import { arr, type Tone } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// Cut the circle open in two ways. Each cut is an ordinary row, solved with the same DP.
const text = ref('10, 1, 1, 10')
const mode = ref<'last' | 'first'>('last')
const nums = computed(() => text.value.split(/[ ,]+/).filter((x) => x !== '').map(Number).filter((x) => Number.isFinite(x) && x >= 0).slice(0, 12))
const row = (a: number[]) => {
  let prev = 0
  let cur = 0
  for (const x of a) [prev, cur] = [cur, Math.max(cur, prev + x)]
  return cur
}
const n = computed(() => nums.value.length)
const withoutLast = computed(() => row(nums.value.slice(0, -1)))
const withoutFirst = computed(() => row(nums.value.slice(1)))
const panel = computed(() => {
  const out = mode.value === 'last' ? n.value - 1 : 0
  const tones = nums.value.map((_, i): Tone | null => (i === out ? 'miss' : null))
  return arr(nums.value, { label: mode.value === 'last' ? 'the last house is left out' : 'the first house is left out', tones })
})
const sentence = computed(() => {
  if (n.value < 2) return 'Give at least two houses, for example 10, 1, 1, 10.'
  const shown = mode.value === 'last' ? withoutLast.value : withoutFirst.value
  return `This row is worth ${shown}. Without the last: ${withoutLast.value}. Without the first: ${withoutFirst.value}. Answer: ${Math.max(withoutLast.value, withoutFirst.value)}.`
})
</script>

<template>
  <div class="rc">
    <label class="f">Houses in a circle (up to 12, separated by commas) <input v-model="text" type="text" autocomplete="off" /></label>
    <div class="m" role="group" aria-label="Which house to leave out">
      <button type="button" :class="{ on: mode === 'last' }" @click="mode = 'last'">Leave out the last</button>
      <button type="button" :class="{ on: mode === 'first' }" @click="mode = 'first'">Leave out the first</button>
    </div>
    <PanelView :panel="panel" />
    <p class="v" role="status">{{ sentence }}</p>
  </div>
</template>

<style scoped>
.rc { display: grid; gap: 10px; }
.f { display: grid; gap: 4px; font-weight: 600; }
.f input[type='text'] { min-height: 44px; padding: 0 10px; font: inherit; }
.m { display: flex; flex-wrap: wrap; gap: 8px; }
.m button { min-height: 44px; padding: 0 14px; font: inherit; border-radius: 10px; border: 2px solid var(--keep-bd); background: transparent; color: inherit; cursor: pointer; }
.m button.on { background: var(--keep-bg); color: var(--keep-fg); font-weight: 700; }
.v { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--focus-bd); background: var(--focus-bg); color: var(--focus-fg); }
</style>
