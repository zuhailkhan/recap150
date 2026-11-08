<script setup lang="ts">
import { computed, ref } from 'vue'
import { trie } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// Stored words: tea, ten, to, inn. Type any text. The ring path is how far a lookup gets.
const stored = ['tea', 'ten', 'to', 'inn']
const text = ref('te')
const q = computed(() => text.value.toLowerCase().replace(/[^a-z]/g, ''))
// How many letters of the query form a path from the root.
const depth = computed(() => {
  let d = 0
  while (d < q.value.length && stored.some((w) => w.startsWith(q.value.slice(0, d + 1)))) d++
  return d
})
const full = computed(() => depth.value === q.value.length)
const isWord = computed(() => stored.includes(q.value))
const panel = computed(() => trie(stored, { label: 'stored: tea, ten, to, inn', hot: q.value.slice(0, depth.value), hotTone: full.value ? 'hit' : 'miss' }))
const said = computed(() =>
  q.value === ''
    ? 'Type some letters.'
    : full.value
      ? `All ${q.value.length} letters have a node. startsWith is true. search is ${isWord.value}${isWord.value ? '' : ', because no word ends on that node'}.`
      : `The walk breaks after ${depth.value} letter${depth.value === 1 ? '' : 's'}: no node for "${q.value[depth.value]}". startsWith and search are both false.`,
)
</script>

<template>
  <div class="d">
    <label class="lab" for="trie-q">Type a prefix or word</label>
    <input id="trie-q" v-model="text" class="inp" maxlength="8" autocomplete="off" autocapitalize="off" spellcheck="false" />
    <PanelView :panel="panel" />
    <p class="verdict" :class="{ bad: !full && q !== '' }" role="status">{{ said }}</p>
  </div>
</template>

<style scoped>
.d { display: grid; gap: 10px; }
.lab { font-weight: 600; }
.inp { min-height: 44px; padding: 0 12px; border-radius: 10px; border: 2px solid var(--line); background: var(--surface-2); color: inherit; font: inherit; }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); }
.verdict.bad { border-color: var(--miss-bd); background: var(--miss-bg); color: var(--miss-fg); }
</style>
