<script setup lang="ts">
import { computed, ref } from 'vue'

// 6 by 6 board. Choose "Add point" or "Set query", then tap cells. Squares that use the query light up.
const N = 6
type Mode = 'add' | 'query'
const mode = ref<Mode>('add')
const copies = ref(new Map<string, number>([['1,3', 1], ['4,0', 1], ['1,0', 1]]))
const query = ref<[number, number]>([4, 3])
const key = (x: number, y: number) => `${x},${y}`
const tap = (x: number, y: number) => {
  if (mode.value === 'query') { query.value = [x, y]; return }
  const next = new Map(copies.value)
  next.set(key(x, y), (next.get(key(x, y)) ?? 0) + 1)
  copies.value = next
}
const clear = () => { copies.value = new Map() }
const found = computed(() => {
  const [qx, qy] = query.value
  const lit = new Set<string>()
  let total = 0
  for (const [k, n] of copies.value) {
    const [px, py] = k.split(',').map(Number)
    if (Math.abs(px - qx) !== Math.abs(py - qy) || px === qx) continue
    const a = copies.value.get(key(qx, py)) ?? 0
    const b = copies.value.get(key(px, qy)) ?? 0
    if (a * b > 0) { total += n * a * b; lit.add(k); lit.add(key(qx, py)); lit.add(key(px, qy)) }
  }
  return { total, lit }
})
const cls = (x: number, y: number) => {
  const q = query.value
  if (q[0] === x && q[1] === y) return 'focus'
  if (found.value.lit.has(key(x, y))) return 'hit'
  return copies.value.has(key(x, y)) ? 'keep' : ''
}
const label = (x: number, y: number) => copies.value.get(key(x, y)) ?? (query.value[0] === x && query.value[1] === y ? '?' : '·')
</script>

<template>
  <div class="ds">
    <div class="row" role="group" aria-label="What a tap does">
      <button class="btn" :aria-pressed="mode === 'add'" @click="mode = 'add'">Add point</button>
      <button class="btn" :aria-pressed="mode === 'query'" @click="mode = 'query'">Set query</button>
      <button class="btn" @click="clear">Clear points</button>
    </div>
    <div class="board" role="group" aria-label="Board, x across, y up">
      <div v-for="r in N" :key="r" class="line">
        <button v-for="x in N" :key="x" class="cellbtn" :class="cls(x - 1, N - r)" :aria-label="`x ${x - 1}, y ${N - r}`" @click="tap(x - 1, N - r)">{{ label(x - 1, N - r) }}</button>
      </div>
    </div>
    <p class="verdict" role="status">Query ({{ query[0] }}, {{ query[1] }}) completes {{ found.total }} square{{ found.total === 1 ? '' : 's' }}. Green = a square's corners. Numbers are copies of a point.</p>
  </div>
</template>

<style scoped>
.ds { display: grid; gap: 10px; }
.row { display: flex; flex-wrap: wrap; gap: 8px; }
.btn { min-height: 44px; padding: 0 14px; border-radius: 10px; border: 2px solid var(--line); background: var(--surface-2); color: inherit; font: inherit; cursor: pointer; }
.btn[aria-pressed='true'] { border-color: var(--focus-bd); background: var(--focus-bg); color: var(--focus-fg); }
.board { display: grid; gap: 3px; }
.line { display: flex; gap: 3px; }
.cellbtn { width: 44px; height: 44px; border-radius: 10px; border: 2px solid var(--line); background: var(--surface-2); color: inherit; font: 700 1rem var(--font-mono); cursor: pointer; }
.cellbtn.keep { border-color: var(--keep-bd); background: var(--keep-bg); color: var(--keep-fg); }
.cellbtn.focus { border-color: var(--focus-bd); background: var(--focus-bg); color: var(--focus-fg); }
.cellbtn.hit { border-color: var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--keep-bd); background: var(--keep-bg); color: var(--keep-fg); }
</style>
