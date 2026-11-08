<script setup lang="ts">
import { computed, ref } from 'vue'
import { arr } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// Pick a sell day. The best buy day for it is the lowest price before it.
const prices = [7, 1, 5, 3, 6, 4]
const sell = ref(4)
const buy = computed(() => {
  let b = 0
  for (let i = 1; i < sell.value; i++) if (prices[i] < prices[b]) b = i
  return b
})
const profit = computed(() => Math.max(0, prices[sell.value] - prices[buy.value]))
const panel = computed(() =>
  arr(prices, {
    label: 'price per day',
    tones: prices.map((_, k) => (k === buy.value && k !== sell.value ? 'keep' : k === sell.value ? 'focus' : k < sell.value ? 'dim' : null)),
    pointers: sell.value === buy.value ? [{ name: 'sell', at: sell.value, tone: 'focus' }] : [{ name: 'buy', at: buy.value, tone: 'keep' }, { name: 'sell', at: sell.value, tone: 'focus' }],
    window: [buy.value, sell.value],
  }),
)
</script>

<template>
  <div class="d">
    <div class="row" role="group" aria-label="Pick the sell day">
      <button v-for="(p, i) in prices" :key="i" type="button" class="day" :aria-pressed="i === sell" :aria-label="`Sell on day ${i}, price ${p}`" @click="sell = i">Day {{ i }}</button>
    </div>
    <PanelView :panel="panel" />
    <p class="verdict" role="status">
      Selling on day {{ sell }} at {{ prices[sell] }}. The cheapest day before it costs {{ prices[buy] }}.
      <strong v-if="profit > 0">Profit {{ profit }}.</strong><strong v-else>No profit here. Selling today loses money or breaks even.</strong>
    </p>
    <p class="muted small">Tap a sell day. You never need to look at every earlier buy day, only the lowest one.</p>
  </div>
</template>

<style scoped>
.d { display: grid; gap: 10px; }
.row { display: flex; flex-wrap: wrap; gap: 8px; }
.day { min-width: 44px; min-height: 44px; padding: 0 12px; font: 600 .9rem var(--font-mono); color: var(--ink); background: var(--surface); border: 1.5px solid var(--line); border-radius: 10px; cursor: pointer; }
.day[aria-pressed='true'] { border-color: var(--focus-bd); background: var(--focus-bg); color: var(--focus-fg); }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--line); background: var(--surface-2); color: var(--ink); }
</style>
