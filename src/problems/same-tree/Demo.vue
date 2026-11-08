<script setup lang="ts">
import { computed, ref } from 'vue'
import { tree, type Tone } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'
import { fromLevel, layout, nodesOf, type N } from './ts/viz'

// Pick a second tree. The first spot where the pair disagrees is marked.
const options: { name: string; q: (number | null)[]; why: string }[] = [
  { name: 'Identical', q: [1, 2, 3], why: 'Every spot is empty in both or equal in both.' },
  { name: 'A value differs', q: [1, 2, 4], why: 'Same shape, but 3 and 4 sit in the same spot.' },
  { name: 'Shape differs', q: [1, 2, null, 3], why: 'The values 1, 2, 3 all appear, but 3 sits in another spot.' },
  { name: 'One side missing', q: [1, 2], why: 'p has a node on the right and q has an empty spot.' },
]
const choice = ref(1)
const p = fromLevel([1, 2, 3])
const q = computed(() => fromLevel(options[choice.value].q))
const firstDiff = (a: N | null, b: N | null): [N | null, N | null] | null => {
  if (!a && !b) return null
  if (!a || !b || a.val !== b.val) return [a, b]
  return firstDiff(a.left, b.left) ?? firstDiff(a.right, b.right)
}
const diff = computed(() => firstDiff(p, q.value))
const draw = (root: N | null, bad: N | null | undefined, label: string) => {
  const { items, at } = layout(root)
  const tones: (Tone | null)[] = items.map(() => null)
  for (const n of nodesOf(root)) tones[at.get(n)!] = diff.value ? 'keep' : 'hit'
  if (bad) tones[at.get(bad)!] = 'miss'
  return tree(items, { label, tones })
}
const pPanel = computed(() => draw(p, diff.value?.[0], 'p'))
const qPanel = computed(() => draw(q.value, diff.value?.[1], 'q'))
</script>

<template>
  <div class="d">
    <div class="row" role="group" aria-label="Pick tree q">
      <button v-for="(o, i) in options" :key="o.name" type="button" class="tap" :class="{ on: i === choice }" :aria-pressed="i === choice" @click="choice = i">{{ o.name }}</button>
    </div>
    <div class="pair">
      <PanelView :panel="pPanel" />
      <PanelView :panel="qPanel" />
    </div>
    <p class="verdict" :class="{ bad: !!diff }" role="status">
      <template v-if="diff">Not the same. {{ options[choice].why }}</template>
      <template v-else>The same. {{ options[choice].why }}</template>
    </p>
    <p class="muted small">Red marks the first disagreement. When nothing disagrees, every node turns green.</p>
  </div>
</template>

<style scoped>
.d { display: grid; gap: 10px; }
.row { display: flex; flex-wrap: wrap; gap: 8px; }
.pair { display: grid; gap: 8px; }
.tap { min-width: 44px; min-height: 44px; padding: 0 12px; border-radius: 10px; border: 2px solid var(--line); background: var(--surface); color: inherit; font: inherit; font-weight: 600; cursor: pointer; }
.tap.on { border-color: var(--focus-bd); background: var(--focus-bg); color: var(--focus-fg); }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); }
.verdict.bad { border-color: var(--miss-bd); background: var(--miss-bg); color: var(--miss-fg); }
</style>
