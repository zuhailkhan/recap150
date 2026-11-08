<script setup lang="ts">
import { computed, ref } from 'vue'
import { arr, buckets } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// Slide a fixed-size window. It is a permutation of "aab" when the letter counts are equal.
const target = 'aab'
const s2 = [...'abbaab']
const start = ref(0)
const n = target.length
const win = computed(() => s2.slice(start.value, start.value + n))
const rows = computed(() =>
  [...new Set([...target, ...win.value])].sort().map((ch) => ({
    ch,
    want: [...target].filter((x) => x === ch).length,
    have: win.value.filter((x) => x === ch).length,
  })),
)
const same = computed(() => rows.value.every((r) => r.want === r.have))
const panel = computed(() =>
  arr(s2, {
    label: 's2',
    tones: s2.map((_, i) => (i >= start.value && i < start.value + n ? (same.value ? 'hit' : 'focus') : null)),
    window: [start.value, start.value + n - 1],
  }),
)
const table = computed(() =>
  buckets(rows.value.map((r) => ({ key: r.ch, items: [`want ${r.want}, have ${r.have}`], tone: r.want === r.have ? ('hit' as const) : ('miss' as const) })), { label: 'counts: target vs window', keyLabel: 'letter' }),
)
</script>

<template>
  <div class="d">
    <p>Target letters: <code>{{ target }}</code>. The window is always {{ n }} wide.</p>
    <label class="sl">Window start <input v-model.number="start" type="range" :min="0" :max="s2.length - n" aria-label="Window start" /></label>
    <PanelView :panel="panel" />
    <PanelView :panel="table" />
    <p class="verdict" :class="{ bad: !same }" role="status">
      <template v-if="same">Every count matches. This window is a permutation of {{ target }}.</template>
      <template v-else>Some counts differ. Order does not matter, only the counts.</template>
    </p>
    <p class="muted small">Slide one step: one letter leaves, one enters. Only two counts change.</p>
  </div>
</template>

<style scoped>
.d { display: grid; gap: 10px; }
.d p { margin: 0; }
.sl { display: flex; align-items: center; gap: 10px; min-height: 44px; font-weight: 600; }
.sl input { flex: 1; min-height: 44px; accent-color: var(--accent); }
.verdict { padding: 10px 12px; border-radius: 10px; border: 2px solid var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); }
.verdict.bad { border-color: var(--miss-bd); background: var(--miss-bg); color: var(--miss-fg); }
</style>
