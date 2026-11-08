<script setup lang="ts">
import { computed, ref } from 'vue'
import Tile from '@/visuals/Tile.vue'
import StackVis from '@/visuals/StackVis.vue'

const seq = ref<string[]>([])
const pairs: Record<string, string> = { ')': '(', ']': '[', '}': '{' }
const keys = ['(', ')', '[', ']', '{', '}']

const state = computed(() => {
  const stack: string[] = []
  for (let i = 0; i < seq.value.length; i++) {
    const ch = seq.value[i]
    if (!(ch in pairs)) { stack.push(ch); continue }
    const top = stack.pop()
    if (top !== pairs[ch]) return { stack, bad: i, top }
  }
  return { stack, bad: -1, top: undefined }
})
const message = computed(() => {
  const s = state.value
  if (s.bad >= 0) return s.top === undefined ? `"${seq.value[s.bad]}" has nothing to close. Invalid.` : `"${seq.value[s.bad]}" needs "${pairs[seq.value[s.bad]]}" but the top was "${s.top}". Invalid.`
  if (!seq.value.length) return 'Tap brackets to build a string. Watch the stack.'
  return s.stack.length ? `Valid so far, with ${s.stack.length} still open.` : 'Everything is closed. Valid.'
})
const bad = computed(() => state.value.bad >= 0)
</script>

<template>
  <div class="md">
    <div class="keys" role="group" aria-label="Add a bracket">
      <button v-for="k in keys" :key="k" type="button" class="btn" :aria-label="`Add ${k}`" @click="seq.push(k)">{{ k }}</button>
      <button class="btn quiet" type="button" :disabled="!seq.length" @click="seq.pop()">Undo</button>
      <button class="btn quiet" type="button" :disabled="!seq.length" @click="seq = []">Clear</button>
    </div>
    <div class="seq" aria-label="Your string"><Tile v-for="(c, i) in seq" :key="i" :value="c" :tone="state.bad === i ? 'miss' : null" small /><span v-if="!seq.length" class="muted small">no brackets yet</span></div>
    <StackVis :p="{ kind: 'stack', items: state.stack, label: 'stack', empty: 'empty' }" />
    <p class="verdict" :class="{ no: bad }" role="status">{{ message }}</p>
  </div>
</template>

<style scoped>
.md { display: grid; gap: 12px; }
.keys { display: flex; flex-wrap: wrap; gap: 8px; }
.keys .btn { font-family: var(--font-mono); font-size: 1.1rem; }
.seq { display: flex; flex-wrap: wrap; gap: 4px; min-height: 34px; align-items: center; }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--line); background: var(--surface-2); }
.verdict.no { background: var(--miss-bg); color: var(--miss-fg); border-color: var(--miss-bd); }
</style>
