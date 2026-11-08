<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, onUpdated, ref } from 'vue'
import type { Panel } from '@/core/panels'
import ArrayVis from './ArrayVis.vue'
import BucketsVis from './BucketsVis.vue'
import StackVis from './StackVis.vue'
import ListVis from './ListVis.vue'
import TreeVis from './TreeVis.vue'
import GraphVis from './GraphVis.vue'
import GridVis from './GridVis.vue'
import DpVis from './DpVis.vue'
import IntervalsVis from './IntervalsVis.vue'
import HeapVis from './HeapVis.vue'
import TrieVis from './TrieVis.vue'
import BitsVis from './BitsVis.vue'
import SeqVis from './SeqVis.vue'
import ClassesVis from './ClassesVis.vue'
import ArchVis from './ArchVis.vue'
defineProps<{ panel: Panel }>()

// A wide diagram scrolls inside its own box on a narrow screen. Say so, or the right-hand part looks missing.
const box = ref<HTMLElement | null>(null)
const scrollable = ref(false)
const check = () => { const el = box.value; scrollable.value = !!el && el.scrollWidth > el.clientWidth + 4 }
onMounted(() => { nextTick(check); window.addEventListener('resize', check) })
onUpdated(() => nextTick(check))
onBeforeUnmount(() => window.removeEventListener('resize', check))
</script>

<template>
  <figure ref="box" class="panel" :class="{ scrolls: scrollable }">
    <!-- a panel label reads like the variable it names: nums, seen, dp[i] -->
    <figcaption v-if="panel.label" class="lab">{{ panel.label }}</figcaption>
    <ArrayVis v-if="panel.kind === 'array'" :p="panel" />
    <BucketsVis v-else-if="panel.kind === 'buckets'" :p="panel" />
    <StackVis v-else-if="panel.kind === 'stack'" :p="panel" />
    <ListVis v-else-if="panel.kind === 'list'" :p="panel" />
    <TreeVis v-else-if="panel.kind === 'tree'" :p="panel" />
    <GraphVis v-else-if="panel.kind === 'graph'" :p="panel" />
    <GridVis v-else-if="panel.kind === 'grid'" :p="panel" />
    <DpVis v-else-if="panel.kind === 'dp'" :p="panel" />
    <IntervalsVis v-else-if="panel.kind === 'intervals'" :p="panel" />
    <HeapVis v-else-if="panel.kind === 'heap'" :p="panel" />
    <TrieVis v-else-if="panel.kind === 'trie'" :p="panel" />
    <BitsVis v-else-if="panel.kind === 'bits'" :p="panel" />
    <SeqVis v-else-if="panel.kind === 'seq'" :p="panel" />
    <ClassesVis v-else-if="panel.kind === 'classes'" :p="panel" />
    <ArchVis v-else-if="panel.kind === 'arch'" :p="panel" />
    <p v-if="scrollable" class="hint" aria-hidden="true">Drag sideways to see the rest</p>
  </figure>
</template>

<style scoped>
.panel { margin: 0; min-width: 0; max-width: 100%; overflow-x: auto; padding-bottom: 2px; }
.lab { font: 500 .8rem var(--font-mono); color: var(--ink-2); margin-bottom: 8px; display: flex; align-items: center; gap: 8px; }
.hint { margin: 6px 0 0; font: 500 .72rem var(--font-mono); color: var(--ink-3); position: sticky; left: 0; }
.lab::after { content: ''; flex: 1; height: 1px; background: var(--line); }
</style>
