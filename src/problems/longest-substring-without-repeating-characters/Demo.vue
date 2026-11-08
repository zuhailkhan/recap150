<script setup lang="ts">
import { computed, ref } from 'vue'
import { arr } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// Drag both ends. The window is valid only while no letter appears twice.
const s = [...'abcabcbb']
const left = ref(0)
const right = ref(2)
const lo = computed(() => Math.min(left.value, right.value))
const hi = computed(() => Math.max(left.value, right.value))
const counts = computed(() => {
  const c = new Map<string, number>()
  for (let i = lo.value; i <= hi.value; i++) c.set(s[i], (c.get(s[i]) ?? 0) + 1)
  return c
})
const ok = computed(() => [...counts.value.values()].every((n) => n === 1))
const panel = computed(() =>
  arr(s, {
    label: 's',
    tones: s.map((ch, k) => (k < lo.value || k > hi.value ? 'dim' : (counts.value.get(ch) ?? 0) > 1 ? 'miss' : 'hit')),
    pointers: [{ name: 'l', at: lo.value }, { name: 'r', at: hi.value }],
    window: [lo.value, hi.value],
  }),
)
</script>

<template>
  <div class="d">
    <label class="sl">Left end <input v-model.number="left" type="range" min="0" max="7" aria-label="Left end of the window" /></label>
    <label class="sl">Right end <input v-model.number="right" type="range" min="0" max="7" aria-label="Right end of the window" /></label>
    <PanelView :panel="panel" />
    <p class="verdict" :class="{ bad: !ok }" role="status">
      <template v-if="ok">Valid window, length {{ hi - lo + 1 }}. No letter repeats.</template>
      <template v-else>Broken. A letter repeats. Move the left end right until the red letters are gone.</template>
    </p>
    <p class="muted small">Try to make the longest valid window. The real algorithm only ever moves the ends forward.</p>
  </div>
</template>

<style scoped>
.d { display: grid; gap: 10px; }
.sl { display: flex; align-items: center; gap: 10px; min-height: 44px; font-weight: 600; }
.sl input { flex: 1; min-height: 44px; accent-color: var(--accent); }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); }
.verdict.bad { border-color: var(--miss-bd); background: var(--miss-bg); color: var(--miss-fg); }
</style>
