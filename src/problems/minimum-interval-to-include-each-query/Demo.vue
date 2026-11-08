<script setup lang="ts">
import { computed, ref } from 'vue'
import { intervals, type Tone } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// For one query: not started yet (keep), expired (miss), still covering (focus), smallest of those (hit).
const ivs = [[1, 3], [2, 3], [2, 5], [4, 6]]
const q = ref(3)
const size = ([s, e]: number[]) => e - s + 1
const alive = computed(() => ivs.filter(([s, e]) => s <= q.value && q.value <= e))
const best = computed(() => (alive.value.length ? Math.min(...alive.value.map(size)) : -1))
const panel = computed(() => {
  let taken = false
  return intervals(
    ivs.map(([start, end]) => {
      let tone: Tone = 'keep'
      if (end < q.value) tone = 'miss'
      else if (start <= q.value) {
        tone = size([start, end]) === best.value && !taken ? 'hit' : 'focus'
        if (tone === 'hit') taken = true
      }
      return { start, end, tone, label: `size ${size([start, end])}` }
    }),
    { label: 'keep = not started, miss = expired, focus = covers, hit = smallest', min: 1, max: 6, marks: [{ at: q.value, label: `query ${q.value}` }] },
  )
})
</script>

<template>
  <div class="d">
    <label class="row">Query <b>{{ q }}</b>
      <input v-model.number="q" type="range" min="1" max="6" aria-label="Query value" />
    </label>
    <PanelView :panel="panel" />
    <p class="verdict" :class="{ bad: best === -1 }" role="status">
      <template v-if="best === -1">Nothing covers {{ q }}, so the answer is -1.</template>
      <template v-else>{{ alive.length }} interval{{ alive.length === 1 ? '' : 's' }} cover {{ q }}. The smallest has size {{ best }}, so that is the answer.</template>
    </p>
    <p class="muted small">Size counts both ends: [2,3] has size 2. The heap keeps the covering ones sorted by size.</p>
  </div>
</template>

<style scoped>
.d { display: grid; gap: 10px; }
.row { display: grid; gap: 6px; font-weight: 600; }
.row input { width: 100%; min-height: 44px; accent-color: var(--accent); }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); }
.verdict.bad { border-color: var(--miss-bd); background: var(--miss-bg); color: var(--miss-fg); }
</style>
