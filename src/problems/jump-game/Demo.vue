<script setup lang="ts">
import { computed, ref } from 'vue'
import { arr } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// A cell beyond the farthest reach of everything before it cannot be landed on.
const nums = [3, 2, 1, 0, 4]
const at = ref(3)
const far = computed(() => nums.slice(0, at.value).reduce((m, v, k) => Math.max(m, k + v), 0))
const stuck = computed(() => at.value > far.value)
const panel = computed(() =>
  arr(nums, {
    label: 'nums. Bracket = what cells before the pointer can reach',
    tones: nums.map((_, k) => (k === at.value ? (stuck.value ? 'miss' : 'hit') : k < at.value ? 'dim' : null)),
    pointers: [{ name: 'i', at: at.value, tone: stuck.value ? 'miss' : 'hit' }],
    window: [0, Math.min(far.value, nums.length - 1)],
  }),
)
</script>

<template>
  <div class="d">
    <label class="slide"><span>Look at index <strong>{{ at }}</strong></span>
      <input v-model.number="at" type="range" min="0" :max="nums.length - 1" step="1" aria-label="Index to test" />
    </label>
    <PanelView :panel="panel" />
    <p class="verdict" :class="{ bad: stuck }" role="status">
      <template v-if="stuck">Cells before index {{ at }} reach at most {{ far }}. Index {{ at }} is beyond that, so nothing can land on it or anything after it.</template>
      <template v-else-if="at === 0">Index 0 is where you start, so it is always reachable.</template>
      <template v-else>Cells before index {{ at }} reach up to {{ far }}, which covers it. Index {{ at }} is reachable.</template>
    </p>
    <p class="muted small">Slide to 4. Every path squeezes through the 0 at index 3, so the reach stops at 3.</p>
  </div>
</template>

<style scoped>
.d { display: grid; gap: 10px; }
.slide { display: grid; gap: 6px; font-weight: 600; }
.slide input { width: 100%; min-height: 44px; accent-color: var(--accent); }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); }
.verdict.bad { border-color: var(--miss-bd); background: var(--miss-bg); color: var(--miss-fg); }
</style>
