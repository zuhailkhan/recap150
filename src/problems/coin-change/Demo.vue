<script setup lang="ts">
import { computed, ref } from 'vue'
import { dp as dpPanel, mark, type Tone } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// dp[a] = 1 + the smallest dp[a - coin] over the coins that fit.
const sets = [[1, 2, 5], [1, 3, 4], [2, 4]]
const which = ref(1)
const a = ref(6)
const coins = computed(() => sets[which.value])
const table = computed(() => {
  const dp = [0]
  for (let x = 1; x <= 9; x++) dp[x] = Math.min(Infinity, ...coins.value.filter((c) => c <= x).map((c) => dp[x - c] + 1))
  return dp
})
const show = (v: number) => (v === Infinity ? 'inf' : v)
const reads = computed(() => coins.value.filter((c) => c <= a.value))
const panel = computed(() => {
  const set: Record<number, Tone> = { [a.value]: table.value[a.value] === Infinity ? 'miss' : 'focus' }
  for (const c of reads.value) set[a.value - c] = 'keep'
  const cells = table.value.map((v, k) => (k <= a.value ? show(v) : ''))
  return dpPanel([cells], { label: 'dp[a] = fewest coins to make a', colLabels: table.value.map((_, k) => k), tones: [mark(table.value.length, set)] })
})
const parts = computed(() => reads.value.map((c) => `dp[${a.value - c}]+1 = ${show(table.value[a.value - c] + 1)}`).join(', '))
</script>

<template>
  <div class="d">
    <div class="row" role="group" aria-label="Coin set">
      <button v-for="(s, k) in sets" :key="k" class="pick" :class="{ on: which === k }" @click="which = k">{{ s.join(', ') }}</button>
    </div>
    <label class="fld">Amount a = {{ a }} <input v-model.number="a" type="range" min="1" max="9" /></label>
    <PanelView :panel="panel" />
    <p class="say" role="status">dp[{{ a }}] = min({{ parts || 'no coin fits' }}) = <strong>{{ show(table[a]) }}</strong></p>
    <p class="muted small">Pick coins 1, 3, 4 and amount 6. The best last coin is 3, not the biggest coin 4.</p>
  </div>
</template>

<style scoped>
.d { display: grid; gap: 10px; }
.row { display: flex; gap: 8px; flex-wrap: wrap; }
.pick { min-height: 44px; padding: 0 14px; border-radius: 10px; border: 2px solid var(--line); background: var(--surface); color: var(--ink); font: 600 1rem var(--font-mono); cursor: pointer; }
.pick.on { border-color: var(--accent); background: var(--accent-soft); }
.fld { display: grid; gap: 4px; font-weight: 600; }
.fld input { min-height: 44px; accent-color: var(--accent); }
.say { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); font-family: var(--font-mono); overflow-wrap: anywhere; }
</style>
