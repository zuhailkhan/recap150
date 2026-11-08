<script setup lang="ts">
import { computed, ref } from 'vue'
import { arr } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// A cut is legal only when no letter appears on both sides.
const s = 'ababcdeffe'
const chars = [...s]
const cut = ref(2)
const shared = computed(() => {
  const left = new Set(chars.slice(0, cut.value))
  return new Set(chars.slice(cut.value).filter((c) => left.has(c)))
})
const panel = computed(() =>
  arr(chars, {
    label: `string. Cut between index ${cut.value - 1} and ${cut.value}`,
    tones: chars.map((c, i) => (shared.value.has(c) ? 'miss' : i < cut.value ? 'keep' : 'dim')),
    window: [0, cut.value - 1],
  }),
)
</script>

<template>
  <div class="d">
    <label class="slide"><span>Cut after <strong>{{ cut }}</strong> letter{{ cut === 1 ? '' : 's' }}</span>
      <input v-model.number="cut" type="range" min="1" :max="chars.length - 1" step="1" aria-label="Cut position" />
    </label>
    <PanelView :panel="panel" />
    <p class="verdict" :class="{ bad: shared.size > 0 }" role="status">
      <template v-if="shared.size > 0">Illegal. {{ [...shared].join(', ') }} would sit on both sides of the cut.</template>
      <template v-else>Legal. No letter is on both sides. This is a spot where the algorithm would cut.</template>
    </p>
    <p class="muted small">The algorithm never tests cuts. It keeps stretching the part until i reaches the last occurrence of every letter inside, which is exactly where a cut becomes legal.</p>
  </div>
</template>

<style scoped>
.d { display: grid; gap: 10px; }
.slide { display: grid; gap: 6px; font-weight: 600; }
.slide input { width: 100%; min-height: 44px; accent-color: var(--accent); }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); }
.verdict.bad { border-color: var(--miss-bd); background: var(--miss-bg); color: var(--miss-fg); }
</style>
