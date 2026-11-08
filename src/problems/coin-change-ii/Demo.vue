<script setup lang="ts">
import { computed, ref } from 'vue'

// Same coins, same amount. Only the loop order differs: combinations versus orders.
const coins = [1, 2, 5]
const amount = ref(4)

function orders(left: number): number[][] {
  if (left === 0) return [[]]
  return coins.filter((c) => c <= left).flatMap((c) => orders(left - c).map((rest) => [c, ...rest]))
}
const all = computed(() => orders(amount.value))
const seen = computed(() => {
  const keys = new Set<string>()
  return all.value.map((o) => {
    const key = [...o].sort((x, y) => x - y).join('+')
    const repeat = keys.has(key)
    keys.add(key)
    return { text: o.join('+'), repeat }
  })
})
const combos = computed(() => seen.value.filter((s) => !s.repeat))
</script>

<template>
  <div class="d">
    <label class="ctl">Amount: {{ amount }} (coins 1, 2, 5)<input v-model.number="amount" type="range" min="1" max="6" /></label>
    <section class="box good">
      <h4>Coins in the outer loop: {{ combos.length }}</h4>
      <p class="chips"><span v-for="s in combos" :key="s.text" class="chip hit">{{ s.text }}</span></p>
    </section>
    <section class="box bad">
      <h4>Amounts in the outer loop: {{ seen.length }}</h4>
      <p class="chips"><span v-for="s in seen" :key="s.text" class="chip" :class="s.repeat ? 'miss' : 'hit'">{{ s.text }}</span></p>
    </section>
    <p class="muted small">Red entries are the same coins as an earlier entry in a different order. Looping over amounts first counts them. Looping over coins first never builds them.</p>
  </div>
</template>

<style scoped>
.d { display: grid; gap: 10px; }
.ctl { display: grid; gap: 4px; font-weight: 600; }
.ctl input { width: 100%; min-height: 44px; accent-color: var(--accent); }
.box { padding: 8px 12px; border-radius: 10px; border: 2px solid var(--line, var(--keep-bd)); }
.box h4 { margin: 0 0 6px; }
.chips { margin: 0; display: flex; flex-wrap: wrap; gap: 6px; }
.chip { padding: 4px 8px; border-radius: 8px; border: 2px solid; font: 600 .85rem var(--font-mono); }
.chip.hit { background: var(--hit-bg); border-color: var(--hit-bd); color: var(--hit-fg); }
.chip.miss { background: var(--miss-bg); border-color: var(--miss-bd); color: var(--miss-fg); }
</style>
