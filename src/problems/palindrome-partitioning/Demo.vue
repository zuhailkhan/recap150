<script setup lang="ts">
import { computed, ref } from 'vue'
import { arr } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// Cut "aabaa" from the left. Only palindromic pieces can be cut off.
const s = 'aabaa'
const pieces = ref<string[]>([])
const start = computed(() => pieces.value.join('').length)
const isPal = (p: string) => p === [...p].reverse().join('')
const options = computed(() => Array.from({ length: s.length - start.value }, (_, k) => s.slice(start.value, start.value + k + 1)))
const done = computed(() => start.value === s.length)
const stringPanel = computed(() => arr(s.split(''), { label: 'string (blue = already cut)', tones: s.split('').map((_, i) => (i < start.value ? (done.value ? 'hit' : 'keep') : null)) }))
const piecesPanel = computed(() => arr(pieces.value, { label: 'pieces cut so far', tones: pieces.value.map(() => (done.value ? 'hit' : 'keep')) }))
</script>

<template>
  <div class="dpp">
    <PanelView :panel="stringPanel" />
    <div class="keys" role="group" aria-label="Choose the next piece">
      <button v-for="p in options" :key="p" class="btn" :class="{ bad: !isPal(p) }" type="button" :disabled="!isPal(p)" :aria-label="isPal(p) ? `Cut ${p}` : `${p} is not a palindrome`" @click="pieces.push(p)">{{ p }}<span v-if="!isPal(p)"> no</span></button>
      <button class="btn quiet" type="button" :disabled="!pieces.length" @click="pieces.pop()">Undo</button>
      <button class="btn quiet" type="button" :disabled="!pieces.length" @click="pieces = []">Clear</button>
    </div>
    <PanelView :panel="piecesPanel" />
    <p class="verdict" :class="{ ok: done }" role="status">
      <template v-if="done">Whole string used: {{ pieces.join(' | ') }} is one partition. Undo to try a longer first piece.</template>
      <template v-else>Next piece starts at index {{ start }}. Only palindromes can be cut. Marked "no" cannot.</template>
    </p>
  </div>
</template>

<style scoped>
.dpp { display: grid; gap: 10px; }
.keys { display: flex; flex-wrap: wrap; gap: 8px; }
.keys .btn { min-height: 44px; font-family: var(--font-mono); }
.keys .btn.bad { text-decoration: line-through; }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--line); background: var(--surface-2); }
.verdict.ok { border-color: var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); }
</style>
