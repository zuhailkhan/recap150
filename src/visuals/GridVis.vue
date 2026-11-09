<script setup lang="ts">
import { computed } from 'vue'
import type { GridPanel } from '@/core/panels'
const props = defineProps<{ p: GridPanel }>()
const ptr = (r: number, c: number) => (props.p.pointers ?? []).filter((q) => q.r === r && q.c === c)
const isEmpty = (v: string | number) => v === '' || v === '.'
/** A 9x9 board gets 3x3 box lines, which is what a Sudoku reader looks for. */
const boxed = computed(() => props.p.cells.length === 9 && props.p.cells.every((r) => r.length === 9))
const wide = computed(() => Math.max(0, ...props.p.cells.map((r) => r.length)) >= 8)
</script>

<template>
  <div class="gr" :class="{ boxed, wide }" role="grid" :aria-label="p.label ?? 'grid'">
    <div v-for="(row, r) in p.cells" :key="r" class="row" role="row" :class="{ b: boxed && r % 3 === 2 && r < 8 }">
      <span
        v-for="(v, c) in row"
        :key="c"
        role="gridcell"
        class="cell"
        :class="[p.tones?.[r]?.[c] ? `tone-${p.tones[r][c]}` : '', { empty: isEmpty(v) && !p.tones?.[r]?.[c], b: boxed && c % 3 === 2 && c < 8 }]"
      >
        <template v-if="isEmpty(v)"><i class="dot" aria-hidden="true"></i><span class="sr-only">empty</span></template>
        <template v-else>{{ v }}</template>
        <sup v-for="q in ptr(r, c)" :key="q.name" :class="`tone-${q.tone ?? 'focus'}`">{{ q.name }}</sup>
      </span>
    </div>
  </div>
</template>

<style scoped>
.gr { display: inline-grid; gap: 2px; padding-top: 8px; }
.row { display: flex; gap: 2px; }
.row.b { margin-bottom: 8px; }
.cell { position: relative; display: inline-grid; place-items: center; min-width: 38px; min-height: 38px; padding: 0 4px; border: 1px solid var(--tile-bd); border-radius: 6px; background: var(--tile-bg); color: var(--tile-fg); font: 600 .95rem var(--font-mono); font-variant-numeric: tabular-nums; transition: background .18s, border-color .18s, color .18s; }
.cell.b { margin-right: 8px; }
.wide .cell { min-width: 34px; min-height: 34px; font-size: .88rem; }
/* empty squares recede, so the filled ones and the highlighted ones are what you see */
.cell.empty { background: transparent; border-color: color-mix(in srgb, var(--tile-bd) 45%, transparent); }
.dot { width: 4px; height: 4px; border-radius: 50%; background: var(--ink-3); opacity: .55; }
/* tones must out-rank the cell's own colours (scoped rules beat the global .tone-* classes) */
.cell.tone-focus { background: var(--focus-bg); color: var(--focus-fg); border-color: var(--focus-bd); border-width: 1.5px; box-shadow: 0 0 0 3px color-mix(in srgb, var(--focus-bd) 22%, transparent); }
.cell.tone-keep { background: var(--keep-bg); color: var(--keep-fg); border-color: var(--keep-bd); border-width: 1.5px; }
.cell.tone-hit { background: var(--hit-bg); color: var(--hit-fg); border-color: var(--hit-bd); border-width: 1.5px; }
.cell.tone-miss { background: var(--miss-bg); color: var(--miss-fg); border-color: var(--miss-bd); border-width: 1.5px; }
.cell.tone-dim { background: var(--dim-bg); color: var(--dim-fg); border-color: var(--dim-bd); border-width: 1.5px; }
sup { position: absolute; top: -8px; right: -4px; font: 700 .6rem var(--font-mono); padding: 0 3px; border-radius: 5px; border: 1.5px solid; z-index: 1; }
@media (max-width: 420px) { .cell { min-width: 31px; min-height: 31px; padding: 0 2px; font-size: .82rem; } .wide .cell { min-width: 31px; } }
</style>
