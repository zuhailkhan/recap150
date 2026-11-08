<script setup lang="ts">
import type { ReadyMeta } from '@/core/schema'
import PanelView from '@/visuals/PanelView.vue'
defineProps<{ example: ReadyMeta['example'] }>()
</script>

<template>
  <figure class="ex">
    <div class="row"><span class="tag">in</span><div class="panels"><PanelView v-for="(p, i) in example.input" :key="i" :panel="p" /></div></div>
    <div class="row"><span class="tag out">out</span><div class="panels"><PanelView v-for="(p, i) in example.output" :key="i" :panel="p" /></div></div>
    <figcaption class="cap small muted">{{ example.caption }}</figcaption>
  </figure>
</template>

<style scoped>
.ex { margin: 0; display: grid; gap: 14px; padding: 18px 20px 16px; background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius); min-width: 0; }
.row { display: grid; grid-template-columns: minmax(0, 1fr); gap: 6px; align-items: start; min-width: 0; }
.row + .row { padding-top: 14px; border-top: 1px dashed var(--line); }
.tag { font: 600 .78rem var(--font-mono); color: var(--ink-3); }
.panels { display: grid; gap: 12px; min-width: 0; }
.cap { margin: 0; }
</style>
