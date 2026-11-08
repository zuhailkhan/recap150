<script setup lang="ts">
import { computed, ref } from 'vue'
import { tree, type Tone } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'
import { find, fromLevel, layout, nodesOf } from './ts/viz'

// Pick p and q. Follow the walk: both smaller go left, both bigger go right, anything else is the split.
const root = fromLevel([6, 2, 8, 0, 4, 7, 9, null, null, 3, 5])
const { items, at } = layout(root)
const vals = nodesOf(root).map((n) => n.val).sort((a, b) => a - b)
const p = ref(3)
const q = ref(5)
const walk = computed(() => {
  const path: number[] = []
  let node = root
  while (node) {
    path.push(node.val)
    if (p.value < node.val && q.value < node.val) node = node.left
    else if (p.value > node.val && q.value > node.val) node = node.right
    else break
  }
  return path
})
const answer = computed(() => walk.value[walk.value.length - 1])
const panel = computed(() => {
  const tones: (Tone | null)[] = items.map(() => null)
  for (const v of walk.value) tones[at.get(find(root, v)!)!] = 'dim'
  tones[at.get(find(root, answer.value)!)!] = 'hit'
  for (const v of [p.value, q.value]) if (v !== answer.value) tones[at.get(find(root, v)!)!] = 'keep'
  return tree(items, { label: 'grey = nodes the walk passed, green = answer, blue = p and q', tones })
})
</script>

<template>
  <div class="d">
    <div class="row">
      <label class="pick">p <select v-model.number="p"><option v-for="v in vals" :key="v" :value="v">{{ v }}</option></select></label>
      <label class="pick">q <select v-model.number="q"><option v-for="v in vals" :key="v" :value="v">{{ v }}</option></select></label>
    </div>
    <PanelView :panel="panel" />
    <p class="verdict" role="status">
      Walk: {{ walk.join(' to ') }}. The answer is <strong>{{ answer }}</strong>, the first node where {{ p }} and {{ q }} do not both go the same way.
    </p>
    <p class="muted small">Pick p = q = one value, or p as an ancestor of q. The walk still stops at the right node.</p>
  </div>
</template>

<style scoped>
.d { display: grid; gap: 10px; }
.row { display: flex; flex-wrap: wrap; gap: 12px; }
.pick { display: flex; align-items: center; gap: 8px; font-weight: 600; }
.pick select { min-height: 44px; min-width: 72px; padding: 0 10px; font: inherit; border-radius: 10px; border: 2px solid var(--line); background: var(--surface); color: inherit; }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); }
</style>
