<script setup lang="ts">
import { computed, ref } from 'vue'
import { tree, type Tone } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'
import { find, fromLevel, layout, nodesOf, type N } from './ts/viz'

// Pick a starting node in the big tree. The pattern must match everything below it, with nothing extra.
const big = fromLevel([3, 4, 5, 1, 2, null, null, null, null, 0])
const pattern = fromLevel([4, 1, 2])
const vals = nodesOf(big).map((n) => n.val)
const picked = ref(4)
const start = computed(() => find(big, picked.value)!)
const firstDiff = (a: N | null, b: N | null): [N | null, N | null] | null => {
  if (!a && !b) return null
  if (!a || !b || a.val !== b.val) return [a, b]
  return firstDiff(a.left, b.left) ?? firstDiff(a.right, b.right)
}
const diff = computed(() => firstDiff(start.value, pattern))
const bigPanel = computed(() => {
  const { items, at } = layout(big)
  const tones: (Tone | null)[] = items.map(() => null)
  for (const n of nodesOf(start.value)) tones[at.get(n)!] = diff.value ? 'keep' : 'hit'
  if (diff.value?.[0]) tones[at.get(diff.value[0])!] = 'miss'
  else tones[at.get(start.value)!] = diff.value ? 'miss' : 'hit'
  return tree(items, { label: 'big tree. Blue = the subtree you are testing', tones })
})
const patPanel = computed(() => {
  const { items, at } = layout(pattern)
  const tones: (Tone | null)[] = items.map(() => (diff.value ? 'keep' : 'hit'))
  if (diff.value?.[1]) tones[at.get(diff.value[1])!] = 'miss'
  return tree(items, { label: 'pattern', tones })
})
</script>

<template>
  <div class="d">
    <div class="row" role="group" aria-label="Pick a starting node">
      <button v-for="v in vals" :key="v" type="button" class="tap" :class="{ on: v === picked }" :aria-pressed="v === picked" @click="picked = v">Start at {{ v }}</button>
    </div>
    <PanelView :panel="bigPanel" />
    <PanelView :panel="patPanel" />
    <p class="verdict" :class="{ bad: !!diff }" role="status">
      <template v-if="!diff">An exact copy starts at {{ picked }}.</template>
      <template v-else-if="diff[0] && diff[1]">Not a copy: {{ diff[0].val }} meets {{ diff[1].val }}.</template>
      <template v-else-if="diff[0]">Not a copy: node {{ diff[0].val }} has no partner in the pattern.</template>
      <template v-else>Not a copy: the pattern needs a node that the big tree lacks here.</template>
    </p>
    <p class="muted small">Start at 4: the top matches, but 2 has an extra child 0. A subtree must match to the very bottom.</p>
  </div>
</template>

<style scoped>
.d { display: grid; gap: 10px; }
.row { display: flex; flex-wrap: wrap; gap: 8px; }
.tap { min-width: 44px; min-height: 44px; padding: 0 12px; border-radius: 10px; border: 2px solid var(--line); background: var(--surface); color: inherit; font: inherit; font-weight: 600; cursor: pointer; }
.tap.on { border-color: var(--focus-bd); background: var(--focus-bg); color: var(--focus-fg); }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); }
.verdict.bad { border-color: var(--miss-bd); background: var(--miss-bg); color: var(--miss-fg); }
</style>
