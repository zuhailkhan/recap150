<script setup lang="ts">
import { computed, ref } from 'vue'
import { tree, type Tone } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'
import { find, fromLevel, hgt, layout, nodesOf } from './ts/viz'

// Tap a node: its height is 1 plus the taller of its two sides.
const root = fromLevel([3, 9, 20, null, null, 15, 7])
const { items, at } = layout(root)
const vals = nodesOf(root).map((n) => n.val)
const picked = ref(20)
const node = computed(() => find(root, picked.value)!)
const left = computed(() => hgt(node.value.left))
const right = computed(() => hgt(node.value.right))
const panel = computed(() => {
  const tones: (Tone | null)[] = items.map(() => null)
  for (const n of nodesOf(node.value)) tones[at.get(n)!] = 'keep'
  tones[at.get(node.value)!] = 'focus'
  return tree(items, { label: 'blue = the subtree under the picked node', tones })
})
</script>

<template>
  <div class="d">
    <div class="row" role="group" aria-label="Pick a node">
      <button v-for="v in vals" :key="v" type="button" class="tap" :class="{ on: v === picked }" :aria-pressed="v === picked" @click="picked = v">Node {{ v }}</button>
    </div>
    <PanelView :panel="panel" />
    <p class="verdict" role="status">
      Height of {{ picked }} = 1 + max({{ left }}, {{ right }}) = <strong>{{ 1 + Math.max(left, right) }}</strong>
    </p>
    <p class="muted small">An empty side counts as 0. The root's answer is the depth of the whole tree.</p>
  </div>
</template>

<style scoped>
.d { display: grid; gap: 10px; }
.row { display: flex; flex-wrap: wrap; gap: 8px; }
.tap { min-width: 44px; min-height: 44px; padding: 0 12px; border-radius: 10px; border: 2px solid var(--line); background: var(--surface); color: inherit; font: inherit; font-weight: 600; cursor: pointer; }
.tap.on { border-color: var(--focus-bd); background: var(--focus-bg); color: var(--focus-fg); }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); }
</style>
