<script setup lang="ts">
import { computed, ref } from 'vue'
import { dp as table, mark2 } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// Pick a cell. See which neighbours it reads and which one wins.
const a = 'abc'
const b = 'yabd'
const i = ref(3)
const j = ref(4)
const dp = computed(() => {
  const d = Array.from({ length: a.length + 1 }, (_, r) => Array.from({ length: b.length + 1 }, (_, c) => (r === 0 ? c : c === 0 ? r : 0)))
  for (let r = 1; r <= a.length; r++) for (let c = 1; c <= b.length; c++) d[r][c] = a[r - 1] === b[c - 1] ? d[r - 1][c - 1] : 1 + Math.min(d[r - 1][c], d[r][c - 1], d[r - 1][c - 1])
  return d
})
const same = computed(() => a[i.value - 1] === b[j.value - 1])
const panel = computed(() => table(dp.value, {
  label: 'dp[i][j] = fewest edits: first i letters of abc (rows) to first j letters of yabd (columns)',
  rowLabels: ['', ...a], colLabels: ['', ...b],
  tones: mark2(a.length + 1, b.length + 1, same.value
    ? [[i.value - 1, j.value - 1, 'keep'], [i.value, j.value, 'focus']]
    : [[i.value - 1, j.value, 'keep'], [i.value, j.value - 1, 'keep'], [i.value - 1, j.value - 1, 'keep'], [i.value, j.value, 'focus']]),
}))
const say = computed(() => {
  const d = dp.value, r = i.value, c = j.value
  if (same.value) return `"${a[r - 1]}" equals "${b[c - 1]}": copy the diagonal, dp[${r}][${c}] = ${d[r - 1][c - 1]}.`
  return `"${a[r - 1]}" differs from "${b[c - 1]}": 1 + min(delete ${d[r - 1][c]}, insert ${d[r][c - 1]}, replace ${d[r - 1][c - 1]}) = ${d[r][c]}.`
})
</script>

<template>
  <div class="ded">
    <label class="fld">Row i (letters of abc used): <strong>{{ i }}</strong> <input v-model.number="i" type="range" min="1" max="3" aria-label="Row i" /></label>
    <label class="fld">Column j (letters of yabd used): <strong>{{ j }}</strong> <input v-model.number="j" type="range" min="1" max="4" aria-label="Column j" /></label>
    <PanelView :panel="panel" />
    <p class="verdict" role="status">{{ say }}</p>
    <p class="muted small">Up means delete a letter of word1. Left means insert a letter of word2. Diagonal means replace.</p>
  </div>
</template>

<style scoped>
.ded { display: grid; gap: 10px; }
.fld { display: grid; gap: 4px; font-weight: 600; }
.fld input { width: 100%; min-height: 44px; accent-color: var(--accent); }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--line); background: var(--surface-2); color: var(--ink); }
</style>
