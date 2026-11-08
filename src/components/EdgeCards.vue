<script setup lang="ts">
import type { ReadyMeta } from '@/core/schema'
defineProps<{ edges: ReadyMeta['edges']; gotchas: ReadyMeta['gotchas'] }>()
</script>

<template>
  <div class="ec">
    <div class="cards">
      <article v-for="e in edges" :key="e.title" class="card">
        <h3>{{ e.title }}</h3>
        <p class="io"><code>{{ e.input }}</code><span aria-hidden="true"> → </span><span class="sr-only"> gives </span><code>{{ e.output }}</code></p>
        <p class="why small">{{ e.why }}</p>
      </article>
    </div>
    <h3 class="gh">Gotchas</h3>
    <ul class="gotchas">
      <li v-for="(g, i) in gotchas" :key="i"><span class="lang" :class="g.lang">{{ g.lang }}</span><span>{{ g.text }}</span></li>
    </ul>
  </div>
</template>

<style scoped>
.ec { display: grid; gap: 14px; min-width: 0; }
.cards { display: grid; gap: 12px; grid-template-columns: 1fr; }
@media (min-width: 640px) { .cards { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (min-width: 1280px) { .cards { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
.card h3 { margin-bottom: 8px; }
.io { margin: 0 0 8px; display: flex; flex-wrap: wrap; gap: 4px 6px; align-items: baseline; }
.io code { overflow-wrap: anywhere; }
.why { margin: 0; color: var(--ink-2); }
.gh { margin: 8px 0 0; }
.gotchas { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
.gotchas li { display: grid; grid-template-columns: 96px minmax(0, 1fr); gap: 12px; align-items: start; padding: 12px 14px; background: var(--surface); border: 1px solid var(--line); border-radius: 12px; }
@media (max-width: 520px) { .gotchas li { grid-template-columns: 1fr; gap: 6px; } }
.lang { justify-self: start; font: 700 .72rem var(--font-body); text-transform: uppercase; letter-spacing: .08em; padding: 3px 9px; border-radius: 999px; border: 1.5px solid; }
.lang.TypeScript { color: var(--keep-fg); background: var(--keep-bg); border-color: var(--keep-bd); }
.lang.Go { color: var(--hit-fg); background: var(--hit-bg); border-color: var(--hit-bd); }
.lang.General { color: var(--focus-fg); background: var(--focus-bg); border-color: var(--focus-bd); }
</style>
