<script setup lang="ts">
import { computed, ref } from 'vue'
import { buckets } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// Net tally: +1 for each letter of the first word, -1 for each letter of the second.
const first = ref('listen')
const second = ref('silent')
const clean = (v: string) => v.toLowerCase().replace(/[^a-z]/g, '')
const net = computed(() => {
  const m = new Map<string, number>()
  for (const ch of clean(first.value)) m.set(ch, (m.get(ch) ?? 0) + 1)
  for (const ch of clean(second.value)) m.set(ch, (m.get(ch) ?? 0) - 1)
  return [...m].sort(([x], [y]) => (x < y ? -1 : 1))
})
const same = computed(() => net.value.every(([, v]) => v === 0))
const panel = computed(() => buckets(net.value.map(([k, v]) => ({ key: k, items: [v], tone: v === 0 ? 'hit' as const : 'miss' as const })), { label: 'tally after both passes', keyLabel: 'letter → count', empty: 'type some letters' }))
</script>

<template>
  <div class="vad">
    <label class="fld">First word <input v-model="first" type="text" autocomplete="off" spellcheck="false" aria-label="First word" /></label>
    <label class="fld">Second word <input v-model="second" type="text" autocomplete="off" spellcheck="false" aria-label="Second word" /></label>
    <PanelView :panel="panel" />
    <p class="verdict" :class="{ bad: !same }" role="status">
      <template v-if="same">Every count is zero. Same letters, same amounts: an anagram.</template>
      <template v-else>Some counts are not zero. Positive means the first word has extra, negative means the second does.</template>
    </p>
    <p class="muted small">Type two words. Order never matters, only the counts.</p>
  </div>
</template>

<style scoped>
.vad { display: grid; gap: 10px; }
.fld { display: grid; gap: 4px; font-weight: 600; }
.fld input { min-height: 44px; padding: 0 10px; font: 600 1rem var(--font-mono); color: var(--ink); background: var(--surface); border: 1.5px solid var(--line); border-radius: 10px; }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); }
.verdict.bad { border-color: var(--miss-bd); background: var(--miss-bg); color: var(--miss-fg); }
</style>
