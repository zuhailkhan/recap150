<script setup lang="ts">
import { computed, ref } from 'vue'
import { arr } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// Group size 3. Start the first group at different cards and see what is left stranded.
const hand = [1, 2, 3, 4, 5, 6]
const size = 3
const starts = [1, 2, 3, 4]
const start = ref(2)
const group = computed(() => Array.from({ length: size }, (_, k) => start.value + k))
const rest = computed(() => hand.filter((c) => !group.value.includes(c)))
// greedy check on what is left: take the smallest, remove a run, repeat
const splits = computed(() => {
  const left = [...rest.value]
  while (left.length) {
    const m = Math.min(...left)
    for (let k = 0; k < size; k++) {
      const at = left.indexOf(m + k)
      if (at < 0) return false
      left.splice(at, 1)
    }
  }
  return true
})
const panels = computed(() => [
  arr(hand, { label: `hand. First group starts at ${start.value}`, tones: hand.map((c) => (group.value.includes(c) ? 'keep' : null)) }),
  arr(rest.value, { label: 'cards left after that group', tones: rest.value.map((c, i) => (!splits.value && i === 0 ? 'miss' : null)) }),
])
</script>

<template>
  <div class="d">
    <div class="row" role="group" aria-label="Where the first group starts">
      <button v-for="s in starts" :key="s" type="button" class="btn" :class="{ on: start === s }" :aria-pressed="start === s" @click="start = s">Start at {{ s }}</button>
    </div>
    <PanelView v-for="(p, i) in panels" :key="i" :panel="p" />
    <p class="verdict" :class="{ bad: !splits }" role="status">
      <template v-if="splits">The rest still splits into groups of {{ size }}. This start works, but only the smallest card is guaranteed to.</template>
      <template v-else>Stuck. Card {{ rest[0] }} is the smallest left, but the cards that would complete its run of {{ size }} are already used in the first group.</template>
    </p>
    <p class="muted small">Starts 1 and 4 happen to work here. Starts 2 and 3 strand the 1. Only the smallest card is safe on every hand.</p>
  </div>
</template>

<style scoped>
.d { display: grid; gap: 10px; }
.row { display: flex; gap: 8px; flex-wrap: wrap; }
.row .btn.on { border-color: var(--focus-bd); background: var(--focus-bg); color: var(--focus-fg); }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); }
.verdict.bad { border-color: var(--miss-bd); background: var(--miss-bg); color: var(--miss-fg); }
</style>
