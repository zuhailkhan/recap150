<script setup lang="ts">
import { computed, ref } from 'vue'
import { dp as table, mark2 } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// Pick a cell. See the two sources of the count: skip (above) and use (diagonal, only if the letters match).
const s = 'babgbag'
const target = 'bag'
const i = ref(5)
const j = ref(2)
const dp = computed(() => {
  const d = Array.from({ length: s.length + 1 }, () => Array.from({ length: target.length + 1 }, (_, c): number => (c === 0 ? 1 : 0)))
  for (let r = 1; r <= s.length; r++) for (let c = 1; c <= target.length; c++) d[r][c] = d[r - 1][c] + (s[r - 1] === target[c - 1] ? d[r - 1][c - 1] : 0)
  return d
})
const same = computed(() => s[i.value - 1] === target[j.value - 1])
const panel = computed(() => table(dp.value, {
  label: 'dp[i][j] = ways the first i letters of babgbag (rows) spell the first j letters of bag (columns)',
  rowLabels: ['', ...s], colLabels: ['', ...target],
  tones: mark2(s.length + 1, target.length + 1, [[i.value - 1, j.value, 'keep'], ...(same.value ? [[i.value - 1, j.value - 1, 'keep'] as [number, number, 'keep']] : []), [i.value, j.value, 'focus']]),
}))
const say = computed(() => {
  const d = dp.value, r = i.value, c = j.value
  if (same.value) return `"${s[r - 1]}" equals "${target[c - 1]}": skip ${d[r - 1][c]} + use ${d[r - 1][c - 1]} = ${d[r][c]}.`
  return `"${s[r - 1]}" differs from "${target[c - 1]}": only skip, ${d[r - 1][c]}. dp[${r}][${c}] = ${d[r][c]}.`
})
</script>

<template>
  <div class="dsd">
    <label class="fld">Row i (letters of babgbag used): <strong>{{ i }}</strong> <input v-model.number="i" type="range" min="1" max="7" aria-label="Row i" /></label>
    <label class="fld">Column j (letters of bag to spell): <strong>{{ j }}</strong> <input v-model.number="j" type="range" min="1" max="3" aria-label="Column j" /></label>
    <PanelView :panel="panel" />
    <p class="verdict" role="status">{{ say }}</p>
    <p class="muted small">Skip is the cell above. Use is the diagonal cell, and only counts when the two letters match.</p>
  </div>
</template>

<style scoped>
.dsd { display: grid; gap: 10px; }
.fld { display: grid; gap: 4px; font-weight: 600; }
.fld input { width: 100%; min-height: 44px; accent-color: var(--accent); }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--line); background: var(--surface-2); color: var(--ink); }
</style>
