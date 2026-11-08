<script setup lang="ts">
import { computed, ref } from 'vue'
import { arr } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// Build a string and watch the range [lo, hi] of possible open counts.
const text = ref<string[]>(['*', '('])
const state = computed(() => {
  let lo = 0
  let hi = 0
  let dead = false
  for (const ch of text.value) {
    if (ch === '(') { lo++; hi++ } else if (ch === ')') { lo--; hi-- } else { lo--; hi++ }
    if (hi < 0) { dead = true; break }
    if (lo < 0) lo = 0
  }
  return { lo, hi, dead }
})
const top = 8
const panels = computed(() => {
  const s = state.value
  const items = Array.from({ length: top + 1 }, (_, k) => k)
  return [
    arr(text.value.length ? text.value : ['(empty)'], { label: 'string' }),
    arr(items, { label: s.dead ? 'possible open counts: none' : 'possible open counts (bracket = [lo, hi])', tones: items.map((k) => (s.dead ? 'miss' : k >= s.lo && k <= s.hi ? 'keep' : null)), window: s.dead ? undefined : [s.lo, Math.min(s.hi, top)] }),
  ]
})
const valid = computed(() => !state.value.dead && state.value.lo === 0)
const add = (c: string) => { if (text.value.length < 8) text.value = [...text.value, c] }
</script>

<template>
  <div class="d">
    <div class="row" role="group" aria-label="Add a character">
      <button v-for="c in ['(', ')', '*']" :key="c" type="button" class="btn" @click="add(c)">Add {{ c }}</button>
      <button type="button" class="btn" :disabled="!text.length" @click="text = text.slice(0, -1)">Undo</button>
      <button type="button" class="btn" @click="text = []">Clear</button>
    </div>
    <PanelView v-for="(p, i) in panels" :key="i" :panel="p" />
    <p class="verdict" :class="{ bad: !valid }" role="status">
      <template v-if="state.dead">Dead. There are more ) than even the best reading allows.</template>
      <template v-else>Range [{{ state.lo }}, {{ state.hi }}]. {{ valid ? 'Zero is reachable, so the string is balanced.' : 'Zero is not reachable, so it is not balanced yet.' }}</template>
    </p>
    <p class="muted small">Start with * then ( : the star could be ) which would go below zero. The clamp throws that reading away, so the range is [1, 2], not [0, 1].</p>
  </div>
</template>

<style scoped>
.d { display: grid; gap: 10px; }
.row { display: flex; gap: 8px; flex-wrap: wrap; }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); }
.verdict.bad { border-color: var(--miss-bd); background: var(--miss-bg); color: var(--miss-fg); }
</style>
