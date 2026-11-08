<script setup lang="ts">
import type { Panel } from '@/core/panels'
import ArrayVis from './ArrayVis.vue'
import BucketsVis from './BucketsVis.vue'
import StackVis from './StackVis.vue'
defineProps<{ panel: Panel }>()
</script>

<template>
  <figure class="panel">
    <figcaption v-if="panel.label" class="lab">{{ panel.label }}</figcaption>
    <ArrayVis v-if="panel.kind === 'array'" :p="panel" />
    <BucketsVis v-else-if="panel.kind === 'buckets'" :p="panel" />
    <StackVis v-else-if="panel.kind === 'stack'" :p="panel" />
  </figure>
</template>

<style scoped>
.panel { margin: 0; min-width: 0; max-width: 100%; overflow-x: auto; padding-bottom: 2px; }
.lab { font: 700 .75rem var(--font-body); text-transform: uppercase; letter-spacing: .08em; color: var(--ink-2); margin-bottom: 6px; }
</style>
