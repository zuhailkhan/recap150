<script setup lang="ts">
import type { GridPanel } from '@/core/panels'
const props = defineProps<{ p: GridPanel }>()
const ptr = (r: number, c: number) => (props.p.pointers ?? []).filter((q) => q.r === r && q.c === c)
</script>

<template>
  <div class="gr" role="grid" :aria-label="p.label ?? 'grid'">
    <div v-for="(row, r) in p.cells" :key="r" class="row" role="row">
      <span v-for="(v, c) in row" :key="c" role="gridcell" class="cell tile small" :class="p.tones?.[r]?.[c] ? `tone-${p.tones[r][c]}` : ''">
        {{ v === '' ? '·' : v }}<sup v-for="q in ptr(r, c)" :key="q.name" :class="`tone-${q.tone ?? 'focus'}`">{{ q.name }}</sup>
      </span>
    </div>
  </div>
</template>

<style scoped>
.gr { display: inline-grid; gap: 3px; padding-top: 6px; }
.row { display: flex; gap: 3px; }
.cell { position: relative; min-width: 36px; min-height: 36px; padding: 0 4px; }
sup { position: absolute; top: -8px; right: -4px; font: 700 .6rem var(--font-mono); padding: 0 3px; border-radius: 5px; border: 1.5px solid; }
</style>
