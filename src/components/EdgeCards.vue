<script setup lang="ts">
import type { ReadyMeta } from '@/core/schema'
defineProps<{ edges?: ReadyMeta['edges']; gotchas: ReadyMeta['gotchas'] }>()
const tag = { TypeScript: 'TS', Go: 'Go', General: 'Any' } as const
</script>

<template>
  <div class="ec">
    <div v-if="edges?.length" class="cards">
      <article v-for="e in edges" :key="e.title" class="edge">
        <h3>{{ e.title }}</h3>
        <p class="io"><code>{{ e.input }}</code><span class="arr" aria-hidden="true">gives</span><span class="sr-only"> gives </span><code>{{ e.output }}</code></p>
        <p class="why small">{{ e.why }}</p>
      </article>
    </div>
    <h3 v-if="edges?.length" class="gh">Gotchas</h3>
    <ul class="gotchas">
      <li v-for="(g, i) in gotchas" :key="i"><span class="lang" :class="g.lang" :title="g.lang"><span class="sr-only">{{ g.lang }}: </span><span aria-hidden="true">{{ tag[g.lang] }}</span></span><span>{{ g.text }}</span></li>
    </ul>
  </div>
</template>

<style scoped>
.ec { display: grid; gap: 28px; min-width: 0; }
.cards { display: grid; gap: 26px 28px; grid-template-columns: 1fr; }
@media (min-width: 640px) { .cards { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (min-width: 1500px) { .cards { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
.edge { border-top: 2px solid var(--ink); padding-top: 12px; min-width: 0; }
.edge h3 { margin-bottom: 10px; }
.io { margin: 0 0 10px; display: flex; flex-wrap: wrap; gap: 6px 8px; align-items: baseline; }
.io code { overflow-wrap: anywhere; background: var(--surface); border: 1px solid var(--line); padding: 2px 7px; }
.arr { font-size: .78rem; color: var(--ink-3); }
.why { margin: 0; color: var(--ink-2); max-width: 44ch; }
.gh { margin: 0; }
.gotchas { list-style: none; margin: 0; padding: 0; display: grid; gap: 0; max-width: 78ch; }
.gotchas li { display: grid; grid-template-columns: 38px minmax(0, 1fr); gap: 14px; align-items: start; padding: 13px 0; border-top: 1px solid var(--line); line-height: 1.55; }
.gotchas li:last-child { border-bottom: 1px solid var(--line); }
.lang { justify-self: start; font: 700 .72rem var(--font-mono); min-width: 30px; text-align: center; padding: 3px 0; border-radius: 5px; border: 1.5px solid var(--ink-3); color: var(--ink-2); }
.lang.TypeScript { background: var(--ink); color: var(--bg); border-color: var(--ink); }
.lang.Go { border-color: var(--ink); color: var(--ink); }
</style>
