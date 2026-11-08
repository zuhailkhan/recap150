<script setup lang="ts">
// Visual gallery used to check every panel kind. Not linked from the navigation. Open /#/lab.
import { arr, bits, buckets, dp, graph, grid, heap, intervals, list, mark, mark2, stack, tree, trie, type Panel } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

const panels: { name: string; p: Panel }[] = [
  { name: 'array', p: arr([2, 7, 11, 15, 3, 6], { label: 'nums', tones: mark(6, { 1: 'focus', 3: 'hit', 0: 'dim' }), pointers: [{ name: 'l', at: 1 }, { name: 'r', at: 3, tone: 'hit' }], window: [1, 3] }) },
  { name: 'buckets', p: buckets([{ key: 'aet', items: ['eat', 'tea'], tone: 'focus' }, { key: 'abt', items: ['bat'] }], { label: 'bins', keyLabel: 'fingerprint' }) },
  { name: 'stack', p: stack(['(', '[', '{'], { label: 'stack', tones: [null, null, 'focus'] }) },
  { name: 'list', p: list([1, 2, 3, 4, 5], { label: 'linked list', tones: mark(5, { 2: 'focus' }), pointers: [{ name: 'slow', at: 1 }, { name: 'fast', at: 3, tone: 'keep' }], cycleTo: 1 }) },
  { name: 'list (plain, links)', p: list([7, 13, 11], { label: 'random pointers', links: [{ from: 0, to: 2, label: 'random' }] }) },
  { name: 'tree', p: tree([4, 2, 7, 1, 3, 6, 9], { label: 'binary tree', tones: mark(7, { 0: 'focus', 1: 'hit' }), pointers: [{ name: 'node', at: 0 }] }) },
  { name: 'tree with gaps', p: tree([3, 9, 20, null, null, 15, 7], { label: 'tree' }) },
  { name: 'graph', p: graph(['A', 'B', 'C', 'D'], [{ from: 'A', to: 'B' }, { from: 'B', to: 'C', directed: true, weight: 4, tone: 'hit' }, { from: 'C', to: 'D' }, { from: 'D', to: 'A' }], { label: 'graph', tones: { A: 'focus', B: 'hit' }, notes: { A: 'd=0' } }) },
  { name: 'grid', p: grid([['1', '1', '0'], ['0', '1', '0'], ['1', '0', '1']], { label: 'islands', tones: [['hit', 'hit', null], [null, 'hit', null], [null, null, null]], pointers: [{ r: 1, c: 1, name: 'cur' }] }) },
  { name: 'dp', p: dp([[0, 1, 1, 2], [0, 0, 1, 2]], { label: 'dp table', rowLabels: ['a', 'b'], colLabels: [0, 1, 2, 3], tones: mark2(2, 4, [[1, 3, 'focus'], [0, 2, 'keep']]) }) },
  { name: 'intervals', p: intervals([{ start: 1, end: 3 }, { start: 2, end: 6, tone: 'focus' }, { start: 8, end: 10, tone: 'hit' }], { label: 'intervals', marks: [{ at: 5, label: 'now' }] }) },
  { name: 'heap', p: heap([1, 3, 2, 7, 4, 5], { label: 'min-heap', tones: mark(6, { 0: 'hit', 4: 'focus' }) }) },
  { name: 'trie', p: trie(['apple', 'app', 'apt', 'bat'], { label: 'trie', hot: 'app' }) },
  { name: 'bits', p: bits([{ label: 'a', value: 12 }, { label: 'b', value: 10 }, { label: 'a&b', value: 8, tones: mark(8, { 4: 'hit' }) }], { label: 'bits' }) },
]
</script>

<template>
  <div class="lab">
    <h1>Visual lab</h1>
    <p class="muted">Every panel kind, for visual checks.</p>
    <div class="grid">
      <section v-for="x in panels" :key="x.name" class="card"><h3>{{ x.name }}</h3><PanelView :panel="x.p" /></section>
    </div>
  </div>
</template>

<style scoped>
.grid { display: grid; gap: 14px; grid-template-columns: repeat(auto-fill, minmax(min(100%, 420px), 1fr)); }
.card h3 { margin-bottom: 10px; }
</style>
