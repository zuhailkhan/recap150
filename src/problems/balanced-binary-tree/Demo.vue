<script setup lang="ts">
import { computed, ref } from 'vue'
import { tree, type Tone } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'
import { find, fromLevel, hgt, layout, nodesOf } from './ts/viz'

// Tap a node: compare the heights of its two sides. The root looks fine, but nodes below it are not.
const root = fromLevel([1, 2, 3, 4, null, null, 5, 6, null, null, 7])
const { items, at } = layout(root)
const vals = nodesOf(root).map((n) => n.val)
const picked = ref(1)
const node = computed(() => find(root, picked.value)!)
const left = computed(() => hgt(node.value.left))
const right = computed(() => hgt(node.value.right))
const lopsided = (v: number) => { const n = find(root, v)!; return Math.abs(hgt(n.left) - hgt(n.right)) > 1 }
const bad = vals.filter(lopsided)
const panel = computed(() => {
  const tones: (Tone | null)[] = items.map(() => null)
  for (const n of nodesOf(node.value.left)) tones[at.get(n)!] = 'keep'
  for (const n of nodesOf(node.value.right)) tones[at.get(n)!] = 'dim'
  tones[at.get(node.value)!] = lopsided(picked.value) ? 'miss' : 'hit'
  return tree(items, { label: 'blue = left side, grey = right side of the picked node', tones })
})
</script>

<template>
  <div class="d">
    <div class="row" role="group" aria-label="Pick a node">
      <button v-for="v in vals" :key="v" type="button" class="tap" :class="{ on: v === picked, no: lopsided(v) }" :aria-pressed="v === picked" @click="picked = v">Node {{ v }}</button>
    </div>
    <PanelView :panel="panel" />
    <p class="verdict" :class="{ bad: lopsided(picked) }" role="status">
      Left height {{ left }}, right height {{ right }}. They differ by {{ Math.abs(left - right) }}.
      <template v-if="lopsided(picked)">Lopsided: this breaks the rule.</template>
      <template v-else>Fine for this node.</template>
    </p>
    <p class="muted small">The root passes (3 and 3). Nodes {{ bad.join(' and ') }} fail, so the whole tree is not balanced. Every node must be checked.</p>
  </div>
</template>

<style scoped>
.d { display: grid; gap: 10px; }
.row { display: flex; flex-wrap: wrap; gap: 8px; }
.tap { min-width: 44px; min-height: 44px; padding: 0 12px; border-radius: 10px; border: 2px solid var(--line); background: var(--surface); color: inherit; font: inherit; font-weight: 600; cursor: pointer; }
.tap.no { border-color: var(--miss-bd); }
.tap.on { border-color: var(--focus-bd); background: var(--focus-bg); color: var(--focus-fg); }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); }
.verdict.bad { border-color: var(--miss-bd); background: var(--miss-bg); color: var(--miss-fg); }
</style>
