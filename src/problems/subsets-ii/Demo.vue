<script setup lang="ts">
import { computed, ref } from 'vue'
import { arr } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// One loop at one depth. Move start to see which numbers the loop may choose and which it skips.
const sorted = [1, 2, 2, 2, 3]
const start = ref(0)
const allowed = (i: number) => i >= start.value && !(i > start.value && sorted[i] === sorted[i - 1])
const panel = computed(() => arr(sorted, {
  label: 'sorted numbers: green = loop chooses it, red = loop skips it',
  tones: sorted.map((_, i) => (i < start.value ? 'dim' : allowed(i) ? 'hit' : 'miss')),
  pointers: [{ name: 'start', at: start.value, tone: 'focus' }],
}))
const chosen = computed(() => sorted.filter((_, i) => allowed(i)))
const skipped = computed(() => sorted.filter((_, i) => i >= start.value && !allowed(i)).length)
</script>

<template>
  <div class="dsii">
    <label class="fld">Where this loop starts: <strong>{{ start }}</strong>
      <input v-model.number="start" type="range" min="0" :max="sorted.length - 1" aria-label="Start index of the loop" />
    </label>
    <PanelView :panel="panel" />
    <p class="verdict" role="status">
      This loop chooses {{ chosen.join(', ') }}. It skips {{ skipped }} number{{ skipped === 1 ? '' : 's' }}.
      <template v-if="skipped">A skipped number equals the one before it, and that one was already tried here.</template>
      <template v-else>Nothing equals its left neighbour inside the loop, so nothing is skipped.</template>
    </p>
    <p class="muted small">Rule: skip index i when i is past start and sorted[i] equals sorted[i - 1]. The first number in the loop is always chosen, even if it is a repeat of something before start.</p>
  </div>
</template>

<style scoped>
.dsii { display: grid; gap: 10px; }
.fld { display: grid; gap: 4px; font-weight: 600; }
.fld input { width: 100%; min-height: 44px; accent-color: var(--accent); }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--line); background: var(--surface-2); }
</style>
