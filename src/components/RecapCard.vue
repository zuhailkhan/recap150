<script setup lang="ts">
import type { ReadyMeta } from '@/core/schema'
defineProps<{ recap: ReadyMeta['recap'] }>()
</script>

<template>
  <div class="rc card">
    <span class="pat">{{ recap.pattern }}</span>
    <p class="key">{{ recap.key }}</p>
    <p class="cx"><span class="muted small">Complexity</span><br />{{ recap.complexity }}</p>
    <ol class="moves">
      <li v-for="(m, i) in recap.moves" :key="i"><span class="badge">{{ i + 1 }}</span>{{ m }}</li>
    </ol>
  </div>
</template>

<style scoped>
.rc { display: grid; gap: 10px; border-left: 6px solid var(--accent); }
.pat { justify-self: start; font: 700 .78rem var(--font-body); text-transform: uppercase; letter-spacing: .08em; padding: 3px 10px; border-radius: 999px; background: var(--accent-soft); color: var(--ink); }
.key { font: 600 1.15rem var(--font-head); margin: 0; }
.cx { margin: 0; }
.moves { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
.moves li { display: flex; gap: 10px; align-items: flex-start; }
</style>
