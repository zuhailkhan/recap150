<script setup lang="ts">
import { computed, ref } from 'vue'
import { dp as table, mark2 } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// Pick a text length i. Watch the star in a* choose between zero copies and eating one letter.
const text = 'aab'
const pattern = 'a*b'
const i = ref(2)
const dp = computed(() => {
  const d = Array.from({ length: text.length + 1 }, () => new Array<boolean>(pattern.length + 1).fill(false))
  d[0][0] = true
  for (let j = 2; j <= pattern.length; j++) if (pattern[j - 1] === '*') d[0][j] = d[0][j - 2]
  for (let r = 1; r <= text.length; r++) for (let c = 1; c <= pattern.length; c++) {
    const fit = pattern[c - 1] === '.' || pattern[c - 1] === text[r - 1]
    d[r][c] = pattern[c - 1] === '*'
      ? d[r][c - 2] || ((pattern[c - 2] === '.' || pattern[c - 2] === text[r - 1]) && d[r - 1][c])
      : fit && d[r - 1][c - 1]
  }
  return d
})
const col = 2
const eats = computed(() => pattern[col - 2] === text[i.value - 1])
const panel = computed(() => table(dp.value.map((row) => row.map((v) => (v ? 'T' : 'F'))), {
  label: 'dp[i][j] = T when the first i letters of aab (rows) match the first j symbols of a*b (columns)',
  rowLabels: ['', ...text], colLabels: ['', ...pattern],
  tones: mark2(text.length + 1, pattern.length + 1, [[i.value, col - 2, 'keep'], ...(eats.value ? [[i.value - 1, col, 'keep'] as [number, number, 'keep']] : []), [i.value, col, 'focus']]),
}))
const say = computed(() => {
  const d = dp.value, r = i.value
  const zero = d[r][col - 2] ? 'T' : 'F'
  const eat = eats.value ? (d[r - 1][col] ? 'T' : 'F') : 'no'
  return `Cell [${r}][${col}] is the star in a*. Zero copies: dp[${r}][${col - 2}] = ${zero}. Eat "${text[r - 1]}": ${eats.value ? `dp[${r - 1}][${col}] = ${eat}` : 'letter does not fit'}. Result ${d[r][col] ? 'T' : 'F'}.`
})
</script>

<template>
  <div class="rxd">
    <label class="fld">Letters of aab used (row i): <strong>{{ i }}</strong> <input v-model.number="i" type="range" min="1" max="3" aria-label="Row i" /></label>
    <PanelView :panel="panel" />
    <p class="verdict" role="status">{{ say }}</p>
    <p class="muted small">The focus cell is the star column. The lit cells are its two choices: zero copies (two columns left) and eat one letter (the cell above).</p>
  </div>
</template>

<style scoped>
.rxd { display: grid; gap: 10px; }
.fld { display: grid; gap: 4px; font-weight: 600; }
.fld input { width: 100%; min-height: 44px; accent-color: var(--accent); }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--line); background: var(--surface-2); color: var(--ink); }
</style>
