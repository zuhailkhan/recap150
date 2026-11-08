<script setup lang="ts">
import { computed, ref } from 'vue'
import { arr } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// Digits 2, 7 and 3: one level per digit. Pick a letter at each level.
const digits = ['2', '7', '3']
const keys: Record<string, string> = { 2: 'abc', 3: 'def', 7: 'pqrs' }
const path = ref<string[]>([])
const level = computed(() => path.value.length)
const done = computed(() => level.value === digits.length)
const options = computed(() => (done.value ? [] : [...keys[digits[level.value]]]))
const digitPanel = computed(() => arr(digits, { label: 'digits', tones: digits.map((_, i) => (done.value ? 'keep' : i < level.value ? 'keep' : i === level.value ? 'focus' : null)) }))
const pathPanel = computed(() => arr(path.value, { label: 'letters so far', tones: path.value.map(() => (done.value ? 'hit' : 'keep')) }))
const total = digits.reduce((n, d) => n * keys[d].length, 1)
</script>

<template>
  <div class="dlc">
    <PanelView :panel="digitPanel" />
    <div class="keys" role="group" aria-label="Pick a letter for this digit">
      <button v-for="ch in options" :key="ch" class="btn" type="button" :aria-label="`Pick ${ch}`" @click="path.push(ch)">{{ ch }}</button>
      <button class="btn quiet" type="button" :disabled="!path.length" @click="path.pop()">Undo</button>
      <button class="btn quiet" type="button" :disabled="!path.length" @click="path = []">Clear</button>
    </div>
    <PanelView :panel="pathPanel" />
    <p class="verdict" :class="{ ok: done }" role="status">
      <template v-if="done">Word "{{ path.join('') }}" is complete. Undo, and pick a different last letter for the next word.</template>
      <template v-else>Digit {{ digits[level] }} offers {{ options.join(', ') }}. Pick one.</template>
    </p>
    <p class="muted small">{{ keys[digits[0]].length }} x {{ keys[digits[1]].length }} x {{ keys[digits[2]].length }} = {{ total }} words in all. Digit 7 has four letters.</p>
  </div>
</template>

<style scoped>
.dlc { display: grid; gap: 10px; }
.keys { display: flex; flex-wrap: wrap; gap: 8px; }
.keys .btn { min-width: 44px; min-height: 44px; font-family: var(--font-mono); font-size: 1.1rem; }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--line); background: var(--surface-2); }
.verdict.ok { border-color: var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); }
</style>
