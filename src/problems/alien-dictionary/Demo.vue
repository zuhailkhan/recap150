<script setup lang="ts">
import { computed, ref } from 'vue'
import { arr, type Tone } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// Two neighbouring words give at most one rule: the first position where they differ. Try "abc" then "ab".
const first = ref('wrt')
const second = ref('wrf')

const info = computed(() => {
  const a = first.value.toLowerCase().replace(/[^a-z]/g, '')
  const b = second.value.toLowerCase().replace(/[^a-z]/g, '')
  let at = -1
  for (let i = 0; i < Math.min(a.length, b.length); i++) if (a[i] !== b[i]) { at = i; break }
  const tone = (len: number): (Tone | null)[] => Array.from({ length: len }, (_, i) => (at < 0 ? (a.length > b.length && i >= b.length ? 'miss' : 'dim') : i < at ? 'dim' : i === at ? 'focus' : null))
  const trap = at < 0 && a.length > b.length
  return {
    a, b, at, trap,
    pa: arr([...a], { label: 'first word', tones: tone(a.length) }),
    pb: arr([...b], { label: 'second word', tones: at < 0 && a.length > b.length ? [...b].map(() => 'dim' as Tone) : tone(b.length) }),
  }
})
</script>

<template>
  <div class="add">
    <label class="fld">First word <input v-model="first" type="text" autocapitalize="none" autocomplete="off" maxlength="8" /></label>
    <label class="fld">Second word (must come after it) <input v-model="second" type="text" autocapitalize="none" autocomplete="off" maxlength="8" /></label>
    <PanelView v-if="info.a.length" :panel="info.pa" />
    <PanelView v-if="info.b.length" :panel="info.pb" />
    <p class="verdict" :class="{ bad: info.trap }" role="status">
      <template v-if="info.at >= 0">First difference at position {{ info.at }}: rule <strong>{{ info.a[info.at] }} comes before {{ info.b[info.at] }}</strong>. The rest of both words says nothing.</template>
      <template v-else-if="info.trap">"{{ info.a }}" is longer and starts with "{{ info.b }}", yet comes first. Impossible in any alphabet, so the answer is an empty string.</template>
      <template v-else>No difference. One word is a prefix of the other, in a fine order. No rule from this pair.</template>
    </p>
  </div>
</template>

<style scoped>
.add { display: grid; gap: 10px; }
.fld { display: grid; gap: 4px; font-weight: 600; }
.fld input { min-height: 44px; padding: 0 10px; border-radius: 10px; border: 2px solid var(--line); background: var(--surface-2); color: inherit; font: inherit; }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--keep-bd); background: var(--keep-bg); color: var(--keep-fg); }
.verdict.bad { border-color: var(--miss-bd); background: var(--miss-bg); color: var(--miss-fg); }
</style>
