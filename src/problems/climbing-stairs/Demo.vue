<script setup lang="ts">
import { computed, ref } from 'vue'
import { dp as dpPanel, mark } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// Every cell is the sum of the two cells before it. Pick a cell to see where its value comes from.
const n = ref(7)
const pick = ref(5)
const table = computed(() => {
  const d = [1, 1]
  for (let i = 2; i <= n.value; i++) d.push(d[i - 1] + d[i - 2])
  return d
})
const at = computed(() => Math.min(Math.max(pick.value, 2), n.value))
const panel = computed(() => {
  const i = at.value
  const set: Record<number, 'keep' | 'focus'> = n.value >= 2 ? { [i - 1]: 'keep', [i - 2]: 'keep', [i]: 'focus' } : {}
  return dpPanel([table.value], { label: 'dp[i] = ways to reach step i', colLabels: table.value.map((_, k) => k), tones: [mark(table.value.length, set)] })
})
const sentence = computed(() => {
  if (n.value < 2) return 'With 1 step there is nothing to add. Both base cells are 1.'
  const i = at.value
  return `dp[${i}] = dp[${i - 1}] + dp[${i - 2}] = ${table.value[i - 1]} + ${table.value[i - 2]} = ${table.value[i]}`
})
</script>

<template>
  <div class="cs">
    <label class="f">Steps n: {{ n }} <input v-model.number="n" type="range" min="1" max="12" /></label>
    <label class="f">Explain cell: {{ at }} <input v-model.number="pick" type="range" min="2" max="12" /></label>
    <PanelView :panel="panel" />
    <p class="v" role="status">{{ sentence }}</p>
  </div>
</template>

<style scoped>
.cs { display: grid; gap: 10px; }
.f { display: grid; gap: 4px; font-weight: 600; }
.f input[type='range'] { min-height: 44px; }
.v { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--focus-bd); background: var(--focus-bg); color: var(--focus-fg); }
</style>
