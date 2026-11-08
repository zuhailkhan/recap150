<script setup lang="ts">
import { computed, ref } from 'vue'
import { arr, dp as dpPanel, mark, type Tone } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// dp[i] = (last digit alone ok ? dp[i-1] : 0) + (last two digits ok ? dp[i-2] : 0)
const raw = ref('2261')
const pick = ref(4)
const s = computed(() => raw.value.replace(/\D/g, '').slice(0, 10) || '1')
const at = computed(() => Math.min(Math.max(pick.value, 1), s.value.length))
const table = computed(() => {
  const dp = [1]
  for (let i = 1; i <= s.value.length; i++) {
    const pair = i >= 2 ? Number(s.value.slice(i - 2, i)) : 0
    dp[i] = (s.value[i - 1] !== '0' ? dp[i - 1] : 0) + (pair >= 10 && pair <= 26 ? dp[i - 2] : 0)
  }
  return dp
})
const one = computed(() => s.value[at.value - 1] !== '0')
const pairVal = computed(() => (at.value >= 2 ? Number(s.value.slice(at.value - 2, at.value)) : 0))
const two = computed(() => pairVal.value >= 10 && pairVal.value <= 26)
const digits = computed(() => {
  const set: Record<number, Tone> = { [at.value - 1]: 'focus' }
  if (at.value >= 2) set[at.value - 2] = two.value ? 'focus' : 'miss'
  return arr([...s.value], { label: 's', tones: mark(s.value.length, set) })
})
const cells = computed(() => {
  const set: Record<number, Tone> = { [at.value]: 'focus' }
  if (one.value) set[at.value - 1] = 'keep'
  if (two.value) set[at.value - 2] = 'keep'
  const filled = table.value.map((v, k) => (k <= at.value ? v : ''))
  return dpPanel([filled], { label: 'dp[i] = ways to read the first i digits', colLabels: table.value.map((_, k) => k), tones: [mark(table.value.length, set)] })
})
</script>

<template>
  <div class="d">
    <label class="fld">Digits <input v-model="raw" inputmode="numeric" maxlength="10" /></label>
    <label class="fld">Fill up to cell i = {{ at }} <input v-model.number="pick" type="range" min="1" :max="s.length" /></label>
    <PanelView :panel="digits" />
    <PanelView :panel="cells" />
    <p class="say" role="status">
      dp[{{ at }}] = {{ one ? `dp[${at - 1}] = ${table[at - 1]}` : 'no single (digit is 0)' }} + {{ two ? `dp[${at - 2}] = ${table[at - 2]}` : `no pair (${at < 2 ? 'too short' : pairVal + ' is outside 10..26'})` }} = <strong>{{ table[at] }}</strong>
    </p>
    <p class="muted small">Edit the digits or drag the slider. Blue cells are the ones the new cell reads.</p>
  </div>
</template>

<style scoped>
.d { display: grid; gap: 10px; }
.fld { display: grid; gap: 4px; font-weight: 600; }
.fld input[type='text'], .fld input:not([type]) { min-height: 44px; padding: 0 12px; font: 600 1.1rem var(--font-mono); border-radius: 10px; border: 2px solid var(--line); background: var(--surface); color: var(--ink); }
.fld input[type='range'] { min-height: 44px; accent-color: var(--accent); }
.say { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); font-family: var(--font-mono); overflow-wrap: anywhere; }
</style>
