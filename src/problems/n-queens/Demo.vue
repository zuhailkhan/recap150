<script setup lang="ts">
import { computed, ref } from 'vue'
import { buckets } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// 4 by 4 board. Place one queen per row, top to bottom. Attacked squares are shaded.
const n = 4
const queens = ref<number[]>([])
const note = ref('Row 0: tap any square.')
const cols = computed(() => queens.value.map((c) => c))
const down = computed(() => queens.value.map((c, r) => r - c))
const up = computed(() => queens.value.map((c, r) => r + c))
const attacked = (r: number, c: number) => cols.value.includes(c) || down.value.includes(r - c) || up.value.includes(r + c)
const row = computed(() => queens.value.length)
const done = computed(() => row.value === n)
const setsPanel = computed(() => buckets([{ key: 'columns', items: cols.value }, { key: 'diagonals r-c', items: down.value }, { key: 'diagonals r+c', items: up.value }], { label: 'attacked lines', keyLabel: 'taken' }))
function tap(r: number, c: number) {
  if (r !== row.value || done.value) { note.value = done.value ? 'All rows have a queen. Undo to explore further.' : `Fill the rows in order. The next one is row ${row.value}.`; return }
  if (attacked(r, c)) note.value = `(${r},${c}) is attacked: ${cols.value.includes(c) ? `column ${c} is taken` : down.value.includes(r - c) ? `r-c = ${r - c} is taken` : `r+c = ${r + c} is taken`}.`
  else { queens.value.push(c); note.value = r + 1 === n ? 'A full board: no two queens attack. Undo to look for the other one.' : `Placed at (${r},${c}). Now row ${r + 1}.` }
}
</script>

<template>
  <div class="dnq">
    <div class="board" role="group" aria-label="4 by 4 board, tap a square in the current row">
      <template v-for="r in n" :key="r">
        <button v-for="c in n" :key="c" type="button" class="sq" :class="{ q: queens[r - 1] === c - 1, hot: attacked(r - 1, c - 1) && queens[r - 1] !== c - 1, now: r - 1 === row }" :aria-label="`Row ${r - 1}, column ${c - 1}`" @click="tap(r - 1, c - 1)">{{ queens[r - 1] === c - 1 ? 'Q' : '' }}</button>
      </template>
    </div>
    <PanelView :panel="setsPanel" />
    <p class="verdict" :class="{ ok: done }" role="status">{{ note }}</p>
    <div class="keys">
      <button class="btn quiet" type="button" :disabled="!queens.length" @click="queens.pop(); note = 'Removed: its column and diagonals are free again.'">Undo</button>
      <button class="btn quiet" type="button" :disabled="!queens.length" @click="queens = []; note = 'Row 0: tap any square.'">Clear</button>
    </div>
  </div>
</template>

<style scoped>
.dnq { display: grid; gap: 10px; }
.board { display: grid; grid-template-columns: repeat(4, 52px); gap: 4px; }
.sq { min-width: 44px; min-height: 52px; font-size: 1.3rem; font-weight: 700; border-radius: 8px; border: 2px solid var(--tile-bd); background: var(--tile-bg); color: var(--tile-fg); cursor: pointer; }
.sq.now { border-color: var(--focus-bd); }
.sq.hot { background: var(--dim-bg); border-color: var(--dim-bd); }
.sq.q { background: var(--keep-bg); color: var(--keep-fg); border-color: var(--keep-bd); }
.keys { display: flex; gap: 8px; }
.keys .btn { min-height: 44px; }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--line); background: var(--surface-2); }
.verdict.ok { border-color: var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); }
</style>
