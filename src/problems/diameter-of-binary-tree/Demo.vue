<script setup lang="ts">
import { computed, ref } from 'vue'
import { tree, type Tone } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'
import { bend, find, fromLevel, hgt, layout, longestBend, nodesOf } from './ts/viz'

// Tap a node: the longest path that bends there is its left height plus its right height.
const root = fromLevel([1, 2, null, 3, 4, 5, null, null, 6])
const { items, at } = layout(root)
const vals = nodesOf(root).map((n) => n.val)
const picked = ref(1)
const node = computed(() => find(root, picked.value)!)
const left = computed(() => hgt(node.value.left))
const right = computed(() => hgt(node.value.right))
const best = Math.max(...nodesOf(root).map((n) => hgt(n.left) + hgt(n.right)))
const isBest = computed(() => left.value + right.value === best)
const panel = computed(() => {
  const tones: (Tone | null)[] = items.map(() => null)
  for (const n of bend(node.value)) tones[at.get(n)!] = isBest.value ? 'hit' : 'keep'
  tones[at.get(node.value)!] = 'focus'
  return tree(items, { label: 'highlighted = longest path that bends at the picked node', tones })
})
const bestNodes = longestBend(root).map((n) => n.val).join(' - ')
</script>

<template>
  <div class="d">
    <div class="row" role="group" aria-label="Pick a node">
      <button v-for="v in vals" :key="v" type="button" class="tap" :class="{ on: v === picked }" :aria-pressed="v === picked" @click="picked = v">Node {{ v }}</button>
    </div>
    <PanelView :panel="panel" />
    <p class="verdict" :class="{ plain: !isBest }" role="status">
      Bend at {{ picked }}: {{ left }} + {{ right }} = <strong>{{ left + right }}</strong> edges.
      <template v-if="isBest">This is the longest path of all.</template>
      <template v-else>The best anywhere is {{ best }}.</template>
    </p>
    <p class="muted small">Try every node. The overall best is {{ best }} edges ({{ bestNodes }}), and it does not bend at the root.</p>
  </div>
</template>

<style scoped>
.d { display: grid; gap: 10px; }
.row { display: flex; flex-wrap: wrap; gap: 8px; }
.tap { min-width: 44px; min-height: 44px; padding: 0 12px; border-radius: 10px; border: 2px solid var(--line); background: var(--surface); color: inherit; font: inherit; font-weight: 600; cursor: pointer; }
.tap.on { border-color: var(--focus-bd); background: var(--focus-bg); color: var(--focus-fg); }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); }
.verdict.plain { border-color: var(--keep-bd); background: var(--keep-bg); color: var(--keep-fg); }
</style>
