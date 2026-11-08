<script setup lang="ts">
import type { ReadyMeta } from '@/core/schema'
defineProps<{ recap: Omit<ReadyMeta['recap'], 'complexity'> & { complexity?: string } }>()
</script>

<template>
  <div class="rc">
    <div class="lead">
      <p class="pat">{{ recap.pattern }}</p>
      <p class="key">{{ recap.key }}</p>
      <p v-if="recap.complexity" class="cx muted">{{ recap.complexity }}</p>
    </div>
    <ol class="moves">
      <li v-for="(m, i) in recap.moves" :key="i"><span class="badge">{{ i + 1 }}</span>{{ m }}</li>
    </ol>
  </div>
</template>

<style scoped>
.rc { display: grid; gap: 22px; padding: 22px 0 4px; border-top: 2px solid var(--ink); min-width: 0; }
@media (min-width: 900px) { .rc { grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr); gap: 48px; } }
.pat { margin: 0 0 6px; font: 600 .86rem var(--font-mono); color: var(--ink-2); }
.key { margin: 0 0 12px; font: 600 clamp(1.3rem, 1.1rem + .9vw, 1.75rem)/1.25 var(--font-head); letter-spacing: -0.018em; max-width: 30ch; }
.cx { margin: 0; font: 500 .9rem var(--font-mono); }
.moves { list-style: none; margin: 0; padding: 0; display: grid; gap: 0; align-content: start; }
.moves li { display: flex; gap: 12px; align-items: flex-start; padding: 11px 0; border-bottom: 1px solid var(--line); line-height: 1.5; }
.moves li:first-child { padding-top: 2px; }
.moves .badge { margin-top: 1px; }
</style>
