<script setup lang="ts">
import { computed } from 'vue'
import type { TriePanel } from '@/core/panels'
import { trieLayout } from './treeLayout'
import TreeSvg from './TreeSvg.vue'
const props = defineProps<{ p: TriePanel }>()
const layout = computed(() => trieLayout(props.p.words))
const onPath = (id: string) => props.p.hot !== undefined && props.p.hot.startsWith(id)
const tone = (id: string) => (onPath(id) ? (props.p.hotTone ?? 'focus') : null)
</script>

<template>
  <div class="tv">
    <TreeSvg :layout="layout" :tone="tone" :hot="onPath" />
    <span class="muted small">A ringed letter ends a word. The top dot is the empty start.</span>
  </div>
</template>

<style scoped>.tv { display: grid; gap: 6px; }</style>
