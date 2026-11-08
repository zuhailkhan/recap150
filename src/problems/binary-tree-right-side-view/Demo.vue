<script setup lang="ts">
import { computed, ref } from 'vue'
import { tree } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// Array positions: 0:1  1:2  2:3  3:4. Node 4 is the left child of 2 and the only node in row 3.
const nodes = [1, 2, 3, 4]
const byRow = [0, 2, 3] // last node of each row
const rightSpine = [0, 2] // follow right children only
const mode = ref<'rows' | 'spine'>('rows')
const picked = computed(() => (mode.value === 'rows' ? byRow : rightSpine))
const panel = computed(() =>
  tree(nodes, { label: 'tree', tones: nodes.map((_, i) => (picked.value.includes(i) ? 'hit' : 'dim')), pointers: [] }),
)
const values = computed(() => picked.value.map((i) => nodes[i]))
</script>

<template>
  <div class="d">
    <div class="pick" role="group" aria-label="How to choose the visible nodes">
      <button type="button" :class="{ on: mode === 'rows' }" :aria-pressed="mode === 'rows'" @click="mode = 'rows'">Last node of each row</button>
      <button type="button" :class="{ on: mode === 'spine' }" :aria-pressed="mode === 'spine'" @click="mode = 'spine'">Only right children</button>
    </div>
    <PanelView :panel="panel" />
    <p class="verdict" :class="{ bad: mode === 'spine' }" role="status">
      You get <strong>[{{ values.join(', ') }}]</strong>.
      <template v-if="mode === 'rows'">Row 3 has only the node 4, so it is the last of its row and it is seen.</template>
      <template v-else>Node 4 is a left child, so this method skips it. But nothing hides it, so the answer is wrong.</template>
    </p>
    <p class="muted small">Switch the method. Position in the row decides what you see, not left or right.</p>
  </div>
</template>

<style scoped>
.d { display: grid; gap: 10px; }
.pick { display: flex; flex-wrap: wrap; gap: 8px; }
.pick button { min-height: 44px; padding: 0 14px; border-radius: 10px; border: 2px solid var(--line, currentColor); background: transparent; color: inherit; font: inherit; font-weight: 600; cursor: pointer; }
.pick button.on { border-color: var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); }
.verdict.bad { border-color: var(--miss-bd); background: var(--miss-bg); color: var(--miss-fg); }
</style>
