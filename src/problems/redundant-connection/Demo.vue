<script setup lang="ts">
import { computed, ref } from 'vue'
import { graph } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// Groups {1,2,3} and {4,5}. Pick an edge to try. Same root means it closes a loop.
const parent = [0, 2, 3, 3, 5, 5]
const climb = (x: number): number[] => (parent[x] === x ? [x] : [x, ...climb(parent[x])])
const a = ref(1)
const b = ref(3)
const pa = computed(() => climb(a.value))
const pb = computed(() => climb(b.value))
const same = computed(() => pa.value[pa.value.length - 1] === pb.value[pb.value.length - 1])
const nodes = [{ id: '1', x: 10, y: 25 }, { id: '2', x: 35, y: 70 }, { id: '3', x: 60, y: 25 }, { id: '4', x: 70, y: 80 }, { id: '5', x: 92, y: 40 }]
const panel = computed(() => graph(nodes, [{ from: '1', to: '2' }, { from: '2', to: '3' }, { from: '4', to: '5' }, ...(a.value !== b.value ? [{ from: String(a.value), to: String(b.value), tone: same.value ? ('miss' as const) : ('hit' as const) }] : [])], {
  label: 'groups {1,2,3} and {4,5}. Your edge is coloured',
  tones: { 3: 'keep', 5: 'keep' },
  notes: { 3: 'leader', 5: 'leader' },
}))
</script>

<template>
  <div class="rcd">
    <div class="row">
      <label>End a <select v-model.number="a"><option v-for="n in 5" :key="n" :value="n">{{ n }}</option></select></label>
      <label>End b <select v-model.number="b"><option v-for="n in 5" :key="n" :value="n">{{ n }}</option></select></label>
    </div>
    <PanelView :panel="panel" />
    <p class="verdict" :class="{ bad: same }" role="status">
      Leader of {{ a }}: {{ pa.join(' → ') }}. Leader of {{ b }}: {{ pb.join(' → ') }}.
      <template v-if="same">Same leader, so edge {{ a }}-{{ b }} closes a loop. It is redundant.</template>
      <template v-else>Different leaders, so edge {{ a }}-{{ b }} merges two groups.</template>
    </p>
    <p class="muted small">Try 1 and 3, then 3 and 4. Following parents until a node is its own parent finds the leader.</p>
  </div>
</template>

<style scoped>
.rcd { display: grid; gap: 10px; }
.row { display: flex; flex-wrap: wrap; gap: 14px; }
.row label { display: flex; align-items: center; gap: 8px; font-weight: 600; }
.row select { min-height: 44px; min-width: 64px; padding: 0 10px; font-size: 1rem; border-radius: 10px; border: 1px solid var(--line); background: var(--surface); color: inherit; }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); }
.verdict.bad { border-color: var(--miss-bd); background: var(--miss-bg); color: var(--miss-fg); }
</style>
