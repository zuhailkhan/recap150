<script setup lang="ts">
import { computed, ref } from 'vue'
import { dp as dpPanel, mark, type Tone } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// One number v, one sweep. Which sums are reachable if v may be used at most once?
const back = ref(true)
const v = ref(2)
const top = 8
const table = computed(() => {
  const dp = Array<boolean>(top + 1).fill(false)
  dp[0] = true
  const sums = Array.from({ length: top - v.value + 1 }, (_, k) => v.value + k)
  for (const s of back.value ? sums.reverse() : sums) if (dp[s - v.value]) dp[s] = true
  return dp
})
const panel = computed(() => {
  const set: Record<number, Tone> = {}
  table.value.forEach((on, s) => { if (on) set[s] = s === 0 ? 'keep' : s === v.value ? 'hit' : 'miss' })
  return dpPanel([table.value.map((on) => (on ? 'T' : 'F'))], { label: 'dp[s] after one sweep with the number ' + v.value, colLabels: table.value.map((_, s) => s), tones: [mark(top + 1, set)] })
})
const bad = computed(() => table.value.some((on, s) => on && s > v.value))
</script>

<template>
  <div class="d">
    <label class="opt"><input v-model="back" type="checkbox" /> Sweep s backwards (from {{ top }} down to {{ v }})</label>
    <label class="fld">The one number v = {{ v }} <input v-model.number="v" type="range" min="1" max="4" /></label>
    <PanelView :panel="panel" />
    <p class="say" :class="{ bad }" role="status">
      <template v-if="bad">Wrong. Going upward, dp[{{ 2 * v }}] reads dp[{{ v }}], which this same number just set. The number {{ v }} is used twice, or more.</template>
      <template v-else>Right. Only 0 (take nothing) and {{ v }} (take it once) are reachable. Each read sees the table from before this number.</template>
    </p>
    <p class="muted small">Untick the box to see the trap. Red cells could only be reached by reusing the number.</p>
  </div>
</template>

<style scoped>
.d { display: grid; gap: 10px; }
.opt { display: flex; align-items: center; gap: 10px; min-height: 44px; font-weight: 600; }
.opt input { width: 22px; height: 22px; accent-color: var(--accent); }
.fld { display: grid; gap: 4px; font-weight: 600; }
.fld input { min-height: 44px; accent-color: var(--accent); }
.say { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); }
.say.bad { border-color: var(--miss-bd); background: var(--miss-bg); color: var(--miss-fg); }
</style>
