<script setup lang="ts">
import type { ArrayPanel } from '@/core/panels'
import Tile from './Tile.vue'
const props = defineProps<{ p: ArrayPanel }>()
const ptrs = (i: number) => (props.p.pointers ?? []).filter((x) => x.at === i)
const inWin = (i: number) => !!props.p.window && i >= props.p.window[0] && i <= props.p.window[1]
</script>

<template>
  <div class="av" role="group" :aria-label="p.label ?? 'array'">
    <div v-for="(it, i) in p.items" :key="i" class="cell" :class="{ inwin: inWin(i) }">
      <Tile :value="it" :tone="p.tones?.[i]" />
      <span class="idx" aria-hidden="true">{{ i }}</span>
      <span class="ptrs">
        <span v-for="q in ptrs(i)" :key="q.name" class="ptr" :class="`tone-${q.tone ?? 'focus'}`">{{ q.name }}</span>
      </span>
    </div>
    <span v-if="!p.items.length" class="muted small">empty</span>
  </div>
</template>

<style scoped>
.av { display: flex; flex-wrap: wrap; gap: 6px; align-items: flex-start; }
.cell { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 3px; border-radius: 12px; border: 2px solid transparent; }
.cell.inwin { border-color: var(--focus-bd); background: var(--focus-bg); }
.idx { font: 500 .72rem var(--font-mono); color: var(--ink-2); }
.ptrs { display: flex; flex-direction: column; gap: 2px; min-height: 20px; }
.ptr { font: 700 .72rem var(--font-mono); padding: 0 6px; border-radius: 6px; border: 1.5px solid; }
</style>
