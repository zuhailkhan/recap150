<script setup lang="ts">
import { computed, ref } from 'vue'
import { arr, buckets, type Tone } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// Each person's list is sorted by time, so only the front of each list can be next. Take the newest front.
const lists: { time: number; id: number }[][] = [
  [{ time: 1, id: 21 }, { time: 4, id: 24 }, { time: 7, id: 27 }],
  [{ time: 2, id: 32 }, { time: 3, id: 33 }],
  [{ time: 5, id: 45 }, { time: 6, id: 46 }],
]
const taken = ref([0, 0, 0]) // how many tweets of each person are already in the feed, counted from the newest end
const feed = ref<number[]>([])

const fronts = computed(() => lists.map((l, i) => (taken.value[i] < l.length ? l[l.length - 1 - taken.value[i]] : null)))
const best = computed(() => {
  let b = -1
  fronts.value.forEach((f, i) => { if (f && (b === -1 || f.time > (fronts.value[b] as { time: number }).time)) b = i })
  return b
})
const top = computed(() => (best.value === -1 ? null : fronts.value[best.value]))
const take = () => {
  const b = best.value
  if (b === -1) return
  feed.value = [...feed.value, (fronts.value[b] as { id: number }).id]
  taken.value = taken.value.map((v, i) => (i === b ? v + 1 : v))
}
const reset = () => { taken.value = [0, 0, 0]; feed.value = [] }

const panel = computed(() => buckets(lists.map((l, i) => ({
  key: `user ${i + 1}`,
  items: l.map((w) => `${w.id} (t${w.time})`),
  itemTones: l.map((_, k): Tone | null => (k >= l.length - taken.value[i] ? 'hit' : k === l.length - 1 - taken.value[i] ? (i === best.value ? 'focus' : 'keep') : null)),
})), { label: 'tweets per user, oldest first. Only the newest not yet used is a candidate' }))
const feedPanel = computed(() => arr(feed.value, { label: 'news feed, newest first', tones: feed.value.map((): Tone => 'hit') }))
</script>

<template>
  <div class="d">
    <PanelView :panel="panel" />
    <PanelView :panel="feedPanel" />
    <div class="row">
      <button class="btn go" :disabled="best === -1" @click="take">Take the newest candidate</button>
      <button class="btn" @click="reset">Start over</button>
    </div>
    <p class="verdict" role="status">
      <template v-if="best === -1">All tweets used. The feed is complete.</template>
      <template v-else-if="top">The candidates are the newest unused tweet of each user. Time t{{ top.time }} is the biggest, so tweet {{ top.id }} (the strongest outline) comes next. Older tweets cannot beat it.</template>
    </p>
  </div>
</template>

<style scoped>
.d { display: grid; gap: 10px; }
.row { display: flex; flex-wrap: wrap; gap: 8px; }
.btn { min-height: 44px; padding: 0 14px; border-radius: 10px; border: 2px solid var(--line); background: var(--surface-2); color: inherit; font: inherit; cursor: pointer; }
.btn.go { border-color: var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); }
.btn:disabled { opacity: 0.5; cursor: default; }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--keep-bd); background: var(--keep-bg); color: var(--keep-fg); }
</style>
