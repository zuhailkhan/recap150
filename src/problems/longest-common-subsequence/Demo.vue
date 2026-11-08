<script setup lang="ts">
import { computed, ref } from 'vue'
import { dp, mark2, type Tone } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// Type two short strings, then pick a cell. See which rule fills it and which cells it reads.
const a = ref('abcd')
const b = ref('acbd')
const pi = ref(3)
const pj = ref(3)
const A = computed(() => a.value.toLowerCase().slice(0, 5))
const B = computed(() => b.value.toLowerCase().slice(0, 5))
const table = computed(() => {
  const t = Array.from({ length: A.value.length + 1 }, () => Array<number>(B.value.length + 1).fill(0))
  for (let i = 1; i <= A.value.length; i++)
    for (let j = 1; j <= B.value.length; j++) t[i][j] = A.value[i - 1] === B.value[j - 1] ? t[i - 1][j - 1] + 1 : Math.max(t[i - 1][j], t[i][j - 1])
  return t
})
const i = computed(() => Math.min(pi.value, A.value.length))
const j = computed(() => Math.min(pj.value, B.value.length))
const same = computed(() => i.value > 0 && j.value > 0 && A.value[i.value - 1] === B.value[j.value - 1])
const panel = computed(() => {
  const set: [number, number, Tone][] = [[i.value, j.value, 'focus']]
  if (i.value > 0 && j.value > 0) {
    if (same.value) set.push([i.value - 1, j.value - 1, 'keep'])
    else set.push([i.value - 1, j.value, 'keep'], [i.value, j.value - 1, 'keep'])
  }
  return dp(table.value, { label: 'dp[i][j] = LCS of the first i letters of text1 and the first j of text2', rowLabels: ['', ...A.value], colLabels: ['', ...B.value], tones: mark2(table.value.length, table.value[0].length, set) })
})
const text = computed(() => {
  if (i.value === 0 || j.value === 0) return 'An empty prefix: nothing in common, so 0.'
  const t = table.value
  if (same.value) return `"${A.value[i.value - 1]}" = "${B.value[j.value - 1]}". Match: diagonal ${t[i.value - 1][j.value - 1]} + 1 = ${t[i.value][j.value]}.`
  return `"${A.value[i.value - 1]}" differs from "${B.value[j.value - 1]}". Max of above ${t[i.value - 1][j.value]} and left ${t[i.value][j.value - 1]} = ${t[i.value][j.value]}.`
})
</script>

<template>
  <div class="d">
    <label class="ctl">text1<input v-model="a" maxlength="5" autocomplete="off" /></label>
    <label class="ctl">text2<input v-model="b" maxlength="5" autocomplete="off" /></label>
    <label class="ctl">Row i: {{ i }}<input v-model.number="pi" type="range" min="0" :max="A.length" /></label>
    <label class="ctl">Column j: {{ j }}<input v-model.number="pj" type="range" min="0" :max="B.length" /></label>
    <PanelView :panel="panel" />
    <p class="verdict" role="status">{{ text }}</p>
    <p class="muted small">Amber is the cell you picked. Blue cells are the ones it reads: one diagonal on a match, two on a mismatch.</p>
  </div>
</template>

<style scoped>
.d { display: grid; gap: 10px; }
.ctl { display: grid; gap: 4px; font-weight: 600; }
.ctl input { width: 100%; min-height: 44px; accent-color: var(--accent); font: inherit; padding: 0 10px; }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--focus-bd); background: var(--focus-bg); color: var(--focus-fg); }
</style>
