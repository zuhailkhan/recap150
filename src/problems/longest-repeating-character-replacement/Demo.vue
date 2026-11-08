<script setup lang="ts">
import { computed, ref } from 'vue'
import { arr, buckets, fromMap } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// A window is fine if (size - count of its most common letter) <= k.
const s = [...'AABABBA']
const left = ref(0)
const right = ref(3)
const k = ref(1)
const lo = computed(() => Math.min(left.value, right.value))
const hi = computed(() => Math.max(left.value, right.value))
const counts = computed(() => {
  const c = new Map<string, number>()
  for (let i = lo.value; i <= hi.value; i++) c.set(s[i], (c.get(s[i]) ?? 0) + 1)
  return c
})
const size = computed(() => hi.value - lo.value + 1)
const top = computed(() => Math.max(...counts.value.values()))
const topLetter = computed(() => [...counts.value].find(([, n]) => n === top.value)?.[0])
const need = computed(() => size.value - top.value)
const ok = computed(() => need.value <= k.value)
const panel = computed(() =>
  arr(s, {
    label: 's',
    tones: s.map((ch, i) => (i < lo.value || i > hi.value ? 'dim' : ch === topLetter.value ? 'hit' : ok.value ? 'keep' : 'miss')),
    pointers: [{ name: 'l', at: lo.value }, { name: 'r', at: hi.value }],
    window: [lo.value, hi.value],
  }),
)
const table = computed(() => buckets(fromMap(counts.value, topLetter.value), { label: 'counts in window', keyLabel: 'letter' }))
</script>

<template>
  <div class="d">
    <label class="sl">Left end <input v-model.number="left" type="range" min="0" max="6" aria-label="Left end of the window" /></label>
    <label class="sl">Right end <input v-model.number="right" type="range" min="0" max="6" aria-label="Right end of the window" /></label>
    <label class="sl">Replacements k = {{ k }} <input v-model.number="k" type="range" min="0" max="3" aria-label="Allowed replacements k" /></label>
    <PanelView :panel="panel" />
    <PanelView :panel="table" />
    <p class="verdict" :class="{ bad: !ok }" role="status">
      Size {{ size }} minus the top count {{ top }} is {{ need }} letters to replace. Allowed {{ k }}.
      <strong v-if="ok">Valid.</strong><strong v-else>Too many. Shrink or slide the window.</strong>
    </p>
    <p class="muted small">Green letters stay. Red ones would be replaced.</p>
  </div>
</template>

<style scoped>
.d { display: grid; gap: 10px; }
.sl { display: flex; align-items: center; gap: 10px; min-height: 44px; font-weight: 600; }
.sl input { flex: 1; min-height: 44px; accent-color: var(--accent); }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); }
.verdict.bad { border-color: var(--miss-bd); background: var(--miss-bg); color: var(--miss-fg); }
</style>
