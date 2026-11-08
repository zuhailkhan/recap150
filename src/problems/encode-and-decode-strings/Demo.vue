<script setup lang="ts">
import { computed, ref } from 'vue'
import { arr } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// The same two words go through two encodings. Edit the first word and see which one survives.
const first = ref('a,b')
const usePrefix = ref(false)
const words = computed(() => [first.value, 'c'])
const encoded = computed(() => (usePrefix.value ? words.value.map((w) => `${w.length}#${w}`).join('') : words.value.join(',')))
const decoded = computed(() => {
  if (!usePrefix.value) return encoded.value.split(',')
  const out: string[] = []
  const s = encoded.value
  for (let i = 0; i < s.length; ) {
    const j = s.indexOf('#', i)
    const n = Number(s.slice(i, j))
    out.push(s.slice(j + 1, j + 1 + n))
    i = j + 1 + n
  }
  return out
})
const ok = computed(() => decoded.value.length === 2 && decoded.value.every((w, i) => w === words.value[i]))
const view = computed(() => arr(encoded.value.split(''), { label: 'encoded text', tones: encoded.value.split('').map(() => (ok.value ? 'hit' as const : 'miss' as const)) }))
const back = computed(() => arr(decoded.value.map((w) => (w === '' ? '(empty)' : w)), { label: 'decoded list', tones: decoded.value.map((w, i) => (w === words.value[i] ? 'hit' as const : 'miss' as const)) }))
</script>

<template>
  <div class="end">
    <label class="fld">First word (the second is always "c") <input v-model="first" type="text" autocomplete="off" spellcheck="false" aria-label="First word" /></label>
    <label class="opt"><input v-model="usePrefix" type="checkbox" /> Use length prefix (otherwise: join with commas)</label>
    <PanelView :panel="view" />
    <PanelView :panel="back" />
    <p class="verdict" :class="{ bad: !ok }" role="status">
      <template v-if="ok">Round trip works. The list came back unchanged.</template>
      <template v-else>Broken. The decoder cannot tell a comma in the data from a comma between words.</template>
    </p>
    <p class="muted small">Try a comma in the first word, then tick the box.</p>
  </div>
</template>

<style scoped>
.end { display: grid; gap: 10px; }
.fld { display: grid; gap: 4px; font-weight: 600; }
.fld input { min-height: 44px; padding: 0 10px; font: 600 1rem var(--font-mono); color: var(--ink); background: var(--surface); border: 1.5px solid var(--line); border-radius: 10px; }
.opt { display: flex; align-items: center; gap: 10px; min-height: 44px; font-weight: 600; }
.opt input { width: 22px; height: 22px; accent-color: var(--accent); }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); }
.verdict.bad { border-color: var(--miss-bd); background: var(--miss-bg); color: var(--miss-fg); }
</style>
