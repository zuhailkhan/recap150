<script setup lang="ts">
import { computed, ref } from 'vue'
import { tree, type Tone } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// A full tree stored heap-style: children of position i sit at 2i+1 and 2i+2. A node in `flipped` shows its children swapped.
const vals = [4, 2, 7, 1, 3, 6, 9]
const flipped = ref<number[]>([])
const toggle = (i: number) => {
  flipped.value = flipped.value.includes(i) ? flipped.value.filter((x) => x !== i) : [...flipped.value, i]
}
const drawn = computed(() => {
  const items: number[] = []
  const tones: (Tone | null)[] = []
  const queue = [0]
  for (let h = 0; h < queue.length; h++) {
    const i = queue[h]
    items.push(vals[i])
    tones.push(flipped.value.includes(i) ? 'hit' : null)
    const kids = [2 * i + 1, 2 * i + 2].filter((k) => k < vals.length)
    queue.push(...(flipped.value.includes(i) ? kids.reverse() : kids))
  }
  return tree(items, { label: 'the tree. Green nodes had their sides swapped', tones })
})
const all = computed(() => flipped.value.length === vals.length)
</script>

<template>
  <div class="d">
    <PanelView :panel="drawn" />
    <div class="row" role="group" aria-label="Swap the sides of a node">
      <button v-for="(v, i) in vals" :key="i" type="button" class="tap" :class="{ on: flipped.includes(i) }" :aria-pressed="flipped.includes(i)" @click="toggle(i)">Swap {{ v }}</button>
    </div>
    <p class="verdict" :class="{ bad: !all }" role="status">
      <template v-if="all">Mirrored. Every node swapped its own two sides.</template>
      <template v-else>{{ flipped.length }} of {{ vals.length }} nodes swapped. Swap only the root and the lower levels keep their old order.</template>
    </p>
    <p class="muted small">Swap every node, in any order. The result is always the mirror image.</p>
  </div>
</template>

<style scoped>
.d { display: grid; gap: 10px; }
.row { display: flex; flex-wrap: wrap; gap: 8px; }
.tap { min-width: 44px; min-height: 44px; padding: 0 12px; border-radius: 10px; border: 2px solid var(--line); background: var(--surface); color: inherit; font: inherit; font-weight: 600; cursor: pointer; }
.tap.on { border-color: var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); }
.verdict.bad { border-color: var(--miss-bd); background: var(--miss-bg); color: var(--miss-fg); }
</style>
