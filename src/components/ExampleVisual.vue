<script setup lang="ts">
import type { ReadyMeta } from '@/core/schema'
import PanelView from '@/visuals/PanelView.vue'
defineProps<{ example: ReadyMeta['example'] }>()
</script>

<template>
  <div class="ex card">
    <div class="side"><span class="tag">Input</span><PanelView v-for="(p, i) in example.input" :key="i" :panel="p" /></div>
    <div class="arrow" aria-hidden="true">↓</div>
    <div class="side"><span class="tag">Output</span><PanelView v-for="(p, i) in example.output" :key="i" :panel="p" /></div>
    <p class="cap small muted">{{ example.caption }}</p>
  </div>
</template>

<style scoped>
.ex { display: grid; gap: 10px; }
.side { display: grid; gap: 8px; min-width: 0; }
.tag { font: 700 .72rem var(--font-body); text-transform: uppercase; letter-spacing: .1em; color: var(--accent); }
.arrow { color: var(--ink-2); font-size: 1.2rem; line-height: 1; }
.cap { margin: 0; }
</style>
