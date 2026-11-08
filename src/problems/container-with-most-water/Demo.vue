<script setup lang="ts">
import { computed, ref } from 'vue'
import { arr, mark } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// Which wall is safe to move? Compare the best the next box could ever hold.
const h = [3, 9, 4, 2, 7, 6]
const l = ref(0)
const r = 5
const w = computed(() => r - l.value)
const lo = computed(() => Math.min(h[l.value], h[r]))
const area = computed(() => w.value * lo.value)
const tallIsLeft = computed(() => h[l.value] > h[r])
const moveTall = ref(false)
// Moving the taller wall keeps the shorter one as the cap, with less width.
const capIfTall = computed(() => (w.value - 1) * lo.value)
// Moving the shorter wall is the only way the cap can rise.
const panel = computed(() => {
  const shortAt = tallIsLeft.value ? r : l.value
  const tallAt = tallIsLeft.value ? l.value : r
  return arr(h, { label: `box area now: ${w.value} × ${lo.value} = ${area.value}`, tones: mark(h.length, { [shortAt]: moveTall.value ? 'keep' : 'miss', [tallAt]: moveTall.value ? 'miss' : 'keep' }), pointers: [{ name: 'l', at: l.value }, { name: 'r', at: r }] })
})
</script>

<template>
  <div class="d">
    <label class="f">Left wall at index {{ l }} <input v-model.number="l" type="range" min="0" max="3" /></label>
    <label class="opt"><input v-model="moveTall" type="checkbox" /> Move the taller wall instead</label>
    <PanelView :panel="panel" />
    <p class="v" :class="{ bad: moveTall }" role="status">
      <template v-if="moveTall">Moving the taller wall leaves the shorter one ({{ lo }}) as the cap. The width drops to {{ w - 1 }}. Best possible: {{ capIfTall }}, never above {{ area }}. A wasted step.</template>
      <template v-else>Moving the shorter wall ({{ lo }}) is the only way the cap can rise. The width drops, but a taller partner could pay for it.</template>
    </p>
  </div>
</template>

<style scoped>
.d { display: grid; gap: 10px; }
.f { display: grid; gap: 4px; font-weight: 600; }
.f input[type='range'] { min-height: 44px; }
.opt { display: flex; align-items: center; gap: 10px; min-height: 44px; font-weight: 600; }
.opt input { width: 22px; height: 22px; accent-color: var(--accent); }
.v { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); }
.v.bad { border-color: var(--miss-bd); background: var(--miss-bg); color: var(--miss-fg); }
</style>
