<script setup lang="ts">
import { computed, ref } from 'vue'
import { dp } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// One rule decides it all: may a buy read yesterday's "sold" state, or only "rest"?
const lists = [[1, 2, 3, 0, 2], [1, 4, 2, 7], [1, 3, 2, 5, 4]]
const pick = ref(0)
const cooldown = ref(true)
const prices = computed(() => lists[pick.value])
function best(p: number[], cool: boolean): number {
  let hold = -p[0]
  let sold = 0
  let rest = 0
  for (let i = 1; i < p.length; i++) {
    const nh = Math.max(hold, (cool ? rest : Math.max(rest, sold)) - p[i])
    const ns = hold + p[i]
    const nr = Math.max(rest, sold)
    hold = nh
    sold = ns
    rest = nr
  }
  return Math.max(sold, rest)
}
const withRule = computed(() => best(prices.value, true))
const without = computed(() => best(prices.value, false))
const shown = computed(() => (cooldown.value ? withRule.value : without.value))
</script>

<template>
  <div class="d">
    <div class="btns" role="group" aria-label="Choose prices">
      <button v-for="(l, k) in lists" :key="k" type="button" class="pick" :class="{ on: pick === k }" @click="pick = k">[{{ l.join(', ') }}]</button>
    </div>
    <PanelView :panel="dp([prices], { label: 'price on each day', colLabels: prices.map((_, i) => `d${i}`) })" />
    <label class="opt"><input v-model="cooldown" type="checkbox" /> Cooldown after a sale</label>
    <p class="rule"><code>hold = max(hold, {{ cooldown ? 'rest' : 'max(rest, sold)' }} - price)</code></p>
    <p class="verdict" role="status">Best profit: {{ shown }}<template v-if="withRule !== without"> (with the rule {{ withRule }}, without {{ without }})</template><template v-else> (same either way here)</template></p>
    <p class="muted small">Only the buy line changes. With the cooldown, a buy may only follow a rest day.</p>
  </div>
</template>

<style scoped>
.d { display: grid; gap: 10px; }
.btns { display: flex; flex-wrap: wrap; gap: 8px; }
.pick { min-height: 44px; padding: 0 12px; border-radius: 10px; border: 2px solid var(--keep-bd); background: var(--keep-bg); color: var(--keep-fg); font: 600 .9rem var(--font-mono); cursor: pointer; }
.pick.on { background: var(--focus-bg); border-color: var(--focus-bd); color: var(--focus-fg); }
.opt { display: flex; align-items: center; gap: 10px; min-height: 44px; font-weight: 600; }
.opt input { width: 22px; height: 22px; accent-color: var(--accent); }
.rule { margin: 0; }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); }
</style>
