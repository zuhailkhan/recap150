<script setup lang="ts">
import { computed, ref } from 'vue'

// Tap a cell to cycle: room, gate, wall. Every room shows its distance to the nearest gate.
const R = 4
const C = 5
const cells = ref<number[][]>([ // 0 room, 1 gate, 2 wall
  [1, 0, 0, 0, 0],
  [0, 0, 2, 0, 0],
  [0, 2, 0, 0, 0],
  [0, 0, 0, 0, 1],
])

const dist = computed(() => {
  const d = cells.value.map((row) => row.map(() => Infinity))
  let wave: number[][] = []
  cells.value.forEach((row, r) => row.forEach((v, c) => { if (v === 1) { d[r][c] = 0; wave.push([r, c]) } }))
  for (let k = 1; wave.length; k++) {
    const next: number[][] = []
    for (const [r, c] of wave) for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nr = r + dr, nc = c + dc
      if (nr >= 0 && nc >= 0 && nr < R && nc < C && cells.value[nr][nc] === 0 && d[nr][nc] === Infinity) { d[nr][nc] = k; next.push([nr, nc]) }
    }
    wave = next
  }
  return d
})
const label = (r: number, c: number) => (cells.value[r][c] === 2 ? '#' : cells.value[r][c] === 1 ? 'G' : dist.value[r][c] === Infinity ? '∞' : String(dist.value[r][c]))
const tone = (r: number, c: number) => (cells.value[r][c] === 2 ? 'tone-dim' : cells.value[r][c] === 1 ? 'tone-keep' : dist.value[r][c] === Infinity ? 'tone-miss' : 'tone-hit')
const cycle = (r: number, c: number) => { cells.value[r][c] = (cells.value[r][c] + 1) % 3 }
</script>

<template>
  <div class="wgd">
    <p class="muted small">Tap a cell to cycle room, gate (G), wall (#). Numbers are steps to the nearest gate. ∞ means no gate can reach it.</p>
    <div class="wgd-grid" role="group" aria-label="rooms, tap to cycle room, gate, wall">
      <div v-for="(row, r) in cells" :key="r" class="wgd-row">
        <button v-for="(_, c) in row" :key="c" type="button" class="tile wgd-cell" :class="tone(r, c)" :aria-label="`row ${r} column ${c}: ${label(r, c)}`" @click="cycle(r, c)">{{ label(r, c) }}</button>
      </div>
    </div>
    <p class="muted small">Add a gate next to a far room. Its number drops, because that room now takes the nearer gate.</p>
  </div>
</template>

<style scoped>
.wgd { display: grid; gap: 10px; }
.wgd-grid { display: inline-grid; gap: 4px; }
.wgd-row { display: flex; gap: 4px; }
.wgd-cell { min-width: 48px; min-height: 48px; cursor: pointer; }
</style>
