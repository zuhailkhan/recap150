<script setup lang="ts">
import { computed, ref } from 'vue'
import { intervals, type Tone } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// Rooms needed = the most meetings running at the same moment. Slide a line through time and count.
const meetings = [[0, 4], [1, 3], [2, 5], [4, 6], [5, 6]]
const at = ref(2)
const running = (t: number) => meetings.filter(([s, e]) => s <= t && t < e).length
const now = computed(() => running(at.value))
const peak = Math.max(...meetings.map(([s]) => running(s)))
const panel = computed(() =>
  intervals(
    meetings.map(([start, end]) => ({ start, end, tone: (start <= at.value && at.value < end ? 'focus' : 'dim') as Tone })),
    { label: 'focus = running at the line', min: 0, max: 6, marks: [{ at: at.value, label: `t = ${at.value}` }] },
  ),
)
</script>

<template>
  <div class="d">
    <label class="row">Time <b>{{ at }}</b>
      <input v-model.number="at" type="range" min="0" max="6" aria-label="Time of the sweep line" />
    </label>
    <PanelView :panel="panel" />
    <p class="verdict" :class="{ bad: now === peak }" role="status">
      {{ now }} meeting{{ now === 1 ? '' : 's' }} running at {{ at }}.
      <template v-if="now === peak"> This is the peak, {{ peak }}. That many rooms are needed.</template>
      <template v-else> The peak is {{ peak }}, so the answer is {{ peak }}.</template>
    </p>
    <p class="muted small">A meeting ending at 4 is already over at 4, so a meeting starting at 4 can take its room.</p>
  </div>
</template>

<style scoped>
.d { display: grid; gap: 10px; }
.row { display: grid; gap: 6px; font-weight: 600; }
.row input { width: 100%; min-height: 44px; accent-color: var(--accent); }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--keep-bd); background: var(--keep-bg); color: var(--keep-fg); }
.verdict.bad { border-color: var(--focus-bd); background: var(--focus-bg); color: var(--focus-fg); }
</style>
