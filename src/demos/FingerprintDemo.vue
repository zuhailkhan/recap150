<script setup lang="ts">
import { computed, ref } from 'vue'
import Tile from '@/visuals/Tile.vue'

const a = ref('eat')
const b = ref('tea')
const mode = ref<'sorted' | 'tally'>('sorted')
const clean = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '').slice(0, 9)

function print(word: string): string[] {
  if (mode.value === 'sorted') return [...word].sort()
  const c = new Map<string, number>()
  for (const ch of [...word].sort()) c.set(ch, (c.get(ch) ?? 0) + 1)
  return [...c].map(([ch, n]) => `${ch}${n}`)
}
const fa = computed(() => print(clean(a.value)))
const fb = computed(() => print(clean(b.value)))
const same = computed(() => fa.value.join('|') === fb.value.join('|'))
</script>

<template>
  <div class="fd">
    <div class="mode" role="group" aria-label="Fingerprint type">
      <button class="btn sm" :class="{ primary: mode === 'sorted' }" :aria-pressed="mode === 'sorted'" @click="mode = 'sorted'">Sorted letters</button>
      <button class="btn sm" :class="{ primary: mode === 'tally' }" :aria-pressed="mode === 'tally'" @click="mode = 'tally'">Letter counts</button>
    </div>
    <div v-for="(w, i) in [a, b]" :key="i" class="line">
      <label :for="`fd-${i}`" class="sr-only">Word {{ i + 1 }}</label>
      <input :id="`fd-${i}`" :value="w" maxlength="9" autocomplete="off" autocapitalize="off" spellcheck="false" @input="(e) => (i === 0 ? (a = clean((e.target as HTMLInputElement).value)) : (b = clean((e.target as HTMLInputElement).value)))" />
      <span class="arrow" aria-hidden="true">→</span>
      <span class="tiles"><Tile v-for="(t, k) in (i === 0 ? fa : fb)" :key="k" :value="t" tone="keep" small /><span v-if="!(i === 0 ? fa : fb).length" class="muted small">empty fingerprint</span></span>
    </div>
    <p class="verdict" :class="same ? 'ok' : 'no'" role="status">
      <template v-if="same">Same fingerprint, so these two words land in the <strong>same bin</strong>.</template>
      <template v-else>Different fingerprints, so they go in <strong>different bins</strong>.</template>
    </p>
    <p class="muted small">Edit the words. Try "listen" and "silent", then "abc" and "abd".</p>
  </div>
</template>

<style scoped>
.fd { display: grid; gap: 12px; }
.mode { display: flex; flex-wrap: wrap; gap: 8px; }
.line { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
input { width: 9.5ch; min-width: 110px; min-height: 44px; padding: 0 12px; font: 600 1rem var(--font-mono); color: var(--ink); background: var(--surface); border: 1.5px solid var(--line); border-radius: 10px; }
.tiles { display: flex; gap: 4px; flex-wrap: wrap; }
.arrow { color: var(--ink-2); }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid; }
.ok { background: var(--hit-bg); color: var(--hit-fg); border-color: var(--hit-bd); }
.no { background: var(--miss-bg); color: var(--miss-fg); border-color: var(--miss-bd); }
</style>
