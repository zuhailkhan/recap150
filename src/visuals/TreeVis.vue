<script setup lang="ts">
import { computed } from 'vue'
import type { TreePanel } from '@/core/panels'
import { levelOrderLayout } from './treeLayout'
import TreeSvg from './TreeSvg.vue'
const props = defineProps<{ p: TreePanel }>()
const layout = computed(() => levelOrderLayout(props.p.nodes))
const ptrs = (id: string) => (props.p.pointers ?? []).filter((q) => String(q.at) === id).map((q) => q.name)
</script>

<template>
  <TreeSvg v-if="layout.nodes.length" :layout="layout" :tone="(id) => p.tones?.[Number(id)]" :ptrs="ptrs" />
  <span v-else class="muted small">empty tree</span>
</template>
