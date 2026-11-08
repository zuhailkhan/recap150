<script setup lang="ts">
import { computed, ref } from 'vue'
import { arr, dp, mark2, type Tone } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// Pick (i, j): i letters of s1 and j of s2 are used. They must weave into the first i + j letters of s3.
const s1 = 'aab'
const s2 = 'ac'
const s3 = 'aaabc'
const pi = ref(2)
const pj = ref(1)
const T = Array.from({ length: s1.length + 1 }, () => Array<boolean>(s2.length + 1).fill(false))
for (let i = 0; i <= s1.length; i++)
  for (let j = 0; j <= s2.length; j++)
    T[i][j] = i === 0 && j === 0 ? true : (i > 0 && T[i - 1][j] && s1[i - 1] === s3[i + j - 1]) || (j > 0 && T[i][j - 1] && s2[j - 1] === s3[i + j - 1])
const panel = computed(() => {
  const set: [number, number, Tone][] = [[pi.value, pj.value, 'focus']]
  if (pi.value > 0) set.push([pi.value - 1, pj.value, 'keep'])
  if (pj.value > 0) set.push([pi.value, pj.value - 1, 'keep'])
  return dp(T.map((r) => r.map((v) => (v ? 'T' : 'F'))), { label: 'dp[i][j]: T = the prefixes weave', rowLabels: ['', ...s1], colLabels: ['', ...s2], tones: mark2(T.length, T[0].length, set) })
})
const target = computed(() => arr([...s3], { label: `s3: first ${pi.value + pj.value} letters must be built`, tones: [...s3].map((_, k) => (k < pi.value + pj.value - 1 ? 'dim' : k === pi.value + pj.value - 1 ? 'focus' : null)) }))
const text = computed(() => {
  const i = pi.value
  const j = pj.value
  if (i + j === 0) return 'Nothing used, nothing to build: true.'
  const c = s3[i + j - 1]
  const a = i > 0 ? `s1 gives "${s1[i - 1]}" and above is ${T[i - 1][j] ? 'T' : 'F'}` : 'no s1 letter'
  const b = j > 0 ? `s2 gives "${s2[j - 1]}" and left is ${T[i][j - 1] ? 'T' : 'F'}` : 'no s2 letter'
  return `Newest letter "${c}". Via s1: ${a}. Via s2: ${b}. Cell = ${T[i][j] ? 'T' : 'F'}.`
})
</script>

<template>
  <div class="d">
    <PanelView :panel="arr([...s1], { label: 's1' })" />
    <PanelView :panel="arr([...s2], { label: 's2' })" />
    <label class="ctl">Letters from s1: {{ pi }}<input v-model.number="pi" type="range" min="0" :max="s1.length" /></label>
    <label class="ctl">Letters from s2: {{ pj }}<input v-model.number="pj" type="range" min="0" :max="s2.length" /></label>
    <PanelView :panel="target" />
    <PanelView :panel="panel" />
    <p class="verdict" role="status">{{ text }}</p>
    <p class="muted small">The position in s3 is always i + j. So two sliders describe the whole situation.</p>
  </div>
</template>

<style scoped>
.d { display: grid; gap: 10px; }
.ctl { display: grid; gap: 4px; font-weight: 600; }
.ctl input { width: 100%; min-height: 44px; accent-color: var(--accent); }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--focus-bd); background: var(--focus-bg); color: var(--focus-fg); }
</style>
