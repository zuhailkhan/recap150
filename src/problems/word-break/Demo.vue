<script setup lang="ts">
import { computed, ref } from 'vue'
import { arr, dp as dpPanel, mark, type Tone } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// dp[i] is true when some cut j has dp[j] true and s[j..i) is a word.
const samples = [
  { s: 'leetcode', words: ['leet', 'code'] },
  { s: 'catsandog', words: ['cats', 'dog', 'sand', 'and', 'cat'] },
  { s: 'aaaaaaa', words: ['aaaa', 'aaa'] },
]
const which = ref(0)
const pick = ref(8)
const sample = computed(() => samples[which.value])
const at = computed(() => Math.min(pick.value, sample.value.s.length))
const table = computed(() => {
  const { s, words } = sample.value
  const dp = [true]
  for (let i = 1; i <= s.length; i++) dp[i] = Array.from({ length: i }, (_, j) => j).some((j) => dp[j] && words.includes(s.slice(j, i)))
  return dp
})
const cuts = computed(() => Array.from({ length: at.value }, (_, j) => sample.value.s.slice(j, at.value)))
const usable = computed(() => cuts.value.map((w, j) => table.value[j] && sample.value.words.includes(w)))
const cutPanel = computed(() => arr(cuts.value, { label: `last word s[j..${at.value}) for each cut j = 0..${at.value - 1}`, tones: usable.value.map((u): Tone => (u ? 'hit' : 'miss')) }))
const row = computed(() => {
  const set: Record<number, Tone> = { [at.value]: table.value[at.value] ? 'hit' : 'miss' }
  usable.value.forEach((u, j) => { if (u) set[j] = 'keep' })
  return dpPanel([table.value.map((v, k) => (k <= at.value ? (v ? 'T' : 'F') : ''))], { label: 'dp[i] = can the first i letters be split?', colLabels: table.value.map((_, k) => k), tones: [mark(table.value.length, set)] })
})
const why = computed(() => {
  const j = usable.value.indexOf(true)
  return j >= 0 ? `Cut ${j}: dp[${j}] is true and "${cuts.value[j]}" is a word, so dp[${at.value}] is true.` : `No cut works: each one has dp[j] false or a last word that is not in the list, so dp[${at.value}] is false.`
})
const choose = (k: number) => { which.value = k; pick.value = samples[k].s.length }
</script>

<template>
  <div class="d">
    <div class="row" role="group" aria-label="Sample string">
      <button v-for="(x, k) in samples" :key="k" class="pick" :class="{ on: which === k }" @click="choose(k)">{{ x.s }}</button>
    </div>
    <label class="fld">Prefix length i = {{ at }} <input v-model.number="pick" type="range" min="1" :max="sample.s.length" /></label>
    <PanelView :panel="cutPanel" />
    <PanelView :panel="row" />
    <p class="say" role="status">{{ why }}</p>
    <p class="muted small">Words: {{ sample.words.join(', ') }}. Green cuts are the ones that make dp[i] true.</p>
  </div>
</template>

<style scoped>
.d { display: grid; gap: 10px; }
.row { display: flex; gap: 8px; flex-wrap: wrap; }
.pick { min-height: 44px; padding: 0 14px; border-radius: 10px; border: 2px solid var(--line); background: var(--surface); color: var(--ink); font: 600 1rem var(--font-mono); cursor: pointer; }
.pick.on { border-color: var(--accent); background: var(--accent-soft); }
.fld { display: grid; gap: 4px; font-weight: 600; }
.fld input { min-height: 44px; accent-color: var(--accent); }
.say { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); overflow-wrap: anywhere; }
</style>
