<script setup lang="ts">
import { computed, ref } from 'vue'
import { tree } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// The full decision tree for [1, 2, 3]. Walk down it by choosing take or leave for each number.
const nums = [1, 2, 3]
const choices = ref<number[]>([]) // 0 = take, 1 = leave
const depth = computed(() => choices.value.length)
const here = computed(() => choices.value.reduce((idx, c) => 2 * idx + 1 + c, 0))
const onPath = computed(() => {
  const ids = [0]
  choices.value.forEach((c) => ids.push(2 * ids[ids.length - 1] + 1 + c))
  return ids
})
const bit = (idx: number, k: number) => ((idx + 1 - 2 ** Math.floor(Math.log2(idx + 1))) >> (Math.floor(Math.log2(idx + 1)) - 1 - k)) & 1
const label = (idx: number): string => {
  const d = Math.floor(Math.log2(idx + 1))
  if (d === 0) return 'start'
  if (d < nums.length) return (bit(idx, d - 1) === 0 ? '+' : 'no ') + nums[d - 1]
  return '{' + nums.filter((_, k) => bit(idx, k) === 0).join(',') + '}'
}
const panel = computed(() => tree(Array.from({ length: 15 }, (_, i) => label(i)), {
  label: 'decision tree: + = take, no = leave',
  tones: Array.from({ length: 15 }, (_, i) => (i === here.value ? (depth.value === nums.length ? 'hit' : 'focus') : onPath.value.includes(i) ? 'keep' : null)),
}))
const say = computed(() => (depth.value < nums.length
  ? `Next number: ${nums[depth.value]}. Take it or leave it out?`
  : `Leaf reached. ${label(here.value)} is one finished subset. Undo to take the other branch.`))
</script>

<template>
  <div class="dsub">
    <div class="keys" role="group" aria-label="Decide the next number">
      <button class="btn" type="button" :disabled="depth === nums.length" @click="choices.push(0)">Take {{ nums[depth] ?? '' }}</button>
      <button class="btn" type="button" :disabled="depth === nums.length" @click="choices.push(1)">Leave {{ nums[depth] ?? '' }}</button>
      <button class="btn quiet" type="button" :disabled="!depth" @click="choices.pop()">Undo</button>
      <button class="btn quiet" type="button" :disabled="!depth" @click="choices = []">Clear</button>
    </div>
    <PanelView :panel="panel" />
    <p class="verdict" :class="{ ok: depth === nums.length }" role="status">{{ say }}</p>
    <p class="muted small">Eight leaves, eight subsets. Undo walks back up one level, which is the same move the code makes with pop.</p>
  </div>
</template>

<style scoped>
.dsub { display: grid; gap: 10px; }
.keys { display: flex; flex-wrap: wrap; gap: 8px; }
.keys .btn { min-height: 44px; }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--line); background: var(--surface-2); }
.verdict.ok { border-color: var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); }
</style>
