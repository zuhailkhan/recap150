<script setup lang="ts">
import { computed, ref } from 'vue'
import { arr, buckets } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// A window is good when it holds at least as many of each target letter as the target.
const s = [...'ADOBECODEBANC']
const target = 'ABC'
const left = ref(0)
const right = ref(5)
const lo = computed(() => Math.min(left.value, right.value))
const hi = computed(() => Math.max(left.value, right.value))
const rows = computed(() =>
  [...new Set(target)].map((ch) => ({ ch, want: [...target].filter((x) => x === ch).length, have: s.slice(lo.value, hi.value + 1).filter((x) => x === ch).length })),
)
const ok = computed(() => rows.value.every((r) => r.have >= r.want))
const panel = computed(() =>
  arr(s, {
    label: 's',
    tones: s.map((ch, i) => (i < lo.value || i > hi.value ? 'dim' : target.includes(ch) ? (ok.value ? 'hit' : 'focus') : 'keep')),
    pointers: [{ name: 'l', at: lo.value }, { name: 'r', at: hi.value }],
    window: [lo.value, hi.value],
  }),
)
const table = computed(() => buckets(rows.value.map((r) => ({ key: r.ch, items: [`${r.have} of ${r.want}`], tone: r.have >= r.want ? ('hit' as const) : ('miss' as const) })), { label: 'window has / target needs', keyLabel: 'letter' }))
</script>

<template>
  <div class="d">
    <p>Target: <code>{{ target }}</code>. Find the shortest window that has all three.</p>
    <label class="sl">Left end <input v-model.number="left" type="range" min="0" max="12" aria-label="Left end of the window" /></label>
    <label class="sl">Right end <input v-model.number="right" type="range" min="0" max="12" aria-label="Right end of the window" /></label>
    <PanelView :panel="panel" />
    <PanelView :panel="table" />
    <p class="verdict" :class="{ bad: !ok }" role="status">
      <template v-if="ok">Covers the target at length {{ hi - lo + 1 }}. Try moving the left end right to make it shorter.</template>
      <template v-else>Not covered yet. Move the right end right to find the missing letters.</template>
    </p>
    <p class="muted small">The algorithm does exactly this: grow right until covered, then shrink left while still covered.</p>
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
