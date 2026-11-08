<script setup lang="ts">
import { computed, ref } from 'vue'
import { arr, tree } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// Pick a tree. The string below is its preorder with # for each missing child.
const trees: { name: string; nodes: (number | null)[] }[] = [
  { name: 'Balanced', nodes: [1, 2, 3] },
  { name: 'Left chain', nodes: [1, 2, null, 3] },
  { name: 'Right chain', nodes: [1, null, 2, null, 3] },
  { name: 'Mixed', nodes: [1, 2, 3, null, null, 4] },
]
const pick = ref(0)
const nodes = computed(() => trees[pick.value].nodes)

// Level-order array to children, then preorder with markers.
const tokens = computed(() => {
  const a = nodes.value
  const kids = new Map<number, [number | null, number | null]>()
  const queue = [0]
  let next = 1
  while (queue.length && next < a.length) {
    const at = queue.shift()!
    const l = a[next] === null || next >= a.length ? null : next
    next++
    const r = next < a.length && a[next] !== null ? next : null
    next++
    kids.set(at, [l, r])
    if (l !== null) queue.push(l)
    if (r !== null) queue.push(r)
  }
  const out: string[] = []
  const walk = (i: number | null): void => {
    if (i === null) return void out.push('#')
    out.push(String(a[i]))
    const [l, r] = kids.get(i) ?? [null, null]
    walk(l)
    walk(r)
  }
  walk(0)
  return out
})
</script>

<template>
  <div class="d">
    <div class="pick" role="group" aria-label="Choose a tree">
      <button v-for="(t, i) in trees" :key="t.name" type="button" :class="{ on: i === pick }" :aria-pressed="i === pick" @click="pick = i">{{ t.name }}</button>
    </div>
    <PanelView :panel="tree(nodes, { label: 'tree' })" />
    <PanelView :panel="arr(tokens, { label: 'tokens in preorder. # marks a missing child', tones: tokens.map((x) => (x === '#' ? 'miss' : null)) })" />
    <p class="verdict" role="status"><strong>{{ tokens.join(',') }}</strong> has {{ tokens.filter((x) => x !== '#').length }} node(s) and {{ tokens.filter((x) => x === '#').length }} marker(s).</p>
    <p class="muted small">Markers are always one more than nodes. They are what tells the reader where each subtree stops.</p>
  </div>
</template>

<style scoped>
.d { display: grid; gap: 10px; }
.pick { display: flex; flex-wrap: wrap; gap: 8px; }
.pick button { min-height: 44px; padding: 0 14px; border-radius: 10px; border: 2px solid var(--line); background: var(--tile-bg); color: var(--tile-fg); font: inherit; font-weight: 600; cursor: pointer; }
.pick button.on { border-color: var(--focus-bd); background: var(--focus-bg); color: var(--focus-fg); }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); overflow-wrap: anywhere; }
</style>
