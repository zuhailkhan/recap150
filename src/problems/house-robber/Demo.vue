<script setup lang="ts">
import { computed, ref } from 'vue'
import { arr, dp as dpPanel, mark } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// Edit the houses. Pick a cell to see "skip" against "rob" for that house.
const text = ref('2, 7, 9, 3, 1')
const pick = ref(3)
const nums = computed(() => text.value.split(/[ ,]+/).filter((x) => x !== '').map(Number).filter((x) => Number.isFinite(x) && x >= 0).slice(0, 12))
const n = computed(() => nums.value.length)
const table = computed(() => {
  const d = new Array<number>(n.value + 1).fill(0)
  if (n.value > 0) d[1] = nums.value[0]
  for (let i = 2; i <= n.value; i++) d[i] = Math.max(d[i - 1], d[i - 2] + nums.value[i - 1])
  return d
})
const ok = computed(() => n.value >= 2)
const at = computed(() => Math.min(Math.max(pick.value, 2), Math.max(n.value, 2)))
const panels = computed(() => {
  const i = at.value
  const set: Record<number, 'keep' | 'focus'> = ok.value ? { [i - 1]: 'keep', [i - 2]: 'keep', [i]: 'focus' } : {}
  return [
    arr(nums.value, { label: 'nums (house loot)', tones: mark(n.value, ok.value ? { [i - 1]: 'focus' } : {}) }),
    dpPanel([table.value], { label: 'dp[i] = most loot from the first i houses', colLabels: table.value.map((_, k) => k), tones: [mark(table.value.length, set)] }),
  ]
})
const sentence = computed(() => {
  if (!ok.value) return 'Give at least two houses, for example 2, 7, 9.'
  const i = at.value
  const skip = table.value[i - 1]
  const take = table.value[i - 2] + nums.value[i - 1]
  return `dp[${i}] = max(dp[${i - 1}], dp[${i - 2}] + nums[${i - 1}]) = max(${skip}, ${table.value[i - 2]} + ${nums.value[i - 1]}) = ${Math.max(skip, take)}. ${take > skip ? 'Rob it.' : 'Skip it.'}`
})
</script>

<template>
  <div class="hr">
    <label class="f">Houses (up to 12, separated by commas) <input v-model="text" type="text" autocomplete="off" /></label>
    <label class="f">Explain cell: {{ at }} <input v-model.number="pick" type="range" min="2" :max="Math.max(n, 3)" /></label>
    <PanelView v-for="(p, k) in panels" :key="k" :panel="p" />
    <p class="v" role="status">{{ sentence }}</p>
  </div>
</template>

<style scoped>
.hr { display: grid; gap: 10px; }
.f { display: grid; gap: 4px; font-weight: 600; }
.f input[type='text'] { min-height: 44px; padding: 0 10px; font: inherit; }
.f input[type='range'] { min-height: 44px; }
.v { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--focus-bd); background: var(--focus-bg); color: var(--focus-fg); }
</style>
