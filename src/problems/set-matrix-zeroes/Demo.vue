<script setup lang="ts">
import { computed, ref } from 'vue'
import { grid, type Tone } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// Tap an inside cell to turn it into a 0. The markers appear in row 0 and column 0, then the cells are wiped.
const ROWS = 3
const COLS = 4
const zeros = ref(new Set<string>(['1,2']))
const flip = (r: number, c: number) => {
  const next = new Set(zeros.value)
  if (!next.delete(`${r},${c}`)) next.add(`${r},${c}`)
  zeros.value = next
}
const start = computed(() => Array.from({ length: ROWS }, (_, r) => Array.from({ length: COLS }, (_, c) => (zeros.value.has(`${r},${c}`) ? 0 : 1))))
// Markers: for every zero, write 0 into the first cell of its row and the first cell of its column.
const marked = computed(() => {
  const m = start.value.map((row) => [...row])
  start.value.forEach((row, r) => row.forEach((v, c) => { if (v === 0 && r > 0 && c > 0) { m[r][0] = 0; m[0][c] = 0 } }))
  return m
})
const result = computed(() => {
  const rowHas = start.value.map((row) => row.includes(0))
  const colHas = start.value[0].map((_, c) => start.value.some((row) => row[c] === 0))
  return start.value.map((row, r) => row.map((_, c) => (rowHas[r] || colHas[c] ? 0 : 1)))
})
const markTones = computed(() => marked.value.map((row, r) => row.map((v, c): Tone | null => (v === 0 && (r === 0 || c === 0) ? 'keep' : null))))
const finalTones = computed(() => result.value.map((row, r) => row.map((v, c): Tone | null => (v === 0 && start.value[r][c] !== 0 ? 'hit' : null))))
const count = computed(() => zeros.value.size)
</script>

<template>
  <div class="zd">
    <div class="pick" role="group" aria-label="Tap cells to place zeros">
      <div v-for="r in ROWS" :key="r" class="line">
        <button v-for="c in COLS" :key="c" class="cellbtn" :class="{ off: zeros.has(`${r - 1},${c - 1}`) }" :aria-pressed="zeros.has(`${r - 1},${c - 1}`)" :aria-label="`Row ${r - 1}, column ${c - 1}`" @click="flip(r - 1, c - 1)">{{ zeros.has(`${r - 1},${c - 1}`) ? 0 : 1 }}</button>
      </div>
    </div>
    <PanelView :panel="grid(marked, { label: 'step 1: markers in row 0 and column 0', tones: markTones })" />
    <PanelView :panel="grid(result, { label: 'step 2: wipe (new zeros highlighted)', tones: finalTones })" />
    <p class="verdict" role="status">{{ count === 0 ? 'No zeros, so nothing to mark. Tap a cell above to add one.' : 'Blue = a marker written into row 0 or column 0 (a real zero there would also look blue, which is why two flags are kept). Green = cells wiped in step 2.' }}</p>
  </div>
</template>

<style scoped>
.zd { display: grid; gap: 10px; }
.pick { display: grid; gap: 3px; }
.line { display: flex; gap: 3px; }
.cellbtn { width: 44px; height: 44px; border-radius: 10px; border: 2px solid var(--line); background: var(--surface-2); color: inherit; font: 700 1rem var(--font-mono); cursor: pointer; }
.cellbtn.off { border-color: var(--miss-bd); background: var(--miss-bg); color: var(--miss-fg); }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--keep-bd); background: var(--keep-bg); color: var(--keep-fg); }
</style>
