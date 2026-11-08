<script setup lang="ts">
import { computed, ref } from 'vue'
import { arr, dp as dpPanel, mark } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// Edit the fees. Pick a cell to see the two ways into it and which one is cheaper.
const text = ref('10, 15, 20, 5')
const pick = ref(4)
const cost = computed(() => text.value.split(/[ ,]+/).filter((x) => x !== '').map(Number).filter((x) => Number.isFinite(x) && x >= 0).slice(0, 12))
const n = computed(() => cost.value.length)
const table = computed(() => {
  const d = new Array<number>(n.value + 1).fill(0)
  for (let i = 2; i <= n.value; i++) d[i] = Math.min(d[i - 1] + cost.value[i - 1], d[i - 2] + cost.value[i - 2])
  return d
})
const at = computed(() => Math.min(Math.max(pick.value, 2), Math.max(n.value, 2)))
const ok = computed(() => n.value >= 2)
const panels = computed(() => {
  const i = at.value
  const set: Record<number, 'keep' | 'focus'> = ok.value ? { [i - 1]: 'keep', [i - 2]: 'keep', [i]: 'focus' } : {}
  const feeSet: Record<number, 'keep'> = ok.value ? { [i - 1]: 'keep', [i - 2]: 'keep' } : {}
  return [
    arr(cost.value, { label: 'cost[i] = fee to leave step i', tones: mark(n.value, feeSet) }),
    dpPanel([table.value], { label: 'dp[i] = cheapest way to stand on step i', colLabels: table.value.map((_, k) => k), tones: [mark(table.value.length, set)] }),
  ]
})
const sentence = computed(() => {
  if (!ok.value) return 'Give at least two fees, for example 10, 15, 20.'
  const i = at.value
  const a = table.value[i - 1] + cost.value[i - 1]
  const b = table.value[i - 2] + cost.value[i - 2]
  return `dp[${i}] = min(${table.value[i - 1]} + ${cost.value[i - 1]}, ${table.value[i - 2]} + ${cost.value[i - 2]}) = min(${a}, ${b}) = ${Math.min(a, b)}`
})
</script>

<template>
  <div class="mc">
    <label class="f">Fees (up to 12, separated by commas) <input v-model="text" type="text" autocomplete="off" /></label>
    <label class="f">Explain cell: {{ at }} <input v-model.number="pick" type="range" min="2" :max="Math.max(n, 3)" /></label>
    <PanelView v-for="(p, k) in panels" :key="k" :panel="p" />
    <p class="v" role="status">{{ sentence }}</p>
  </div>
</template>

<style scoped>
.mc { display: grid; gap: 10px; }
.f { display: grid; gap: 4px; font-weight: 600; }
.f input[type='text'] { min-height: 44px; padding: 0 10px; font: inherit; }
.f input[type='range'] { min-height: 44px; }
.v { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--focus-bd); background: var(--focus-bg); color: var(--focus-fg); }
</style>
