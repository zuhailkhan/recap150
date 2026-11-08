<script setup lang="ts">
import { computed, ref } from 'vue'
import { arr } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// Type a number. Follow "sum of squared digits" until it hits 1 or a number we have already seen.
const start = ref(19)
const next = (n: number) => String(n).split('').reduce((s, d) => s + Number(d) ** 2, 0)
const run = computed(() => {
  let n = Math.max(1, Math.min(99999, Math.floor(Number(start.value)) || 1))
  const seen: number[] = []
  while (n !== 1 && !seen.includes(n)) { seen.push(n); n = next(n) }
  return { seen, end: n, happy: n === 1 }
})
const panel = computed(() => {
  const items = [...run.value.seen, run.value.end]
  return arr(items, { label: 'the chain', tones: items.map((_, i) => (i < items.length - 1 ? 'keep' : run.value.happy ? 'hit' : 'miss')) })
})
</script>

<template>
  <div class="hpy">
    <label class="lab">Start number (1 to 99999)
      <input v-model.number="start" class="num" type="number" min="1" max="99999" inputmode="numeric" />
    </label>
    <div class="row" role="group" aria-label="Examples">
      <button v-for="k in [19, 2, 7, 4]" :key="k" class="btn" @click="start = k">{{ k }}</button>
    </div>
    <PanelView :panel="panel" />
    <p class="verdict" :class="run.happy ? 'ok' : 'bad'" role="status">
      {{ run.happy ? `Reaches 1 after ${run.seen.length} steps. Happy.` : `Meets ${run.end} a second time. It loops forever, so it is not happy.` }}
    </p>
  </div>
</template>

<style scoped>
.hpy { display: grid; gap: 10px; }
.lab { display: grid; gap: 6px; font-weight: 600; }
.num { min-height: 44px; padding: 0 12px; border-radius: 10px; border: 2px solid var(--line); background: var(--surface-2); color: inherit; font: inherit; }
.row { display: flex; flex-wrap: wrap; gap: 8px; }
.btn { min-height: 44px; min-width: 44px; padding: 0 14px; border-radius: 10px; border: 2px solid var(--line); background: var(--surface-2); color: inherit; font: inherit; cursor: pointer; }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid; }
.verdict.ok { border-color: var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); }
.verdict.bad { border-color: var(--miss-bd); background: var(--miss-bg); color: var(--miss-fg); }
</style>
