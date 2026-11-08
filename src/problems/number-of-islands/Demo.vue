<script setup lang="ts">
import { computed, ref } from 'vue'

// Tap cells to add or remove land. Land joined side to side shares an island number.
const N = 5
const land = ref<boolean[][]>([
  [true, true, false, false, false],
  [false, true, false, true, false],
  [false, false, false, true, true],
  [true, false, false, false, false],
  [true, true, false, true, false],
])
const ids = computed(() => {
  const id = Array.from({ length: N }, () => Array<number>(N).fill(0))
  let count = 0
  const flood = (r: number, c: number): void => {
    if (r < 0 || c < 0 || r >= N || c >= N || !land.value[r][c] || id[r][c]) return
    id[r][c] = count
    flood(r + 1, c); flood(r - 1, c); flood(r, c + 1); flood(r, c - 1)
  }
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (land.value[r][c] && !id[r][c]) { count++; flood(r, c) }
  return { id, count }
})
const toggle = (r: number, c: number) => { land.value[r][c] = !land.value[r][c] }
const tone = (r: number, c: number) => (ids.value.id[r][c] === 0 ? '' : ids.value.id[r][c] % 2 ? 'tone-keep' : 'tone-hit')
</script>

<template>
  <div class="nid">
    <p class="muted small">Tap a cell to flip it between land and water. Numbers are island numbers. The two colours only tell neighbouring islands apart.</p>
    <div class="nid-grid" role="group" aria-label="map, tap to toggle land">
      <div v-for="(row, r) in land" :key="r" class="nid-row">
        <button v-for="(isLand, c) in row" :key="c" type="button" class="tile nid-cell" :class="tone(r, c)" :aria-label="`row ${r} column ${c}, ${isLand ? 'island ' + ids.id[r][c] : 'water'}`" @click="toggle(r, c)">
          {{ isLand ? ids.id[r][c] : '' }}
        </button>
      </div>
    </div>
    <p class="nid-out" role="status">Floods started: <strong>{{ ids.count }}</strong>. That is the island count.</p>
    <p class="muted small">Try making a diagonal pair. It stays two islands, because only side-to-side cells join.</p>
  </div>
</template>

<style scoped>
.nid { display: grid; gap: 10px; }
.nid-grid { display: inline-grid; gap: 4px; }
.nid-row { display: flex; gap: 4px; }
.nid-cell { min-width: 48px; min-height: 48px; cursor: pointer; }
.nid-out { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--line); background: var(--surface-2); color: var(--ink); }
</style>
