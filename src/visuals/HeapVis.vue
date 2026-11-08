<script setup lang="ts">
import { computed } from 'vue'
import type { HeapPanel } from '@/core/panels'
import { heapLayout } from './treeLayout'
import TreeSvg from './TreeSvg.vue'
import Tile from './Tile.vue'
const props = defineProps<{ p: HeapPanel }>()
const layout = computed(() => heapLayout(props.p.items))
</script>

<template>
  <div class="hv">
    <TreeSvg v-if="layout.nodes.length" :layout="layout" :tone="(id) => p.tones?.[Number(id)]" />
    <span v-else class="muted small">empty heap</span>
    <div class="arr" aria-label="heap as an array">
      <div v-for="(it, i) in p.items" :key="i" class="c"><Tile :value="it" :tone="p.tones?.[i]" small /><span class="i">{{ i }}</span></div>
    </div>
    <span class="muted small">{{ p.max ? 'Max-heap: a parent is never smaller than its children.' : 'Min-heap: a parent is never larger than its children.' }}</span>
  </div>
</template>

<style scoped>
.hv { display: grid; gap: 8px; }
.arr { display: flex; gap: 4px; flex-wrap: wrap; }
.c { display: flex; flex-direction: column; align-items: center; }
.i { font: 500 .68rem var(--font-mono); color: var(--ink-2); }
</style>
