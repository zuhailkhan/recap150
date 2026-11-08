<script setup lang="ts">
import { computed, ref } from 'vue'

// Tap a cell to flip it between X and O. O's linked to the border are safe. Other O's get captured.
const N = 5
const board = ref<boolean[][]>([
  [false, true, false, false, false],
  [false, true, true, false, false],
  [false, false, false, true, false],
  [false, false, true, true, false],
  [false, false, false, false, false],
]) // true = O

const safe = computed(() => {
  const s = board.value.map((row) => row.map(() => false))
  const go = (r: number, c: number): void => {
    if (r < 0 || c < 0 || r >= N || c >= N || !board.value[r][c] || s[r][c]) return
    s[r][c] = true
    go(r + 1, c); go(r - 1, c); go(r, c + 1); go(r, c - 1)
  }
  for (let i = 0; i < N; i++) { go(0, i); go(N - 1, i); go(i, 0); go(i, N - 1) }
  return s
})
const captured = computed(() => board.value.flat().filter((v, i) => v && !safe.value[Math.floor(i / N)][i % N]).length)
const tone = (r: number, c: number) => (!board.value[r][c] ? '' : safe.value[r][c] ? 'tone-keep' : 'tone-hit')
const toggle = (r: number, c: number) => { board.value[r][c] = !board.value[r][c] }
</script>

<template>
  <div class="srd">
    <p class="muted small">Tap cells to flip X and O. <span class="tile small tone-keep">safe O</span> touches the border through other O's. <span class="tile small tone-hit">captured O</span> is walled in and gets flipped.</p>
    <div class="srd-grid" role="group" aria-label="board, tap to flip X and O">
      <div v-for="(row, r) in board" :key="r" class="srd-row">
        <button v-for="(isO, c) in row" :key="c" type="button" class="tile srd-cell" :class="tone(r, c)" :aria-label="`row ${r} column ${c}, ${isO ? (safe[r][c] ? 'O, safe' : 'O, captured') : 'X'}`" @click="toggle(r, c)">{{ isO ? 'O' : 'X' }}</button>
      </div>
    </div>
    <p class="srd-out" role="status"><strong>{{ captured }}</strong> O{{ captured === 1 ? '' : "'s" }} will flip to X.</p>
  </div>
</template>

<style scoped>
.srd { display: grid; gap: 10px; }
.srd-grid { display: inline-grid; gap: 4px; }
.srd-row { display: flex; gap: 4px; }
.srd-cell { min-width: 48px; min-height: 48px; cursor: pointer; }
.srd-out { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--line); background: var(--surface-2); color: var(--ink); }
</style>
