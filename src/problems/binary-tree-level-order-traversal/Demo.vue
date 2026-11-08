<script setup lang="ts">
import { computed, ref } from 'vue'
import { arr, tree, type Tone } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'
import { fromLevel, layout, type N } from './ts/viz'

// Pick a round. At the start of round k the queue holds exactly level k, and the rows before it are done.
const root = fromLevel([1, 2, 3, 4, 5, null, 6, 7])
const { items, at } = layout(root)
const levels: N[][] = []
for (let row: N[] = root ? [root] : []; row.length; row = row.flatMap((n) => [n.left, n.right].filter((c): c is N => !!c))) levels.push(row)
const round = ref(1)
const queue = computed(() => levels[round.value - 1])
const done = computed(() => levels.slice(0, round.value - 1))
const treePanel = computed(() => {
  const tones: (Tone | null)[] = items.map(() => null)
  for (const row of done.value) for (const n of row) tones[at.get(n)!] = 'dim'
  for (const n of queue.value) tones[at.get(n)!] = 'focus'
  return tree(items, { label: 'yellow = the level this round handles, grey = finished rows', tones })
})
const queuePanel = computed(() => arr(queue.value.map((n) => n.val), { label: `queue at the start of round ${round.value}`, tones: queue.value.map(() => 'focus') }))
const resultPanel = computed(() => arr(done.value.map((r) => `[${r.map((n) => n.val).join(',')}]`), { label: 'result so far' }))
</script>

<template>
  <div class="d">
    <div class="row" role="group" aria-label="Pick a round">
      <button v-for="r in levels.length" :key="r" type="button" class="tap" :class="{ on: r === round }" :aria-pressed="r === round" @click="round = r">Round {{ r }}</button>
    </div>
    <PanelView :panel="treePanel" />
    <PanelView :panel="queuePanel" />
    <PanelView :panel="resultPanel" />
    <p class="verdict" role="status">
      The queue holds {{ queue.length }} node{{ queue.length === 1 ? '' : 's' }}, so this round takes exactly {{ queue.length }} from the front. Their children line up behind for round {{ round + 1 }}.
    </p>
    <p class="muted small">Reading the queue length before the round starts is what draws the line between levels.</p>
  </div>
</template>

<style scoped>
.d { display: grid; gap: 10px; }
.row { display: flex; flex-wrap: wrap; gap: 8px; }
.tap { min-width: 44px; min-height: 44px; padding: 0 12px; border-radius: 10px; border: 2px solid var(--line); background: var(--surface); color: inherit; font: inherit; font-weight: 600; cursor: pointer; }
.tap.on { border-color: var(--focus-bd); background: var(--focus-bg); color: var(--focus-fg); }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); }
</style>
