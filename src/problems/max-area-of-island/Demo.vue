<script setup lang="ts">
import { computed, ref } from 'vue'

// Tap a land cell. The flood from there claims its whole island, and the area is the number of cells claimed.
const map = [
  [1, 1, 0, 0, 1],
  [0, 1, 0, 0, 1],
  [0, 1, 1, 0, 0],
  [0, 0, 0, 1, 1],
  [1, 0, 0, 1, 0],
]
const pick = ref<[number, number]>([0, 0])

const claimed = computed(() => {
  const seen = new Set<string>()
  const go = (r: number, c: number): number => {
    if (r < 0 || c < 0 || r >= map.length || c >= map[0].length || map[r][c] !== 1 || seen.has(`${r},${c}`)) return 0
    seen.add(`${r},${c}`)
    return 1 + go(r + 1, c) + go(r - 1, c) + go(r, c + 1) + go(r, c - 1)
  }
  return { seen, area: go(pick.value[0], pick.value[1]) }
})
const tone = (r: number, c: number) => (claimed.value.seen.has(`${r},${c}`) ? (r === pick.value[0] && c === pick.value[1] ? 'tone-focus' : 'tone-hit') : map[r][c] === 1 ? 'tone-dim' : '')
</script>

<template>
  <div class="mad">
    <p class="muted small">Tap any land cell (the 1s). Its island lights up and the flood reports the area.</p>
    <div class="mad-grid" role="group" aria-label="map, tap land to flood from it">
      <div v-for="(row, r) in map" :key="r" class="mad-row">
        <button v-for="(v, c) in row" :key="c" type="button" class="tile mad-cell" :class="tone(r, c)" :disabled="v === 0" :aria-label="`row ${r} column ${c}, ${v === 1 ? 'land' : 'water'}`" @click="pick = [r, c]">{{ v }}</button>
      </div>
    </div>
    <p class="mad-out" role="status">Flood from ({{ pick[0] }},{{ pick[1] }}) claimed <strong>{{ claimed.area }}</strong> cell{{ claimed.area === 1 ? '' : 's' }}: area = {{ claimed.area }}.</p>
  </div>
</template>

<style scoped>
.mad { display: grid; gap: 10px; }
.mad-grid { display: inline-grid; gap: 4px; }
.mad-row { display: flex; gap: 4px; }
.mad-cell { min-width: 48px; min-height: 48px; cursor: pointer; }
.mad-cell:disabled { cursor: default; opacity: .6; }
.mad-out { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--line); background: var(--surface-2); color: var(--ink); }
</style>
