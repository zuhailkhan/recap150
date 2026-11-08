<script setup lang="ts">
import { computed, ref } from 'vue'
import { arr } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// One loop at one depth. Move start and left to see what it chooses, skips, and where it stops.
const sorted = [1, 2, 2, 3, 5]
const start = ref(1)
const left = ref(4)
// 'stop' = the loop has already broken out because a number was too big
const kind = (i: number): 'before' | 'choose' | 'skip' | 'stop' => {
  const firstBig = sorted.findIndex((x, j) => j >= start.value && !(j > start.value && x === sorted[j - 1]) && x > left.value)
  if (i < start.value) return 'before'
  if (firstBig !== -1 && i >= firstBig) return 'stop'
  return i > start.value && sorted[i] === sorted[i - 1] ? 'skip' : 'choose'
}
const panel = computed(() => arr(sorted, {
  label: 'sorted: green = choose, red = skip a repeat or stop (too big)',
  tones: sorted.map((_, i) => ({ before: 'dim', choose: 'hit', skip: 'miss', stop: 'miss' } as const)[kind(i)]),
  pointers: [{ name: 'start', at: start.value, tone: 'focus' }],
}))
const chosen = computed(() => sorted.filter((_, i) => kind(i) === 'choose'))
const why = computed(() => {
  const parts: string[] = []
  if (sorted.some((_, i) => kind(i) === 'skip')) parts.push('A skipped number repeats its left neighbour at this depth.')
  if (sorted.some((_, i) => kind(i) === 'stop')) parts.push(`The loop breaks at the first number above ${left.value}, since the rest are bigger too.`)
  return parts.join(' ') || 'No skips and no break here.'
})
</script>

<template>
  <div class="dcs2">
    <label class="fld">Loop starts at index: <strong>{{ start }}</strong>
      <input v-model.number="start" type="range" min="0" :max="sorted.length - 1" aria-label="Start index of the loop" />
    </label>
    <label class="fld">Still needed (left): <strong>{{ left }}</strong>
      <input v-model.number="left" type="range" min="1" max="8" aria-label="Amount still needed" />
    </label>
    <PanelView :panel="panel" />
    <p class="verdict" role="status">The loop chooses {{ chosen.length ? chosen.join(', ') : 'nothing' }}. {{ why }}</p>
    <p class="muted small">Skip needs i past start. Break is only safe because the list is sorted.</p>
  </div>
</template>

<style scoped>
.dcs2 { display: grid; gap: 10px; }
.fld { display: grid; gap: 4px; font-weight: 600; }
.fld input { width: 100%; min-height: 44px; accent-color: var(--accent); }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--line); background: var(--surface-2); }
</style>
